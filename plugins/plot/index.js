import { createContext as e, createElement as t, forwardRef as n, useCallback as r, useContext as i, useEffect as a, useRef as o, useState as s } from "react";
import { Button as c, Select as l, TextInput as u, Toolbar as d } from "@robviz/core";
import { jsx as f, jsxs as p } from "react/jsx-runtime";
// node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs
var m = (e) => e?.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
// node_modules/lucide-react/dist/esm/shared/src/utils/toLucideIconData.mjs
function h(e, t, n = []) {
	if (t == null) throw Error("[lucide]: iconNode is required when icon name is used");
	return {
		name: m(e),
		size: 24,
		node: t,
		...n.length > 0 ? { aliases: n } : {}
	};
}
// node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs
var g = (e) => {
	let t = "", n = !1;
	for (let r of e) r === "-" || r === "_" || r <= " " ? n = t.length > 0 : (t.length === 0 ? t += r.toLowerCase() : t += n ? r.toUpperCase() : r, n = !1);
	return t;
}, _ = (e) => {
	let t = g(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, v = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), y = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": 2,
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
// node_modules/lucide-react/dist/esm/shared/src/build/buildLucideIconNode.mjs
function b(e) {
	return e != null;
}
function x(e, t = {}) {
	let n = t.attributeNames ?? {}, r = (e) => n[e] ?? e, i = e.size ?? e.width ?? y.width, a = e.size ?? e.height ?? y.height, o = e.aliases?.filter((e) => typeof e == "string" && e.trim() !== "").map((e) => `lucide-${e}`) ?? [], s = [...e.name ? [`lucide-${e.name}`] : [], ...o], c = t.className?.split(" ").filter(Boolean) ?? [], l = t.includeDefaultClasses === !1 ? v(...c) : v("lucide", ...s, ...c), u = t.absoluteStrokeWidth ? Number(t.strokeWidth ?? y["stroke-width"]) * Number(e.size ?? e.width ?? y.width) / Number(t.size ?? t.width ?? y.width) : t.strokeWidth ?? y["stroke-width"];
	return [
		"svg",
		{
			...Object.entries(y).reduce((e, [t, n]) => (e[r(t)] = n, e), {}),
			..."color" in t && t.color && { [r("stroke")]: t.color },
			..."size" in t && b(t.size) && {
				[r("width")]: t.size,
				[r("height")]: t.size
			},
			..."width" in t && b(t.width) && { [r("width")]: t.width },
			..."height" in t && b(t.height) && { [r("height")]: t.height },
			[r("stroke-width")]: u,
			...l && { [r("class")]: l },
			[r("viewBox")]: `0 0 ${i} ${a}`,
			...t.hasA11yProp === !1 ? { [r("aria-hidden")]: "true" } : {},
			..."attributes" in t && t.attributes
		},
		e.node.map((e) => {
			let [n, i, a] = e, o = t.nonScalingStroke ? {
				[r("vector-effect")]: "non-scaling-stroke",
				...i
			} : i;
			return a ? [
				n,
				o,
				a
			] : [n, o];
		})
	];
}
// node_modules/lucide-react/dist/esm/shared/src/build/buildLucideIconForReact.mjs
function S(e, t = {}) {
	return x(e, {
		...t,
		attributeNames: {
			...t.attributeNames,
			class: "className",
			"stroke-width": "strokeWidth",
			"stroke-linecap": "strokeLinecap",
			"stroke-linejoin": "strokeLinejoin",
			"vector-effect": "vectorEffect"
		}
	});
}
// node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs
var C = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, w = e({}), T = () => i(w), E = n(({ color: e, size: n, width: r, height: i, strokeWidth: a, absoluteStrokeWidth: o, nonScalingStroke: s, className: c = "", children: l, iconNode: u = [], icon: d = {
	node: u,
	aliases: [],
	size: 24
}, ...f }, p) => {
	let { size: m = 24, strokeWidth: h = 2, absoluteStrokeWidth: g = !1, nonScalingStroke: _ = !1, color: y = "currentColor", className: b = "" } = T() ?? {}, x = !!l || C(f), [w, E, D = []] = S(d, {
		color: e ?? y,
		width: r ?? n ?? m,
		height: i ?? n ?? m,
		strokeWidth: a ?? h,
		absoluteStrokeWidth: o ?? g,
		nonScalingStroke: s ?? _,
		className: v(b, c),
		hasA11yProp: x,
		attributes: f
	});
	return t(w, {
		ref: p,
		...E
	}, [...D.map(([e, n]) => t(e, n)), ...Array.isArray(l) ? l : [l]]);
});
// node_modules/lucide-react/dist/esm/createLucideIcon.mjs
function D(e, r = [], i = []) {
	let a = typeof e == "string" ? h(e, r, i) : e, o = n(({ className: e, ...n }, r) => t(E, {
		ref: r,
		icon: a,
		className: e,
		...n
	}));
	return a.name && (o.displayName = _(a.name)), o;
}
// node_modules/lucide-react/dist/esm/icons/eye-off.mjs
var O = {
	name: "eye-off",
	size: 24,
	node: [
		["path", {
			d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
			key: "ct8e1f"
		}],
		["path", {
			d: "M14.084 14.158a3 3 0 0 1-4.242-4.242",
			key: "151rxh"
		}],
		["path", {
			d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
			key: "13bj9a"
		}],
		["path", {
			d: "m2 2 20 20",
			key: "1ooewy"
		}]
	]
};
O.node;
var k = D(O), A = {
	name: "eye",
	size: 24,
	node: [["path", {
		d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
		key: "1nclc0"
	}], ["circle", {
		cx: "12",
		cy: "12",
		r: "3",
		key: "1v7zrd"
	}]]
};
A.node;
var j = D(A), M = {
	name: "pause",
	size: 24,
	node: [["rect", {
		x: "14",
		y: "3",
		width: "5",
		height: "18",
		rx: "1",
		key: "kaeet6"
	}], ["rect", {
		x: "5",
		y: "3",
		width: "5",
		height: "18",
		rx: "1",
		key: "1wsw3u"
	}]]
};
M.node;
var ee = D(M), te = {
	name: "play",
	size: 24,
	node: [["path", {
		d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
		key: "10ikf1"
	}]]
};
te.node;
var ne = D(te), re = {
	name: "rotate-ccw",
	size: 24,
	node: [["path", {
		d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
		key: "1357e3"
	}], ["path", {
		d: "M3 3v5h5",
		key: "1xhq8a"
	}]]
};
re.node;
var ie = D(re), N = {
	name: "trash",
	size: 24,
	node: [
		["path", {
			d: "M10 11v6",
			key: "nco0om"
		}],
		["path", {
			d: "M14 11v6",
			key: "outv1u"
		}],
		["path", {
			d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
			key: "miytrc"
		}],
		["path", {
			d: "M3 6h18",
			key: "d0wm0j"
		}],
		["path", {
			d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
			key: "e791ji"
		}]
	],
	aliases: ["trash-2"]
};
N.node;
var P = D(N), F = !0, ae = "uplot", oe = "u-hz", se = "u-vt", ce = "u-title", le = "u-wrap", ue = "u-under", de = "u-over", fe = "u-axis", pe = "u-off", me = "u-select", he = "u-cursor-x", ge = "u-cursor-y", _e = "u-cursor-pt", ve = "u-legend", ye = "u-live", be = "u-inline", xe = "u-series", Se = "u-marker", Ce = "u-label", we = "u-value", Te = "width", Ee = "height", De = "top", Oe = "bottom", ke = "left", Ae = "right", je = "#000", Me = "#0000", Ne = "mousemove", Pe = "mousedown", Fe = "mouseup", Ie = "mouseenter", Le = "mouseleave", Re = "dblclick", ze = "resize", Be = "scroll", Ve = "change", He = "dppxchange", Ue = "--", We = typeof window < "u", Ge = We ? document : null, Ke = We ? window : null, qe = We ? navigator : null, I, Je;
function Ye() {
	let e = devicePixelRatio;
	I != e && (I = e, Je && lt(Ve, Je, Ye), Je = matchMedia(`(min-resolution: ${I - .001}dppx) and (max-resolution: ${I + .001}dppx)`), ct(Ve, Je, Ye), Ke.dispatchEvent(new CustomEvent(He)));
}
function Xe(e, t) {
	if (t != null) {
		let n = e.classList;
		!n.contains(t) && n.add(t);
	}
}
function Ze(e, t) {
	let n = e.classList;
	n.contains(t) && n.remove(t);
}
function L(e, t, n) {
	e.style[t] = n + "px";
}
function Qe(e, t, n, r) {
	let i = Ge.createElement(e);
	return t != null && Xe(i, t), n?.insertBefore(i, r), i;
}
function $e(e, t) {
	return Qe("div", e, t);
}
var et = /* @__PURE__ */ new WeakMap();
function tt(e, t, n, r, i) {
	let a = "translate(" + t + "px," + n + "px)";
	a != et.get(e) && (e.style.transform = a, et.set(e, a), t < 0 || n < 0 || t > r || n > i ? Xe(e, pe) : Ze(e, pe));
}
var nt = /* @__PURE__ */ new WeakMap();
function rt(e, t, n) {
	let r = t + n;
	r != nt.get(e) && (nt.set(e, r), e.style.background = t, e.style.borderColor = n);
}
var it = /* @__PURE__ */ new WeakMap();
function at(e, t, n, r) {
	let i = t + "" + n;
	i != it.get(e) && (it.set(e, i), e.style.height = n + "px", e.style.width = t + "px", e.style.marginLeft = r ? -t / 2 + "px" : 0, e.style.marginTop = r ? -n / 2 + "px" : 0);
}
var ot = { passive: !0 }, st = {
	...ot,
	capture: !0
};
function ct(e, t, n, r) {
	t.addEventListener(e, n, r ? st : ot);
}
function lt(e, t, n, r) {
	t.removeEventListener(e, n, ot);
}
We && Ye();
function ut(e, t, n, r) {
	let i;
	n ||= 0, r ||= t.length - 1;
	let a = r <= 2147483647;
	for (; r - n > 1;) i = a ? n + r >> 1 : kt((n + r) / 2), t[i] < e ? n = i : r = i;
	return e - t[n] <= t[r] - e ? n : r;
}
function dt(e) {
	return (t, n, r) => {
		let i = -1, a = -1;
		for (let a = n; a <= r; a++) if (e(t[a])) {
			i = a;
			break;
		}
		for (let i = r; i >= n; i--) if (e(t[i])) {
			a = i;
			break;
		}
		return [i, a];
	};
}
var ft = (e) => e != null, pt = (e) => e != null && e > 0, mt = dt(ft), ht = dt(pt);
function gt(e, t, n, r = 0, i = !1) {
	let a = i ? ht : mt, o = i ? pt : ft;
	[t, n] = a(e, t, n);
	let s = e[t], c = e[t];
	if (t > -1) {
		if (r == 1) s = e[t], c = e[n];
		else if (r == -1) s = e[n], c = e[t];
		else for (let r = t; r <= n; r++) {
			let t = e[r];
			o(t) && (t < s ? s = t : t > c && (c = t));
		}
	}
	return [s ?? V, c ?? -V];
}
function _t(e, t, n, r) {
	let i = Ft(e), a = Ft(t);
	e == t && (i == -1 ? (e *= n, t /= n) : (e /= n, t *= n));
	let o = n == 10 ? It : Lt, s = i == 1 ? kt : jt, c = a == 1 ? jt : kt, l = s(o(Ot(e))), u = c(o(Ot(t))), d = Pt(n, l), f = Pt(n, u);
	return n == 10 && (l < 0 && (d = U(d, -l)), u < 0 && (f = U(f, -u))), r || n == 2 ? (e = d * i, t = f * a) : (e = $t(e, d), t = Qt(t, f)), [e, t];
}
function vt(e, t, n, r) {
	let i = _t(e, t, n, r);
	return e == 0 && (i[0] = 0), t == 0 && (i[1] = 0), i;
}
var yt = .1, bt = {
	mode: 3,
	pad: yt
}, xt = {
	pad: 0,
	soft: null,
	mode: 0
}, R = {
	min: xt,
	max: xt
};
function St(e, t, n, r) {
	return dn(n) ? B(e, t, n) : (xt.pad = n, xt.soft = r ? 0 : null, xt.mode = r ? 3 : 0, B(e, t, R));
}
function z(e, t) {
	return e ?? t;
}
function Ct(e, t, n) {
	for (t = z(t, 0), n = z(n, e.length - 1); t <= n;) {
		if (e[t] != null) return !0;
		t++;
	}
	return !1;
}
function B(e, t, n) {
	let r = n.min, i = n.max, a = z(r.pad, 0), o = z(i.pad, 0), s = z(r.hard, -V), c = z(i.hard, V), l = z(r.soft, V), u = z(i.soft, -V), d = z(r.mode, 0), f = z(i.mode, 0), p = t - e, m = It(p), h = Nt(Ot(e), Ot(t)), g = Ot(It(h) - m);
	(p < 1e-24 || g > 10) && (p = 0, (e == 0 || t == 0) && (p = 1e-24, d == 2 && l != V && (a = 0), f == 2 && u != -V && (o = 0)));
	let _ = p || h || 1e3, v = Pt(10, kt(It(_))), y = U($t(e - _ * (p == 0 ? e == 0 ? .1 : 1 : a), v / 10), 24), b = e >= l && (d == 1 || d == 3 && y <= l || d == 2 && y >= l) ? l : V, x = Nt(s, y < b && e >= b ? b : Mt(b, y)), S = U(Qt(t + _ * (p == 0 ? t == 0 ? .1 : 1 : o), v / 10), 24), C = t <= u && (f == 1 || f == 3 && S >= u || f == 2 && S <= u) ? u : -V, w = Mt(c, S > C && t <= C ? C : Nt(C, S));
	return x == w && x == 0 && (w = 100), [x, w];
}
var wt = new Intl.NumberFormat(We ? qe.language : "en-US"), Tt = (e) => wt.format(e), Et = Math, Dt = Et.PI, Ot = Et.abs, kt = Et.floor, At = Et.round, jt = Et.ceil, Mt = Et.min, Nt = Et.max, Pt = Et.pow, Ft = Et.sign, It = Et.log10, Lt = Et.log2, Rt = (e, t = 1) => Et.sinh(e) * t, zt = (e, t = 1) => Et.asinh(e / t), V = Infinity;
function Bt(e) {
	return (It((e ^ e >> 31) - (e >> 31)) | 0) + 1;
}
function Vt(e, t, n) {
	return Mt(Nt(e, t), n);
}
function Ht(e) {
	return typeof e == "function";
}
function H(e) {
	return Ht(e) ? e : () => e;
}
var Ut = () => {}, Wt = (e) => e, Gt = (e, t) => t, Kt = (e) => null, qt = (e) => !0, Jt = (e, t) => e == t, Yt = /\.\d*?(?=9{6,}|0{6,})/gm, Xt = (e) => {
	if (cn(e) || en.has(e)) return e;
	let t = `${e}`, n = t.match(Yt);
	if (n == null) return e;
	let r = n[0].length - 1;
	if (t.indexOf("e-") != -1) {
		let [e, n] = t.split("e");
		return +`${Xt(e)}e${n}`;
	}
	return U(e, r);
};
function Zt(e, t) {
	return Xt(U(Xt(e / t)) * t);
}
function Qt(e, t) {
	return Xt(jt(Xt(e / t)) * t);
}
function $t(e, t) {
	return Xt(kt(Xt(e / t)) * t);
}
function U(e, t = 0) {
	if (cn(e)) return e;
	let n = 10 ** t;
	return At(e * n * (1 + 2 ** -52)) / n;
}
var en = /* @__PURE__ */ new Map();
function tn(e) {
	return (("" + e).split(".")[1] || "").length;
}
function nn(e, t, n, r) {
	let i = [], a = r.map(tn);
	for (let o = t; o < n; o++) {
		let t = Ot(o), n = U(Pt(e, o), t);
		for (let s = 0; s < r.length; s++) {
			let c = e == 10 ? +`${r[s]}e${o}` : r[s] * n, l = (o >= 0 ? 0 : t) + (o >= a[s] ? 0 : a[s]), u = e == 10 ? c : U(c, l);
			i.push(u), en.set(u, l);
		}
	}
	return i;
}
var rn = {}, an = [], on = [null, null], sn = Array.isArray, cn = Number.isInteger, ln = (e) => e === void 0;
function un(e) {
	return typeof e == "string";
}
function dn(e) {
	let t = !1;
	if (e != null) {
		let n = e.constructor;
		t = n == null || n == Object;
	}
	return t;
}
function fn(e) {
	return typeof e == "object" && !!e;
}
var pn = Object.getPrototypeOf(Uint8Array), mn = "__proto__";
function hn(e, t = dn) {
	let n;
	if (sn(e)) {
		let r = e.find((e) => e != null);
		if (sn(r) || t(r)) {
			n = Array(e.length);
			for (let r = 0; r < e.length; r++) n[r] = hn(e[r], t);
		} else n = e.slice();
	} else if (e instanceof pn) n = e.slice();
	else if (t(e)) {
		n = {};
		for (let r in e) r != mn && (n[r] = hn(e[r], t));
	} else n = e;
	return n;
}
function W(e) {
	let t = arguments;
	for (let n = 1; n < t.length; n++) {
		let r = t[n];
		for (let t in r) t != mn && (dn(e[t]) ? W(e[t], hn(r[t])) : e[t] = hn(r[t]));
	}
	return e;
}
var gn = 0, _n = 1, vn = 2;
function yn(e, t, n) {
	for (let r = 0, i, a = -1; r < t.length; r++) {
		let o = t[r];
		if (o > a) {
			for (i = o - 1; i >= 0 && e[i] == null;) e[i--] = null;
			for (i = o + 1; i < n && e[i] == null;) e[a = i++] = null;
		}
	}
}
function bn(e, t) {
	if (Cn(e)) {
		let t = e[0].slice();
		for (let n = 1; n < e.length; n++) t.push(...e[n].slice(1));
		return wn(t[0]) || (t = Sn(t)), t;
	}
	let n = /* @__PURE__ */ new Set();
	for (let t = 0; t < e.length; t++) {
		let r = e[t][0], i = r.length;
		for (let e = 0; e < i; e++) n.add(r[e]);
	}
	let r = [Array.from(n).sort((e, t) => e - t)], i = r[0].length, a = /* @__PURE__ */ new Map();
	for (let e = 0; e < i; e++) a.set(r[0][e], e);
	for (let n = 0; n < e.length; n++) {
		let o = e[n], s = o[0];
		for (let e = 1; e < o.length; e++) {
			let c = o[e], l = Array(i).fill(void 0), u = t ? t[n][e] : _n, d = [];
			for (let e = 0; e < c.length; e++) {
				let t = c[e], n = a.get(s[e]);
				t === null ? u != gn && (l[n] = t, u == vn && d.push(n)) : l[n] = t;
			}
			yn(l, d, i), r.push(l);
		}
	}
	return r;
}
var xn = typeof queueMicrotask > "u" ? (e) => Promise.resolve().then(e) : queueMicrotask;
function Sn(e) {
	let t = e[0], n = t.length, r = Array(n);
	for (let e = 0; e < r.length; e++) r[e] = e;
	r.sort((e, n) => t[e] - t[n]);
	let i = [];
	for (let t = 0; t < e.length; t++) {
		let a = e[t], o = Array(n);
		for (let e = 0; e < n; e++) o[e] = a[r[e]];
		i.push(o);
	}
	return i;
}
function Cn(e) {
	let t = e[0][0], n = t.length;
	for (let r = 1; r < e.length; r++) {
		let i = e[r][0];
		if (i.length != n) return !1;
		if (i != t) {
			for (let e = 0; e < n; e++) if (i[e] != t[e]) return !1;
		}
	}
	return !0;
}
function wn(e, t = 100) {
	let n = e.length;
	if (n <= 1) return !0;
	let r = 0, i = n - 1;
	for (; r <= i && e[r] == null;) r++;
	for (; i >= r && e[i] == null;) i--;
	if (i <= r) return !0;
	let a = Nt(1, kt((i - r + 1) / t));
	for (let t = e[r], n = r + a; n <= i; n += a) {
		let r = e[n];
		if (r != null) {
			if (r <= t) return !1;
			t = r;
		}
	}
	return !0;
}
var Tn = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
], En = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];
function Dn(e) {
	return e.slice(0, 3);
}
var On = En.map(Dn), kn = {
	MMMM: Tn,
	MMM: Tn.map(Dn),
	WWWW: En,
	WWW: On
};
function An(e) {
	return (e < 10 ? "0" : "") + e;
}
function jn(e) {
	return (e < 10 ? "00" : e < 100 ? "0" : "") + e;
}
var Mn = {
	YYYY: (e) => e.getFullYear(),
	YY: (e) => (e.getFullYear() + "").slice(2),
	MMMM: (e, t) => t.MMMM[e.getMonth()],
	MMM: (e, t) => t.MMM[e.getMonth()],
	MM: (e) => An(e.getMonth() + 1),
	M: (e) => e.getMonth() + 1,
	DD: (e) => An(e.getDate()),
	D: (e) => e.getDate(),
	WWWW: (e, t) => t.WWWW[e.getDay()],
	WWW: (e, t) => t.WWW[e.getDay()],
	HH: (e) => An(e.getHours()),
	H: (e) => e.getHours(),
	h: (e) => {
		let t = e.getHours();
		return t == 0 ? 12 : t > 12 ? t - 12 : t;
	},
	AA: (e) => e.getHours() >= 12 ? "PM" : "AM",
	aa: (e) => e.getHours() >= 12 ? "pm" : "am",
	a: (e) => e.getHours() >= 12 ? "p" : "a",
	mm: (e) => An(e.getMinutes()),
	m: (e) => e.getMinutes(),
	ss: (e) => An(e.getSeconds()),
	s: (e) => e.getSeconds(),
	fff: (e) => jn(e.getMilliseconds())
};
function Nn(e, t) {
	t ||= kn;
	let n = [], r = /\{([a-z]+)\}|[^{]+/gi, i;
	for (; i = r.exec(e);) n.push(i[0][0] == "{" ? Mn[i[1]] : i[0]);
	return (e) => {
		let r = "";
		for (let i = 0; i < n.length; i++) r += typeof n[i] == "string" ? n[i] : n[i](e, t);
		return r;
	};
}
var Pn = new Intl.DateTimeFormat().resolvedOptions().timeZone;
function Fn(e, t) {
	let n;
	return t == "UTC" || t == "Etc/UTC" ? n = /* @__PURE__ */ new Date(+e + e.getTimezoneOffset() * 6e4) : t == Pn ? n = e : (n = new Date(e.toLocaleString("en-US", { timeZone: t })), n.setMilliseconds(e.getMilliseconds())), n;
}
var In = (e) => e % 1 == 0, Ln = [
	1,
	2,
	2.5,
	5
], Rn = nn(10, -32, 0, Ln), zn = nn(10, 0, 32, Ln), Bn = zn.filter(In), Vn = Rn.concat(zn), G = "\n", K = "{YYYY}", q = G + K, Hn = "{M}/{D}", Un = G + Hn, Wn = Un + "/{YY}", Gn = "{aa}", Kn = "{h}:{mm}" + Gn, qn = G + Kn, Jn = ":{ss}", J = null;
function Yn(e) {
	let t = e * 1e3, n = t * 60, r = n * 60, i = r * 24, a = i * 30, o = i * 365, s = (e == 1 ? nn(10, 0, 3, Ln).filter(In) : nn(10, -3, 0, Ln)).concat([
		t,
		t * 5,
		t * 10,
		t * 15,
		t * 30,
		n,
		n * 5,
		n * 10,
		n * 15,
		n * 30,
		r,
		r * 2,
		r * 3,
		r * 4,
		r * 6,
		r * 8,
		r * 12,
		i,
		i * 2,
		i * 3,
		i * 4,
		i * 5,
		i * 6,
		i * 7,
		i * 8,
		i * 9,
		i * 10,
		i * 15,
		a,
		a * 2,
		a * 3,
		a * 4,
		a * 6,
		o,
		o * 2,
		o * 5,
		o * 10,
		o * 25,
		o * 50,
		o * 100
	]), c = [
		[
			o,
			K,
			J,
			J,
			J,
			J,
			J,
			J,
			1
		],
		[
			i * 28,
			"{MMM}",
			q,
			J,
			J,
			J,
			J,
			J,
			1
		],
		[
			i,
			Hn,
			q,
			J,
			J,
			J,
			J,
			J,
			1
		],
		[
			r,
			"{h}" + Gn,
			Wn,
			J,
			Un,
			J,
			J,
			J,
			1
		],
		[
			n,
			Kn,
			Wn,
			J,
			Un,
			J,
			J,
			J,
			1
		],
		[
			t,
			Jn,
			Wn + " " + Kn,
			J,
			Un + " " + Kn,
			J,
			qn,
			J,
			1
		],
		[
			e,
			Jn + ".{fff}",
			Wn + " " + Kn,
			J,
			Un + " " + Kn,
			J,
			qn,
			J,
			1
		]
	];
	function l(t) {
		return (s, c, l, u, d, f) => {
			let p = [], m = d >= o, h = d >= a && d < o, g = t(l), _ = U(g * e, 3), v = ar(g.getFullYear(), m ? 0 : g.getMonth(), h || m ? 1 : g.getDate()), y = U(v * e, 3);
			if (h || m) {
				let n = h ? d / a : 0, r = m ? d / o : 0, i = _ == y ? _ : U(ar(v.getFullYear() + r, v.getMonth() + n, 1) * e, 3), s = new Date(At(i / e)), c = s.getFullYear(), l = s.getMonth();
				for (let a = 0; i <= u; a++) {
					let o = ar(c + r * a, l + n * a, 1), s = o - t(U(o * e, 3));
					i = U((+o + s) * e, 3), i <= u && p.push(i);
				}
			} else {
				let a = d >= i ? i : d, o = y + (kt(l) - kt(_)) + Qt(_ - y, a);
				p.push(o);
				let m = t(o), h = m.getHours() + m.getMinutes() / n + m.getSeconds() / r, g = d / r, v = f / s.axes[c]._space;
				for (; o = U(o + d, e == 1 ? 0 : 3), !(o > u);) if (g > 1) {
					let e = kt(U(h + g, 6)) % 24, n = t(o).getHours() - e;
					n > 1 && (n = -1), o -= n * r, h = (h + g) % 24;
					let i = p[p.length - 1];
					U((o - i) / d, 3) * v >= .7 && p.push(o);
				} else p.push(o);
			}
			return p;
		};
	}
	return [
		s,
		c,
		l
	];
}
var [Xn, Zn, Qn] = Yn(1), [$n, er, tr] = Yn(.001);
nn(2, -53, 53, [1]);
function nr(e, t) {
	return e.map((e) => e.map((n, r) => r == 0 || r == 8 || n == null ? n : t(r == 1 || e[8] == 0 ? n : e[1] + n)));
}
function rr(e, t) {
	return (n, r, i, a, o) => {
		let s = t.find((e) => o >= e[0]) || t[t.length - 1], c, l, u, d, f, p;
		return r.map((t) => {
			let n = e(t), r = n.getFullYear(), i = n.getMonth(), a = n.getDate(), o = n.getHours(), m = n.getMinutes(), h = n.getSeconds(), g = r != c && s[2] || i != l && s[3] || a != u && s[4] || o != d && s[5] || m != f && s[6] || h != p && s[7] || s[1];
			return c = r, l = i, u = a, d = o, f = m, p = h, g(n);
		});
	};
}
function ir(e, t) {
	let n = Nn(t);
	return (t, r, i, a, o) => r.map((t) => n(e(t)));
}
function ar(e, t, n) {
	return new Date(e, t, n);
}
function or(e, t) {
	return t(e);
}
var sr = "{YYYY}-{MM}-{DD} {h}:{mm}{aa}";
function cr(e, t) {
	return (n, r, i, a) => a == null ? Ue : t(e(r));
}
function lr(e, t) {
	let n = e.series[t];
	return n.width ? n.stroke(e, t) : n.points.width ? n.points.stroke(e, t) : null;
}
function ur(e, t) {
	return e.series[t].fill(e, t);
}
var dr = {
	show: !0,
	live: !0,
	isolate: !1,
	mount: Ut,
	markers: {
		show: !0,
		width: 2,
		stroke: lr,
		fill: ur,
		dash: "solid"
	},
	idx: null,
	idxs: null,
	values: []
};
function fr(e, t) {
	let n = e.cursor.points, r = $e(), i = n.size(e, t);
	L(r, Te, i), L(r, Ee, i);
	let a = i / -2;
	L(r, "marginLeft", a), L(r, "marginTop", a);
	let o = n.width(e, t, i);
	return o && L(r, "borderWidth", o), r;
}
function pr(e, t) {
	let n = e.series[t].points;
	return n._fill || n._stroke;
}
function mr(e, t) {
	let n = e.series[t].points;
	return n._stroke || n._fill;
}
function hr(e, t) {
	return e.series[t].points.size;
}
var gr = [0, 0];
function _r(e, t, n) {
	return gr[0] = t, gr[1] = n, gr;
}
function vr(e, t, n, r = !0) {
	return (e) => {
		e.button != 0 || r && e.target != t || n(e);
	};
}
function yr(e, t, n, r = !0) {
	return (e) => {
		r && e.target != t || n(e);
	};
}
var br = {
	show: !0,
	x: !0,
	y: !0,
	lock: !1,
	move: _r,
	points: {
		one: !1,
		show: fr,
		size: hr,
		width: 0,
		stroke: mr,
		fill: pr
	},
	bind: {
		mousedown: vr,
		mouseup: vr,
		click: vr,
		dblclick: vr,
		mousemove: yr,
		mouseleave: yr,
		mouseenter: yr
	},
	drag: {
		setScale: !0,
		x: !0,
		y: !1,
		dist: 0,
		uni: null,
		click: (e, t) => {
			t.stopPropagation(), t.stopImmediatePropagation();
		},
		_x: !1,
		_y: !1
	},
	focus: {
		dist: (e, t, n, r, i) => r - i,
		prox: -1,
		bias: 0
	},
	hover: {
		skip: [void 0],
		prox: null,
		bias: 0
	},
	left: -10,
	top: -10,
	idx: null,
	dataIdx: null,
	idxs: null,
	event: null
}, xr = {
	show: !0,
	stroke: "rgba(0,0,0,0.07)",
	width: 2
}, Sr = W({}, xr, { filter: Gt }), Cr = W({}, Sr, { size: 10 }), wr = W({}, xr, { show: !1 }), Tr = "12px system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"", Er = "bold " + Tr, Dr = 1.5, Or = {
	show: !0,
	scale: "x",
	stroke: je,
	space: 50,
	gap: 5,
	alignTo: 1,
	size: 50,
	labelGap: 0,
	labelSize: 30,
	labelFont: Er,
	side: 2,
	grid: Sr,
	ticks: Cr,
	border: wr,
	font: Tr,
	lineGap: Dr,
	rotate: 0
}, kr = "Value", Ar = "Time", jr = {
	show: !0,
	scale: "x",
	auto: !1,
	sorted: 1,
	min: V,
	max: -Infinity,
	idxs: []
};
function Mr(e, t, n, r, i) {
	return t.map((e) => e == null ? "" : Tt(e));
}
function Nr(e, t, n, r, i, a, o) {
	let s = [], c = en.get(i) || 0;
	n = o ? n : U(Qt(n, i), c);
	for (let e = n; e <= r; e = U(e + i, c)) s.push(Object.is(e, -0) ? 0 : e);
	return s;
}
function Pr(e, t, n, r, i, a, o) {
	let s = [], c = e.scales[e.axes[t].scale].log;
	i = Pt(c, kt((c == 10 ? It : Lt)(n))), c == 10 && (i = Vn[ut(i, Vn)]);
	let l = n, u = i * c;
	c == 10 && (u = Vn[ut(u, Vn)]);
	do
		s.push(l), l += i, c == 10 && !en.has(l) && (l = U(l, en.get(i))), l >= u && (i = l, u = i * c, c == 10 && (u = Vn[ut(u, Vn)]));
	while (l <= r);
	return s;
}
function Fr(e, t, n, r, i, a, o) {
	let s = e.scales[e.axes[t].scale].asinh, c = r > s ? Pr(e, t, Nt(s, n), r, i) : [s], l = r >= 0 && n <= 0 ? [0] : [];
	return (n < -s ? Pr(e, t, Nt(s, -r), -n, i) : [s]).reverse().map((e) => -e).concat(l, c);
}
var Ir = /./, Lr = /[12357]/, Rr = /[125]/, zr = /1/, Br = (e, t, n, r) => e.map((e, i) => t == 4 && e == 0 || i % r == 0 && n.test(e.toExponential()[+(e < 0)]) ? e : null);
function Vr(e, t, n, r, i) {
	let a = e.axes[n], o = a.scale, s = e.scales[o], c = e.valToPos, l = a._space, u = c(10, o), d = c(9, o) - u >= l ? Ir : c(7, o) - u >= l ? Lr : c(5, o) - u >= l ? Rr : zr;
	if (d == zr) {
		let e = Ot(c(1, o) - u);
		if (e < l) return Br(t.slice().reverse(), s.distr, d, jt(l / e)).reverse();
	}
	return Br(t, s.distr, d, 1);
}
function Hr(e, t, n, r, i) {
	let a = e.axes[n], o = a.scale, s = a._space, c = e.valToPos, l = Ot(c(1, o) - c(2, o));
	return l < s ? Br(t.slice().reverse(), 3, Ir, jt(s / l)).reverse() : t;
}
function Ur(e, t, n, r) {
	return r == null ? Ue : t == null ? "" : Tt(t);
}
var Wr = {
	show: !0,
	scale: "y",
	stroke: je,
	space: 30,
	gap: 5,
	alignTo: 1,
	size: 50,
	labelGap: 0,
	labelSize: 30,
	labelFont: Er,
	side: 3,
	grid: Sr,
	ticks: Cr,
	border: wr,
	font: Tr,
	lineGap: Dr,
	rotate: 0
};
function Gr(e, t) {
	return U((3 + (e || 1) * 2) * t, 3);
}
function Kr(e, t) {
	let { scale: n, idxs: r } = e.series[0], i = e._data[0], a = e.valToPos(i[r[0]], n, !0), o = Ot(e.valToPos(i[r[1]], n, !0) - a) / (e.series[t].points.space * I);
	return r[1] - r[0] <= o;
}
var qr = {
	scale: null,
	auto: !0,
	sorted: 0,
	min: V,
	max: -Infinity
}, Jr = (e, t, n, r, i) => i, Yr = {
	show: !0,
	auto: !0,
	sorted: 0,
	gaps: Jr,
	alpha: 1,
	facets: [W({}, qr, { scale: "x" }), W({}, qr, { scale: "y" })]
}, Xr = {
	scale: "y",
	auto: !0,
	sorted: 0,
	show: !0,
	spanGaps: !1,
	gaps: Jr,
	alpha: 1,
	points: {
		show: Kr,
		filter: null
	},
	values: null,
	min: V,
	max: -Infinity,
	idxs: [],
	path: null,
	clip: null
};
function Zr(e, t, n, r, i) {
	return n / 10;
}
var Qr = {
	time: F,
	auto: !0,
	distr: 1,
	log: 10,
	asinh: 1,
	min: null,
	max: null,
	dir: 1,
	ori: 0
}, $r = W({}, Qr, {
	time: !1,
	ori: 1
}), ei = {};
function ti(e, t) {
	let n = ei[e];
	return n || (n = {
		key: e,
		plots: [],
		sub(e) {
			n.plots.push(e);
		},
		unsub(e) {
			n.plots = n.plots.filter((t) => t != e);
		},
		pub(e, t, r, i, a, o, s) {
			for (let c = 0; c < n.plots.length; c++) n.plots[c] != t && n.plots[c].pub(e, t, r, i, a, o, s);
		}
	}, e != null && (ei[e] = n)), n;
}
var ni = 1, ri = 2;
function ii(e, t, n) {
	let r = e.mode, i = e.series[t], a = r == 2 ? e._data[t] : e._data, o = e.scales, s = e.bbox, c = a[0], l = r == 2 ? a[1] : a[t], u = r == 2 ? o[i.facets[0].scale] : o[e.series[0].scale], d = r == 2 ? o[i.facets[1].scale] : o[i.scale], f = s.left, p = s.top, m = s.width, h = s.height, g = e.valToPosH, _ = e.valToPosV;
	return u.ori == 0 ? n(i, c, l, u, d, g, _, f, p, m, h, pi, hi, _i, yi, xi) : n(i, c, l, u, d, _, g, p, f, h, m, mi, gi, vi, bi, Y);
}
function ai(e, t) {
	let n = 0, r = 0, i = z(e.bands, an);
	for (let e = 0; e < i.length; e++) {
		let a = i[e];
		a.series[0] == t ? n = a.dir : a.series[1] == t && (a.dir == 1 ? r |= 1 : r |= 2);
	}
	return [n, r == 1 ? -1 : r == 2 ? 1 : r == 3 ? 2 : 0];
}
function oi(e, t, n, r, i) {
	let a = e.mode, o = e.series[t], s = a == 2 ? o.facets[1].scale : o.scale, c = e.scales[s];
	return i == -1 ? c.min : i == 1 ? c.max : c.distr == 3 ? c.dir == 1 ? c.min : c.max : 0;
}
function si(e, t, n, r, i, a) {
	return ii(e, t, (e, t, o, s, c, l, u, d, f, p, m) => {
		let h = e.pxRound, g = s.dir * (s.ori == 0 ? 1 : -1), _ = s.ori == 0 ? hi : gi, v, y;
		g == 1 ? (v = n, y = r) : (v = r, y = n);
		let b = h(l(t[v], s, p, d)), x = h(u(o[v], c, m, f)), S = h(l(t[y], s, p, d)), C = h(u(a == 1 ? c.max : c.min, c, m, f)), w = new Path2D(i);
		return _(w, S, C), _(w, b, C), _(w, b, x), w;
	});
}
function ci(e, t, n, r, i, a) {
	let o = null;
	if (e.length > 0) {
		o = new Path2D();
		let s = t == 0 ? _i : vi, c = n;
		for (let t = 0; t < e.length; t++) {
			let n = e[t];
			if (n[1] > n[0]) {
				let e = n[0] - c;
				e > 0 && s(o, c, r, e, r + a), c = n[1];
			}
		}
		let l = n + i - c;
		l > 0 && s(o, c, r - 5, l, r + a + 10);
	}
	return o;
}
function li(e, t, n) {
	let r = e[e.length - 1];
	r && r[0] == t ? r[1] = n : e.push([t, n]);
}
function ui(e, t, n, r, i, a, o) {
	let s = [], c = e.length;
	for (let l = i == 1 ? n : r; l >= n && l <= r; l += i) if (t[l] === null) {
		let u = l, d = l;
		if (i == 1) for (; ++l <= r && t[l] === null;) d = l;
		else for (; --l >= n && t[l] === null;) d = l;
		let f = a(e[u]), p = d == u ? f : a(e[d]), m = u - i;
		f = o <= 0 && m >= 0 && m < c ? a(e[m]) : f;
		let h = d + i;
		p = o >= 0 && h >= 0 && h < c ? a(e[h]) : p, p >= f && s.push([f, p]);
	}
	return s;
}
function di(e) {
	return e == 0 ? Wt : e == 1 ? At : (t) => Zt(t, e);
}
function fi(e) {
	let t = e == 0 ? pi : mi, n = e == 0 ? (e, t, n, r, i, a) => {
		e.arcTo(t, n, r, i, a);
	} : (e, t, n, r, i, a) => {
		e.arcTo(n, t, i, r, a);
	}, r = e == 0 ? (e, t, n, r, i) => {
		e.rect(t, n, r, i);
	} : (e, t, n, r, i) => {
		e.rect(n, t, i, r);
	};
	return (e, i, a, o, s, c = 0, l = 0) => {
		c == 0 && l == 0 ? r(e, i, a, o, s) : (c = Mt(c, o / 2, s / 2), l = Mt(l, o / 2, s / 2), t(e, i + c, a), n(e, i + o, a, i + o, a + s, c), n(e, i + o, a + s, i, a + s, l), n(e, i, a + s, i, a, l), n(e, i, a, i + o, a, c), e.closePath());
	};
}
var pi = (e, t, n) => {
	e.moveTo(t, n);
}, mi = (e, t, n) => {
	e.moveTo(n, t);
}, hi = (e, t, n) => {
	e.lineTo(t, n);
}, gi = (e, t, n) => {
	e.lineTo(n, t);
}, _i = fi(0), vi = fi(1), yi = (e, t, n, r, i, a) => {
	e.arc(t, n, r, i, a);
}, bi = (e, t, n, r, i, a) => {
	e.arc(n, t, r, i, a);
}, xi = (e, t, n, r, i, a, o) => {
	e.bezierCurveTo(t, n, r, i, a, o);
}, Y = (e, t, n, r, i, a, o) => {
	e.bezierCurveTo(n, t, i, r, o, a);
};
function X(e) {
	return (e, t, n, r, i) => ii(e, t, (t, a, o, s, c, l, u, d, f, p, m) => {
		let { pxRound: h, points: g } = t, _, v;
		s.ori == 0 ? (_ = pi, v = yi) : (_ = mi, v = bi);
		let y = U(g.width * I, 3), b = (g.size - g.width) / 2 * I, x = U(b * 2, 3), S = new Path2D(), C = new Path2D(), { left: w, top: T, width: E, height: D } = e.bbox;
		_i(C, w - x, T - x, E + x * 2, D + x * 2);
		let O = (e) => {
			if (o[e] != null) {
				let t = h(l(a[e], s, p, d)), n = h(u(o[e], c, m, f));
				_(S, t + b, n), v(S, t, n, b, 0, Dt * 2);
			}
		};
		if (i) i.forEach(O);
		else for (let e = n; e <= r; e++) O(e);
		return {
			stroke: y > 0 ? S : null,
			fill: S,
			clip: C,
			flags: 3
		};
	});
}
function Si(e) {
	return (t, n, r, i, a, o) => {
		r != i && (a != r && o != r && e(t, n, r), a != i && o != i && e(t, n, i), e(t, n, o));
	};
}
var Ci = Si(hi), wi = Si(gi);
function Z(e) {
	let t = z(e?.alignGaps, 0);
	return (e, n, r, i) => ii(e, n, (a, o, s, c, l, u, d, f, p, m, h) => {
		[r, i] = mt(s, r, i);
		let g = a.pxRound, _ = (e) => g(u(e, c, m, f)), v = (e) => g(d(e, l, h, p)), y, b;
		c.ori == 0 ? (y = hi, b = Ci) : (y = gi, b = wi);
		let x = c.dir * (c.ori == 0 ? 1 : -1), S = {
			stroke: new Path2D(),
			fill: null,
			clip: null,
			band: null,
			gaps: null,
			flags: ni
		}, C = S.stroke, w = !1;
		if (i - r >= m * 4) {
			let t = (t) => e.posToVal(t, c.key, !0), n = null, a = null, l, u, d, f = _(o[x == 1 ? r : i]), p = _(o[r]), m = _(o[i]), h = t(x == 1 ? p + 1 : m - 1);
			for (let e = x == 1 ? r : i; e >= r && e <= i; e += x) {
				let r = o[e], i = (x == 1 ? r < h : r > h) ? f : _(r), c = s[e];
				i == f ? c == null ? c === null && (w = !0) : (u = c, n == null ? (y(C, i, v(u)), l = n = a = u) : u < n ? n = u : u > a && (a = u)) : (n != null && b(C, f, v(n), v(a), v(l), v(u)), c == null ? (n = a = null, c === null && (w = !0)) : (u = c, y(C, i, v(u)), n = a = l = u), f = i, h = t(f + x));
			}
			n != null && n != a && d != f && b(C, f, v(n), v(a), v(l), v(u));
		} else for (let e = x == 1 ? r : i; e >= r && e <= i; e += x) {
			let t = s[e];
			t === null ? w = !0 : t != null && y(C, _(o[e]), v(t));
		}
		let [T, E] = ai(e, n);
		if (a.fill != null || T != 0) {
			let t = S.fill = new Path2D(C), s = v(a.fillTo(e, n, a.min, a.max, T)), c = _(o[r]), l = _(o[i]);
			x == -1 && ([l, c] = [c, l]), y(t, l, s), y(t, c, s);
		}
		if (!a.spanGaps) {
			let l = [];
			w && l.push(...ui(o, s, r, i, x, _, t)), S.gaps = l = a.gaps(e, n, r, i, l), S.clip = ci(l, c.ori, f, p, m, h);
		}
		return E != 0 && (S.band = E == 2 ? [si(e, n, r, i, C, -1), si(e, n, r, i, C, 1)] : si(e, n, r, i, C, E)), S;
	});
}
function Q(e) {
	let t = z(e.align, 1), n = z(e.ascDesc, !1), r = z(e.alignGaps, 0), i = z(e.extend, !1);
	return (e, a, o, s) => ii(e, a, (c, l, u, d, f, p, m, h, g, _, v) => {
		[o, s] = mt(u, o, s);
		let y = c.pxRound, { left: b, width: x } = e.bbox, S = (e) => y(p(e, d, _, h)), C = (e) => y(m(e, f, v, g)), w = d.ori == 0 ? hi : gi, T = {
			stroke: new Path2D(),
			fill: null,
			clip: null,
			band: null,
			gaps: null,
			flags: ni
		}, E = T.stroke, D = d.dir * (d.ori == 0 ? 1 : -1), O = C(u[D == 1 ? o : s]), k = S(l[D == 1 ? o : s]), A = k, j = k;
		i && t == -1 && (j = b, w(E, j, O)), w(E, k, O);
		for (let e = D == 1 ? o : s; e >= o && e <= s; e += D) {
			let n = u[e];
			if (n == null) continue;
			let r = S(l[e]), i = C(n);
			t == 1 ? w(E, r, O) : w(E, A, i), w(E, r, i), O = i, A = r;
		}
		let M = A;
		i && t == 1 && (M = b + x, w(E, M, O));
		let [ee, te] = ai(e, a);
		if (c.fill != null || ee != 0) {
			let t = T.fill = new Path2D(E), n = C(c.fillTo(e, a, c.min, c.max, ee));
			w(t, M, n), w(t, j, n);
		}
		if (!c.spanGaps) {
			let i = [];
			i.push(...ui(l, u, o, s, D, S, r));
			let f = c.width * I / 2, p = n || t == 1 ? f : -f, m = n || t == -1 ? -f : f;
			i.forEach((e) => {
				e[0] += p, e[1] += m;
			}), T.gaps = i = c.gaps(e, a, o, s, i), T.clip = ci(i, d.ori, h, g, _, v);
		}
		return te != 0 && (T.band = te == 2 ? [si(e, a, o, s, E, -1), si(e, a, o, s, E, 1)] : si(e, a, o, s, E, te)), T;
	});
}
function Ti(e, t, n, r, i, a, o = V) {
	if (e.length > 1) {
		let s = null;
		for (let c = 0, l = Infinity; c < e.length; c++) if (t[c] !== void 0) {
			if (s != null) {
				let t = Ot(e[c] - e[s]);
				t < l && (l = t, o = Ot(n(e[c], r, i, a) - n(e[s], r, i, a)));
			}
			s = c;
		}
	}
	return o;
}
function Ei(e) {
	e ||= rn;
	let t = z(e.size, [
		.6,
		V,
		1
	]), n = e.align || 0, r = e.gap || 0, i = e.radius;
	i = i == null ? [0, 0] : typeof i == "number" ? [i, 0] : i;
	let a = H(i), o = 1 - t[0], s = z(t[1], V), c = z(t[2], 1), l = z(e.disp, rn), u = z(e.each, (e) => {}), { fill: d, stroke: f } = l;
	return (e, t, i, p) => ii(e, t, (m, h, g, _, v, y, b, x, S, C, w) => {
		let T = m.pxRound, E = n, D = r * I, O = s * I, k = c * I, A, j;
		_.ori == 0 ? [A, j] = a(e, t) : [j, A] = a(e, t);
		let M = _.dir * (_.ori == 0 ? 1 : -1), ee = _.ori == 0 ? _i : vi, te = _.ori == 0 ? u : (e, t, n, r, i, a, o) => {
			u(e, t, n, i, r, o, a);
		}, ne = z(e.bands, an).find((e) => e.series[0] == t), re = ne == null ? 0 : ne.dir, ie = m.fillTo(e, t, m.min, m.max, re), N = T(b(ie, v, w, S)), P, F, ae, oe = C, se = T(m.width * I), ce = !1, le = null, ue = null, de = null, fe = null;
		d != null && (se == 0 || f != null) && (ce = !0, le = d.values(e, t, i, p), ue = /* @__PURE__ */ new Map(), new Set(le).forEach((e) => {
			e != null && ue.set(e, new Path2D());
		}), se > 0 && (de = f.values(e, t, i, p), fe = /* @__PURE__ */ new Map(), new Set(de).forEach((e) => {
			e != null && fe.set(e, new Path2D());
		})));
		let { x0: pe, size: me } = l;
		if (pe != null && me != null) {
			E = 1, h = pe.values(e, t, i, p), pe.unit == 2 && (h = h.map((t) => e.posToVal(x + t * C, _.key, !0)));
			let n = me.values(e, t, i, p);
			F = me.unit == 2 ? n[0] * C : y(n[0], _, C, x) - y(0, _, C, x), oe = Ti(h, g, y, _, C, x, oe), ae = oe - F + D;
		} else oe = Ti(h, g, y, _, C, x, oe), ae = oe * o + D, F = oe - ae;
		ae < 1 && (ae = 0), se >= F / 2 && (se = 0), ae < 5 && (T = Wt);
		let he = ae > 0, ge = oe - ae - (he ? se : 0);
		F = T(Vt(ge, k, O)), P = (E == 0 ? F / 2 : E == M ? 0 : F) - E * M * ((E == 0 ? D / 2 : 0) + (he ? se / 2 : 0));
		let _e = {
			stroke: null,
			fill: null,
			clip: null,
			band: null,
			gaps: null,
			flags: 0
		}, ve = ce ? null : new Path2D(), ye = null;
		if (ne != null) ye = e.data[ne.series[1]];
		else {
			let { y0: n, y1: r } = l;
			n != null && r != null && (g = r.values(e, t, i, p), ye = n.values(e, t, i, p));
		}
		let be = A * F, xe = j * F;
		for (let n = M == 1 ? i : p; n >= i && n <= p; n += M) {
			let r = g[n];
			if (r == null) continue;
			if (ye != null) {
				let e = ye[n] ?? 0;
				if (r - e == 0) continue;
				N = b(e, v, w, S);
			}
			let i = y(_.distr != 2 || l != null ? h[n] : n, _, C, x), a = b(z(r, ie), v, w, S), o = T(i - P), s = T(Nt(a, N)), c = T(Mt(a, N)), u = s - c;
			if (r != null) {
				let i = r < 0 ? xe : be, a = r < 0 ? be : xe;
				ce ? (se > 0 && de[n] != null && ee(fe.get(de[n]), o, c + kt(se / 2), F, Nt(0, u - se), i, a), le[n] != null && ee(ue.get(le[n]), o, c + kt(se / 2), F, Nt(0, u - se), i, a)) : ee(ve, o, c + kt(se / 2), F, Nt(0, u - se), i, a), te(e, t, n, o - se / 2, c, F + se, u);
			}
		}
		return se > 0 ? _e.stroke = ce ? fe : ve : ce || (_e._fill = m.width == 0 ? m._fill : m._stroke ?? m._fill, _e.width = 0), _e.fill = ce ? ue : ve, _e;
	});
}
function Di(e, t) {
	let n = z(t?.alignGaps, 0);
	return (t, r, i, a) => ii(t, r, (o, s, c, l, u, d, f, p, m, h, g) => {
		[i, a] = mt(c, i, a);
		let _ = o.pxRound, v = (e) => _(d(e, l, h, p)), y = (e) => _(f(e, u, g, m)), b, x, S;
		l.ori == 0 ? (b = pi, S = hi, x = xi) : (b = mi, S = gi, x = Y);
		let C = l.dir * (l.ori == 0 ? 1 : -1), w = v(s[C == 1 ? i : a]), T = w, E = [], D = [];
		for (let e = C == 1 ? i : a; e >= i && e <= a; e += C) if (c[e] != null) {
			let t = s[e], n = v(t);
			E.push(T = n), D.push(y(c[e]));
		}
		let O = {
			stroke: e(E, D, b, S, x, _),
			fill: null,
			clip: null,
			band: null,
			gaps: null,
			flags: ni
		}, k = O.stroke, [A, j] = ai(t, r);
		if (o.fill != null || A != 0) {
			let e = O.fill = new Path2D(k), n = y(o.fillTo(t, r, o.min, o.max, A));
			S(e, T, n), S(e, w, n);
		}
		if (!o.spanGaps) {
			let e = [];
			e.push(...ui(s, c, i, a, C, v, n)), O.gaps = e = o.gaps(t, r, i, a, e), O.clip = ci(e, l.ori, p, m, h, g);
		}
		return j != 0 && (O.band = j == 2 ? [si(t, r, i, a, k, -1), si(t, r, i, a, k, 1)] : si(t, r, i, a, k, j)), O;
	});
}
function Oi(e) {
	return Di(ki, e);
}
function ki(e, t, n, r, i, a) {
	let o = e.length;
	if (o < 2) return null;
	let s = new Path2D();
	if (n(s, e[0], t[0]), o == 2) r(s, e[1], t[1]);
	else {
		let n = Array(o), r = Array(o - 1), a = Array(o - 1), c = Array(o - 1);
		for (let n = 0; n < o - 1; n++) a[n] = t[n + 1] - t[n], c[n] = e[n + 1] - e[n], r[n] = a[n] / c[n];
		n[0] = r[0];
		for (let e = 1; e < o - 1; e++) r[e] === 0 || r[e - 1] === 0 || r[e - 1] > 0 != r[e] > 0 ? n[e] = 0 : (n[e] = 3 * (c[e - 1] + c[e]) / ((2 * c[e] + c[e - 1]) / r[e - 1] + (c[e] + 2 * c[e - 1]) / r[e]), isFinite(n[e]) || (n[e] = 0));
		n[o - 1] = r[o - 2];
		for (let r = 0; r < o - 1; r++) i(s, e[r] + c[r] / 3, t[r] + n[r] * c[r] / 3, e[r + 1] - c[r] / 3, t[r + 1] - n[r + 1] * c[r] / 3, e[r + 1], t[r + 1]);
	}
	return s;
}
var Ai = /* @__PURE__ */ new Set();
function ji() {
	for (let e of Ai) e.syncRect(!0);
}
We && (ct(ze, Ke, ji), ct(Be, Ke, ji, !0), ct(He, Ke, () => {
	qi.pxRatio = I;
}));
var Mi = Z(), Ni = X();
function Pi(e, t, n, r) {
	return (r ? [e[0], e[1]].concat(e.slice(2)) : [e[0]].concat(e.slice(1))).map((e, r) => Ii(e, r, t, n));
}
function Fi(e, t) {
	return e.map((e, n) => n == 0 ? {} : W({}, t, e));
}
function Ii(e, t, n, r) {
	return W({}, t == 0 ? n : r, e);
}
function Li(e, t, n) {
	return t == null ? on : [t, n];
}
var Ri = Li;
function zi(e, t, n) {
	return t == null ? on : St(t, n, yt, !0);
}
function Bi(e, t, n, r) {
	return t == null ? on : _t(t, n, e.scales[r].log, !1);
}
var Vi = Bi;
function Hi(e, t, n, r) {
	return t == null ? on : vt(t, n, e.scales[r].log, !1);
}
var Ui = Hi;
function Wi(e, t, n, r, i) {
	let a = Nt(Bt(e), Bt(t)), o = t - e, s = ut(i / r * o, n);
	do {
		let e = n[s], t = r * e / o;
		if (t >= i && a + (e < 5 ? en.get(e) : 0) <= 17) return [e, t];
	} while (++s < n.length);
	return [0, 0];
}
function Gi(e) {
	let t, n;
	return e = e.replace(/(\d+)px/, (e, r) => (t = At((n = +r) * I)) + "px"), [
		e,
		t,
		n
	];
}
function Ki(e) {
	e.show && [e.font, e.labelFont].forEach((e) => {
		let t = U(e[2] * I, 1);
		e[0] = e[0].replace(/[0-9.]+px/, t + "px"), e[1] = t;
	});
}
function qi(e, t, n) {
	let r = { mode: z(e.mode, 1) }, i = r.mode;
	function a(e, t, n, r) {
		let i = t.valToPct(e);
		return r + n * (t.dir == -1 ? 1 - i : i);
	}
	function o(e, t, n, r) {
		let i = t.valToPct(e);
		return r + n * (t.dir == -1 ? i : 1 - i);
	}
	function s(e, t, n, r) {
		return t.ori == 0 ? a(e, t, n, r) : o(e, t, n, r);
	}
	r.valToPosH = a, r.valToPosV = o;
	let c = !1;
	r.status = 0;
	let l = r.root = $e(ae);
	if (e.id != null && (l.id = e.id), Xe(l, e.class), e.title) {
		let t = $e(ce, l);
		t.textContent = e.title;
	}
	let u = Qe("canvas"), d = r.ctx = u.getContext("2d"), f = $e(le, l);
	ct("click", f, (e) => {
		e.target === m && (Y != vi || X != yi) && Ci.click(r, e);
	}, !0);
	let p = r.under = $e(ue, f);
	f.appendChild(u);
	let m = r.over = $e(de, f);
	e = hn(e);
	let h = +z(e.pxAlign, 1), g = di(h);
	(e.plugins || []).forEach((t) => {
		t.opts && (e = t.opts(r, e) || e);
	});
	let _ = e.ms || .001, v = r.series = i == 1 ? Pi(e.series || [], jr, Xr, !1) : Fi(e.series || [null], Yr), y = r.axes = Pi(e.axes || [], Or, Wr, !0), b = r.scales = {}, x = r.bands = e.bands || [];
	x.forEach((e) => {
		e.fill = H(e.fill || null), e.dir = z(e.dir, -1);
	});
	let S = i == 2 ? v[1].facets[0].scale : v[0].scale, C = {
		axes: Kr,
		series: Sr
	}, w = (e.drawOrder || ["axes", "series"]).map((e) => C[e]);
	function T(e) {
		let t = e.distr == 3 ? (t) => It(t > 0 ? t : e.clamp(r, t, e.min, e.max, e.key)) : e.distr == 4 ? (t) => zt(t, e.asinh) : e.distr == 100 ? (t) => e.fwd(t) : (e) => e;
		return (n) => {
			let r = t(n), { _min: i, _max: a } = e, o = a - i;
			return (r - i) / o;
		};
	}
	function E(t) {
		let n = b[t];
		if (n == null) {
			let r = (e.scales || rn)[t] || rn;
			if (r.from != null) {
				E(r.from);
				let e = W({}, b[r.from], r, { key: t });
				e.valToPct = T(e), b[t] = e;
			} else {
				n = b[t] = W({}, t == S ? Qr : $r, r), n.key = t;
				let e = n.time, a = n.range, o = sn(a);
				if ((t != S || i == 2 && !e) && (o && (a[0] == null || a[1] == null) && (a = {
					min: a[0] == null ? bt : {
						mode: 1,
						hard: a[0],
						soft: a[0]
					},
					max: a[1] == null ? bt : {
						mode: 1,
						hard: a[1],
						soft: a[1]
					}
				}, o = !1), !o && dn(a))) {
					let e = a;
					a = (t, n, r) => n == null ? on : St(n, r, e);
				}
				n.range = H(a || (e ? Ri : t == S ? n.distr == 3 ? Vi : n.distr == 4 ? Ui : Li : n.distr == 3 ? Bi : n.distr == 4 ? Hi : zi)), n.auto = H(!o && n.auto), n.clamp = H(n.clamp || Zr), n._min = n._max = null, n.valToPct = T(n);
			}
		}
	}
	E("x"), E("y"), i == 1 && v.forEach((e) => {
		E(e.scale);
	}), y.forEach((e) => {
		E(e.scale);
	});
	for (let t in e.scales) E(t);
	let D = b[S], O = D.distr, k, A;
	D.ori == 0 ? (Xe(l, oe), k = a, A = o) : (Xe(l, se), k = o, A = a);
	let j = {};
	for (let e in b) {
		let t = b[e];
		(t.min != null || t.max != null) && (j[e] = {
			min: t.min,
			max: t.max
		}, t.min = t.max = null);
	}
	let M = e.tzDate || ((e) => new Date(At(e / _))), ee = e.fmtDate || Nn, te = _ == 1 ? Qn(M) : tr(M), ne = rr(M, nr(_ == 1 ? Zn : er, ee)), re = cr(M, or(sr, ee)), ie = [], N = r.legend = W({}, dr, e.legend), P = r.cursor = W({}, br, { drag: { y: i == 2 } }, e.cursor), F = N.show, je = P.show, ze = N.markers;
	N.idxs = ie, ze.width = H(ze.width), ze.dash = H(ze.dash), ze.stroke = H(ze.stroke), ze.fill = H(ze.fill);
	let Be, Ve, We, qe = [], Je = [], Ye, et = !1, nt = {};
	if (N.live) {
		let e = v[1] ? v[1].values : null;
		et = e != null, Ye = et ? e(r, 1, 0) : { _: 0 };
		for (let e in Ye) nt[e] = Ue;
	}
	if (F) {
		if (Be = Qe("table", ve, l), We = Qe("tbody", null, Be), N.mount(r, Be), et) {
			Ve = Qe("thead", null, Be, We);
			let e = Qe("tr", null, Ve);
			for (var it in Qe("th", null, e), Ye) Qe("th", Ce, e).textContent = it;
		} else Xe(Be, be), N.live && Xe(Be, ye);
	}
	let ot = { show: !0 }, st = { show: !1 };
	function dt(e, t) {
		if (t == 0 && (et || !N.live || i == 2)) return on;
		let n = [], a = Qe("tr", xe, We, We.childNodes[t]);
		Xe(a, e.class), e.show || Xe(a, pe);
		let o = Qe("th", null, a);
		if (ze.show) {
			let e = $e(Se, o);
			if (t > 0) {
				let n = ze.width(r, t);
				n && (e.style.border = n + "px " + ze.dash(r, t) + " " + ze.stroke(r, t)), e.style.background = ze.fill(r, t);
			}
		}
		let s = $e(Ce, o);
		for (var c in e.label instanceof HTMLElement ? s.appendChild(e.label) : s.textContent = e.label, t > 0 && (ze.show || (s.style.color = e.width > 0 ? ze.stroke(r, t) : ze.fill(r, t)), pt("click", o, (t) => {
			if (P._lock) return;
			Sn(t);
			let n = v.indexOf(e);
			if ((t.ctrlKey || t.metaKey) != N.isolate) {
				let e = v.some((e, t) => t > 0 && t != n && e.show);
				v.forEach((t, r) => {
					r > 0 && ki(r, e ? r == n ? ot : st : ot, !0, $.setSeries);
				});
			} else ki(n, { show: !e.show }, !0, $.setSeries);
		}, !1), Tn && pt(Ie, o, (t) => {
			P._lock || (Sn(t), ki(v.indexOf(e), $i, !0, $.setSeries));
		}, !1)), Ye) {
			let e = Qe("td", we, a);
			e.textContent = "--", n.push(e);
		}
		return [a, n];
	}
	let ft = /* @__PURE__ */ new Map();
	function pt(e, t, n, i = !0) {
		let a = ft.get(t) || {}, o = P.bind[e](r, t, n, i);
		o && (ct(e, t, a[e] = o), ft.set(t, a));
	}
	function mt(e, t, n) {
		let r = ft.get(t) || {};
		for (let n in r) (e == null || n == e) && (lt(n, t, r[n]), delete r[n]);
		e ?? ft.delete(t);
	}
	let ht = 0, xt = 0, R = 0, B = 0, wt = 0, Tt = 0, Et = wt, kt = Tt, Ft = R, Lt = B, Bt = 0, Ut = 0, Wt = 0, Yt = 0;
	r.bbox = {};
	let Xt = !1, Qt = !1, $t = !1, nn = !1, cn = !1, pn = !1;
	function mn(e, t, n) {
		(n || e != r.width || t != r.height) && gn(e, t), qr(!1), $t = !0, Qt = !0, si();
	}
	function gn(e, t) {
		r.width = ht = R = e, r.height = xt = B = t, wt = Tt = 0, yn(), bn();
		let n = r.bbox;
		Bt = n.left = Zt(wt * I, .5), Ut = n.top = Zt(Tt * I, .5), Wt = n.width = Zt(R * I, .5), Yt = n.height = Zt(B * I, .5);
	}
	function _n() {
		let e = !1, t = 0;
		for (; !e;) {
			t++;
			let n = zr(t), i = Br(t);
			e = t == 3 || n && i, e || (gn(r.width, r.height), Qt = !0);
		}
	}
	function vn({ width: e, height: t }) {
		mn(e, t);
	}
	r.setSize = vn;
	function yn() {
		let e = !1, t = !1, n = !1, r = !1;
		y.forEach((i, a) => {
			if (i.show && i._show) {
				let { side: a, _size: o } = i, s = a % 2, c = o + (i.label == null ? 0 : i.labelSize);
				c > 0 && (s ? (R -= c, a == 3 ? (wt += c, r = !0) : n = !0) : (B -= c, a == 0 ? (Tt += c, e = !0) : t = !0));
			}
		}), Fn[0] = e, Fn[1] = n, Fn[2] = t, Fn[3] = r, R -= zn[1] + zn[3], wt += zn[3], B -= zn[2] + zn[0], Tt += zn[0];
	}
	function bn() {
		let e = wt + R, t = Tt + B, n = wt, r = Tt;
		function i(i, a) {
			switch (i) {
				case 1: return e += a, e - a;
				case 2: return t += a, t - a;
				case 3: return n -= a, n + a;
				case 0: return r -= a, r + a;
			}
		}
		y.forEach((e, t) => {
			if (e.show && e._show) {
				let t = e.side;
				e._pos = i(t, e._size), e.label != null && (e._lpos = i(t, e.labelSize));
			}
		});
	}
	if (P.dataIdx == null) {
		let e = P.hover, n = e.skip = new Set(e.skip ?? []);
		n.add(void 0);
		let r = e.prox = H(e.prox), i = e.bias ??= 0;
		P.dataIdx = (e, a, o, s) => {
			if (a == 0) return o;
			let c = o, l = r(e, a, o, s) ?? V, u = l >= 0 && l < V, d = D.ori == 0 ? R : B, f = P.left, p = t[0], m = t[a];
			if (n.has(m[o])) {
				c = null;
				let e = null, t = null, r;
				if (i == 0 || i == -1) for (r = o; e == null && r-- > 0;) n.has(m[r]) || (e = r);
				if (i == 0 || i == 1) for (r = o; t == null && r++ < m.length;) n.has(m[r]) || (t = r);
				if (e != null || t != null) {
					if (u) {
						let n = e == null ? -Infinity : k(p[e], D, d, 0), r = t == null ? Infinity : k(p[t], D, d, 0), i = f - n, a = r - f;
						i <= a ? i <= l && (c = e) : a <= l && (c = t);
					} else c = t == null ? e : e == null ? t : o - e <= t - o ? e : t;
				}
			} else u && Ot(f - k(p[o], D, d, 0)) > l && (c = null);
			return c;
		};
	}
	let Sn = (e) => {
		P.event = e;
	};
	P.idxs = ie, P._lock = !1;
	let Cn = P.points;
	Cn.show = H(Cn.show), Cn.size = H(Cn.size), Cn.stroke = H(Cn.stroke), Cn.width = H(Cn.width), Cn.fill = H(Cn.fill);
	let wn = r.focus = W({}, e.focus || { alpha: .3 }, P.focus), Tn = wn.prox >= 0, En = Tn && Cn.one, Dn = [], On = [], kn = [];
	function An(e, t) {
		let n = Cn.show(r, t);
		if (n instanceof HTMLElement) return Xe(n, _e), Xe(n, e.class), tt(n, -10, -10, R, B), m.insertBefore(n, Dn[t]), n;
	}
	function jn(e, t) {
		if (i == 1 || t > 0) {
			let t = i == 1 && b[e.scale].time, n = e.value;
			e.value = t ? un(n) ? cr(M, or(n, ee)) : n || re : n || Ur, e.label = e.label || (t ? Ar : kr);
		}
		if (En || t > 0) {
			e.width = e.width == null ? 1 : e.width, e.paths = e.paths || Mi || Kt, e.fillTo = H(e.fillTo || oi), e.pxAlign = +z(e.pxAlign, h), e.pxRound = di(e.pxAlign), e.stroke = H(e.stroke || null), e.fill = H(e.fill || null), e._stroke = e._fill = e._paths = e._focus = null;
			let t = Gr(Nt(1, e.width), 1), n = e.points = W({}, {
				size: t,
				width: Nt(1, t * .2),
				stroke: e.stroke,
				space: t * 2,
				paths: Ni,
				_stroke: null,
				_fill: null
			}, e.points);
			n.show = H(n.show), n.filter = H(n.filter), n.fill = H(n.fill), n.stroke = H(n.stroke), n.paths = H(n.paths), n.pxAlign = e.pxAlign;
		}
		if (F) {
			let n = dt(e, t);
			qe.splice(t, 0, n[0]), Je.splice(t, 0, n[1]), N.values.push(null);
		}
		if (je) {
			ie.splice(t, 0, null);
			let n = null;
			En ? t == 0 && (n = An(e, t)) : t > 0 && (n = An(e, t)), Dn.splice(t, 0, n), On.splice(t, 0, 0), kn.splice(t, 0, 0);
		}
		Oa("addSeries", t);
	}
	function Mn(e, t) {
		t ??= v.length, e = i == 1 ? Ii(e, t, jr, Xr) : Ii(e, t, {}, Yr), v.splice(t, 0, e), jn(v[t], t);
	}
	r.addSeries = Mn;
	function Pn(e) {
		if (v.splice(e, 1), F) {
			N.values.splice(e, 1), Je.splice(e, 1);
			let t = qe.splice(e, 1)[0];
			mt(null, t.firstChild), t.remove();
		}
		je && (ie.splice(e, 1), Dn.splice(e, 1)[0].remove(), On.splice(e, 1), kn.splice(e, 1)), Oa("delSeries", e);
	}
	r.delSeries = Pn;
	let Fn = [
		!1,
		!1,
		!1,
		!1
	];
	function In(e, t) {
		if (e._show = e.show, e.show) {
			let n = e.side % 2, i = b[e.scale];
			i ??= (e.scale = n ? v[1].scale : S, b[e.scale]);
			let a = i.time;
			e.size = H(e.size), e.space = H(e.space), e.rotate = H(e.rotate), sn(e.incrs) && e.incrs.forEach((e) => {
				!en.has(e) && en.set(e, tn(e));
			}), e.incrs = H(e.incrs || (i.distr == 2 ? Bn : a ? _ == 1 ? Xn : $n : Vn)), e.splits = H(e.splits || (a && i.distr == 1 ? te : i.distr == 3 ? Pr : i.distr == 4 ? Fr : Nr)), e.stroke = H(e.stroke), e.grid.stroke = H(e.grid.stroke), e.ticks.stroke = H(e.ticks.stroke), e.border.stroke = H(e.border.stroke);
			let o = e.values;
			e.values = sn(o) && !sn(o[0]) ? H(o) : a ? sn(o) ? rr(M, nr(o, ee)) : un(o) ? ir(M, o) : o || ne : o || Mr, e.filter = H(e.filter || (i.distr >= 3 && i.log == 10 ? Vr : i.distr == 3 && i.log == 2 ? Hr : Gt)), e.font = Gi(e.font), e.labelFont = Gi(e.labelFont), e._size = e.size(r, null, t, 0), e._space = e._rotate = e._incrs = e._found = e._splits = e._values = null, e._size > 0 && (Fn[t] = !0, e._el = $e(fe, f));
		}
	}
	function Ln(e, t, n, r) {
		let [i, a, o, s] = n, c = t % 2, l = 0;
		return c == 0 && (s || a) && (l = t == 0 && !i || t == 2 && !o ? At(Or.size / 3) : 0), c == 1 && (i || o) && (l = t == 1 && !a || t == 3 && !s ? At(Wr.size / 2) : 0), l;
	}
	let Rn = r.padding = (e.padding || [
		Ln,
		Ln,
		Ln,
		Ln
	]).map((e) => H(z(e, Ln))), zn = r._padding = Rn.map((e, t) => e(r, t, Fn, 0)), G, K = null, q = null, Hn = i == 1 ? v[0].idxs : null, Un = null, Wn = !1;
	function Gn(e, n) {
		if (t = e ?? [], r.data = r._data = t, i == 2) {
			G = 0;
			for (let e = 1; e < v.length; e++) G += t[e][0].length;
		} else {
			t.length == 0 && (r.data = r._data = t = [[]]), Un = t[0], G = Un.length;
			let e = t;
			if (O == 2) {
				e = t.slice();
				let n = e[0] = Array(G);
				for (let e = 0; e < G; e++) n[e] = e;
			}
			r._data = t = e;
		}
		if (qr(!0), Oa("setData"), O == 2 && ($t = !0), n !== !1) {
			let e = D;
			e.auto(r, Wn) ? Kn() : Oi(S, e.min, e.max), nn ||= P.left >= 0, pn = !0, si();
		}
	}
	r.setData = Gn;
	function Kn() {
		Wn = !0;
		let e, n;
		i == 1 && (G > 0 ? (K = Hn[0] = 0, q = Hn[1] = G - 1, e = t[0][K], n = t[0][q], O == 2 ? (e = K, n = q) : e == n && (O == 3 ? [e, n] = _t(e, e, D.log, !1) : O == 4 ? [e, n] = vt(e, e, D.log, !1) : D.time ? n = e + At(86400 / _) : [e, n] = St(e, n, yt, !0))) : (K = Hn[0] = e = null, q = Hn[1] = n = null)), Oi(S, e, n);
	}
	let qn, Jn, J, Yn, ar, lr, ur, fr, pr, mr;
	function hr(e, t, n, r, i, a) {
		e ??= Me, n ??= an, r ??= "butt", i ??= Me, a ??= "round", e != qn && (d.strokeStyle = qn = e), i != Jn && (d.fillStyle = Jn = i), t != J && (d.lineWidth = J = t), a != ar && (d.lineJoin = ar = a), r != lr && (d.lineCap = lr = r), n != Yn && d.setLineDash(Yn = n);
	}
	function gr(e, t, n, r) {
		t != Jn && (d.fillStyle = Jn = t), e != ur && (d.font = ur = e), n != fr && (d.textAlign = fr = n), r != pr && (d.textBaseline = pr = r);
	}
	function _r(e, t, n, i, a = 0) {
		if (i.length > 0 && e.auto(r, Wn) && (t == null || t.min == null)) {
			let t = z(K, 0), r = z(q, i.length - 1), o = n.min == null ? gt(i, t, r, a, e.distr == 3) : [n.min, n.max];
			e.min = Mt(e.min, n.min = o[0]), e.max = Nt(e.max, n.max = o[1]);
		}
	}
	let vr = {
		min: null,
		max: null
	};
	function yr() {
		for (let e in b) {
			let t = b[e];
			j[e] == null && (t.min == null || j[S] != null && t.auto(r, Wn)) && (j[e] = vr);
		}
		for (let e in b) {
			let t = b[e];
			j[e] == null && t.from != null && j[t.from] != null && (j[e] = vr);
		}
		j[S] != null && qr(!0);
		let e = {};
		for (let t in j) {
			let n = j[t];
			if (n != null) {
				let a = e[t] = hn(b[t], fn);
				if (n.min != null) W(a, n);
				else if (t != S || i == 2) {
					if (G == 0 && a.from == null) {
						let e = a.range(r, null, null, t);
						a.min = e[0], a.max = e[1];
					} else a.min = V, a.max = -Infinity;
				}
			}
		}
		if (G > 0) {
			v.forEach((n, a) => {
				if (i == 1) {
					let i = n.scale, o = j[i];
					if (o == null) return;
					let s = e[i];
					if (a == 0) {
						let e = s.range(r, s.min, s.max, i);
						s.min = e[0], s.max = e[1], K = ut(s.min, t[0]), q = ut(s.max, t[0]), q - K > 1 && (t[0][K] < s.min && K++, t[0][q] > s.max && q--), n.min = Un[K], n.max = Un[q];
					} else n.show && n.auto && _r(s, o, n, t[a], n.sorted);
					n.idxs[0] = K, n.idxs[1] = q;
				} else if (a > 0 && n.show && n.auto) {
					let [r, i] = n.facets, o = r.scale, s = i.scale, [c, l] = t[a], u = e[o], d = e[s];
					u != null && _r(u, j[o], r, c, r.sorted), d != null && _r(d, j[s], i, l, i.sorted), n.min = i.min, n.max = i.max;
				}
			});
			for (let t in e) {
				let n = e[t], i = j[t];
				if (n.from == null && (i == null || i.min == null)) {
					let e = n.range(r, n.min == V ? null : n.min, n.max == -Infinity ? null : n.max, t);
					n.min = e[0], n.max = e[1];
				}
			}
		}
		for (let t in e) {
			let n = e[t];
			if (n.from != null) {
				let i = e[n.from];
				if (i.min == null) n.min = n.max = null;
				else {
					let e = n.range(r, i.min, i.max, t);
					n.min = e[0], n.max = e[1];
				}
			}
		}
		let n = {}, a = !1;
		for (let t in e) {
			let r = e[t], i = b[t];
			if (i.min != r.min || i.max != r.max) {
				i.min = r.min, i.max = r.max;
				let e = i.distr;
				i._min = e == 3 ? It(i.min) : e == 4 ? zt(i.min, i.asinh) : e == 100 ? i.fwd(i.min) : i.min, i._max = e == 3 ? It(i.max) : e == 4 ? zt(i.max, i.asinh) : e == 100 ? i.fwd(i.max) : i.max, n[t] = a = !0;
			}
		}
		if (a) {
			v.forEach((e, t) => {
				i == 2 ? t > 0 && n.y && (e._paths = null) : n[e.scale] && (e._paths = null);
			});
			for (let e in n) $t = !0, Oa("setScale", e);
			je && P.left >= 0 && (nn = pn = !0);
		}
		for (let e in j) j[e] = null;
	}
	function xr(e) {
		let t = Vt(K - 1, 0, G - 1), n = Vt(q + 1, 0, G - 1);
		for (; e[t] == null && t > 0;) t--;
		for (; e[n] == null && n < G - 1;) n++;
		return [t, n];
	}
	function Sr() {
		if (G > 0) {
			let e = v.some((e) => e._focus) && mr != wn.alpha;
			e && (d.globalAlpha = mr = wn.alpha), v.forEach((e, n) => {
				if (n > 0 && e.show && (Cr(n, !1), Cr(n, !0), e._paths == null)) {
					let a = mr;
					mr != e.alpha && (d.globalAlpha = mr = e.alpha);
					let o = i == 2 ? [0, t[n][0].length - 1] : xr(t[n]);
					e._paths = e.paths(r, n, o[0], o[1]), mr != a && (d.globalAlpha = mr = a);
				}
			}), v.forEach((e, t) => {
				if (t > 0 && e.show) {
					let n = mr;
					mr != e.alpha && (d.globalAlpha = mr = e.alpha), e._paths != null && wr(t, !1);
					{
						let n = e._paths == null ? null : e._paths.gaps, i = e.points.show(r, t, K, q, n), a = e.points.filter(r, t, i, n);
						(i || a) && (e.points._paths = e.points.paths(r, t, K, q, a), wr(t, !0));
					}
					mr != n && (d.globalAlpha = mr = n), Oa("drawSeries", t);
				}
			}), e && (d.globalAlpha = mr = 1);
		}
	}
	function Cr(e, t) {
		let n = t ? v[e].points : v[e];
		n._stroke = n.stroke(r, e), n._fill = n.fill(r, e);
	}
	function wr(e, t) {
		let n = t ? v[e].points : v[e], { stroke: r, fill: i, clip: a, flags: o, _stroke: s = n._stroke, _fill: c = n._fill, _width: l = n.width } = n._paths;
		l = U(l * I, 3);
		let u = null, f = l % 2 / 2;
		t && c == null && (c = l > 0 ? "#fff" : s);
		let p = n.pxAlign == 1 && f > 0;
		if (p && d.translate(f, f), !t) {
			let e = Bt - l / 2, t = Ut - l / 2, n = Wt + l, r = Yt + l;
			u = new Path2D(), u.rect(e, t, n, r);
		}
		t ? Er(s, l, n.dash, n.cap, c, r, i, o, a) : Tr(e, s, l, n.dash, n.cap, c, r, i, o, u, a), p && d.translate(-f, -f);
	}
	function Tr(e, n, i, a, o, s, c, l, u, d, f) {
		let p = !1;
		u != 0 && x.forEach((m, h) => {
			if (m.series[0] == e) {
				let e = v[m.series[1]], g = t[m.series[1]], _ = (e._paths || rn).band;
				sn(_) && (_ = m.dir == 1 ? _[0] : _[1]);
				let y, b = null;
				e.show && _ && Ct(g, K, q) ? (b = m.fill(r, h) || s, y = e._paths.clip) : _ = null, Er(n, i, a, o, b, c, l, u, d, f, y, _), p = !0;
			}
		}), p || Er(n, i, a, o, s, c, l, u, d, f);
	}
	function Er(e, t, n, r, i, a, o, s, c, l, u, f) {
		hr(e, t, n, r, i), (c || l || f) && (d.save(), c && d.clip(c), l && d.clip(l)), f ? (s & 3) == 3 ? (d.clip(f), u && d.clip(u), Ir(i, o), Dr(e, a, t)) : s & ri ? (Ir(i, o), d.clip(f), Dr(e, a, t)) : s & ni && (d.save(), d.clip(f), u && d.clip(u), Ir(i, o), d.restore(), Dr(e, a, t)) : (Ir(i, o), Dr(e, a, t)), (c || l || f) && d.restore();
	}
	function Dr(e, t, n) {
		n > 0 && (t instanceof Map ? t.forEach((e, t) => {
			d.strokeStyle = qn = t, d.stroke(e);
		}) : t != null && e && d.stroke(t));
	}
	function Ir(e, t) {
		t instanceof Map ? t.forEach((e, t) => {
			d.fillStyle = Jn = t, d.fill(e);
		}) : t != null && e && d.fill(t);
	}
	function Lr(e, t, n, i) {
		let a = y[e], o;
		if (i <= 0) o = [0, 0];
		else {
			let s = a._space = a.space(r, e, t, n, i);
			o = Wi(t, n, a._incrs = a.incrs(r, e, t, n, i, s), i, s);
		}
		return a._found = o;
	}
	function Rr(e, t, n, r, i, a, o, s, c, l) {
		let u = o % 2 / 2;
		h == 1 && d.translate(u, u), hr(s, o, c, l, s), d.beginPath();
		let f, p, m, g, _ = i + (r == 0 || r == 3 ? -a : a);
		n == 0 ? (p = i, g = _) : (f = i, m = _);
		for (let r = 0; r < e.length; r++) t[r] != null && (n == 0 ? f = m = e[r] : p = g = e[r], d.moveTo(f, p), d.lineTo(m, g));
		d.stroke(), h == 1 && d.translate(-u, -u);
	}
	function zr(e) {
		let t = !0;
		return y.forEach((n, i) => {
			if (!n.show) return;
			let a = b[n.scale];
			if (a.min == null) {
				n._show && (t = !1, n._show = !1, qr(!1));
				return;
			}
			n._show || (t = !1, n._show = !0, qr(!1));
			let o = n.side, s = o % 2, { min: c, max: l } = a, [u, d] = Lr(i, c, l, s == 0 ? R : B);
			if (d == 0) return;
			let f = a.distr == 2, p = n._splits = n.splits(r, i, c, l, u, d, f), m = a.distr == 2 ? p.map((e) => Un[e]) : p, h = a.distr == 2 ? Un[p[1]] - Un[p[0]] : u, g = n._values = n.values(r, n.filter(r, m, i, d, h), i, d, h);
			n._rotate = o == 2 ? n.rotate(r, g, i, d) : 0;
			let _ = n._size;
			n._size = jt(n.size(r, g, i, e)), _ != null && n._size != _ && (t = !1);
		}), t;
	}
	function Br(e) {
		let t = !0;
		return Rn.forEach((n, i) => {
			let a = n(r, i, Fn, e);
			a != zn[i] && (t = !1), zn[i] = a;
		}), t;
	}
	function Kr() {
		for (let e = 0; e < y.length; e++) {
			let t = y[e];
			if (!t.show || !t._show) continue;
			let n = t.side, i = n % 2, a, o, c = t.stroke(r, e), l = n == 0 || n == 3 ? -1 : 1, [u, f] = t._found;
			if (t.label != null) {
				let s = t.labelGap * l, p = At((t._lpos + s) * I);
				gr(t.labelFont[0], c, "center", n == 2 ? De : Oe), d.save(), i == 1 ? (a = o = 0, d.translate(p, At(Ut + Yt / 2)), d.rotate((n == 3 ? -Dt : Dt) / 2)) : (a = At(Bt + Wt / 2), o = p);
				let m = Ht(t.label) ? t.label(r, e, u, f) : t.label;
				d.fillText(m, a, o), d.restore();
			}
			if (f == 0) continue;
			let p = b[t.scale], m = i == 0 ? Wt : Yt, h = i == 0 ? Bt : Ut, _ = t._splits, v = p.distr == 2 ? _.map((e) => Un[e]) : _, x = p.distr == 2 ? Un[_[1]] - Un[_[0]] : u, S = t.ticks, C = t.border, w = S.show ? S.size : 0, T = At(w * I), E = At((t.alignTo == 2 ? t._size - w - t.gap : t.gap) * I), D = t._rotate * -Dt / 180, O = g(t._pos * I), k = O + (T + E) * l;
			o = i == 0 ? k : 0, a = i == 1 ? k : 0;
			let A = t.font[0];
			gr(A, c, t.align == 1 ? ke : t.align == 2 ? Ae : D > 0 ? ke : D < 0 ? Ae : i == 0 ? "center" : n == 3 ? Ae : ke, D || i == 1 ? "middle" : n == 2 ? De : Oe);
			let j = t.font[1] * t.lineGap, M = _.map((e) => g(s(e, p, m, h))), ee = t._values;
			for (let e = 0; e < ee.length; e++) {
				let t = ee[e];
				if (t != null) {
					i == 0 ? a = M[e] : o = M[e], t = "" + t;
					let n = t.indexOf("\n") == -1 ? [t] : t.split(/\n/gm);
					for (let e = 0; e < n.length; e++) {
						let t = n[e];
						D ? (d.save(), d.translate(a, o + e * j), d.rotate(D), d.fillText(t, 0, 0), d.restore()) : d.fillText(t, a, o + e * j);
					}
				}
			}
			S.show && Rr(M, S.filter(r, v, e, f, x), i, n, O, T, U(S.width * I, 3), S.stroke(r, e), S.dash, S.cap);
			let te = t.grid;
			te.show && Rr(M, te.filter(r, v, e, f, x), i, i == 0 ? 2 : 1, i == 0 ? Ut : Bt, i == 0 ? Yt : Wt, U(te.width * I, 3), te.stroke(r, e), te.dash, te.cap), C.show && Rr([O], [1], +(i == 0), i == 0 ? 1 : 2, i == 1 ? Ut : Bt, i == 1 ? Yt : Wt, U(C.width * I, 3), C.stroke(r, e), C.dash, C.cap);
		}
		Oa("drawAxes");
	}
	function qr(e) {
		v.forEach((t, n) => {
			n > 0 && (t._paths = null, e && (i == 1 ? (t.min = null, t.max = null) : t.facets.forEach((e) => {
				e.min = null, e.max = null;
			})));
		});
	}
	let Jr = !1, ei = !1, ii = [];
	function ai() {
		ei = !1;
		for (let e = 0; e < ii.length; e++) Oa(...ii[e]);
		ii.length = 0;
	}
	function si() {
		Jr ||= (xn(li), !0);
	}
	function ci(e, t = !1) {
		Jr = !0, ei = t, e(r), li(), t && ii.length > 0 && queueMicrotask(ai);
	}
	r.batch = ci;
	function li() {
		if (Xt &&= (yr(), !1), $t &&= (_n(), !1), Qt) {
			if (L(p, ke, wt), L(p, De, Tt), L(p, Te, R), L(p, Ee, B), L(m, ke, wt), L(m, De, Tt), L(m, Te, R), L(m, Ee, B), L(f, Te, ht), L(f, Ee, xt), u.width = At(ht * I), u.height = At(xt * I), y.forEach(({ _el: e, _show: t, _size: n, _pos: r, side: i }) => {
				if (e != null) {
					if (t) {
						let t = i === 3 || i === 0 ? n : 0, a = i % 2 == 1;
						L(e, a ? "left" : "top", r - t), L(e, a ? "width" : "height", n), L(e, a ? "top" : "left", a ? Tt : wt), L(e, a ? "height" : "width", a ? B : R), Ze(e, pe);
					} else Xe(e, pe);
				}
			}), qn = Jn = J = ar = lr = ur = fr = pr = Yn = null, mr = 1, fa(!0), wt != Et || Tt != kt || R != Ft || B != Lt) {
				qr(!1);
				let e = R / Ft, t = B / Lt;
				if (je && !nn && P.left >= 0) {
					P.left *= e, P.top *= t, mi && tt(mi, At(P.left), 0, R, B), hi && tt(hi, 0, At(P.top), R, B);
					for (let n = 0; n < Dn.length; n++) {
						let r = Dn[n];
						r != null && (On[n] *= e, kn[n] *= t, tt(r, jt(On[n]), jt(kn[n]), R, B));
					}
				}
				if (Q.show && !cn && Q.left >= 0 && Q.width > 0) {
					Q.left *= e, Q.width *= e, Q.top *= t, Q.height *= t;
					for (let e in ha) L(Ti, e, Q[e]);
				}
				Et = wt, kt = Tt, Ft = R, Lt = B;
			}
			Oa("setSize"), Qt = !1;
		}
		ht > 0 && xt > 0 && (d.clearRect(0, 0, u.width, u.height), Oa("drawClear"), w.forEach((e) => e()), Oa("draw")), Q.show && cn && (Ei(Q), cn = !1), je && nn && (ua(null, !0, !1), nn = !1), N.show && N.live && pn && (ca(), pn = !1), c || (c = !0, r.status = 1, Oa("ready")), Wn = !1, Jr = !1;
	}
	r.redraw = (e, t) => {
		$t = t || !1, e === !1 ? si() : Oi(S, D.min, D.max);
	};
	function ui(e, n) {
		let i = b[e];
		if (i.from == null) {
			if (G == 0) {
				let t = i.range(r, n.min, n.max, e);
				n.min = t[0], n.max = t[1];
			}
			if (n.min > n.max) {
				let e = n.min;
				n.min = n.max, n.max = e;
			}
			if (G > 1 && n.min != null && n.max != null && n.max - n.min < 1e-16) return;
			e == S && i.distr == 2 && G > 0 && (n.min = ut(n.min, t[0]), n.max = ut(n.max, t[0]), n.min == n.max && n.max++), j[e] = n, Xt = !0, si();
		}
	}
	r.setScale = ui;
	let fi, pi, mi, hi, gi, _i, vi, yi, bi, xi, Y, X, Si = !1, Ci = P.drag, wi = Ci.x, Z = Ci.y;
	je && (P.x && (fi = $e(he, m)), P.y && (pi = $e(ge, m)), D.ori == 0 ? (mi = fi, hi = pi) : (mi = pi, hi = fi), Y = P.left, X = P.top);
	let Q = r.select = W({
		show: !0,
		over: !0,
		left: 0,
		width: 0,
		top: 0,
		height: 0
	}, e.select), Ti = Q.show ? $e(me, Q.over ? m : p) : null;
	function Ei(e, t) {
		if (Q.show) {
			for (let t in e) Q[t] = e[t], t in ha && L(Ti, t, e[t]);
			t !== !1 && Oa("setSelect");
		}
	}
	r.setSelect = Ei;
	function Di(e) {
		if (v[e].show) F && Ze(qe[e], pe);
		else if (F && Xe(qe[e], pe), je) {
			let t = En ? Dn[0] : Dn[e];
			t != null && tt(t, -10, -10, R, B);
		}
	}
	function Oi(e, t, n) {
		ui(e, {
			min: t,
			max: n
		});
	}
	function ki(e, t, n, a) {
		t.focus != null && ea(e), t.show != null && v.forEach((n, r) => {
			r > 0 && (e == r || e == null) && (n.show = t.show, Di(r), i == 2 ? (Oi(n.facets[0].scale, null, null), Oi(n.facets[1].scale, null, null)) : Oi(n.scale, null, null), si());
		}), n !== !1 && Oa("setSeries", e, t), a && Ma("setSeries", r, e, t);
	}
	r.setSeries = ki;
	function ji(e, t) {
		W(x[e], t);
	}
	function qi(e, t) {
		e.fill = H(e.fill || null), e.dir = z(e.dir, -1), t ??= x.length, x.splice(t, 0, e);
	}
	function Ji(e) {
		e == null ? x.length = 0 : x.splice(e, 1);
	}
	r.addBand = qi, r.setBand = ji, r.delBand = Ji;
	function Yi(e, t) {
		v[e].alpha = t, je && Dn[e] != null && (Dn[e].style.opacity = t), F && qe[e] && (qe[e].style.opacity = t);
	}
	let Xi, Zi, Qi, $i = { focus: !0 };
	function ea(e) {
		if (e != Qi) {
			let t = e == null, n = wn.alpha != 1;
			v.forEach((r, a) => {
				if (i == 1 || a > 0) {
					let i = t || a == 0 || a == e;
					r._focus = t ? null : i, n && Yi(a, i ? 1 : wn.alpha);
				}
			}), Qi = e, n && si();
		}
	}
	F && Tn && pt(Le, Be, (e) => {
		P._lock || (Sn(e), Qi != null && ki(null, $i, !0, $.setSeries));
	});
	function ta(e, t, n) {
		let r = b[t];
		n && (e = e / I - (r.ori == 1 ? Tt : wt));
		let i = R;
		r.ori == 1 && (i = B, e = i - e), r.dir == -1 && (e = i - e);
		let a = r._min, o = r._max, s = e / i, c = a + (o - a) * s, l = r.distr;
		return l == 3 ? Pt(10, c) : l == 4 ? Rt(c, r.asinh) : l == 100 ? r.bwd(c) : c;
	}
	function na(e, n) {
		return ut(ta(e, S, n), t[0], K, q);
	}
	r.valToIdx = (e) => ut(e, t[0]), r.posToIdx = na, r.posToVal = ta, r.valToPos = (e, t, n) => b[t].ori == 0 ? a(e, b[t], n ? Wt : R, n ? Bt : 0) : o(e, b[t], n ? Yt : B, n ? Ut : 0), r.setCursor = (e, t, n) => {
		Y = e.left, X = e.top, ua(null, t, n);
	};
	function ra(e, t) {
		L(Ti, ke, Q.left = e), L(Ti, Te, Q.width = t);
	}
	function ia(e, t) {
		L(Ti, De, Q.top = e), L(Ti, Ee, Q.height = t);
	}
	let aa = D.ori == 0 ? ra : ia, oa = D.ori == 1 ? ra : ia;
	function sa() {
		if (F && N.live) for (let e = +(i == 2); e < v.length; e++) {
			if (e == 0 && et) continue;
			let t = N.values[e], n = 0;
			for (let r in t) Je[e][n++].firstChild.nodeValue = t[r];
		}
	}
	function ca(e, t) {
		if (e != null && (e.idxs ? e.idxs.forEach((e, t) => {
			ie[t] = e;
		}) : ln(e.idx) || ie.fill(e.idx), N.idx = ie[0]), F && N.live) {
			for (let e = 0; e < v.length; e++) (e > 0 || i == 1 && !et) && la(e, ie[e]);
			sa();
		}
		pn = !1, t !== !1 && Oa("setLegend");
	}
	r.setLegend = ca;
	function la(e, n) {
		let i = v[e], a = e == 0 && O == 2 ? Un : t[e], o;
		et ? o = i.values(r, e, n) ?? nt : (o = i.value(r, n == null ? null : a[n], e, n), o = o == null ? nt : { _: o }), N.values[e] = o;
	}
	function ua(e, n, a) {
		bi = Y, xi = X, [Y, X] = P.move(r, Y, X), P.left = Y, P.top = X, je && (mi && tt(mi, At(Y), 0, R, B), hi && tt(hi, 0, At(X), R, B));
		let o, s = K > q;
		Xi = V, Zi = null;
		let c = D.ori == 0 ? R : B, l = D.ori == 1 ? R : B;
		if (Y < 0 || G == 0 || s) {
			o = P.idx = null;
			for (let e = 0; e < v.length; e++) {
				let t = Dn[e];
				t != null && tt(t, -10, -10, R, B);
			}
			Tn && ki(null, $i, !0, e == null && $.setSeries), N.live && (ie.fill(o), pn = !0);
		} else {
			let e, n, a;
			i == 1 && (e = D.ori == 0 ? Y : X, n = ta(e, S), o = P.idx = ut(n, t[0], K, q), a = k(t[0][o], D, c, 0));
			let s = -10, u = -10, d = 0, f = 0, p = !0, m = "", h = "";
			for (let e = +(i == 2); e < v.length; e++) {
				let g = v[e], _ = ie[e], y = _ == null ? null : i == 1 ? t[e][_] : t[e][1][_], x = P.dataIdx(r, e, o, n), S = x == null ? null : i == 1 ? t[e][x] : t[e][1][x];
				if (pn = pn || S != y || x != _, ie[e] = x, e > 0 && g.show) {
					let n = x == null ? -10 : x == o ? a : k(i == 1 ? t[0][x] : t[e][0][x], D, c, 0), _ = S == null ? -10 : A(S, i == 1 ? b[g.scale] : b[g.facets[1].scale], l, 0);
					if (Tn && S != null) {
						let t = D.ori == 1 ? Y : X, n = Ot(wn.dist(r, e, x, _, t));
						if (n < Xi) {
							let r = wn.bias;
							if (r != 0) {
								let i = ta(t, g.scale), a = S >= 0 ? 1 : -1, o = i >= 0 ? 1 : -1;
								o == a && (o == 1 ? r == 1 ? S >= i : S <= i : r == 1 ? S <= i : S >= i) && (Xi = n, Zi = e);
							} else Xi = n, Zi = e;
						}
					}
					if (pn || En) {
						let t, i;
						D.ori == 0 ? (t = n, i = _) : (t = _, i = n);
						let a, o, c, l, g, v, y = !0, b = Cn.bbox;
						if (b != null) {
							y = !1;
							let t = b(r, e);
							c = t.left, l = t.top, a = t.width, o = t.height;
						} else c = t, l = i, a = o = Cn.size(r, e);
						if (v = Cn.fill(r, e), g = Cn.stroke(r, e), En) e == Zi && Xi <= wn.prox && (s = c, u = l, d = a, f = o, p = y, m = v, h = g);
						else {
							let t = Dn[e];
							t != null && (On[e] = c, kn[e] = l, at(t, a, o, y), rt(t, v, g), tt(t, jt(c), jt(l), R, B));
						}
					}
				}
			}
			if (En) {
				let e = wn.prox;
				if (pn || (Qi == null ? Xi <= e : Xi > e || Zi != Qi)) {
					let e = Dn[0];
					e != null && (On[0] = s, kn[0] = u, at(e, d, f, p), rt(e, m, h), tt(e, jt(s), jt(u), R, B));
				}
			}
		}
		if (Q.show && Si) {
			if (e != null) {
				let [t, n] = $.scales, [r, i] = $.match, [a, o] = e.cursor.sync.scales, s = e.cursor.drag;
				if (wi = s._x, Z = s._y, wi || Z) {
					let { left: s, top: u, width: d, height: f } = e.select, p = e.scales[a].ori, m = e.posToVal, h, g, _, v, y, x = t != null && r(t, a), S = n != null && i(n, o);
					x && wi ? (p == 0 ? (h = s, g = d) : (h = u, g = f), _ = b[t], v = k(m(h, a), _, c, 0), y = k(m(h + g, a), _, c, 0), aa(Mt(v, y), Ot(y - v))) : aa(0, c), S && Z ? (p == 1 ? (h = s, g = d) : (h = u, g = f), _ = b[n], v = A(m(h, o), _, l, 0), y = A(m(h + g, o), _, l, 0), oa(Mt(v, y), Ot(y - v))) : oa(0, l);
				} else ga();
			} else {
				let e = Ot(bi - gi), t = Ot(xi - _i);
				if (D.ori == 1) {
					let n = e;
					e = t, t = n;
				}
				wi = Ci.x && e >= Ci.dist, Z = Ci.y && t >= Ci.dist;
				let n = Ci.uni;
				n == null ? Ci.x && Ci.y && (wi || Z) && (wi = Z = !0) : wi && Z && (wi = e >= n, Z = t >= n, !wi && !Z && (t > e ? Z = !0 : wi = !0));
				let r, i;
				wi && (D.ori == 0 ? (r = vi, i = Y) : (r = yi, i = X), aa(Mt(r, i), Ot(i - r)), Z || oa(0, l)), Z && (D.ori == 1 ? (r = vi, i = Y) : (r = yi, i = X), oa(Mt(r, i), Ot(i - r)), wi || aa(0, c)), !wi && !Z && (aa(0, 0), oa(0, 0));
			}
		}
		if (Ci._x = wi, Ci._y = Z, e == null) {
			if (a) {
				if (Aa != null) {
					let [e, t] = $.scales;
					$.values[0] = e == null ? null : ta(D.ori == 0 ? Y : X, e), $.values[1] = t == null ? null : ta(D.ori == 1 ? Y : X, t);
				}
				Ma(Ne, r, Y, X, R, B, o);
			}
			if (Tn) {
				let e = a && $.setSeries, t = wn.prox;
				Qi == null ? Xi <= t && ki(Zi, $i, !0, e) : Xi > t ? ki(null, $i, !0, e) : Zi != Qi && ki(Zi, $i, !0, e);
			}
		}
		pn && (N.idx = o, ca()), n !== !1 && Oa("setCursor");
	}
	let da = null;
	Object.defineProperty(r, "rect", { get() {
		return da ?? fa(!1), da;
	} });
	function fa(e = !1) {
		e ? da = null : (da = m.getBoundingClientRect(), Oa("syncRect", da));
	}
	function pa(e, t, n, r, i, a, o) {
		P._lock || Si && e != null && e.movementX == 0 && e.movementY == 0 || (ma(e, t, n, r, i, a, o, !1, e != null), e == null ? ua(t, !0, !1) : ua(null, !0, !0));
	}
	function ma(e, t, n, i, a, o, c, l, u) {
		if (da ?? fa(!1), Sn(e), e != null) n = e.clientX - da.left, i = e.clientY - da.top;
		else {
			if (n < 0 || i < 0) {
				Y = -10, X = -10;
				return;
			}
			let [e, r] = $.scales, c = t.cursor.sync, [l, u] = c.values, [d, f] = c.scales, [p, m] = $.match, h = t.axes[0].side % 2 == 1, g = D.ori == 0 ? R : B, _ = D.ori == 1 ? R : B, v = h ? o : a, y = h ? a : o, x = h ? i : n, S = h ? n : i;
			if (n = d == null ? x / v * g : p(e, d) ? s(l, b[e], g, 0) : -10, i = f == null ? S / y * _ : m(r, f) ? s(u, b[r], _, 0) : -10, D.ori == 1) {
				let e = n;
				n = i, i = e;
			}
		}
		u && (t == null || t.cursor.event.type == Ne) && ((n <= 1 || n >= R - 1) && (n = Zt(n, R)), (i <= 1 || i >= B - 1) && (i = Zt(i, B))), l ? (gi = n, _i = i, [vi, yi] = P.move(r, n, i)) : (Y = n, X = i);
	}
	let ha = {
		width: 0,
		height: 0,
		left: 0,
		top: 0
	};
	function ga() {
		Ei(ha, !1);
	}
	let _a, va, ya, ba;
	function xa(e, t, n, i, a, o, s) {
		Si = !0, wi = Z = Ci._x = Ci._y = !1, ma(e, t, n, i, a, o, s, !0, !1), e != null && (pt(Fe, Ge, Sa, !1), Ma(Pe, r, vi, yi, R, B, null));
		let { left: c, top: l, width: u, height: d } = Q;
		_a = c, va = l, ya = u, ba = d;
	}
	function Sa(e, t, n, i, a, o, s) {
		Si = Ci._x = Ci._y = !1, ma(e, t, n, i, a, o, s, !1, !0);
		let { left: c, top: l, width: u, height: d } = Q, f = u > 0 || d > 0, p = _a != c || va != l || ya != u || ba != d;
		if (f && p && Ei(Q), Ci.setScale && f && p) {
			let e = c, t = u, n = l, r = d;
			if (D.ori == 1 && (e = l, t = d, n = c, r = u), wi && Oi(S, ta(e, S), ta(e + t, S)), Z) for (let e in b) {
				let t = b[e];
				e != S && t.from == null && t.min != V && Oi(e, ta(n + r, e), ta(n, e));
			}
			ga();
		} else P.lock && (P._lock = !P._lock, ua(t, !0, e != null));
		e != null && (mt(Fe, Ge), Ma(Fe, r, Y, X, R, B, null));
	}
	function Ca(e, t, n, r, i, a, o) {
		if (P._lock) return;
		Sn(e);
		let s = Si;
		if (Si) {
			let e = !0, t = !0, n, r;
			D.ori == 0 ? (n = wi, r = Z) : (n = Z, r = wi), n && r && (e = Y <= 10 || Y >= R - 10, t = X <= 10 || X >= B - 10), n && e && (Y = Y < vi ? 0 : R), r && t && (X = X < yi ? 0 : B), ua(null, !0, !0), Si = !1;
		}
		Y = -10, X = -10, ie.fill(null), ua(null, !0, !0), s && (Si = s);
	}
	function wa(e, t, n, i, a, o, s) {
		P._lock || (Sn(e), Kn(), ga(), e != null && Ma(Re, r, Y, X, R, B, null));
	}
	function Ta() {
		y.forEach(Ki), mn(r.width, r.height, !0);
	}
	ct(He, Ke, Ta);
	let Ea = {};
	Ea.mousedown = xa, Ea.mousemove = pa, Ea.mouseup = Sa, Ea.dblclick = wa, Ea.setSeries = (e, t, n, i) => {
		let a = $.match[2];
		n = a(r, t, n), n != -1 && ki(n, i, !0, !1);
	}, je && (pt(Pe, m, xa), pt(Ne, m, pa), pt(Ie, m, (e) => {
		Sn(e), fa(!1);
	}), pt(Le, m, Ca), pt(Re, m, wa), Ai.add(r), r.syncRect = fa);
	let Da = r.hooks = e.hooks || {};
	function Oa(e, t, n) {
		ei ? ii.push([
			e,
			t,
			n
		]) : e in Da && Da[e].forEach((e) => {
			e.call(null, r, t, n);
		});
	}
	(e.plugins || []).forEach((e) => {
		for (let t in e.hooks) Da[t] = (Da[t] || []).concat(e.hooks[t]);
	});
	let ka = (e, t, n) => n, $ = W({
		key: null,
		setSeries: !1,
		filters: {
			pub: qt,
			sub: qt
		},
		scales: [S, v[1] ? v[1].scale : null],
		match: [
			Jt,
			Jt,
			ka
		],
		values: [null, null]
	}, P.sync);
	$.match.length == 2 && $.match.push(ka), P.sync = $;
	let Aa = $.key, ja = ti(Aa);
	function Ma(e, t, n, r, i, a, o) {
		$.filters.pub(e, t, n, r, i, a, o) && ja.pub(e, t, n, r, i, a, o);
	}
	ja.sub(r);
	function Na(e, t, n, r, i, a, o) {
		$.filters.sub(e, t, n, r, i, a, o) && Ea[e](null, t, n, r, i, a, o);
	}
	r.pub = Na;
	function Pa() {
		ja.unsub(r), Ai.delete(r), ft.clear(), lt(He, Ke, Ta), l.remove(), Be?.remove(), Oa("destroy");
	}
	r.destroy = Pa;
	function Fa() {
		Oa("init", e, t), Gn(t || e.data, !1), j[S] ? ui(S, j[S]) : Kn(), cn = Q.show && (Q.width > 0 || Q.height > 0), nn = pn = !0, mn(e.width, e.height);
	}
	return v.forEach(jn), y.forEach(In), n ? n instanceof HTMLElement ? (n.appendChild(l), Fa()) : n(r, Fa) : Fa(), r;
}
qi.assign = W, qi.fmtNum = Tt, qi.rangeNum = St, qi.rangeLog = _t, qi.rangeAsinh = vt, qi.orient = ii, qi.pxRatio = I, qi.join = bn, qi.fmtDate = Nn, qi.tzDate = Fn, qi.sync = ti;
{
	qi.addGap = li, qi.clipGaps = ci;
	let e = qi.paths = { points: X };
	e.linear = Z, e.stepped = Q, e.bars = Ei, e.spline = Oi;
}
// plot/plotMath.ts
function Ji(e, t) {
	return Math.max(0, (e - t) / 1e3);
}
function Yi(e, t) {
	return `${e}\0${t}`;
}
function Xi(e, t = .05) {
	let n = Infinity, r = -Infinity;
	for (let t of e) for (let e of t) Number.isFinite(e) && (n = Math.min(n, e), r = Math.max(r, e));
	if (!Number.isFinite(n) || !Number.isFinite(r)) return [-1, 1];
	let i = r - n, a = i > 0 ? i * t : Math.max(Math.abs(n) * t, .001);
	return [n - a, r + a];
}
function Zi(e, t, n, r = 1, i = 300) {
	let [a, o] = e, s = Math.max(.1, o - a), c = Math.max(r, Math.min(i, s * n)), l = s > 0 ? (t - a) / s : .5, u = Math.max(0, t - c * Math.max(0, Math.min(1, l)));
	return [u, u + c];
}
function Qi(e, t, n = 0) {
	let r = e[1] - e[0], i = Math.max(n, e[0] + t);
	return [i, i + r];
}
function $i(e, t, n = .05) {
	let [r, i] = t, a = [];
	for (let t of e) {
		if (t.visible === !1) continue;
		let e = [];
		for (let n = 0; n < t.ts.length; n++) {
			let a = t.ts[n];
			a >= r && a <= i && e.push(t.vs[n]);
		}
		e.length > 0 && a.push(e);
	}
	return Xi(a, n);
}
// plot/index.tsx
var ea = 60, ta = 3e3, na = [
	"#4ea1ff",
	"#ffb347",
	"#5ad469",
	"#ff6b81",
	"#c792ea",
	"#6be7dd"
];
function ra(e, t) {
	let n = e;
	for (let e of t.split(".")) {
		if (typeof n != "object" || !n) return;
		n = n[e];
	}
	return n;
}
var ia = {
	"nav_msgs/msg/Odometry": [
		"twist.twist.linear.x",
		"twist.twist.angular.z",
		"pose.pose.position.x",
		"pose.pose.position.y"
	],
	"std_msgs/msg/Float32": ["data"],
	"sensor_msgs/msg/JointState": ["position.0", "position.1"]
}, aa = {
	"zh-CN": {
		chooseTopic: "选择话题...",
		fieldPath: "字段路径，如 twist.linear.x",
		add: "添加",
		resume: "继续实时",
		pause: "暂停",
		reset: "复位视角",
		clearAll: "清空",
		invalidField: "无效数值",
		waitingData: "等待数据...",
		hide: "隐藏",
		show: "显示",
		remove: "删除"
	},
	en: {
		chooseTopic: "Choose topic...",
		fieldPath: "Field path, e.g. twist.linear.x",
		add: "Add",
		resume: "Resume",
		pause: "Pause",
		reset: "Reset view",
		clearAll: "Clear all",
		invalidField: "Invalid number",
		waitingData: "Waiting for data...",
		hide: "Hide",
		show: "Show",
		remove: "Remove"
	}
};
function oa({ ctx: e, state: t, onStateChange: n }) {
	let { bridge: i, topics: m, theme: h = "dark", locale: g = "zh-CN" } = e, _ = g === "en", v = (e) => _ ? aa.en[e] : aa["zh-CN"][e], y = o(null), b = o(null), x = o(null), S = o([]), C = o(/* @__PURE__ */ new Map()), w = o(performance.now()), T = o(!1), E = o(h), D = o(n), O = o(1), A = o(null);
	E.current = h, D.current = n;
	let [M, te] = s([]), [re, N] = s(""), [F, ae] = s(""), [oe, se] = s(!1), [ce, le] = s(!1), [, ue] = s(0), de = r((e) => {
		S.current = e, te(e);
	}, []), fe = r((e) => {
		if (C.current.has(e)) return;
		let t = i.subscribe(e, (t) => {
			if (t.kind !== "raw") return;
			let n = Ji(performance.now(), w.current);
			for (let r of S.current) {
				if (r.topic !== e) continue;
				let i = ra(t.message, r.field);
				if (typeof i != "number" && typeof i != "bigint") {
					r.status = "invalid";
					continue;
				}
				let a = Number(i);
				if (!Number.isFinite(a)) {
					r.status = "invalid";
					continue;
				}
				r.status = "ok", r.latest = a, r.ts.push(n), r.vs.push(a);
				let o = n - ea;
				for (; r.ts.length > ta || (r.ts[0] ?? n) < o;) r.ts.shift(), r.vs.shift();
			}
		});
		C.current.set(e, t);
	}, [i]), pe = r(() => {
		x.current?.destroy(), x.current = null;
		let e = y.current, t = S.current;
		if (!e || t.length === 0) return;
		let n = E.current === "dark", r = {
			stroke: n ? "rgba(245,245,245,0.74)" : "rgba(10,10,10,0.74)",
			grid: {
				stroke: n ? "rgba(245,245,245,0.14)" : "rgba(10,10,10,0.14)",
				width: 1
			},
			ticks: {
				stroke: n ? "rgba(245,245,245,0.36)" : "rgba(10,10,10,0.36)",
				width: 1
			},
			font: "11px system-ui, -apple-system, sans-serif"
		};
		x.current = new qi({
			width: e.clientWidth,
			height: Math.max(100, e.clientHeight - 4),
			series: [{}, ...t.map((e) => ({
				label: `${e.topic}.${e.field}`,
				stroke: e.color,
				show: e.visible,
				width: 2,
				points: { show: !1 }
			}))],
			axes: [r, { ...r }],
			legend: { show: !0 },
			cursor: { drag: {
				x: !1,
				y: !1
			} },
			scales: {
				x: {
					time: !1,
					auto: !1
				},
				y: { auto: !1 }
			}
		}, [[], ...t.map(() => [])], e);
	}, []), me = r((e) => {
		let t = e.topic.trim(), n = e.field.trim();
		if (!t || !n || S.current.some((e) => Yi(e.topic, e.field) === Yi(t, n))) return !1;
		let r = O.current++, i = [...S.current, {
			id: r,
			topic: t,
			field: n,
			color: na[(r - 1) % na.length],
			visible: e.visible ?? !0,
			ts: [],
			vs: [],
			status: "waiting"
		}];
		return de(i), fe(t), queueMicrotask(pe), !0;
	}, [
		de,
		fe,
		pe
	]);
	a(() => {
		let e = t;
		for (let t of e?.series ?? []) me(t);
	}, []), a(() => {
		D.current?.({ series: M.map(({ topic: e, field: t, visible: n }) => ({
			topic: e,
			field: t,
			...n ? {} : { visible: n }
		})) });
	}, [M]), a(() => {
		let e = setInterval(() => {
			if (T.current) return;
			let e = x.current, t = S.current;
			if (!e || t.length === 0) return;
			let n = qi.join(t.map((e) => [e.ts, e.vs]));
			e.setData(n);
			let r = t.reduce((e, t) => Math.max(e, t.ts.at(-1) ?? 0), 0);
			if (A.current !== null) {
				let [n, r] = A.current;
				e.setScale("x", {
					min: n,
					max: r
				});
				let [i, a] = $i(t, A.current);
				e.setScale("y", {
					min: i,
					max: a
				});
			} else {
				e.setScale("x", {
					min: Math.max(0, r - ea),
					max: Math.max(ea, r)
				});
				let [n, i] = Xi(t.filter((e) => e.visible).map((e) => e.vs.filter((t, n) => (e.ts[n] ?? 0) >= r - ea)));
				e.setScale("y", {
					min: n,
					max: i
				});
			}
			ue((e) => e + 1);
		}, 100);
		return () => clearInterval(e);
	}, []);
	let he = r(() => {
		A.current = null, le(!1);
		let e = x.current, t = S.current;
		if (e && t.length > 0) {
			let n = t.reduce((e, t) => Math.max(e, t.ts.at(-1) ?? 0), 0);
			e.setScale("x", {
				min: Math.max(0, n - ea),
				max: Math.max(ea, n)
			});
		}
	}, []);
	a(() => {
		let e = y.current;
		if (!e) return;
		let t = (e) => {
			e.preventDefault(), e.stopPropagation();
			let t = x.current;
			if (!t) return;
			let n = t.over.getBoundingClientRect(), r = e.clientX - n.left, i = t.posToVal(r, "x");
			if (!Number.isFinite(i)) return;
			let a = t.scales.x, o = a.min ?? 0, s = a.max ?? ea, c = A.current ?? [o, s];
			if (e.ctrlKey) {
				let n = Zi(c, i, Math.exp(-e.deltaY * .01));
				A.current = n, le(!0), t.setScale("x", {
					min: n[0],
					max: n[1]
				});
			} else if (e.deltaMode === 0 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
				let r = (c[1] - c[0]) / Math.max(10, n.width), i = Qi(c, e.deltaX * r);
				A.current = i, le(!0), t.setScale("x", {
					min: i[0],
					max: i[1]
				});
			} else {
				let n = Zi(c, i, e.deltaY < 0 ? .85 : 1 / .85);
				A.current = n, le(!0), t.setScale("x", {
					min: n[0],
					max: n[1]
				});
			}
		};
		return e.addEventListener("wheel", t, { passive: !1 }), () => e.removeEventListener("wheel", t);
	}, []), a(() => {
		let e = y.current;
		if (!e) return;
		let t = new ResizeObserver(() => {
			x.current?.setSize({
				width: e.clientWidth,
				height: Math.max(100, e.clientHeight - 4)
			});
		});
		return t.observe(e), () => t.disconnect();
	}, []), a(() => {
		pe();
	}, [h, pe]), a(() => {
		let e = C.current;
		return () => {
			for (let t of e.values()) t();
			e.clear(), x.current?.destroy();
		};
	}, []);
	let ge = r((e) => {
		let t = S.current.find((t) => t.id === e);
		if (!t) return;
		let n = S.current.filter((t) => t.id !== e);
		de(n), n.some((e) => e.topic === t.topic) || (C.current.get(t.topic)?.(), C.current.delete(t.topic)), queueMicrotask(pe);
	}, [de, pe]), _e = r(() => {
		for (let e of C.current.values()) e();
		C.current.clear(), de([]), x.current?.destroy(), x.current = null;
	}, [de]), ve = r((e) => {
		de(S.current.map((t) => t.id === e ? {
			...t,
			visible: !t.visible
		} : t)), queueMicrotask(pe);
	}, [de, pe]), ye = m.filter((e) => !["sensor_msgs/msg/Image", "sensor_msgs/msg/CompressedImage"].includes(e.schemaName)), be = ia[m.find((e) => e.topic === re)?.schemaName ?? ""] ?? [], xe = M.some((e) => Yi(e.topic, e.field) === Yi(re, F.trim()));
	return /* @__PURE__ */ p("div", {
		className: "plot-panel",
		children: [/* @__PURE__ */ p(d, {
			className: "plot-toolbar",
			children: [
				/* @__PURE__ */ p(l, {
					"aria-label": v("chooseTopic"),
					value: re,
					onChange: (e) => N(e.target.value),
					children: [/* @__PURE__ */ f("option", {
						value: "",
						children: v("chooseTopic")
					}), ye.map((e) => /* @__PURE__ */ f("option", {
						value: e.topic,
						children: e.topic
					}, e.topic))]
				}),
				/* @__PURE__ */ f(u, {
					ref: b,
					required: !0,
					className: "field-input",
					placeholder: v("fieldPath"),
					value: F,
					onChange: (e) => ae(e.target.value),
					onKeyDown: (e) => {
						e.key === "Enter" && me({
							topic: re,
							field: F
						}) && ae("");
					},
					list: "plot-field-hints"
				}),
				/* @__PURE__ */ f("datalist", {
					id: "plot-field-hints",
					children: be.map((e) => /* @__PURE__ */ f("option", { value: e }, e))
				}),
				/* @__PURE__ */ f(c, {
					onClick: () => {
						b.current?.checkValidity() && me({
							topic: re,
							field: F
						}) && ae("");
					},
					disabled: !re || xe,
					children: v("add")
				}),
				/* @__PURE__ */ f(c, {
					className: "icon-action",
					onClick: () => {
						T.current = !T.current, se(T.current);
					},
					title: v(oe ? "resume" : "pause"),
					"aria-label": v(oe ? "resume" : "pause"),
					children: f(oe ? ne : ee, { size: 14 })
				}),
				ce && /* @__PURE__ */ f(c, {
					className: "icon-action",
					onClick: he,
					title: v("reset"),
					"aria-label": v("reset"),
					children: /* @__PURE__ */ f(ie, { size: 14 })
				}),
				M.length > 0 && /* @__PURE__ */ f(c, {
					className: "icon-action",
					onClick: _e,
					title: v("clearAll"),
					"aria-label": v("clearAll"),
					children: /* @__PURE__ */ f(P, { size: 14 })
				})
			]
		}), /* @__PURE__ */ p("div", {
			className: "plot-content",
			children: [M.length > 0 && /* @__PURE__ */ f("div", {
				className: "series-list",
				children: M.map((e) => /* @__PURE__ */ p("div", {
					className: `series-row ${e.visible ? "" : "muted"}`,
					children: [
						/* @__PURE__ */ f("i", { style: { background: e.color } }),
						/* @__PURE__ */ p("span", {
							className: "series-name",
							children: [
								e.topic,
								".",
								e.field
							]
						}),
						/* @__PURE__ */ f("span", {
							className: `series-value ${e.status}`,
							children: e.status === "ok" ? e.latest?.toPrecision(6) : e.status === "invalid" ? v("invalidField") : v("waitingData")
						}),
						/* @__PURE__ */ f(c, {
							onClick: () => ve(e.id),
							title: e.visible ? v("hide") : v("show"),
							"aria-label": e.visible ? v("hide") : v("show"),
							children: e.visible ? /* @__PURE__ */ f(j, { size: 12 }) : /* @__PURE__ */ f(k, { size: 12 })
						}),
						/* @__PURE__ */ f(c, {
							onClick: () => ge(e.id),
							title: v("remove"),
							"aria-label": v("remove"),
							children: /* @__PURE__ */ f(P, { size: 12 })
						})
					]
				}, e.id))
			}), /* @__PURE__ */ f("div", {
				ref: y,
				className: "plot-body"
			})]
		})]
	});
}
var sa = {
	id: "plot",
	name: "曲线 (Plot)",
	panels: [{
		kind: "plot",
		title: (e) => e.locale === "en" ? "Plot" : "曲线面板",
		component: oa
	}]
};
export { oa as PlotPanel, sa as default };
