/** 点云共用着色器：turbo 色带按 value 归一化着色，点大小随距离衰减 */
import { TURBO_GLSL } from "./colormap";

export const POINTS_VERTEX = /* glsl */ `
attribute float value;
uniform float uMin;
uniform float uMax;
uniform float uSize;
varying float vT;
void main() {
  vT = clamp((value - uMin) / max(uMax - uMin, 1e-6), 0.0, 1.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(uSize * (120.0 / -mv.z), 1.0, 8.0);
  gl_Position = projectionMatrix * mv;
}
`;

export const POINTS_FRAGMENT = /* glsl */ `
precision mediump float;
uniform float uHasValue;
uniform float uOpacity;
uniform vec3 uFlatColor;
varying float vT;
${TURBO_GLSL}
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  vec3 color = uHasValue > 0.5 ? turbo(vT) : uFlatColor;
  gl_FragColor = vec4(color, uOpacity);
}
`;
