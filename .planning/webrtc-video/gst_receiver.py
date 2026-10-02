import asyncio
import json
import threading

import gi
import websockets

gi.require_version("Gst", "1.0")
gi.require_version("GstWebRTC", "1.0")
gi.require_version("GstSdp", "1.0")
from gi.repository import GLib, Gst, GstWebRTC, GstSdp


TOPIC = "/camera/front/image_raw"
URL = "ws://127.0.0.1:8787/ws"


class Receiver:
    def __init__(self, label, loop):
        self.label = label
        self.loop = loop
        self.ws = None
        self.peer = None
        self.pending_ice = []
        self.remote_description_set = False
        self.frames = 0
        self.frames_ready = asyncio.Event()
        self.lock = threading.Lock()

        self.pipeline = Gst.Pipeline.new(f"receiver_{label}")
        self.peer = Gst.ElementFactory.make("webrtcbin", f"receiver_peer_{label}")
        self.peer.set_property("bundle-policy", "max-bundle")
        self.pipeline.add(self.peer)
        self.peer.connect("on-ice-candidate", self.on_local_ice)
        self.peer.connect("pad-added", self.on_remote_pad)
        for prop in ("connection-state", "ice-connection-state", "ice-gathering-state"):
            self.peer.connect(f"notify::{prop}", self.on_peer_state, prop)
        bus = self.pipeline.get_bus()
        bus.add_signal_watch()
        bus.connect("message::error", self.on_pipeline_error)
        self.pipeline.set_state(Gst.State.PLAYING)

    def on_peer_state(self, _peer, _param, prop):
        state = self.peer.get_property(prop).value_nick
        print(f"{self.label}: {prop}={state}", flush=True)
        if prop == "connection-state" and state == "connected":
            promise = Gst.Promise.new_with_change_func(self.on_stats, None)
            self.peer.emit("get-stats", None, promise)

    def on_stats(self, promise, _data):
        reply = promise.get_reply()
        print(f"{self.label}: WebRTC stats: {reply.to_string() if reply else None}", flush=True)

    def on_pipeline_error(self, _bus, message):
        error, debug = message.parse_error()
        print(f"{self.label}: GStreamer error: {error}; {debug}", flush=True)

    def schedule_send(self, payload):
        asyncio.run_coroutine_threadsafe(self.ws.send(json.dumps(payload)), self.loop)

    def on_local_ice(self, _peer, mline, candidate):
        print(f"{self.label}: local ICE candidate for mline {mline}", flush=True)
        self.schedule_send({
            "type": "ice", "topic": TOPIC, "candidate": candidate,
            "sdpMLineIndex": int(mline),
        })

    def on_remote_pad(self, _peer, pad):
        print(f"{self.label}: remote pad {pad.get_name()} caps={pad.get_current_caps()}", flush=True)
        queue = Gst.ElementFactory.make("queue")
        depay = Gst.ElementFactory.make("rtph264depay")
        parser = Gst.ElementFactory.make("h264parse")
        decoder = Gst.ElementFactory.make("avdec_h264")
        sink = Gst.ElementFactory.make("fakesink")
        sink.set_property("sync", False)
        sink.set_property("signal-handoffs", True)
        sink.connect("handoff", self.on_decoded_frame)
        elements = [queue, depay, parser, decoder, sink]
        for element in elements:
            self.pipeline.add(element)
        for first, second in zip(elements, elements[1:]):
            if not first.link(second):
                raise RuntimeError(f"{self.label}: failed to link receive/decode chain")
        if pad.link(queue.get_static_pad("sink")) != Gst.PadLinkReturn.OK:
            raise RuntimeError(f"{self.label}: failed to link incoming WebRTC pad")
        for element in elements:
            element.sync_state_with_parent()

    def on_decoded_frame(self, _sink, _buffer, _pad):
        with self.lock:
            self.frames += 1
            frame_count = self.frames
            ready = frame_count >= 10
        if frame_count in (1, 10):
            caps = _sink.get_static_pad("sink").get_current_caps()
            if caps:
                info = caps.get_structure(0)
                width = info.get_value("width")
                height = info.get_value("height")
                print(f"{self.label}: decoded frame {frame_count} at {width}x{height}", flush=True)
        if ready:
            self.loop.call_soon_threadsafe(self.frames_ready.set)

    def on_offer(self, sdp_text):
        offer_text = sdp_text
        print("SDP media lines: " + " | ".join(
            line for line in offer_text.splitlines()
            if line.startswith(("m=", "a=send", "a=recv", "a=inactive", "a=rtpmap:"))
        ), flush=True)
        result, message = GstSdp.SDPMessage.new()
        if result != GstSdp.SDPResult.OK:
            raise RuntimeError("could not allocate remote SDP")
        result = GstSdp.sdp_message_parse_buffer(sdp_text.encode(), message)
        if result != GstSdp.SDPResult.OK:
            raise RuntimeError("could not parse remote SDP")
        offer = GstWebRTC.WebRTCSessionDescription.new(GstWebRTC.WebRTCSDPType.OFFER, message)

        def remote_set(_promise, _data):
            print(f"{self.label}: remote description set", flush=True)
            self.remote_description_set = True
            for mline, candidate in self.pending_ice:
                self.peer.emit("add-ice-candidate", mline, candidate)
            self.pending_ice.clear()
            promise = Gst.Promise.new_with_change_func(answer_created, None)
            self.peer.emit("create-answer", None, promise)

        def answer_created(promise, _data):
            print(f"{self.label}: answer promise completed", flush=True)
            reply = promise.get_reply()
            answer = reply.get_value("answer") if reply else None
            if not answer:
                raise RuntimeError("GStreamer did not create an SDP answer")
            print("SDP answer media lines: " + " | ".join(
                line for line in answer.sdp.as_text().splitlines()
                if line.startswith(("m=", "a=send", "a=recv", "a=inactive", "a=rtpmap:"))
            ), flush=True)
            self.peer.emit("set-local-description", answer, Gst.Promise.new())
            self.schedule_send({
                "type": "answer", "topic": TOPIC, "sdp": answer.sdp.as_text(),
            })
            print(f"{self.label}: SDP answer sent", flush=True)

        promise = Gst.Promise.new_with_change_func(remote_set, None)
        self.peer.emit("set-remote-description", offer, promise)

    async def run(self):
        self.ws = await websockets.connect(URL, max_size=64 * 1024)
        await self.ws.send(json.dumps({"type": "watch", "topic": TOPIC, "targetFps": 10}))
        try:
            while not self.frames_ready.is_set():
                recv_task = asyncio.create_task(self.ws.recv())
                frames_task = asyncio.create_task(self.frames_ready.wait())
                done, pending = await asyncio.wait(
                    {recv_task, frames_task},
                    timeout=25,
                    return_when=asyncio.FIRST_COMPLETED,
                )
                for task in pending:
                    task.cancel()
                if pending:
                    await asyncio.gather(*pending, return_exceptions=True)
                if not done:
                    raise TimeoutError("no video frames or signaling received")
                if frames_task in done:
                    break
                message = json.loads(recv_task.result())
                print(f"{self.label}: received {message['type']}", flush=True)
                if message["type"] == "offer":
                    self.on_offer(message["sdp"])
                elif message["type"] == "ice":
                    if self.remote_description_set:
                        self.peer.emit("add-ice-candidate", message["sdpMLineIndex"], message["candidate"])
                    else:
                        self.pending_ice.append((message["sdpMLineIndex"], message["candidate"]))
                elif message["type"] == "error":
                    raise RuntimeError(message["message"])
            with self.lock:
                return {"viewer": self.label, "decodedFrames": self.frames}
        finally:
            await self.ws.send(json.dumps({"type": "unwatch", "topic": TOPIC}))
            await self.ws.close()
            self.pipeline.set_state(Gst.State.NULL)


async def main():
    Gst.init(None)
    glib = GLib.MainLoop()
    thread = threading.Thread(target=glib.run, daemon=True)
    thread.start()
    loop = asyncio.get_running_loop()
    results = await asyncio.gather(Receiver("a", loop).run(), Receiver("b", loop).run())
    print(json.dumps(results))


if __name__ == "__main__":
    asyncio.run(main())
