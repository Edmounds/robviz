/** 点云共用着色器：turbo 色带按 value 归一化着色，点大小随距离衰减 */
import { TURBO_GLSL } from "./colormap";

export const POINTS_VERTEX = /* glsl */ `
attribute float value;
uniform float uMin;
uniform float uMax;
uniform float uZMin;
uniform float uZMax;
uniform float uSize;
uniform float uFixedSize;
uniform float uColorMode;
uniform float uHasValue;
varying float vT;
varying float vUseColor;
void main() {
  float useHeight = step(1.5, uColorMode);
  float selected = mix(value, position.z, useHeight);
  float selectedMin = mix(uMin, uZMin, useHeight);
  float selectedMax = mix(uMax, uZMax, useHeight);
  vT = clamp((selected - selectedMin) / max(selectedMax - selectedMin, 1e-6), 0.0, 1.0);
  vUseColor = uColorMode < 0.5 ? 0.0 : mix(uHasValue, 1.0, useHeight);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float fixedSize = clamp(uSize, 1.0, 10.0);
  float distanceSize = clamp(uSize * (120.0 / -mv.z), 1.0, 8.0);
  gl_PointSize = mix(distanceSize, fixedSize, uFixedSize);
  gl_Position = projectionMatrix * mv;
}
`;

export const POINTS_FRAGMENT = /* glsl */ `
precision mediump float;
uniform float uOpacity;
uniform vec3 uFlatColor;
varying float vT;
varying float vUseColor;
${TURBO_GLSL}
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  vec3 color = vUseColor > 0.5 ? turbo(vT) : uFlatColor;
  gl_FragColor = vec4(color, uOpacity);
}
`;
