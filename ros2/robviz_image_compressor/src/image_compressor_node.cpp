// Copyright 2026 Edmounds
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

#include <cstdint>
#include <memory>
#include <string>
#include <utility>
#include <vector>

#include "image_transport/image_transport.hpp"
#include "rclcpp/rclcpp.hpp"
#include "rmw/qos_profiles.h"
#include "sensor_msgs/msg/image.hpp"

#include "robviz_image_compressor/config.hpp"
#include "robviz_image_compressor/latest_frame.hpp"

namespace robviz_image_compressor
{
namespace
{

struct StreamRuntime
{
  LatestFrame latest;
  image_transport::Publisher publisher;
  rclcpp::Subscription<sensor_msgs::msg::Image>::SharedPtr subscription;
  rclcpp::TimerBase::SharedPtr timer;
};

}  // namespace

class ImageCompressorNode : public rclcpp::Node
{
public:
  ImageCompressorNode()
  : Node("robviz_image_compressor")
  {
    for (const auto & config : load_stream_configs(*this)) {
      add_stream(config);
    }
  }

private:
  void add_stream(const StreamConfig & config)
  {
    const auto parameter_prefix = plugin_parameter_prefix(config.output_base_topic);
    declare_parameter<std::vector<std::string>>(
      parameter_prefix + ".enable_pub_plugins",
      std::vector<std::string>{"image_transport/compressed"});
    declare_parameter<std::string>(parameter_prefix + ".format", "jpeg");
    declare_parameter<int64_t>(
      parameter_prefix + ".jpeg_quality", config.jpeg_quality);

    auto stream = std::make_unique<StreamRuntime>();
    stream->publisher = image_transport::create_publisher(
      this, config.output_base_topic, rmw_qos_profile_sensor_data);
    auto * runtime = stream.get();

    stream->subscription = create_subscription<sensor_msgs::msg::Image>(
      config.input_topic,
      rclcpp::SensorDataQoS().keep_last(1),
      [runtime](sensor_msgs::msg::Image::ConstSharedPtr image) {
        runtime->latest.store(std::move(image));
      });
    stream->timer = create_wall_timer(
      timer_period(config.max_fps),
      [runtime]() {
        const auto image = runtime->latest.take(runtime->publisher.getNumSubscribers() > 0);
        if (image) {
          runtime->publisher.publish(image);
        }
      });

    RCLCPP_INFO(
      get_logger(), "[%s] %s -> %s, max %.2f FPS, JPEG quality %d",
      config.id.c_str(), config.input_topic.c_str(),
      compressed_topic(config.output_base_topic).c_str(), config.max_fps,
      config.jpeg_quality);
    streams_.push_back(std::move(stream));
  }

  std::vector<std::unique_ptr<StreamRuntime>> streams_;
};

}  // namespace robviz_image_compressor

int main(int argc, char ** argv)
{
  rclcpp::init(argc, argv);
  try {
    rclcpp::spin(std::make_shared<robviz_image_compressor::ImageCompressorNode>());
  } catch (const std::exception & error) {
    RCLCPP_FATAL(rclcpp::get_logger("robviz_image_compressor"), "%s", error.what());
    rclcpp::shutdown();
    return 1;
  }
  rclcpp::shutdown();
  return 0;
}
