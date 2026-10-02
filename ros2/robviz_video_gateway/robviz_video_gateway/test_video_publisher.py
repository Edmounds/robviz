import time
import cv2
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge


class VideoPublisher(Node):
    def __init__(self):
        super().__init__('test_video_publisher')
        self.declare_parameter('video_path', '/tmp/robviz-video-test/source.mp4')
        self.declare_parameter('topic', '/camera/front/image_raw')
        self.declare_parameter('fps', 30.0)
        self.declare_parameter('width', 1280)
        self.declare_parameter('height', 720)

        video_path = self.get_parameter('video_path').get_parameter_value().string_value
        self.topic_name = self.get_parameter('topic').get_parameter_value().string_value
        self.fps = self.get_parameter('fps').get_parameter_value().double_value
        self.width = self.get_parameter('width').get_parameter_value().integer_value
        self.height = self.get_parameter('height').get_parameter_value().integer_value

        self.publisher = self.create_publisher(Image, self.topic_name, 2)
        self.bridge = CvBridge()

        self.cap = cv2.VideoCapture(video_path)
        if not self.cap.isOpened():
            self.get_logger().warn(
                f'Could not open {video_path}, falling back to synthetic generator',
            )
            self.cap = None

        self.frame_idx = 0
        timer_period = 1.0 / max(1.0, self.fps)
        self.timer = self.create_timer(timer_period, self.timer_callback)
        self.get_logger().info(
            f'Publishing test video to {self.topic_name} at {self.fps} FPS '
            f'({self.width}x{self.height})',
        )

    def timer_callback(self):
        frame = None
        if self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.cap.read()

        if frame is None:
            # Synthetic fallback
            import numpy as np
            frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
            t = time.time()
            cx = int((self.width / 2) + np.sin(t * 2) * (self.width / 3))
            cy = int((self.height / 2) + np.cos(t * 2) * (self.height / 4))
            cv2.circle(frame, (cx, cy), 50, (0, 200, 255), -1)

        # Overlay current timestamp and frame count for visual latency inspection
        ts = time.strftime('%H:%M:%S') + f'.{int((time.time() % 1) * 1000):03d}'
        cv2.putText(frame, f'RobViz Test | {ts} | F#{self.frame_idx}', (30, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
        self.frame_idx += 1

        msg = self.bridge.cv2_to_imgmsg(frame, encoding='bgr8')
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'camera_optical_frame'
        self.publisher.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = VideoPublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
