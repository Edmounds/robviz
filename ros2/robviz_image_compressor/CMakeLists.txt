cmake_minimum_required(VERSION 3.8)
project(robviz_image_compressor)

if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

find_package(ament_cmake REQUIRED)
find_package(image_transport REQUIRED)
find_package(rclcpp REQUIRED)
find_package(sensor_msgs REQUIRED)

add_library(${PROJECT_NAME}_core src/config.cpp)
target_compile_features(${PROJECT_NAME}_core PUBLIC cxx_std_17)
target_include_directories(${PROJECT_NAME}_core PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>)
ament_target_dependencies(${PROJECT_NAME}_core rclcpp)

add_executable(compressor_node src/image_compressor_node.cpp)
target_compile_features(compressor_node PUBLIC cxx_std_17)
target_link_libraries(compressor_node ${PROJECT_NAME}_core)
ament_target_dependencies(compressor_node image_transport rclcpp sensor_msgs)

install(TARGETS ${PROJECT_NAME}_core compressor_node
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION lib/${PROJECT_NAME})
install(DIRECTORY include/ DESTINATION include)
install(DIRECTORY config launch DESTINATION share/${PROJECT_NAME})

if(BUILD_TESTING)
  find_package(ament_cmake_gtest REQUIRED)
  find_package(ament_lint_auto REQUIRED)
  ament_lint_auto_find_test_dependencies()

  ament_add_gtest(test_config test/test_config.cpp)
  target_link_libraries(test_config ${PROJECT_NAME}_core)
  ament_target_dependencies(test_config rclcpp)

  ament_add_gtest(test_latest_frame test/test_latest_frame.cpp)
  target_include_directories(test_latest_frame PRIVATE include)
  ament_target_dependencies(test_latest_frame sensor_msgs)
endif()

ament_export_include_directories(include)
ament_export_dependencies(rclcpp)
ament_package()
