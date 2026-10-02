from setuptools import find_packages, setup
import os
from glob import glob

package_name = 'robviz_video_gateway'

setup(
    name=package_name,
    version='0.1.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'config'), glob('config/*.yaml')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='cqc',
    maintainer_email='cqc@todo.todo',
    description='RobViz WebRTC Video Gateway for adaptive ROS 2 Image streaming',
    license='MIT',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'gateway_node = robviz_video_gateway.gateway_node:main',
            'test_video_publisher = robviz_video_gateway.test_video_publisher:main',
        ],
    },
)
