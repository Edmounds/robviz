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

#ifndef ROBVIZ_IMAGE_COMPRESSOR__CONFIG_HPP_
#define ROBVIZ_IMAGE_COMPRESSOR__CONFIG_HPP_

#include <string>
#include <vector>

#include "rclcpp/node.hpp"

namespace robviz_image_compressor
{

struct StreamConfig
{
  std::string id;
  std::string input_topic;
  std::string output_base_topic;
  double max_fps;
  int jpeg_quality;
};

std::vector<StreamConfig> load_stream_configs(rclcpp::Node & node);
std::string compressed_topic(const std::string & output_base_topic);
std::string plugin_parameter_prefix(const std::string & output_base_topic);

}  // namespace robviz_image_compressor

#endif  // ROBVIZ_IMAGE_COMPRESSOR__CONFIG_HPP_
