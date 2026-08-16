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

#ifndef ROBVIZ_IMAGE_COMPRESSOR__LATEST_FRAME_HPP_
#define ROBVIZ_IMAGE_COMPRESSOR__LATEST_FRAME_HPP_

#include <chrono>
#include <utility>

#include "sensor_msgs/msg/image.hpp"

namespace robviz_image_compressor
{

class LatestFrame
{
public:
  using Image = sensor_msgs::msg::Image;

  void store(Image::ConstSharedPtr image)
  {
    latest_ = std::move(image);
  }

  Image::ConstSharedPtr take(bool has_subscribers)
  {
    if (!has_subscribers) {
      latest_.reset();
      return nullptr;
    }
    return std::exchange(latest_, nullptr);
  }

private:
  Image::ConstSharedPtr latest_;
};

inline std::chrono::nanoseconds timer_period(double max_fps)
{
  return std::chrono::duration_cast<std::chrono::nanoseconds>(
    std::chrono::duration<double>(1.0 / max_fps));
}

}  // namespace robviz_image_compressor

#endif  // ROBVIZ_IMAGE_COMPRESSOR__LATEST_FRAME_HPP_
