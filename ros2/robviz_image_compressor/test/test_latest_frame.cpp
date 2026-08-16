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

#include <chrono>
#include <memory>

#include "robviz_image_compressor/latest_frame.hpp"
#include "sensor_msgs/msg/image.hpp"

namespace
{

sensor_msgs::msg::Image::ConstSharedPtr frame(uint32_t sequence)
{
  auto message = std::make_shared<sensor_msgs::msg::Image>();
  message->header.stamp.nanosec = sequence;
  return message;
}

TEST(LatestFrame, PublishesTheFirstFrame)
{
  robviz_image_compressor::LatestFrame latest;
  latest.store(frame(1));

  const auto selected = latest.take(true);

  ASSERT_NE(selected, nullptr);
  EXPECT_EQ(selected->header.stamp.nanosec, 1U);
}

TEST(LatestFrame, KeepsOnlyTheNewestFrame)
{
  robviz_image_compressor::LatestFrame latest;
  latest.store(frame(1));
  latest.store(frame(2));

  const auto selected = latest.take(true);

  ASSERT_NE(selected, nullptr);
  EXPECT_EQ(selected->header.stamp.nanosec, 2U);
  EXPECT_EQ(latest.take(true), nullptr);
}

TEST(LatestFrame, DropsPendingDataWithoutSubscribers)
{
  robviz_image_compressor::LatestFrame latest;
  latest.store(frame(1));

  EXPECT_EQ(latest.take(false), nullptr);
  EXPECT_EQ(latest.take(true), nullptr);
}

TEST(LatestFrame, ConvertsFpsToATimerPeriod)
{
  EXPECT_EQ(
    robviz_image_compressor::timer_period(10.0),
    std::chrono::milliseconds(100));
  EXPECT_EQ(
    robviz_image_compressor::timer_period(2.5),
    std::chrono::milliseconds(400));
}

}  // namespace
