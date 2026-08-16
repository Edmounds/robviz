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

#include "robviz_image_compressor/config.hpp"

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <regex>
#include <stdexcept>
#include <string>
#include <unordered_set>
#include <vector>

#include "rclcpp/expand_topic_or_service_name.hpp"

namespace robviz_image_compressor
{
namespace
{

constexpr char kCompressedSuffix[] = "/compressed";
const std::regex kStreamIdPattern("^[A-Za-z][A-Za-z0-9_]*$");

bool ends_with(const std::string & value, const std::string & suffix)
{
  return value.size() >= suffix.size() &&
         value.compare(value.size() - suffix.size(), suffix.size(), suffix) == 0;
}

void validate_absolute_topic(
  rclcpp::Node & node, const std::string & stream_id,
  const std::string & field, const std::string & topic)
{
  if (topic.empty() || topic.front() != '/') {
    throw std::invalid_argument(
            "stream '" + stream_id + "' " + field + " must be an absolute topic");
  }
  try {
    (void)rclcpp::expand_topic_or_service_name(
      topic, node.get_name(), node.get_namespace());
  } catch (const std::exception & error) {
    throw std::invalid_argument(
            "stream '" + stream_id + "' " + field + " is invalid: " + error.what());
  }
}

}  // namespace

std::vector<StreamConfig> load_stream_configs(rclcpp::Node & node)
{
  const auto stream_ids = node.declare_parameter<std::vector<std::string>>(
    "streams", std::vector<std::string>{});
  if (stream_ids.empty()) {
    throw std::invalid_argument("parameter 'streams' must contain at least one stream id");
  }

  std::unordered_set<std::string> seen_ids;
  std::unordered_set<std::string> seen_outputs;
  std::vector<StreamConfig> configs;
  configs.reserve(stream_ids.size());

  for (const auto & id : stream_ids) {
    if (!std::regex_match(id, kStreamIdPattern)) {
      throw std::invalid_argument(
              "invalid stream id '" + id + "'; use letters, digits, and underscores");
    }
    if (!seen_ids.insert(id).second) {
      throw std::invalid_argument("duplicate stream id '" + id + "'");
    }

    const std::string prefix = "streams." + id + ".";
    const auto input_topic = node.declare_parameter<std::string>(
      prefix + "input_topic", "");
    auto output_base_topic = node.declare_parameter<std::string>(
      prefix + "output_base_topic", "");
    const auto max_fps = node.declare_parameter<double>(prefix + "max_fps", 10.0);
    const auto quality = node.declare_parameter<int64_t>(prefix + "jpeg_quality", 70);

    if (output_base_topic.empty()) {
      output_base_topic = input_topic;
    }
    validate_absolute_topic(node, id, "input_topic", input_topic);
    validate_absolute_topic(node, id, "output_base_topic", output_base_topic);
    if (ends_with(output_base_topic, kCompressedSuffix)) {
      throw std::invalid_argument(
              "stream '" + id + "' output_base_topic must not end with /compressed");
    }
    if (!std::isfinite(max_fps) || max_fps <= 0.0) {
      throw std::invalid_argument("stream '" + id + "' max_fps must be greater than zero");
    }
    if (quality < 1 || quality > 100) {
      throw std::invalid_argument("stream '" + id + "' jpeg_quality must be in [1, 100]");
    }
    if (!seen_outputs.insert(output_base_topic).second) {
      throw std::invalid_argument(
              "multiple streams publish to '" + compressed_topic(output_base_topic) + "'");
    }

    configs.push_back(
      StreamConfig{id, input_topic, output_base_topic, max_fps, static_cast<int>(quality)});
  }

  return configs;
}

std::string compressed_topic(const std::string & output_base_topic)
{
  return output_base_topic + kCompressedSuffix;
}

std::string plugin_parameter_prefix(const std::string & output_base_topic)
{
  auto prefix = output_base_topic.substr(1);
  std::replace(prefix.begin(), prefix.end(), '/', '.');
  return prefix;
}

}  // namespace robviz_image_compressor
