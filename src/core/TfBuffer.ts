import type { Quaternion, TimeSec, Transform, Vector3 } from "./types";

export interface Tf {
  translation: Vector3;
  rotation: Quaternion;
}

interface Sample extends Tf {
  time: TimeSec;
}

interface Edge {
  parent: string;
  samples: Sample[]; // 按 time 升序
  isStatic: boolean;
}

/** 查询时 time = 0 表示"取每段最新数据"（对齐 tf2 惯例） */
export const LATEST: TimeSec = 0;

function identity(): Tf {
  return {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
}

// ---- 四元数 / 变换数学（自实现，core 不依赖 three.js，需在 Node 运行）----

function quatMul(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

function quatConj(q: Quaternion): Quaternion {
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

function quatRotate(q: Quaternion, v: Vector3): Vector3 {
  // v' = q * (v,0) * q⁻¹，展开为高效形式
  const tx = 2 * (q.y * v.z - q.z * v.y);
  const ty = 2 * (q.z * v.x - q.x * v.z);
  const tz = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

function quatSlerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
  let cos = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  let bx = b.x, by = b.y, bz = b.z, bw = b.w;
  if (cos < 0) {
    cos = -cos;
    bx = -bx; by = -by; bz = -bz; bw = -bw;
  }
  let s0: number, s1: number;
  if (cos > 0.9995) {
    // 夹角极小，线性插值后归一化
    s0 = 1 - t;
    s1 = t;
  } else {
    const theta = Math.acos(cos);
    const sin = Math.sin(theta);
    s0 = Math.sin((1 - t) * theta) / sin;
    s1 = Math.sin(t * theta) / sin;
  }
  const q = {
    x: s0 * a.x + s1 * bx,
    y: s0 * a.y + s1 * by,
    z: s0 * a.z + s1 * bz,
    w: s0 * a.w + s1 * bw,
  };
  const n = Math.hypot(q.x, q.y, q.z, q.w) || 1;
  return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n };
}

/** a ∘ b：先施加 b 再施加 a（即 a_T_mid * mid_T_b） */
function compose(a: Tf, b: Tf): Tf {
  const rotated = quatRotate(a.rotation, b.translation);
  return {
    translation: {
      x: a.translation.x + rotated.x,
      y: a.translation.y + rotated.y,
      z: a.translation.z + rotated.z,
    },
    rotation: quatMul(a.rotation, b.rotation),
  };
}

function invert(t: Tf): Tf {
  const qi = quatConj(t.rotation);
  const ti = quatRotate(qi, t.translation);
  return {
    translation: { x: -ti.x, y: -ti.y, z: -ti.z },
    rotation: qi,
  };
}

// ---- 缓冲实现 ----

/**
 * tf2 语义的最小实现：每个 child frame 一条指向 parent 的边，
 * 边上是时间窗内的有序采样；查询时二分 + lerp/slerp 插值，跨 frame 走公共祖先。
 */
export class TfBuffer {
  #edges = new Map<string, Edge>();
  #windowSec: number;
  #framesCache: string[] | undefined;

  constructor(windowSec = 10) {
    this.#windowSec = windowSec;
  }

  clear(): void {
    this.#edges.clear();
    this.#framesCache = undefined;
  }

  setTransform(
    parent: string,
    child: string,
    time: TimeSec,
    transform: Transform,
    isStatic = false,
  ): void {
    let edge = this.#edges.get(child);
    if (!edge || edge.parent !== parent) {
      edge = { parent, samples: [], isStatic };
      this.#edges.set(child, edge);
      this.#framesCache = undefined; // 拓扑变化才失效，样本追加不重建
    }
    const sample: Sample = {
      time,
      translation: { ...transform.translation },
      rotation: { ...transform.rotation },
    };
    if (isStatic) {
      edge.samples = [sample];
      return;
    }
    const samples = edge.samples;
    // 常见情况：按时间递增到达，直接 push
    if (samples.length === 0 || time >= samples[samples.length - 1].time) {
      samples.push(sample);
    } else {
      samples.splice(lowerBound(samples, time), 0, sample);
    }
    // 裁剪时间窗
    const cutoff = samples[samples.length - 1].time - this.#windowSec;
    let drop = 0;
    while (drop < samples.length - 1 && samples[drop].time < cutoff) drop++;
    if (drop > 0) samples.splice(0, drop);
  }

  /** 所有已知 frame（含仅作为 parent 出现的），排序稳定；结果有缓存，调用方不得修改 */
  frames(): string[] {
    if (this.#framesCache) return this.#framesCache;
    const set = new Set<string>();
    for (const [child, edge] of this.#edges) {
      set.add(child);
      set.add(edge.parent);
    }
    this.#framesCache = [...set].sort();
    return this.#framesCache;
  }

  /** child → parent 映射，供 TF tree 面板使用 */
  tree(): Map<string, string> {
    const m = new Map<string, string>();
    for (const [child, edge] of this.#edges) m.set(child, edge.parent);
    return m;
  }

  /**
   * 求 target_T_source：把 source 系下的点变换到 target 系。
   * 链路断开或无数据时返回 undefined（调用方必须显式处理，这是 TF 调试的重要信号）。
   */
  lookup(target: string, source: string, time: TimeSec): Tf | undefined {
    if (target === source) return identity();

    const sourceChain = this.#chainToRoot(source); // [source, ..., root]
    const targetChain = this.#chainToRoot(target);
    const inSource = new Map<string, number>();
    sourceChain.forEach((f, i) => inSource.set(f, i));

    // 在 target 链上找第一个也在 source 链上的 frame（最近公共祖先）
    let ancestor: string | undefined;
    let targetSteps = 0;
    for (const f of targetChain) {
      if (inSource.has(f)) {
        ancestor = f;
        break;
      }
      targetSteps++;
    }
    if (ancestor === undefined) return undefined;

    // anc_T_source：source 沿链向上组合
    let ancFromSource = identity();
    for (let i = inSource.get(ancestor)! - 1; i >= 0; i--) {
      const edgeTf = this.#edgeAt(sourceChain[i], time);
      if (!edgeTf) return undefined;
      ancFromSource = compose(ancFromSource, edgeTf);
    }
    // 注意方向：链是 child→parent，parent_T_child 需从祖先侧往下依次左乘。
    // 上面的循环从祖先下一层开始向 source 方向走，等价于
    // anc_T_source = anc_T_c1 * c1_T_c2 * ... * cn_T_source
    // #edgeAt(child) 返回 parent_T_child，循环顺序已保证左乘次序正确。

    // anc_T_target：同理
    let ancFromTarget = identity();
    for (let i = targetSteps - 1; i >= 0; i--) {
      const edgeTf = this.#edgeAt(targetChain[i], time);
      if (!edgeTf) return undefined;
      ancFromTarget = compose(ancFromTarget, edgeTf);
    }

    // target_T_source = (anc_T_target)⁻¹ * anc_T_source
    return compose(invert(ancFromTarget), ancFromSource);
  }

  /** parent_T_child 在指定时刻的插值结果 */
  #edgeAt(child: string, time: TimeSec): Tf | undefined {
    const edge = this.#edges.get(child);
    if (!edge || edge.samples.length === 0) return undefined;
    const samples = edge.samples;

    if (edge.isStatic || time === LATEST) {
      const s = samples[samples.length - 1];
      return { translation: s.translation, rotation: s.rotation };
    }

    const i = lowerBound(samples, time);
    // 越界时钳制到端点（渲染平滑优先，不做 tf2 式报错）
    if (i === 0) {
      const s = samples[0];
      return { translation: s.translation, rotation: s.rotation };
    }
    if (i >= samples.length) {
      const s = samples[samples.length - 1];
      return { translation: s.translation, rotation: s.rotation };
    }
    const a = samples[i - 1];
    const b = samples[i];
    const t = (time - a.time) / (b.time - a.time);
    return {
      translation: {
        x: a.translation.x + (b.translation.x - a.translation.x) * t,
        y: a.translation.y + (b.translation.y - a.translation.y) * t,
        z: a.translation.z + (b.translation.z - a.translation.z) * t,
      },
      rotation: quatSlerp(a.rotation, b.rotation, t),
    };
  }

  #chainToRoot(frame: string): string[] {
    const chain = [frame];
    let cur = frame;
    for (;;) {
      const edge = this.#edges.get(cur);
      if (!edge) return chain;
      cur = edge.parent;
      if (chain.includes(cur)) return chain; // 环保护
      chain.push(cur);
    }
  }
}

function lowerBound(samples: Sample[], time: TimeSec): number {
  let lo = 0;
  let hi = samples.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].time < time) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export const tfMath = { quatMul, quatConj, quatRotate, quatSlerp, compose, invert };
