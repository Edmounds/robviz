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

#include <gtest/gtest.h>

#include <memory>
#include <string>
#include <vector>

#include "rclcpp/rclcpp.hpp"
#include "robviz_image_compressor/config.hpp"

namespace
{

class ConfigTest : public ::testing::Test
{
protected:
  static void SetUpTestSuite()
  {
    if (!rclcpp::ok()) {
      rclcpp::init(0, nullptr);
    }
  }

  static void TearDownTestSuite()
  {
    if (rclcpp::ok()) {
      rclcpp::shutdown();
    }
  }
};

rclcpp::NodeOptions options_with(std::vector<rclcpp::Parameter> parameters)
{
  rclcpp::NodeOptions options;
  options.parameter_overrides(parameters);
  return options;
}

TEST_F(ConfigTest, LoadsMultipleStreamsAndAppliesDefaults)
{
  auto node = std::make_shared<rclcpp::Node>(
    "config_multiple_streams",
    options_with(
    {
      rclcpp::Parameter("streams", std::vector<std::string>{"color", "rear"}),
      rclcpp::Parameter("streams.color.input_topic", "/camera/color/image_raw"),
      rclcpp::Parameter("streams.color.output_base_topic", ""),
      rclcpp::Parameter("streams.rear.input_topic", "/camera/rear/image_raw"),
      rclcpp::Parameter("streams.rear.output_base_topic", "/web/rear"),
      rclcpp::Parameter("streams.rear.max_fps", 5.0),
      rclcpp::Parameter("streams.rear.jpeg_quality", 60),
    }));

  const auto streams = robviz_image_compressor::load_stream_configs(*node);

  ASSERT_EQ(streams.size(), 2U);
  EXPECT_EQ(streams[0].id, "color");
  EXPECT_EQ(streams[0].output_base_topic, "/camera/color/image_raw");
  EXPECT_DOUBLE_EQ(streams[0].max_fps, 10.0);
  EXPECT_EQ(streams[0].jpeg_quality, 70);
  EXPECT_EQ(streams[1].id, "rear");
  EXPECT_EQ(streams[1].output_base_topic, "/web/rear");
  EXPECT_DOUBLE_EQ(streams[1].max_fps, 5.0);
  EXPECT_EQ(streams[1].jpeg_quality, 60);
}

TEST_F(ConfigTest, RejectsInvalidStreamIds)
{
  auto node = std::make_shared<rclcpp::Node>(
    "config_invalid_id",
    options_with(
    {
      rclcpp::Parameter("streams", std::vector<std::string>{"front-camera"}),
    }));

  EXPECT_THROW(robviz_image_compressor::load_stream_configs(*node), std::invalid_argument);
}

TEST_F(ConfigTest, RejectsDuplicateOutputTopics)
{
  auto node = std::make_shared<rclcpp::Node>(
    "config_duplicate_output",
    options_with(
    {
      rclcpp::Parameter("streams", std::vector<std::string>{"front", "rear"}),
      rclcpp::Parameter("streams.front.input_topic", "/camera/front/image_raw"),
      rclcpp::Parameter("streams.front.output_base_topic", "/web/image"),
      rclcpp::Parameter("streams.rear.input_topic", "/camera/rear/image_raw"),
      rclcpp::Parameter("streams.rear.output_base_topic", "/web/image"),
    }));

  EXPECT_THROW(robviz_image_compressor::load_stream_configs(*node), std::invalid_argument);
}

TEST_F(ConfigTest, RejectsInvalidRateAndQuality)
{
  auto invalid_rate = std::make_shared<rclcpp::Node>(
    "config_invalid_rate",
    options_with(
    {
      rclcpp::Parameter("streams", std::vector<std::string>{"color"}),
      rclcpp::Parameter("streams.color.input_topic", "/camera/image_raw"),
      rclcpp::Parameter("streams.color.max_fps", 0.0),
    }));
  EXPECT_THROW(
    robviz_image_compressor::load_stream_configs(*invalid_rate), std::invalid_argument);

  auto invalid_quality = std::make_shared<rclcpp::Node>(
    "config_invalid_quality",
    options_with(
    {
      rclcpp::Parameter("streams", std::vector<std::string>{"color"}),
      rclcpp::Parameter("streams.color.input_topic", "/camera/image_raw"),
      rclcpp::Parameter("streams.color.jpeg_quality", 101),
    }));
  EXPECT_THROW(
    robviz_image_compressor::load_stream_configs(*invalid_quality), std::invalid_argument);
}

TEST_F(ConfigTest, RejectsCompressedOutputBase)
{
  auto node = std::make_shared<rclcpp::Node>(
    "config_compressed_output",
    options_with(
    {
      rclcpp::Parameter("streams", std::vector<std::string>{"color"}),
      rclcpp::Parameter("streams.color.input_topic", "/camera/image_raw"),
      rclcpp::Parameter(
        "streams.color.output_base_topic", "/camera/image_raw/compressed"),
    }));

  EXPECT_THROW(robviz_image_compressor::load_stream_configs(*node), std::invalid_argument);
}

}  // namespace
