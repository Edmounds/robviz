"""Stdlib smoke checks of real methods, extracted without ROS/GI imports.

Run: python3 .planning/review-image/gateway_checks.py
This checks layouts/configuration, NOT native GStreamer queue/runtime behavior.
"""
import ast
import logging
import unittest
from pathlib import Path
from types import SimpleNamespace

tree = ast.parse(Path('ros2/robviz_video_gateway/robviz_video_gateway/topic_streamer.py').read_text())
formats = next(ast.literal_eval(n.value) for n in tree.body
               if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'COLOR_FORMATS'
                                                   for t in n.targets))
cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'TopicStreamer')
methods = [n for n in cls.body if isinstance(n, ast.FunctionDef)
           and n.name in ('image_bytes', 'setup_pipeline')]
scope = {'COLOR_FORMATS': formats, 'Image': SimpleNamespace, 'logger': logging.getLogger(__name__)}
exec(compile(ast.Module(body=methods, type_ignores=[]), '<real gateway methods>', 'exec'), scope)


class Checks(unittest.TestCase):
    def test_row_layouts(self):
        for encoding, (gst_format, channels) in formats.items():
            for width in (1, 2, 3, 4, 642):
                row = bytes(i % 256 for i in range(width * channels))
                aligned = (len(row) + 3) & ~3
                for step in (len(row), aligned, aligned + 5):
                    msg = SimpleNamespace(width=width, height=3, encoding=encoding, step=step,
                                          data=(row + bytes(step - len(row))) * 3)
                    data, spec = scope['image_bytes'](None, msg)
                    self.assertEqual(spec, (width, 3, gst_format))
                    self.assertEqual(data, (row + bytes(aligned - len(row))) * 3)
        msg = SimpleNamespace(width=642, height=480, encoding='rgb8', step=1926, data=bytes(1926 * 480))
        self.assertEqual(len(scope['image_bytes'](None, msg)[0]), 925440)

    def test_rejects_bad_inputs(self):
        for overrides in ({'encoding': '16UC1'}, {'width': 0}, {'step': 5},
                          {'data': b''}, {'step': 64 * 1024 * 1024 + 1}):
            msg = SimpleNamespace(**({'width': 2, 'height': 1, 'encoding': 'rgb8',
                                      'step': 6, 'data': bytes(6)} | overrides))
            with self.assertRaises(ValueError):
                scope['image_bytes'](None, msg)

    def test_actual_pipeline_configuration(self):
        descriptions = []
        bus = SimpleNamespace(add_signal_watch=lambda: None, connect=lambda *args: None)
        pipeline = SimpleNamespace(get_by_name=lambda name: name, get_bus=lambda: bus,
                                   set_state=lambda state: None)
        def parse_launch(description):
            descriptions.append(description)
            return pipeline
        scope['Gst'] = SimpleNamespace(parse_launch=parse_launch, State=SimpleNamespace(PLAYING='playing'))
        streamer = SimpleNamespace(topic='/camera', encoder_type='test',
                                   encoder_description=lambda: 'identity name=enc', on_pipeline_error=None)
        scope['setup_pipeline'](streamer, 642, 480, 'RGB')
        appsrc = descriptions[0].split('!')[0]
        for property_value in ('block=false', 'max-buffers=1', 'max-bytes=0',
                               'max-time=0', 'leaky-type=downstream'):
            self.assertIn(property_value, appsrc)
        self.assertNotIn('leaky', descriptions[0].split('!')[1])


if __name__ == '__main__':
    unittest.main()
