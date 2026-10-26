import { createContext as e, createElement as t, forwardRef as n, useCallback as r, useContext as i, useEffect as a, useMemo as o, useRef as s, useState as c } from "react";
import { Button as l, IconButton as u, TextInput as d, useI18n as f, validateInputs as p } from "@robviz/core";
import { Fragment as m, jsx as h, jsxs as g } from "react/jsx-runtime";
import { createPortal as _ } from "react-dom";
// node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs
var v = (e) => e?.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
// node_modules/lucide-react/dist/esm/shared/src/utils/toLucideIconData.mjs
function ee(e, t, n = []) {
	if (t == null) throw Error("[lucide]: iconNode is required when icon name is used");
	return {
		name: v(e),
		size: 24,
		node: t,
		...n.length > 0 ? { aliases: n } : {}
	};
}
// node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs
var te = (e) => {
	let t = "", n = !1;
	for (let r of e) r === "-" || r === "_" || r <= " " ? n = t.length > 0 : (t.length === 0 ? t += r.toLowerCase() : t += n ? r.toUpperCase() : r, n = !1);
	return t;
}, y = (e) => {
	let t = te(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, ne = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), re = {
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
function ie(e) {
	return e != null;
}
function ae(e, t = {}) {
	let n = t.attributeNames ?? {}, r = (e) => n[e] ?? e, i = e.size ?? e.width ?? re.width, a = e.size ?? e.height ?? re.height, o = e.aliases?.filter((e) => typeof e == "string" && e.trim() !== "").map((e) => `lucide-${e}`) ?? [], s = [...e.name ? [`lucide-${e.name}`] : [], ...o], c = t.className?.split(" ").filter(Boolean) ?? [], l = t.includeDefaultClasses === !1 ? ne(...c) : ne("lucide", ...s, ...c), u = t.absoluteStrokeWidth ? Number(t.strokeWidth ?? re["stroke-width"]) * Number(e.size ?? e.width ?? re.width) / Number(t.size ?? t.width ?? re.width) : t.strokeWidth ?? re["stroke-width"];
	return [
		"svg",
		{
			...Object.entries(re).reduce((e, [t, n]) => (e[r(t)] = n, e), {}),
			..."color" in t && t.color && { [r("stroke")]: t.color },
			..."size" in t && ie(t.size) && {
				[r("width")]: t.size,
				[r("height")]: t.size
			},
			..."width" in t && ie(t.width) && { [r("width")]: t.width },
			..."height" in t && ie(t.height) && { [r("height")]: t.height },
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
function oe(e, t = {}) {
	return ae(e, {
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
var b = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, se = e({}), x = () => i(se), ce = n(({ color: e, size: n, width: r, height: i, strokeWidth: a, absoluteStrokeWidth: o, nonScalingStroke: s, className: c = "", children: l, iconNode: u = [], icon: d = {
	node: u,
	aliases: [],
	size: 24
}, ...f }, p) => {
	let { size: m = 24, strokeWidth: h = 2, absoluteStrokeWidth: g = !1, nonScalingStroke: _ = !1, color: v = "currentColor", className: ee = "" } = x() ?? {}, te = !!l || b(f), [y, re, ie = []] = oe(d, {
		color: e ?? v,
		width: r ?? n ?? m,
		height: i ?? n ?? m,
		strokeWidth: a ?? h,
		absoluteStrokeWidth: o ?? g,
		nonScalingStroke: s ?? _,
		className: ne(ee, c),
		hasA11yProp: te,
		attributes: f
	});
	return t(y, {
		ref: p,
		...re
	}, [...ie.map(([e, n]) => t(e, n)), ...Array.isArray(l) ? l : [l]]);
});
// node_modules/lucide-react/dist/esm/createLucideIcon.mjs
function le(e, r = [], i = []) {
	let a = typeof e == "string" ? ee(e, r, i) : e, o = n(({ className: e, ...n }, r) => t(ce, {
		ref: r,
		icon: a,
		className: e,
		...n
	}));
	return a.name && (o.displayName = y(a.name)), o;
}
// node_modules/lucide-react/dist/esm/icons/chevron-down.mjs
var ue = {
	name: "chevron-down",
	size: 24,
	node: [["path", {
		d: "m6 9 6 6 6-6",
		key: "qrunsl"
	}]]
};
ue.node;
var S = le(ue), C = {
	name: "rotate-cw",
	size: 24,
	node: [["path", {
		d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",
		key: "1p45f6"
	}], ["path", {
		d: "M21 3v5h-5",
		key: "1q7to0"
	}]]
};
C.node;
var de = le(C), fe = {
	name: "square-terminal",
	size: 24,
	node: [
		["path", {
			d: "m7 11 2-2-2-2",
			key: "1lz0vl"
		}],
		["path", {
			d: "M11 13h4",
			key: "1p7l4v"
		}],
		["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2",
			ry: "2",
			key: "1m3agn"
		}]
	],
	aliases: ["terminal-square"]
};
fe.node;
var pe = le(fe), me = {
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
me.node;
var he = le(me), ge = 2, _e = 1, ve = class {
	activate(e) {
		this._terminal = e;
	}
	dispose() {}
	fit() {
		let e = this.proposeDimensions();
		if (!e || !this._terminal || isNaN(e.cols) || isNaN(e.rows)) return;
		let t = this._terminal._core;
		(this._terminal.rows !== e.rows || this._terminal.cols !== e.cols) && (t._renderService.clear(), this._terminal.resize(e.cols, e.rows));
	}
	proposeDimensions() {
		if (!this._terminal || !this._terminal.element || !this._terminal.element.parentElement) return;
		let e = this._terminal._core._renderService.dimensions;
		if (e.css.cell.width === 0 || e.css.cell.height === 0) return;
		let t = this._terminal.options.scrollback === 0 ? 0 : this._terminal.options.overviewRuler?.width || 14, n = window.getComputedStyle(this._terminal.element.parentElement), r = parseInt(n.getPropertyValue("height")), i = Math.max(0, parseInt(n.getPropertyValue("width"))), a = window.getComputedStyle(this._terminal.element), o = {
			top: parseInt(a.getPropertyValue("padding-top")),
			bottom: parseInt(a.getPropertyValue("padding-bottom")),
			right: parseInt(a.getPropertyValue("padding-right")),
			left: parseInt(a.getPropertyValue("padding-left"))
		}, s = o.top + o.bottom, c = o.right + o.left, l = r - s, u = i - c - t;
		return {
			cols: Math.max(ge, Math.floor(u / e.css.cell.width)),
			rows: Math.max(_e, Math.floor(l / e.css.cell.height))
		};
	}
}, ye = Object.defineProperty, be = Object.getOwnPropertyDescriptor, xe = (e, t) => {
	for (var n in t) ye(e, n, {
		get: t[n],
		enumerable: !0
	});
}, w = (e, t, n, r) => {
	for (var i = r > 1 ? void 0 : r ? be(t, n) : t, a = e.length - 1, o; a >= 0; a--) (o = e[a]) && (i = (r ? o(t, n, i) : o(i)) || i);
	return r && i && ye(t, n, i), i;
}, T = (e, t) => (n, r) => t(n, r, e), Se = "Terminal input", Ce = {
	get: () => Se,
	set: (e) => Se = e
}, we = "Too much output to announce, navigate to rows manually to read", Te = {
	get: () => we,
	set: (e) => we = e
};
function Ee(e) {
	return e.replace(/\r?\n/g, "\r");
}
function De(e, t) {
	return t ? "\x1B[200~" + e + "\x1B[201~" : e;
}
function Oe(e, t) {
	e.clipboardData && e.clipboardData.setData("text/plain", t.selectionText), e.preventDefault();
}
function ke(e, t, n, r) {
	e.stopPropagation(), e.clipboardData && Ae(e.clipboardData.getData("text/plain"), t, n, r);
}
function Ae(e, t, n, r) {
	e = Ee(e), e = De(e, n.decPrivateModes.bracketedPasteMode && r.rawOptions.ignoreBracketedPasteMode !== !0), n.triggerDataEvent(e, !0), t.value = "";
}
function je(e, t, n) {
	let r = n.getBoundingClientRect(), i = e.clientX - r.left - 10, a = e.clientY - r.top - 10;
	t.style.width = "20px", t.style.height = "20px", t.style.left = `${i}px`, t.style.top = `${a}px`, t.style.zIndex = "1000", t.focus();
}
function Me(e, t, n, r, i) {
	je(e, t, n), i && r.rightClickSelect(e), t.value = r.selectionText, t.select();
}
function Ne(e) {
	return e > 65535 ? (e -= 65536, String.fromCharCode((e >> 10) + 55296) + String.fromCharCode(e % 1024 + 56320)) : String.fromCharCode(e);
}
function Pe(e, t = 0, n = e.length) {
	let r = "";
	for (let i = t; i < n; ++i) {
		let t = e[i];
		t > 65535 ? (t -= 65536, r += String.fromCharCode((t >> 10) + 55296) + String.fromCharCode(t % 1024 + 56320)) : r += String.fromCharCode(t);
	}
	return r;
}
var Fe = class {
	constructor() {
		this._interim = 0;
	}
	clear() {
		this._interim = 0;
	}
	decode(e, t) {
		let n = e.length;
		if (!n) return 0;
		let r = 0, i = 0;
		if (this._interim) {
			let n = e.charCodeAt(i++);
			56320 <= n && n <= 57343 ? t[r++] = (this._interim - 55296) * 1024 + n - 56320 + 65536 : (t[r++] = this._interim, t[r++] = n), this._interim = 0;
		}
		for (let a = i; a < n; ++a) {
			let i = e.charCodeAt(a);
			if (55296 <= i && i <= 56319) {
				if (++a >= n) return this._interim = i, r;
				let o = e.charCodeAt(a);
				56320 <= o && o <= 57343 ? t[r++] = (i - 55296) * 1024 + o - 56320 + 65536 : (t[r++] = i, t[r++] = o);
			} else i !== 65279 && (t[r++] = i);
		}
		return r;
	}
}, Ie = class {
	constructor() {
		this.interim = /* @__PURE__ */ new Uint8Array(3);
	}
	clear() {
		this.interim.fill(0);
	}
	decode(e, t) {
		let n = e.length;
		if (!n) return 0;
		let r = 0, i, a, o, s, c = 0, l = 0;
		if (this.interim[0]) {
			let i = !1, a = this.interim[0];
			a &= (a & 224) == 192 ? 31 : (a & 240) == 224 ? 15 : 7;
			let o = 0, s;
			for (; (s = this.interim[++o] & 63) && o < 4;) a <<= 6, a |= s;
			let c = (this.interim[0] & 224) == 192 ? 2 : (this.interim[0] & 240) == 224 ? 3 : 4, u = c - o;
			for (; l < u;) {
				if (l >= n) return 0;
				if (s = e[l++], (s & 192) != 128) {
					l--, i = !0;
					break;
				}
				this.interim[o++] = s, a <<= 6, a |= s & 63;
			}
			i || (c === 2 ? a < 128 ? l-- : t[r++] = a : c === 3 ? a < 2048 || a >= 55296 && a <= 57343 || a === 65279 || (t[r++] = a) : a < 65536 || a > 1114111 || (t[r++] = a)), this.interim.fill(0);
		}
		let u = n - 4, d = l;
		for (; d < n;) {
			for (; d < u && !((i = e[d]) & 128) && !((a = e[d + 1]) & 128) && !((o = e[d + 2]) & 128) && !((s = e[d + 3]) & 128);) t[r++] = i, t[r++] = a, t[r++] = o, t[r++] = s, d += 4;
			if (i = e[d++], i < 128) t[r++] = i;
			else if ((i & 224) == 192) {
				if (d >= n) return this.interim[0] = i, r;
				if (a = e[d++], (a & 192) != 128 || (c = (i & 31) << 6 | a & 63, c < 128)) {
					d--;
					continue;
				}
				t[r++] = c;
			} else if ((i & 240) == 224) {
				if (d >= n) return this.interim[0] = i, r;
				if (a = e[d++], (a & 192) != 128) {
					d--;
					continue;
				}
				if (d >= n) return this.interim[0] = i, this.interim[1] = a, r;
				if (o = e[d++], (o & 192) != 128) {
					d--;
					continue;
				}
				if (c = (i & 15) << 12 | (a & 63) << 6 | o & 63, c < 2048 || c >= 55296 && c <= 57343 || c === 65279) continue;
				t[r++] = c;
			} else if ((i & 248) == 240) {
				if (d >= n) return this.interim[0] = i, r;
				if (a = e[d++], (a & 192) != 128) {
					d--;
					continue;
				}
				if (d >= n) return this.interim[0] = i, this.interim[1] = a, r;
				if (o = e[d++], (o & 192) != 128) {
					d--;
					continue;
				}
				if (d >= n) return this.interim[0] = i, this.interim[1] = a, this.interim[2] = o, r;
				if (s = e[d++], (s & 192) != 128) {
					d--;
					continue;
				}
				if (c = (i & 7) << 18 | (a & 63) << 12 | (o & 63) << 6 | s & 63, c < 65536 || c > 1114111) continue;
				t[r++] = c;
			}
		}
		return r;
	}
}, Le = "", Re = " ", ze = class e {
	constructor() {
		this.fg = 0, this.bg = 0, this.extended = new Be();
	}
	static toColorRGB(e) {
		return [
			e >>> 16 & 255,
			e >>> 8 & 255,
			e & 255
		];
	}
	static fromColorRGB(e) {
		return (e[0] & 255) << 16 | (e[1] & 255) << 8 | e[2] & 255;
	}
	clone() {
		let t = new e();
		return t.fg = this.fg, t.bg = this.bg, t.extended = this.extended.clone(), t;
	}
	isInverse() {
		return this.fg & 67108864;
	}
	isBold() {
		return this.fg & 134217728;
	}
	isUnderline() {
		return this.hasExtendedAttrs() && this.extended.underlineStyle !== 0 ? 1 : this.fg & 268435456;
	}
	isBlink() {
		return this.fg & 536870912;
	}
	isInvisible() {
		return this.fg & 1073741824;
	}
	isItalic() {
		return this.bg & 67108864;
	}
	isDim() {
		return this.bg & 134217728;
	}
	isStrikethrough() {
		return this.fg & 2147483648;
	}
	isProtected() {
		return this.bg & 536870912;
	}
	isOverline() {
		return this.bg & 1073741824;
	}
	getFgColorMode() {
		return this.fg & 50331648;
	}
	getBgColorMode() {
		return this.bg & 50331648;
	}
	isFgRGB() {
		return (this.fg & 50331648) == 50331648;
	}
	isBgRGB() {
		return (this.bg & 50331648) == 50331648;
	}
	isFgPalette() {
		return (this.fg & 50331648) == 16777216 || (this.fg & 50331648) == 33554432;
	}
	isBgPalette() {
		return (this.bg & 50331648) == 16777216 || (this.bg & 50331648) == 33554432;
	}
	isFgDefault() {
		return !(this.fg & 50331648);
	}
	isBgDefault() {
		return !(this.bg & 50331648);
	}
	isAttributeDefault() {
		return this.fg === 0 && this.bg === 0;
	}
	getFgColor() {
		switch (this.fg & 50331648) {
			case 16777216:
			case 33554432: return this.fg & 255;
			case 50331648: return this.fg & 16777215;
			default: return -1;
		}
	}
	getBgColor() {
		switch (this.bg & 50331648) {
			case 16777216:
			case 33554432: return this.bg & 255;
			case 50331648: return this.bg & 16777215;
			default: return -1;
		}
	}
	hasExtendedAttrs() {
		return this.bg & 268435456;
	}
	updateExtended() {
		this.extended.isEmpty() ? this.bg &= -268435457 : this.bg |= 268435456;
	}
	getUnderlineColor() {
		if (this.bg & 268435456 && ~this.extended.underlineColor) switch (this.extended.underlineColor & 50331648) {
			case 16777216:
			case 33554432: return this.extended.underlineColor & 255;
			case 50331648: return this.extended.underlineColor & 16777215;
			default: return this.getFgColor();
		}
		return this.getFgColor();
	}
	getUnderlineColorMode() {
		return this.bg & 268435456 && ~this.extended.underlineColor ? this.extended.underlineColor & 50331648 : this.getFgColorMode();
	}
	isUnderlineColorRGB() {
		return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) == 50331648 : this.isFgRGB();
	}
	isUnderlineColorPalette() {
		return this.bg & 268435456 && ~this.extended.underlineColor ? (this.extended.underlineColor & 50331648) == 16777216 || (this.extended.underlineColor & 50331648) == 33554432 : this.isFgPalette();
	}
	isUnderlineColorDefault() {
		return this.bg & 268435456 && ~this.extended.underlineColor ? !(this.extended.underlineColor & 50331648) : this.isFgDefault();
	}
	getUnderlineStyle() {
		return this.fg & 268435456 ? this.bg & 268435456 ? this.extended.underlineStyle : 1 : 0;
	}
	getUnderlineVariantOffset() {
		return this.extended.underlineVariantOffset;
	}
}, Be = class e {
	constructor(e = 0, t = 0) {
		this._ext = 0, this._urlId = 0, this._ext = e, this._urlId = t;
	}
	get ext() {
		return this._urlId ? this._ext & -469762049 | this.underlineStyle << 26 : this._ext;
	}
	set ext(e) {
		this._ext = e;
	}
	get underlineStyle() {
		return this._urlId ? 5 : (this._ext & 469762048) >> 26;
	}
	set underlineStyle(e) {
		this._ext &= -469762049, this._ext |= e << 26 & 469762048;
	}
	get underlineColor() {
		return this._ext & 67108863;
	}
	set underlineColor(e) {
		this._ext &= -67108864, this._ext |= e & 67108863;
	}
	get urlId() {
		return this._urlId;
	}
	set urlId(e) {
		this._urlId = e;
	}
	get underlineVariantOffset() {
		let e = (this._ext & 3758096384) >> 29;
		return e < 0 ? e ^ 4294967288 : e;
	}
	set underlineVariantOffset(e) {
		this._ext &= 536870911, this._ext |= e << 29 & 3758096384;
	}
	clone() {
		return new e(this._ext, this._urlId);
	}
	isEmpty() {
		return this.underlineStyle === 0 && this._urlId === 0;
	}
}, Ve = class e extends ze {
	constructor() {
		super(...arguments), this.content = 0, this.fg = 0, this.bg = 0, this.extended = new Be(), this.combinedData = "";
	}
	static fromCharData(t) {
		let n = new e();
		return n.setFromCharData(t), n;
	}
	isCombined() {
		return this.content & 2097152;
	}
	getWidth() {
		return this.content >> 22;
	}
	getChars() {
		return this.content & 2097152 ? this.combinedData : this.content & 2097151 ? Ne(this.content & 2097151) : "";
	}
	getCode() {
		return this.isCombined() ? this.combinedData.charCodeAt(this.combinedData.length - 1) : this.content & 2097151;
	}
	setFromCharData(e) {
		this.fg = e[0], this.bg = 0;
		let t = !1;
		if (e[1].length > 2) t = !0;
		else if (e[1].length === 2) {
			let n = e[1].charCodeAt(0);
			if (55296 <= n && n <= 56319) {
				let r = e[1].charCodeAt(1);
				56320 <= r && r <= 57343 ? this.content = (n - 55296) * 1024 + r - 56320 + 65536 | e[2] << 22 : t = !0;
			} else t = !0;
		} else this.content = e[1].charCodeAt(0) | e[2] << 22;
		t && (this.combinedData = e[1], this.content = 2097152 | e[2] << 22);
	}
	getAsCharData() {
		return [
			this.fg,
			this.getChars(),
			this.getWidth(),
			this.getCode()
		];
	}
}, He = "di$target", Ue = "di$dependencies", We = /* @__PURE__ */ new Map();
function Ge(e) {
	return e[Ue] || [];
}
function E(e) {
	if (We.has(e)) return We.get(e);
	let t = function(e, n, r) {
		if (arguments.length !== 3) throw Error("@IServiceName-decorator can only be used to decorate a parameter");
		Ke(t, e, r);
	};
	return t._id = e, We.set(e, t), t;
}
function Ke(e, t, n) {
	t[He] === t ? t[Ue].push({
		id: e,
		index: n
	}) : (t[Ue] = [{
		id: e,
		index: n
	}], t[He] = t);
}
var qe = E("BufferService"), Je = E("CoreMouseService"), Ye = E("CoreService"), Xe = E("CharsetService"), Ze = E("InstantiationService"), Qe = E("LogService"), $e = E("OptionsService"), et = E("OscLinkService"), tt = E("UnicodeService"), nt = E("DecorationService"), rt = class {
	constructor(e, t, n) {
		this._bufferService = e, this._optionsService = t, this._oscLinkService = n;
	}
	provideLinks(e, t) {
		let n = this._bufferService.buffer.lines.get(e - 1);
		if (!n) {
			t(void 0);
			return;
		}
		let r = [], i = this._optionsService.rawOptions.linkHandler, a = new Ve(), o = n.getTrimmedLength(), s = -1, c = -1, l = !1;
		for (let t = 0; t < o; t++) if (c !== -1 || n.hasContent(t)) {
			if (n.loadCell(t, a), a.hasExtendedAttrs() && a.extended.urlId) {
				if (c === -1) {
					c = t, s = a.extended.urlId;
					continue;
				}
				l = a.extended.urlId !== s;
			} else c !== -1 && (l = !0);
			if (l || c !== -1 && t === o - 1) {
				let n = this._oscLinkService.getLinkData(s)?.uri;
				if (n) {
					let a = {
						start: {
							x: c + 1,
							y: e
						},
						end: {
							x: t + +(!l && t === o - 1),
							y: e
						}
					}, s = !1;
					if (!i?.allowNonHttpProtocols) try {
						let e = new URL(n);
						["http:", "https:"].includes(e.protocol) || (s = !0);
					} catch {
						s = !0;
					}
					s || r.push({
						text: n,
						range: a,
						activate: (e, t) => i ? i.activate(e, t, a) : it(e, t),
						hover: (e, t) => i?.hover?.(e, t, a),
						leave: (e, t) => i?.leave?.(e, t, a)
					});
				}
				l = !1, a.hasExtendedAttrs() && a.extended.urlId ? (c = t, s = a.extended.urlId) : (c = -1, s = -1);
			}
		}
		t(r);
	}
};
rt = w([
	T(0, qe),
	T(1, $e),
	T(2, et)
], rt);
function it(e, t) {
	if (confirm(`Do you want to navigate to ${t}?

WARNING: This link could potentially be dangerous`)) {
		let e = window.open();
		if (e) {
			try {
				e.opener = null;
			} catch {}
			e.location.href = t;
		} else console.warn("Opening link blocked as opener could not be cleared");
	}
}
var at = E("CharSizeService"), ot = E("CoreBrowserService"), st = E("MouseService"), ct = E("RenderService"), lt = E("SelectionService"), ut = E("CharacterJoinerService"), dt = E("ThemeService"), ft = E("LinkProviderService"), pt = new class {
	constructor() {
		this.listeners = [], this.unexpectedErrorHandler = function(e) {
			setTimeout(() => {
				throw e.stack ? yt.isErrorNoTelemetry(e) ? new yt(e.message + "\n\n" + e.stack) : /* @__PURE__ */ Error(e.message + "\n\n" + e.stack) : e;
			}, 0);
		};
	}
	addListener(e) {
		return this.listeners.push(e), () => {
			this._removeListener(e);
		};
	}
	emit(e) {
		this.listeners.forEach((t) => {
			t(e);
		});
	}
	_removeListener(e) {
		this.listeners.splice(this.listeners.indexOf(e), 1);
	}
	setUnexpectedErrorHandler(e) {
		this.unexpectedErrorHandler = e;
	}
	getUnexpectedErrorHandler() {
		return this.unexpectedErrorHandler;
	}
	onUnexpectedError(e) {
		this.unexpectedErrorHandler(e), this.emit(e);
	}
	onUnexpectedExternalError(e) {
		this.unexpectedErrorHandler(e);
	}
}();
function mt(e) {
	gt(e) || pt.onUnexpectedError(e);
}
var ht = "Canceled";
function gt(e) {
	return e instanceof _t || e instanceof Error && e.name === ht && e.message === ht;
}
var _t = class extends Error {
	constructor() {
		super(ht), this.name = this.message;
	}
};
function vt(e) {
	return Error(e ? `Illegal argument: ${e}` : "Illegal argument");
}
var yt = class e extends Error {
	constructor(e) {
		super(e), this.name = "CodeExpectedError";
	}
	static fromError(t) {
		if (t instanceof e) return t;
		let n = new e();
		return n.message = t.message, n.stack = t.stack, n;
	}
	static isErrorNoTelemetry(e) {
		return e.name === "CodeExpectedError";
	}
}, bt = class e extends Error {
	constructor(t) {
		super(t || "An unexpected bug occurred."), Object.setPrototypeOf(this, e.prototype);
	}
};
function xt(e, t = 0) {
	return e[e.length - (1 + t)];
}
var St;
((e) => {
	function t(e) {
		return e < 0;
	}
	e.isLessThan = t;
	function n(e) {
		return e <= 0;
	}
	e.isLessThanOrEqual = n;
	function r(e) {
		return e > 0;
	}
	e.isGreaterThan = r;
	function i(e) {
		return e === 0;
	}
	e.isNeitherLessOrGreaterThan = i, e.greaterThan = 1, e.lessThan = -1, e.neitherLessOrGreaterThan = 0;
})(St ||= {});
var Ct = class e {
	constructor(e) {
		this.iterate = e;
	}
	forEach(e) {
		this.iterate((t) => (e(t), !0));
	}
	toArray() {
		let e = [];
		return this.iterate((t) => (e.push(t), !0)), e;
	}
	filter(t) {
		return new e((e) => this.iterate((n) => !t(n) || e(n)));
	}
	map(t) {
		return new e((e) => this.iterate((n) => e(t(n))));
	}
	some(e) {
		let t = !1;
		return this.iterate((n) => (t = e(n), !t)), t;
	}
	findFirst(e) {
		let t;
		return this.iterate((n) => !e(n) || (t = n, !1)), t;
	}
	findLast(e) {
		let t;
		return this.iterate((n) => (e(n) && (t = n), !0)), t;
	}
	findLastMaxBy(e) {
		let t, n = !0;
		return this.iterate((r) => ((n || St.isGreaterThan(e(r, t))) && (n = !1, t = r), !0)), t;
	}
};
Ct.empty = new Ct((e) => {});
function wt(e, t) {
	let n = this, r = !1, i;
	return function() {
		if (r) return i;
		if (r = !0, t) try {
			i = e.apply(n, arguments);
		} finally {
			t();
		}
		else i = e.apply(n, arguments);
		return i;
	};
}
var Tt;
((e) => {
	function t(e) {
		return e && typeof e == "object" && typeof e[Symbol.iterator] == "function";
	}
	e.is = t;
	let n = Object.freeze([]);
	function r() {
		return n;
	}
	e.empty = r;
	function* i(e) {
		yield e;
	}
	e.single = i;
	function a(e) {
		return t(e) ? e : i(e);
	}
	e.wrap = a;
	function o(e) {
		return e || n;
	}
	e.from = o;
	function* s(e) {
		for (let t = e.length - 1; t >= 0; t--) yield e[t];
	}
	e.reverse = s;
	function c(e) {
		return !e || e[Symbol.iterator]().next().done === !0;
	}
	e.isEmpty = c;
	function l(e) {
		return e[Symbol.iterator]().next().value;
	}
	e.first = l;
	function u(e, t) {
		let n = 0;
		for (let r of e) if (t(r, n++)) return !0;
		return !1;
	}
	e.some = u;
	function d(e, t) {
		for (let n of e) if (t(n)) return n;
	}
	e.find = d;
	function* f(e, t) {
		for (let n of e) t(n) && (yield n);
	}
	e.filter = f;
	function* p(e, t) {
		let n = 0;
		for (let r of e) yield t(r, n++);
	}
	e.map = p;
	function* m(e, t) {
		let n = 0;
		for (let r of e) yield* t(r, n++);
	}
	e.flatMap = m;
	function* h(...e) {
		for (let t of e) yield* t;
	}
	e.concat = h;
	function g(e, t, n) {
		let r = n;
		for (let n of e) r = t(r, n);
		return r;
	}
	e.reduce = g;
	function* _(e, t, n = e.length) {
		for (t < 0 && (t += e.length), n < 0 ? n += e.length : n > e.length && (n = e.length); t < n; t++) yield e[t];
	}
	e.slice = _;
	function v(t, n = Infinity) {
		let r = [];
		if (n === 0) return [r, t];
		let i = t[Symbol.iterator]();
		for (let t = 0; t < n; t++) {
			let t = i.next();
			if (t.done) return [r, e.empty()];
			r.push(t.value);
		}
		return [r, { [Symbol.iterator]() {
			return i;
		} }];
	}
	e.consume = v;
	async function ee(e) {
		let t = [];
		for await (let n of e) t.push(n);
		return Promise.resolve(t);
	}
	e.asyncToArray = ee;
})(Tt ||= {});
var Et = null;
function Dt(e) {
	return Et?.trackDisposable(e), e;
}
function Ot(e) {
	Et?.markAsDisposed(e);
}
function kt(e, t) {
	Et?.setParent(e, t);
}
function At(e) {
	return Et?.markAsSingleton(e), e;
}
function jt(e) {
	if (Tt.is(e)) {
		let t = [];
		for (let n of e) if (n) try {
			n.dispose();
		} catch (e) {
			t.push(e);
		}
		if (t.length === 1) throw t[0];
		if (t.length > 1) throw AggregateError(t, "Encountered errors while disposing of store");
		return Array.isArray(e) ? [] : e;
	}
	if (e) return e.dispose(), e;
}
function Mt(...e) {
	return D(() => jt(e));
}
function D(e) {
	let t = Dt({ dispose: wt(() => {
		Ot(t), e();
	}) });
	return t;
}
var Nt = class e {
	constructor() {
		this._toDispose = /* @__PURE__ */ new Set(), this._isDisposed = !1, Dt(this);
	}
	dispose() {
		this._isDisposed || (Ot(this), this._isDisposed = !0, this.clear());
	}
	get isDisposed() {
		return this._isDisposed;
	}
	clear() {
		if (this._toDispose.size !== 0) try {
			jt(this._toDispose);
		} finally {
			this._toDispose.clear();
		}
	}
	add(t) {
		if (!t) return t;
		if (t === this) throw Error("Cannot register a disposable on itself!");
		return kt(t, this), this._isDisposed ? e.DISABLE_DISPOSED_WARNING || console.warn((/* @__PURE__ */ Error("Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!")).stack) : this._toDispose.add(t), t;
	}
	delete(e) {
		if (e) {
			if (e === this) throw Error("Cannot dispose a disposable on itself!");
			this._toDispose.delete(e), e.dispose();
		}
	}
	deleteAndLeak(e) {
		e && this._toDispose.has(e) && (this._toDispose.delete(e), kt(e, null));
	}
};
Nt.DISABLE_DISPOSED_WARNING = !1;
var Pt = Nt, O = class {
	constructor() {
		this._store = new Pt(), Dt(this), kt(this._store, this);
	}
	dispose() {
		Ot(this), this._store.dispose();
	}
	_register(e) {
		if (e === this) throw Error("Cannot register a disposable on itself!");
		return this._store.add(e);
	}
};
O.None = Object.freeze({ dispose() {} });
var Ft = class {
	constructor() {
		this._isDisposed = !1, Dt(this);
	}
	get value() {
		return this._isDisposed ? void 0 : this._value;
	}
	set value(e) {
		this._isDisposed || e === this._value || (this._value?.dispose(), e && kt(e, this), this._value = e);
	}
	clear() {
		this.value = void 0;
	}
	dispose() {
		this._isDisposed = !0, Ot(this), this._value?.dispose(), this._value = void 0;
	}
	clearAndLeak() {
		let e = this._value;
		return this._value = void 0, e && kt(e, null), e;
	}
}, It = typeof window == "object" ? window : globalThis, Lt = class e {
	constructor(t) {
		this.element = t, this.next = e.Undefined, this.prev = e.Undefined;
	}
};
Lt.Undefined = new Lt(void 0);
var k = Lt, Rt = class {
	constructor() {
		this._first = k.Undefined, this._last = k.Undefined, this._size = 0;
	}
	get size() {
		return this._size;
	}
	isEmpty() {
		return this._first === k.Undefined;
	}
	clear() {
		let e = this._first;
		for (; e !== k.Undefined;) {
			let t = e.next;
			e.prev = k.Undefined, e.next = k.Undefined, e = t;
		}
		this._first = k.Undefined, this._last = k.Undefined, this._size = 0;
	}
	unshift(e) {
		return this._insert(e, !1);
	}
	push(e) {
		return this._insert(e, !0);
	}
	_insert(e, t) {
		let n = new k(e);
		if (this._first === k.Undefined) this._first = n, this._last = n;
		else if (t) {
			let e = this._last;
			this._last = n, n.prev = e, e.next = n;
		} else {
			let e = this._first;
			this._first = n, n.next = e, e.prev = n;
		}
		this._size += 1;
		let r = !1;
		return () => {
			r || (r = !0, this._remove(n));
		};
	}
	shift() {
		if (this._first !== k.Undefined) {
			let e = this._first.element;
			return this._remove(this._first), e;
		}
	}
	pop() {
		if (this._last !== k.Undefined) {
			let e = this._last.element;
			return this._remove(this._last), e;
		}
	}
	_remove(e) {
		if (e.prev !== k.Undefined && e.next !== k.Undefined) {
			let t = e.prev;
			t.next = e.next, e.next.prev = t;
		} else e.prev === k.Undefined && e.next === k.Undefined ? (this._first = k.Undefined, this._last = k.Undefined) : e.next === k.Undefined ? (this._last = this._last.prev, this._last.next = k.Undefined) : e.prev === k.Undefined && (this._first = this._first.next, this._first.prev = k.Undefined);
		--this._size;
	}
	*[Symbol.iterator]() {
		let e = this._first;
		for (; e !== k.Undefined;) yield e.element, e = e.next;
	}
}, zt = globalThis.performance && typeof globalThis.performance.now == "function", Bt = class e {
	static create(t) {
		return new e(t);
	}
	constructor(e) {
		this._now = zt && e === !1 ? Date.now : globalThis.performance.now.bind(globalThis.performance), this._startTime = this._now(), this._stopTime = -1;
	}
	stop() {
		this._stopTime = this._now();
	}
	reset() {
		this._startTime = this._now(), this._stopTime = -1;
	}
	elapsed() {
		return this._stopTime === -1 ? this._now() - this._startTime : this._stopTime - this._startTime;
	}
}, Vt;
((e) => {
	e.None = () => O.None;
	function t(e, t) {
		return d(e, () => {}, 0, void 0, !0, void 0, t);
	}
	e.defer = t;
	function n(e) {
		return (t, n = null, r) => {
			let i = !1, a;
			return a = e((e) => {
				if (!i) return a ? a.dispose() : i = !0, t.call(n, e);
			}, null, r), i && a.dispose(), a;
		};
	}
	e.once = n;
	function r(e, t, n) {
		return l((n, r = null, i) => e((e) => n.call(r, t(e)), null, i), n);
	}
	e.map = r;
	function i(e, t, n) {
		return l((n, r = null, i) => e((e) => {
			t(e), n.call(r, e);
		}, null, i), n);
	}
	e.forEach = i;
	function a(e, t, n) {
		return l((n, r = null, i) => e((e) => t(e) && n.call(r, e), null, i), n);
	}
	e.filter = a;
	function o(e) {
		return e;
	}
	e.signal = o;
	function s(...e) {
		return (t, n = null, r) => u(Mt(...e.map((e) => e((e) => t.call(n, e)))), r);
	}
	e.any = s;
	function c(e, t, n, i) {
		let a = n;
		return r(e, (e) => (a = t(a, e), a), i);
	}
	e.reduce = c;
	function l(e, t) {
		let n, r = new A({
			onWillAddFirstListener() {
				n = e(r.fire, r);
			},
			onDidRemoveLastListener() {
				n?.dispose();
			}
		});
		return t?.add(r), r.event;
	}
	function u(e, t) {
		return t instanceof Array ? t.push(e) : t && t.add(e), e;
	}
	function d(e, t, n = 100, r = !1, i = !1, a, o) {
		let s, c, l, u = 0, d, f = new A({
			leakWarningThreshold: a,
			onWillAddFirstListener() {
				s = e((e) => {
					u++, c = t(c, e), r && !l && (f.fire(c), c = void 0), d = () => {
						let e = c;
						c = void 0, l = void 0, (!r || u > 1) && f.fire(e), u = 0;
					}, typeof n == "number" ? (clearTimeout(l), l = setTimeout(d, n)) : l === void 0 && (l = 0, queueMicrotask(d));
				});
			},
			onWillRemoveListener() {
				i && u > 0 && d?.();
			},
			onDidRemoveLastListener() {
				d = void 0, s.dispose();
			}
		});
		return o?.add(f), f.event;
	}
	e.debounce = d;
	function f(t, n = 0, r) {
		return e.debounce(t, (e, t) => e ? (e.push(t), e) : [t], n, void 0, !0, void 0, r);
	}
	e.accumulate = f;
	function p(e, t = (e, t) => e === t, n) {
		let r = !0, i;
		return a(e, (e) => {
			let n = r || !t(e, i);
			return r = !1, i = e, n;
		}, n);
	}
	e.latch = p;
	function m(t, n, r) {
		return [e.filter(t, n, r), e.filter(t, (e) => !n(e), r)];
	}
	e.split = m;
	function h(e, t = !1, n = [], r) {
		let i = n.slice(), a = e((e) => {
			i ? i.push(e) : s.fire(e);
		});
		r && r.add(a);
		let o = () => {
			i?.forEach((e) => s.fire(e)), i = null;
		}, s = new A({
			onWillAddFirstListener() {
				a || (a = e((e) => s.fire(e)), r && r.add(a));
			},
			onDidAddFirstListener() {
				i && (t ? setTimeout(o) : o());
			},
			onDidRemoveLastListener() {
				a && a.dispose(), a = null;
			}
		});
		return r && r.add(s), s.event;
	}
	e.buffer = h;
	function g(e, t) {
		return (n, r, i) => {
			let a = t(new v());
			return e(function(e) {
				let t = a.evaluate(e);
				t !== _ && n.call(r, t);
			}, void 0, i);
		};
	}
	e.chain = g;
	let _ = Symbol("HaltChainable");
	class v {
		constructor() {
			this.steps = [];
		}
		map(e) {
			return this.steps.push(e), this;
		}
		forEach(e) {
			return this.steps.push((t) => (e(t), t)), this;
		}
		filter(e) {
			return this.steps.push((t) => e(t) ? t : _), this;
		}
		reduce(e, t) {
			let n = t;
			return this.steps.push((t) => (n = e(n, t), n)), this;
		}
		latch(e = (e, t) => e === t) {
			let t = !0, n;
			return this.steps.push((r) => {
				let i = t || !e(r, n);
				return t = !1, n = r, i ? r : _;
			}), this;
		}
		evaluate(e) {
			for (let t of this.steps) if (e = t(e), e === _) break;
			return e;
		}
	}
	function ee(e, t, n = (e) => e) {
		let r = (...e) => i.fire(n(...e)), i = new A({
			onWillAddFirstListener: () => e.on(t, r),
			onDidRemoveLastListener: () => e.removeListener(t, r)
		});
		return i.event;
	}
	e.fromNodeEventEmitter = ee;
	function te(e, t, n = (e) => e) {
		let r = (...e) => i.fire(n(...e)), i = new A({
			onWillAddFirstListener: () => e.addEventListener(t, r),
			onDidRemoveLastListener: () => e.removeEventListener(t, r)
		});
		return i.event;
	}
	e.fromDOMEventEmitter = te;
	function y(e) {
		return new Promise((t) => n(e)(t));
	}
	e.toPromise = y;
	function ne(e) {
		let t = new A();
		return e.then((e) => {
			t.fire(e);
		}, () => {
			t.fire(void 0);
		}).finally(() => {
			t.dispose();
		}), t.event;
	}
	e.fromPromise = ne;
	function re(e, t) {
		return e((e) => t.fire(e));
	}
	e.forward = re;
	function ie(e, t, n) {
		return t(n), e((e) => t(e));
	}
	e.runAndSubscribe = ie;
	class ae {
		constructor(e, t) {
			this._observable = e, this._counter = 0, this._hasChanged = !1;
			let n = {
				onWillAddFirstListener: () => {
					e.addObserver(this);
				},
				onDidRemoveLastListener: () => {
					e.removeObserver(this);
				}
			};
			this.emitter = new A(n), t && t.add(this.emitter);
		}
		beginUpdate(e) {
			this._counter++;
		}
		handlePossibleChange(e) {}
		handleChange(e, t) {
			this._hasChanged = !0;
		}
		endUpdate(e) {
			this._counter--, this._counter === 0 && (this._observable.reportChanges(), this._hasChanged && (this._hasChanged = !1, this.emitter.fire(this._observable.get())));
		}
	}
	function oe(e, t) {
		return new ae(e, t).emitter.event;
	}
	e.fromObservable = oe;
	function b(e) {
		return (t, n, r) => {
			let i = 0, a = !1, o = {
				beginUpdate() {
					i++;
				},
				endUpdate() {
					i--, i === 0 && (e.reportChanges(), a && (a = !1, t.call(n)));
				},
				handlePossibleChange() {},
				handleChange() {
					a = !0;
				}
			};
			e.addObserver(o), e.reportChanges();
			let s = { dispose() {
				e.removeObserver(o);
			} };
			return r instanceof Pt ? r.add(s) : Array.isArray(r) && r.push(s), s;
		};
	}
	e.fromObservableLight = b;
})(Vt ||= {});
var Ht = class e {
	constructor(t) {
		this.listenerCount = 0, this.invocationCount = 0, this.elapsedOverall = 0, this.durations = [], this.name = `${t}_${e._idPool++}`, e.all.add(this);
	}
	start(e) {
		this._stopWatch = new Bt(), this.listenerCount = e;
	}
	stop() {
		if (this._stopWatch) {
			let e = this._stopWatch.elapsed();
			this.durations.push(e), this.elapsedOverall += e, this.invocationCount += 1, this._stopWatch = void 0;
		}
	}
};
Ht.all = /* @__PURE__ */ new Set(), Ht._idPool = 0;
var Ut = Ht, Wt = -1, Gt = class e {
	constructor(t, n, r = (e._idPool++).toString(16).padStart(3, "0")) {
		this._errorHandler = t, this.threshold = n, this.name = r, this._warnCountdown = 0;
	}
	dispose() {
		this._stacks?.clear();
	}
	check(e, t) {
		let n = this.threshold;
		if (n <= 0 || t < n) return;
		this._stacks ||= /* @__PURE__ */ new Map();
		let r = this._stacks.get(e.value) || 0;
		if (this._stacks.set(e.value, r + 1), --this._warnCountdown, this._warnCountdown <= 0) {
			this._warnCountdown = n * .5;
			let [e, r] = this.getMostFrequentStack(), i = `[${this.name}] potential listener LEAK detected, having ${t} listeners already. MOST frequent listener (${r}):`;
			console.warn(i), console.warn(e);
			let a = new Jt(i, e);
			this._errorHandler(a);
		}
		return () => {
			let t = this._stacks.get(e.value) || 0;
			this._stacks.set(e.value, t - 1);
		};
	}
	getMostFrequentStack() {
		if (!this._stacks) return;
		let e, t = 0;
		for (let [n, r] of this._stacks) (!e || t < r) && (e = [n, r], t = r);
		return e;
	}
};
Gt._idPool = 1;
var Kt = Gt, qt = class e {
	constructor(e) {
		this.value = e;
	}
	static create() {
		return new e((/* @__PURE__ */ Error()).stack ?? "");
	}
	print() {
		console.warn(this.value.split("\n").slice(2).join("\n"));
	}
}, Jt = class extends Error {
	constructor(e, t) {
		super(e), this.name = "ListenerLeakError", this.stack = t;
	}
}, Yt = class extends Error {
	constructor(e, t) {
		super(e), this.name = "ListenerRefusalError", this.stack = t;
	}
}, Xt = 0, Zt = class {
	constructor(e) {
		this.value = e, this.id = Xt++;
	}
}, Qt = 2, A = class {
	constructor(e) {
		this._size = 0, this._options = e, this._leakageMon = Wt > 0 || this._options?.leakWarningThreshold ? new Kt(e?.onListenerError ?? mt, this._options?.leakWarningThreshold ?? Wt) : void 0, this._perfMon = this._options?._profName ? new Ut(this._options._profName) : void 0, this._deliveryQueue = this._options?.deliveryQueue;
	}
	dispose() {
		this._disposed || (this._disposed = !0, this._deliveryQueue?.current === this && this._deliveryQueue.reset(), this._listeners && (this._listeners = void 0, this._size = 0), this._options?.onDidRemoveLastListener?.(), this._leakageMon?.dispose());
	}
	get event() {
		return this._event ??= (e, t, n) => {
			if (this._leakageMon && this._size > this._leakageMon.threshold ** 2) {
				let e = `[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far (${this._size} vs ${this._leakageMon.threshold})`;
				console.warn(e);
				let t = this._leakageMon.getMostFrequentStack() ?? ["UNKNOWN stack", -1], n = new Yt(`${e}. HINT: Stack shows most frequent listener (${t[1]}-times)`, t[0]);
				return (this._options?.onListenerError || mt)(n), O.None;
			}
			if (this._disposed) return O.None;
			t && (e = e.bind(t));
			let r = new Zt(e), i;
			this._leakageMon && this._size >= Math.ceil(this._leakageMon.threshold * .2) && (r.stack = qt.create(), i = this._leakageMon.check(r.stack, this._size + 1)), this._listeners ? this._listeners instanceof Zt ? (this._deliveryQueue ??= new $t(), this._listeners = [this._listeners, r]) : this._listeners.push(r) : (this._options?.onWillAddFirstListener?.(this), this._listeners = r, this._options?.onDidAddFirstListener?.(this)), this._size++;
			let a = D(() => {
				i?.(), this._removeListener(r);
			});
			return n instanceof Pt ? n.add(a) : Array.isArray(n) && n.push(a), a;
		}, this._event;
	}
	_removeListener(e) {
		if (this._options?.onWillRemoveListener?.(this), !this._listeners) return;
		if (this._size === 1) {
			this._listeners = void 0, this._options?.onDidRemoveLastListener?.(this), this._size = 0;
			return;
		}
		let t = this._listeners, n = t.indexOf(e);
		if (n === -1) throw console.log("disposed?", this._disposed), console.log("size?", this._size), console.log("arr?", JSON.stringify(this._listeners)), /* @__PURE__ */ Error("Attempted to dispose unknown listener");
		this._size--, t[n] = void 0;
		let r = this._deliveryQueue.current === this;
		if (this._size * Qt <= t.length) {
			let e = 0;
			for (let n = 0; n < t.length; n++) t[n] ? t[e++] = t[n] : r && (this._deliveryQueue.end--, e < this._deliveryQueue.i && this._deliveryQueue.i--);
			t.length = e;
		}
	}
	_deliver(e, t) {
		if (!e) return;
		let n = this._options?.onListenerError || mt;
		if (!n) e.value(t);
		else try {
			e.value(t);
		} catch (e) {
			n(e);
		}
	}
	_deliverQueue(e) {
		let t = e.current._listeners;
		for (; e.i < e.end;) this._deliver(t[e.i++], e.value);
		e.reset();
	}
	fire(e) {
		if (this._deliveryQueue?.current && (this._deliverQueue(this._deliveryQueue), this._perfMon?.stop()), this._perfMon?.start(this._size), this._listeners) {
			if (this._listeners instanceof Zt) this._deliver(this._listeners, e);
			else {
				let t = this._deliveryQueue;
				t.enqueue(this, e, this._listeners.length), this._deliverQueue(t);
			}
		}
		this._perfMon?.stop();
	}
	hasListeners() {
		return this._size > 0;
	}
}, $t = class {
	constructor() {
		this.i = -1, this.end = 0;
	}
	enqueue(e, t, n) {
		this.i = 0, this.end = n, this.current = e, this.value = t;
	}
	reset() {
		this.i = this.end, this.current = void 0, this.value = void 0;
	}
}, en = class {
	constructor() {
		this.mapWindowIdToZoomLevel = /* @__PURE__ */ new Map(), this._onDidChangeZoomLevel = new A(), this.onDidChangeZoomLevel = this._onDidChangeZoomLevel.event, this.mapWindowIdToZoomFactor = /* @__PURE__ */ new Map(), this._onDidChangeFullscreen = new A(), this.onDidChangeFullscreen = this._onDidChangeFullscreen.event, this.mapWindowIdToFullScreen = /* @__PURE__ */ new Map();
	}
	getZoomLevel(e) {
		return this.mapWindowIdToZoomLevel.get(this.getWindowId(e)) ?? 0;
	}
	setZoomLevel(e, t) {
		if (this.getZoomLevel(t) === e) return;
		let n = this.getWindowId(t);
		this.mapWindowIdToZoomLevel.set(n, e), this._onDidChangeZoomLevel.fire(n);
	}
	getZoomFactor(e) {
		return this.mapWindowIdToZoomFactor.get(this.getWindowId(e)) ?? 1;
	}
	setZoomFactor(e, t) {
		this.mapWindowIdToZoomFactor.set(this.getWindowId(t), e);
	}
	setFullscreen(e, t) {
		if (this.isFullscreen(t) === e) return;
		let n = this.getWindowId(t);
		this.mapWindowIdToFullScreen.set(n, e), this._onDidChangeFullscreen.fire(n);
	}
	isFullscreen(e) {
		return !!this.mapWindowIdToFullScreen.get(this.getWindowId(e));
	}
	getWindowId(e) {
		return e.vscodeWindowId;
	}
};
en.INSTANCE = new en();
var tn = en;
function nn(e, t, n) {
	typeof t == "string" && (t = e.matchMedia(t)), t.addEventListener("change", n);
}
tn.INSTANCE.onDidChangeZoomLevel;
function rn(e) {
	return tn.INSTANCE.getZoomFactor(e);
}
tn.INSTANCE.onDidChangeFullscreen;
var an = typeof navigator == "object" ? navigator.userAgent : "", on = an.indexOf("Firefox") >= 0, sn = an.indexOf("AppleWebKit") >= 0, cn = an.indexOf("Chrome") >= 0, ln = !cn && an.indexOf("Safari") >= 0;
an.indexOf("Electron/"), an.indexOf("Android");
var un = !1;
if (typeof It.matchMedia == "function") {
	let e = It.matchMedia("(display-mode: standalone) or (display-mode: window-controls-overlay)"), t = It.matchMedia("(display-mode: fullscreen)");
	un = e.matches, nn(It, e, ({ matches: e }) => {
		un && t.matches || (un = e);
	});
}
function dn() {
	return un;
}
var fn = "en", pn = !1, mn = !1, hn = !1, gn = !1, _n = !1, vn = fn, yn, bn = globalThis, xn;
typeof bn.vscode < "u" && typeof bn.vscode.process < "u" ? xn = bn.vscode.process : typeof process < "u" && typeof process?.versions?.node == "string" && (xn = process);
var Sn = typeof xn?.versions?.electron == "string" && xn?.type === "renderer";
if (typeof xn == "object") {
	pn = xn.platform === "win32", mn = xn.platform === "darwin", hn = xn.platform === "linux", hn && xn.env.SNAP && xn.env.SNAP_REVISION, xn.env.CI || xn.env.BUILD_ARTIFACTSTAGINGDIRECTORY, vn = fn;
	let e = xn.env.VSCODE_NLS_CONFIG;
	if (e) try {
		let t = JSON.parse(e);
		t.userLocale, t.osLocale, vn = t.resolvedLanguage || fn, t.languagePack?.translationsConfigFile;
	} catch {}
	gn = !0;
} else typeof navigator == "object" && !Sn ? (yn = navigator.userAgent, pn = yn.indexOf("Windows") >= 0, mn = yn.indexOf("Macintosh") >= 0, (yn.indexOf("Macintosh") >= 0 || yn.indexOf("iPad") >= 0 || yn.indexOf("iPhone") >= 0) && navigator.maxTouchPoints && navigator.maxTouchPoints, hn = yn.indexOf("Linux") >= 0, yn?.indexOf("Mobi"), _n = !0, vn = globalThis._VSCODE_NLS_LANGUAGE || fn, navigator.language.toLowerCase()) : console.error("Unable to resolve platform.");
var Cn = pn, wn = mn, Tn = hn, En = gn;
_n && typeof bn.importScripts == "function" && bn.origin;
var Dn = yn, On = vn, kn;
((e) => {
	function t() {
		return On;
	}
	e.value = t;
	function n() {
		return On.length === 2 ? On === "en" : On.length >= 3 && On[0] === "e" && On[1] === "n" && On[2] === "-";
	}
	e.isDefaultVariant = n;
	function r() {
		return On === "en";
	}
	e.isDefault = r;
})(kn ||= {});
var An = typeof bn.postMessage == "function" && !bn.importScripts;
(() => {
	if (An) {
		let e = [];
		bn.addEventListener("message", (t) => {
			if (t.data && t.data.vscodeScheduleAsyncWork) for (let n = 0, r = e.length; n < r; n++) {
				let r = e[n];
				if (r.id === t.data.vscodeScheduleAsyncWork) {
					e.splice(n, 1), r.callback();
					return;
				}
			}
		});
		let t = 0;
		return (n) => {
			let r = ++t;
			e.push({
				id: r,
				callback: n
			}), bn.postMessage({ vscodeScheduleAsyncWork: r }, "*");
		};
	}
	return (e) => setTimeout(e);
})();
var jn = !!(Dn && Dn.indexOf("Chrome") >= 0);
Dn && Dn.indexOf("Firefox"), !jn && Dn && Dn.indexOf("Safari"), Dn && Dn.indexOf("Edg/"), Dn && Dn.indexOf("Android");
var Mn = typeof navigator == "object" ? navigator : {};
En || document.queryCommandSupported && document.queryCommandSupported("copy") || Mn && Mn.clipboard && Mn.clipboard.writeText, En || Mn && Mn.clipboard && Mn.clipboard.readText, En || dn() || Mn.keyboard, "ontouchstart" in It || Mn.maxTouchPoints, It.PointerEvent && ("ontouchstart" in It || navigator.maxTouchPoints);
var Nn = class {
	constructor() {
		this._keyCodeToStr = [], this._strToKeyCode = Object.create(null);
	}
	define(e, t) {
		this._keyCodeToStr[e] = t, this._strToKeyCode[t.toLowerCase()] = e;
	}
	keyCodeToStr(e) {
		return this._keyCodeToStr[e];
	}
	strToKeyCode(e) {
		return this._strToKeyCode[e.toLowerCase()] || 0;
	}
}, Pn = new Nn(), Fn = new Nn(), In = new Nn(), Ln = Array(230), Rn;
((e) => {
	function t(e) {
		return Pn.keyCodeToStr(e);
	}
	e.toString = t;
	function n(e) {
		return Pn.strToKeyCode(e);
	}
	e.fromString = n;
	function r(e) {
		return Fn.keyCodeToStr(e);
	}
	e.toUserSettingsUS = r;
	function i(e) {
		return In.keyCodeToStr(e);
	}
	e.toUserSettingsGeneral = i;
	function a(e) {
		return Fn.strToKeyCode(e) || In.strToKeyCode(e);
	}
	e.fromUserSettings = a;
	function o(e) {
		if (e >= 98 && e <= 113) return null;
		switch (e) {
			case 16: return "Up";
			case 18: return "Down";
			case 15: return "Left";
			case 17: return "Right";
		}
		return Pn.keyCodeToStr(e);
	}
	e.toElectronAccelerator = o;
})(Rn ||= {});
var zn = class e {
	constructor(e, t, n, r, i) {
		this.ctrlKey = e, this.shiftKey = t, this.altKey = n, this.metaKey = r, this.keyCode = i;
	}
	equals(t) {
		return t instanceof e && this.ctrlKey === t.ctrlKey && this.shiftKey === t.shiftKey && this.altKey === t.altKey && this.metaKey === t.metaKey && this.keyCode === t.keyCode;
	}
	getHashCode() {
		return `K${this.ctrlKey ? "1" : "0"}${this.shiftKey ? "1" : "0"}${this.altKey ? "1" : "0"}${this.metaKey ? "1" : "0"}${this.keyCode}`;
	}
	isModifierKey() {
		return this.keyCode === 0 || this.keyCode === 5 || this.keyCode === 57 || this.keyCode === 6 || this.keyCode === 4;
	}
	toKeybinding() {
		return new Bn([this]);
	}
	isDuplicateModifierCase() {
		return this.ctrlKey && this.keyCode === 5 || this.shiftKey && this.keyCode === 4 || this.altKey && this.keyCode === 6 || this.metaKey && this.keyCode === 57;
	}
}, Bn = class {
	constructor(e) {
		if (e.length === 0) throw vt("chords");
		this.chords = e;
	}
	getHashCode() {
		let e = "";
		for (let t = 0, n = this.chords.length; t < n; t++) t !== 0 && (e += ";"), e += this.chords[t].getHashCode();
		return e;
	}
	equals(e) {
		if (e === null || this.chords.length !== e.chords.length) return !1;
		for (let t = 0; t < this.chords.length; t++) if (!this.chords[t].equals(e.chords[t])) return !1;
		return !0;
	}
};
function Vn(e) {
	if (e.charCode) {
		let t = String.fromCharCode(e.charCode).toUpperCase();
		return Rn.fromString(t);
	}
	let t = e.keyCode;
	if (t === 3) return 7;
	if (on) switch (t) {
		case 59: return 85;
		case 60:
			if (Tn) return 97;
			break;
		case 61: return 86;
		case 107: return 109;
		case 109: return 111;
		case 173: return 88;
		case 224: if (wn) return 57;
	}
	else if (sn && (wn && t === 93 || !wn && t === 92)) return 57;
	return Ln[t] || 0;
}
var Hn = wn ? 256 : 2048, Un = 512, Wn = 1024, Gn = wn ? 2048 : 256, Kn = class {
	constructor(e) {
		this._standardKeyboardEventBrand = !0;
		let t = e;
		this.browserEvent = t, this.target = t.target, this.ctrlKey = t.ctrlKey, this.shiftKey = t.shiftKey, this.altKey = t.altKey, this.metaKey = t.metaKey, this.altGraphKey = t.getModifierState?.("AltGraph"), this.keyCode = Vn(t), this.code = t.code, this.ctrlKey = this.ctrlKey || this.keyCode === 5, this.altKey = this.altKey || this.keyCode === 6, this.shiftKey = this.shiftKey || this.keyCode === 4, this.metaKey = this.metaKey || this.keyCode === 57, this._asKeybinding = this._computeKeybinding(), this._asKeyCodeChord = this._computeKeyCodeChord();
	}
	preventDefault() {
		this.browserEvent && this.browserEvent.preventDefault && this.browserEvent.preventDefault();
	}
	stopPropagation() {
		this.browserEvent && this.browserEvent.stopPropagation && this.browserEvent.stopPropagation();
	}
	toKeyCodeChord() {
		return this._asKeyCodeChord;
	}
	equals(e) {
		return this._asKeybinding === e;
	}
	_computeKeybinding() {
		let e = 0;
		this.keyCode !== 5 && this.keyCode !== 4 && this.keyCode !== 6 && this.keyCode !== 57 && (e = this.keyCode);
		let t = 0;
		return this.ctrlKey && (t |= Hn), this.altKey && (t |= Un), this.shiftKey && (t |= Wn), this.metaKey && (t |= Gn), t |= e, t;
	}
	_computeKeyCodeChord() {
		let e = 0;
		return this.keyCode !== 5 && this.keyCode !== 4 && this.keyCode !== 6 && this.keyCode !== 57 && (e = this.keyCode), new zn(this.ctrlKey, this.shiftKey, this.altKey, this.metaKey, e);
	}
}, qn = /* @__PURE__ */ new WeakMap();
function Jn(e) {
	if (!e.parent || e.parent === e) return null;
	try {
		let t = e.location, n = e.parent.location;
		if (t.origin !== "null" && n.origin !== "null" && t.origin !== n.origin) return null;
	} catch {
		return null;
	}
	return e.parent;
}
var Yn = class {
	static getSameOriginWindowChain(e) {
		let t = qn.get(e);
		if (!t) {
			t = [], qn.set(e, t);
			let n = e, r;
			do
				r = Jn(n), r ? t.push({
					window: new WeakRef(n),
					iframeElement: n.frameElement || null
				}) : t.push({
					window: new WeakRef(n),
					iframeElement: null
				}), n = r;
			while (n);
		}
		return t.slice(0);
	}
	static getPositionOfChildWindowRelativeToAncestorWindow(e, t) {
		if (!t || e === t) return {
			top: 0,
			left: 0
		};
		let n = 0, r = 0, i = this.getSameOriginWindowChain(e);
		for (let e of i) {
			let i = e.window.deref();
			if (n += i?.scrollY ?? 0, r += i?.scrollX ?? 0, i === t || !e.iframeElement) break;
			let a = e.iframeElement.getBoundingClientRect();
			n += a.top, r += a.left;
		}
		return {
			top: n,
			left: r
		};
	}
}, Xn = class {
	constructor(e, t) {
		this.timestamp = Date.now(), this.browserEvent = t, this.leftButton = t.button === 0, this.middleButton = t.button === 1, this.rightButton = t.button === 2, this.buttons = t.buttons, this.target = t.target, this.detail = t.detail || 1, t.type === "dblclick" && (this.detail = 2), this.ctrlKey = t.ctrlKey, this.shiftKey = t.shiftKey, this.altKey = t.altKey, this.metaKey = t.metaKey, typeof t.pageX == "number" ? (this.posx = t.pageX, this.posy = t.pageY) : (this.posx = t.clientX + this.target.ownerDocument.body.scrollLeft + this.target.ownerDocument.documentElement.scrollLeft, this.posy = t.clientY + this.target.ownerDocument.body.scrollTop + this.target.ownerDocument.documentElement.scrollTop);
		let n = Yn.getPositionOfChildWindowRelativeToAncestorWindow(e, t.view);
		this.posx -= n.left, this.posy -= n.top;
	}
	preventDefault() {
		this.browserEvent.preventDefault();
	}
	stopPropagation() {
		this.browserEvent.stopPropagation();
	}
}, Zn = class {
	constructor(e, t = 0, n = 0) {
		this.browserEvent = e || null, this.target = e ? e.target || e.targetNode || e.srcElement : null, this.deltaY = n, this.deltaX = t;
		let r = !1;
		if (cn) {
			let e = navigator.userAgent.match(/Chrome\/(\d+)/);
			r = (e ? parseInt(e[1]) : 123) <= 122;
		}
		if (e) {
			let t = e, n = e, i = e.view?.devicePixelRatio || 1;
			if (typeof t.wheelDeltaY < "u") this.deltaY = r ? t.wheelDeltaY / (120 * i) : t.wheelDeltaY / 120;
			else if (typeof n.VERTICAL_AXIS < "u" && n.axis === n.VERTICAL_AXIS) this.deltaY = -n.detail / 3;
			else if (e.type === "wheel") {
				let t = e;
				this.deltaY = t.deltaMode === t.DOM_DELTA_LINE ? on && !wn ? -e.deltaY / 3 : -e.deltaY : -e.deltaY / 40;
			}
			if (typeof t.wheelDeltaX < "u") this.deltaX = ln && Cn ? -(t.wheelDeltaX / 120) : r ? t.wheelDeltaX / (120 * i) : t.wheelDeltaX / 120;
			else if (typeof n.HORIZONTAL_AXIS < "u" && n.axis === n.HORIZONTAL_AXIS) this.deltaX = -e.detail / 3;
			else if (e.type === "wheel") {
				let t = e;
				this.deltaX = t.deltaMode === t.DOM_DELTA_LINE ? on && !wn ? -e.deltaX / 3 : -e.deltaX : -e.deltaX / 40;
			}
			this.deltaY === 0 && this.deltaX === 0 && e.wheelDelta && (this.deltaY = r ? e.wheelDelta / (120 * i) : e.wheelDelta / 120);
		}
	}
	preventDefault() {
		this.browserEvent?.preventDefault();
	}
	stopPropagation() {
		this.browserEvent?.stopPropagation();
	}
}, Qn = Object.freeze(function(e, t) {
	let n = setTimeout(e.bind(t), 0);
	return { dispose() {
		clearTimeout(n);
	} };
}), $n;
((e) => {
	function t(t) {
		return t === e.None || t === e.Cancelled || t instanceof er ? !0 : !t || typeof t != "object" ? !1 : typeof t.isCancellationRequested == "boolean" && typeof t.onCancellationRequested == "function";
	}
	e.isCancellationToken = t, e.None = Object.freeze({
		isCancellationRequested: !1,
		onCancellationRequested: Vt.None
	}), e.Cancelled = Object.freeze({
		isCancellationRequested: !0,
		onCancellationRequested: Qn
	});
})($n ||= {});
var er = class {
	constructor() {
		this._isCancelled = !1, this._emitter = null;
	}
	cancel() {
		this._isCancelled || (this._isCancelled = !0, this._emitter && (this._emitter.fire(void 0), this.dispose()));
	}
	get isCancellationRequested() {
		return this._isCancelled;
	}
	get onCancellationRequested() {
		return this._isCancelled ? Qn : (this._emitter ||= new A(), this._emitter.event);
	}
	dispose() {
		this._emitter &&= (this._emitter.dispose(), null);
	}
}, tr = class {
	constructor(e, t) {
		this._isDisposed = !1, this._token = -1, typeof e == "function" && typeof t == "number" && this.setIfNotSet(e, t);
	}
	dispose() {
		this.cancel(), this._isDisposed = !0;
	}
	cancel() {
		this._token !== -1 && (clearTimeout(this._token), this._token = -1);
	}
	cancelAndSet(e, t) {
		if (this._isDisposed) throw new bt("Calling 'cancelAndSet' on a disposed TimeoutTimer");
		this.cancel(), this._token = setTimeout(() => {
			this._token = -1, e();
		}, t);
	}
	setIfNotSet(e, t) {
		if (this._isDisposed) throw new bt("Calling 'setIfNotSet' on a disposed TimeoutTimer");
		this._token === -1 && (this._token = setTimeout(() => {
			this._token = -1, e();
		}, t));
	}
}, nr = class {
	constructor() {
		this.disposable = void 0, this.isDisposed = !1;
	}
	cancel() {
		this.disposable?.dispose(), this.disposable = void 0;
	}
	cancelAndSet(e, t, n = globalThis) {
		if (this.isDisposed) throw new bt("Calling 'cancelAndSet' on a disposed IntervalTimer");
		this.cancel();
		let r = n.setInterval(() => {
			e();
		}, t);
		this.disposable = D(() => {
			n.clearInterval(r), this.disposable = void 0;
		});
	}
	dispose() {
		this.cancel(), this.isDisposed = !0;
	}
};
(function() {
	typeof globalThis.requestIdleCallback != "function" || globalThis.cancelIdleCallback;
})();
var rr;
((e) => {
	async function t(e) {
		let t, n = await Promise.all(e.map((e) => e.then((e) => e, (e) => {
			t ||= e;
		})));
		if (typeof t < "u") throw t;
		return n;
	}
	e.settled = t;
	function n(e) {
		return new Promise(async (t, n) => {
			try {
				await e(t, n);
			} catch (e) {
				n(e);
			}
		});
	}
	e.withAsyncBody = n;
})(rr ||= {});
var ir = class e {
	static fromArray(t) {
		return new e((e) => {
			e.emitMany(t);
		});
	}
	static fromPromise(t) {
		return new e(async (e) => {
			e.emitMany(await t);
		});
	}
	static fromPromises(t) {
		return new e(async (e) => {
			await Promise.all(t.map(async (t) => e.emitOne(await t)));
		});
	}
	static merge(t) {
		return new e(async (e) => {
			await Promise.all(t.map(async (t) => {
				for await (let n of t) e.emitOne(n);
			}));
		});
	}
	constructor(e, t) {
		this._state = 0, this._results = [], this._error = null, this._onReturn = t, this._onStateChanged = new A(), queueMicrotask(async () => {
			let t = {
				emitOne: (e) => this.emitOne(e),
				emitMany: (e) => this.emitMany(e),
				reject: (e) => this.reject(e)
			};
			try {
				await Promise.resolve(e(t)), this.resolve();
			} catch (e) {
				this.reject(e);
			} finally {
				t.emitOne = void 0, t.emitMany = void 0, t.reject = void 0;
			}
		});
	}
	[Symbol.asyncIterator]() {
		let e = 0;
		return {
			next: async () => {
				do {
					if (this._state === 2) throw this._error;
					if (e < this._results.length) return {
						done: !1,
						value: this._results[e++]
					};
					if (this._state === 1) return {
						done: !0,
						value: void 0
					};
					await Vt.toPromise(this._onStateChanged.event);
				} while (1);
			},
			return: async () => (this._onReturn?.(), {
				done: !0,
				value: void 0
			})
		};
	}
	static map(t, n) {
		return new e(async (e) => {
			for await (let r of t) e.emitOne(n(r));
		});
	}
	map(t) {
		return e.map(this, t);
	}
	static filter(t, n) {
		return new e(async (e) => {
			for await (let r of t) n(r) && e.emitOne(r);
		});
	}
	filter(t) {
		return e.filter(this, t);
	}
	static coalesce(t) {
		return e.filter(t, (e) => !!e);
	}
	coalesce() {
		return e.coalesce(this);
	}
	static async toPromise(e) {
		let t = [];
		for await (let n of e) t.push(n);
		return t;
	}
	toPromise() {
		return e.toPromise(this);
	}
	emitOne(e) {
		this._state === 0 && (this._results.push(e), this._onStateChanged.fire());
	}
	emitMany(e) {
		this._state === 0 && (this._results = this._results.concat(e), this._onStateChanged.fire());
	}
	resolve() {
		this._state === 0 && (this._state = 1, this._onStateChanged.fire());
	}
	reject(e) {
		this._state === 0 && (this._state = 2, this._error = e, this._onStateChanged.fire());
	}
};
ir.EMPTY = ir.fromArray([]);
function ar(e) {
	return or(e, 0);
}
function or(e, t) {
	switch (typeof e) {
		case "object": return e === null ? sr(349, t) : Array.isArray(e) ? ur(e, t) : dr(e, t);
		case "string": return lr(e, t);
		case "boolean": return cr(e, t);
		case "number": return sr(e, t);
		case "undefined": return sr(937, t);
		default: return sr(617, t);
	}
}
function sr(e, t) {
	return (t << 5) - t + e | 0;
}
function cr(e, t) {
	return sr(e ? 433 : 863, t);
}
function lr(e, t) {
	t = sr(149417, t);
	for (let n = 0, r = e.length; n < r; n++) t = sr(e.charCodeAt(n), t);
	return t;
}
function ur(e, t) {
	return t = sr(104579, t), e.reduce((e, t) => or(t, e), t);
}
function dr(e, t) {
	return t = sr(181387, t), Object.keys(e).sort().reduce((t, n) => (t = lr(n, t), or(e[n], t)), t);
}
var { registerWindow: fr, getWindow: pr, getDocument: mr, getWindows: hr, getWindowsCount: gr, getWindowId: _r, getWindowById: vr, hasWindow: yr, onDidRegisterWindow: br, onWillUnregisterWindow: xr, onDidUnregisterWindow: Sr } = function() {
	let e = /* @__PURE__ */ new Map(), t = {
		window: It,
		disposables: new Pt()
	};
	e.set(It.vscodeWindowId, t);
	let n = new A(), r = new A(), i = new A();
	function a(n, r) {
		return (typeof n == "number" ? e.get(n) : void 0) ?? (r ? t : void 0);
	}
	return {
		onDidRegisterWindow: n.event,
		onWillUnregisterWindow: i.event,
		onDidUnregisterWindow: r.event,
		registerWindow(t) {
			if (e.has(t.vscodeWindowId)) return O.None;
			let a = new Pt(), o = {
				window: t,
				disposables: a.add(new Pt())
			};
			return e.set(t.vscodeWindowId, o), a.add(D(() => {
				e.delete(t.vscodeWindowId), r.fire(t);
			})), a.add(j(t, M.BEFORE_UNLOAD, () => {
				i.fire(t);
			})), n.fire(o), a;
		},
		getWindows() {
			return e.values();
		},
		getWindowsCount() {
			return e.size;
		},
		getWindowId(e) {
			return e.vscodeWindowId;
		},
		hasWindow(t) {
			return e.has(t);
		},
		getWindowById: a,
		getWindow(e) {
			let t = e;
			if (t?.ownerDocument?.defaultView) return t.ownerDocument.defaultView.window;
			let n = e;
			return n?.view ? n.view.window : It;
		},
		getDocument(e) {
			return pr(e).document;
		}
	};
}(), Cr = class {
	constructor(e, t, n, r) {
		this._node = e, this._type = t, this._handler = n, this._options = r || !1, this._node.addEventListener(this._type, this._handler, this._options);
	}
	dispose() {
		this._handler &&= (this._node.removeEventListener(this._type, this._handler, this._options), this._node = null, null);
	}
};
function j(e, t, n, r) {
	return new Cr(e, t, n, r);
}
function wr(e, t) {
	return function(n) {
		return t(new Xn(e, n));
	};
}
function Tr(e) {
	return function(t) {
		return e(new Kn(t));
	};
}
var Er = function(e, t, n, r) {
	let i = n;
	return t === "click" || t === "mousedown" || t === "contextmenu" ? i = wr(pr(e), n) : (t === "keydown" || t === "keypress" || t === "keyup") && (i = Tr(n)), j(e, t, i, r);
}, Dr, Or = class extends nr {
	constructor(e) {
		super(), this.defaultTarget = e && pr(e);
	}
	cancelAndSet(e, t, n) {
		return super.cancelAndSet(e, t, n ?? this.defaultTarget);
	}
}, kr = class {
	constructor(e, t = 0) {
		this._runner = e, this.priority = t, this._canceled = !1;
	}
	dispose() {
		this._canceled = !0;
	}
	execute() {
		if (!this._canceled) try {
			this._runner();
		} catch (e) {
			mt(e);
		}
	}
	static sort(e, t) {
		return t.priority - e.priority;
	}
};
(function() {
	let e = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = (i) => {
		n.set(i, !1);
		let a = e.get(i) ?? [];
		for (t.set(i, a), e.set(i, []), r.set(i, !0); a.length > 0;) a.sort(kr.sort), a.shift().execute();
		r.set(i, !1);
	};
	Dr = (t, r, a = 0) => {
		let o = _r(t), s = new kr(r, a), c = e.get(o);
		return c || (c = [], e.set(o, c)), c.push(s), n.get(o) || (n.set(o, !0), t.requestAnimationFrame(() => i(o))), s;
	};
})();
var Ar = class e {
	constructor(e, t) {
		this.width = e, this.height = t;
	}
	with(t = this.width, n = this.height) {
		return t !== this.width || n !== this.height ? new e(t, n) : this;
	}
	static is(e) {
		return typeof e == "object" && typeof e.height == "number" && typeof e.width == "number";
	}
	static lift(t) {
		return t instanceof e ? t : new e(t.width, t.height);
	}
	static equals(e, t) {
		return e === t ? !0 : !e || !t ? !1 : e.width === t.width && e.height === t.height;
	}
};
Ar.None = new Ar(0, 0);
function jr(e) {
	let t = e.getBoundingClientRect(), n = pr(e);
	return {
		left: t.left + n.scrollX,
		top: t.top + n.scrollY,
		width: t.width,
		height: t.height
	};
}
new class {
	constructor() {
		this.mutationObservers = /* @__PURE__ */ new Map();
	}
	observe(e, t, n) {
		let r = this.mutationObservers.get(e);
		r || (r = /* @__PURE__ */ new Map(), this.mutationObservers.set(e, r));
		let i = ar(n), a = r.get(i);
		if (a) a.users += 1;
		else {
			let o = new A(), s = new MutationObserver((e) => o.fire(e));
			s.observe(e, n);
			let c = a = {
				users: 1,
				observer: s,
				onDidMutate: o.event
			};
			t.add(D(() => {
				--c.users, c.users === 0 && (o.dispose(), s.disconnect(), r?.delete(i), r?.size === 0 && this.mutationObservers.delete(e));
			})), r.set(i, a);
		}
		return a.onDidMutate;
	}
}();
var M = {
	CLICK: "click",
	AUXCLICK: "auxclick",
	DBLCLICK: "dblclick",
	MOUSE_UP: "mouseup",
	MOUSE_DOWN: "mousedown",
	MOUSE_OVER: "mouseover",
	MOUSE_MOVE: "mousemove",
	MOUSE_OUT: "mouseout",
	MOUSE_ENTER: "mouseenter",
	MOUSE_LEAVE: "mouseleave",
	MOUSE_WHEEL: "wheel",
	POINTER_UP: "pointerup",
	POINTER_DOWN: "pointerdown",
	POINTER_MOVE: "pointermove",
	POINTER_LEAVE: "pointerleave",
	CONTEXT_MENU: "contextmenu",
	WHEEL: "wheel",
	KEY_DOWN: "keydown",
	KEY_PRESS: "keypress",
	KEY_UP: "keyup",
	LOAD: "load",
	BEFORE_UNLOAD: "beforeunload",
	UNLOAD: "unload",
	PAGE_SHOW: "pageshow",
	PAGE_HIDE: "pagehide",
	PASTE: "paste",
	ABORT: "abort",
	ERROR: "error",
	RESIZE: "resize",
	SCROLL: "scroll",
	FULLSCREEN_CHANGE: "fullscreenchange",
	WK_FULLSCREEN_CHANGE: "webkitfullscreenchange",
	SELECT: "select",
	CHANGE: "change",
	SUBMIT: "submit",
	RESET: "reset",
	FOCUS: "focus",
	FOCUS_IN: "focusin",
	FOCUS_OUT: "focusout",
	BLUR: "blur",
	INPUT: "input",
	STORAGE: "storage",
	DRAG_START: "dragstart",
	DRAG: "drag",
	DRAG_ENTER: "dragenter",
	DRAG_LEAVE: "dragleave",
	DRAG_OVER: "dragover",
	DROP: "drop",
	DRAG_END: "dragend",
	ANIMATION_START: sn ? "webkitAnimationStart" : "animationstart",
	ANIMATION_END: sn ? "webkitAnimationEnd" : "animationend",
	ANIMATION_ITERATION: sn ? "webkitAnimationIteration" : "animationiteration"
}, Mr = class {
	constructor(e) {
		this.domNode = e, this._maxWidth = "", this._width = "", this._height = "", this._top = "", this._left = "", this._bottom = "", this._right = "", this._paddingTop = "", this._paddingLeft = "", this._paddingBottom = "", this._paddingRight = "", this._fontFamily = "", this._fontWeight = "", this._fontSize = "", this._fontStyle = "", this._fontFeatureSettings = "", this._fontVariationSettings = "", this._textDecoration = "", this._lineHeight = "", this._letterSpacing = "", this._className = "", this._display = "", this._position = "", this._visibility = "", this._color = "", this._backgroundColor = "", this._layerHint = !1, this._contain = "none", this._boxShadow = "";
	}
	setMaxWidth(e) {
		let t = Nr(e);
		this._maxWidth !== t && (this._maxWidth = t, this.domNode.style.maxWidth = this._maxWidth);
	}
	setWidth(e) {
		let t = Nr(e);
		this._width !== t && (this._width = t, this.domNode.style.width = this._width);
	}
	setHeight(e) {
		let t = Nr(e);
		this._height !== t && (this._height = t, this.domNode.style.height = this._height);
	}
	setTop(e) {
		let t = Nr(e);
		this._top !== t && (this._top = t, this.domNode.style.top = this._top);
	}
	setLeft(e) {
		let t = Nr(e);
		this._left !== t && (this._left = t, this.domNode.style.left = this._left);
	}
	setBottom(e) {
		let t = Nr(e);
		this._bottom !== t && (this._bottom = t, this.domNode.style.bottom = this._bottom);
	}
	setRight(e) {
		let t = Nr(e);
		this._right !== t && (this._right = t, this.domNode.style.right = this._right);
	}
	setPaddingTop(e) {
		let t = Nr(e);
		this._paddingTop !== t && (this._paddingTop = t, this.domNode.style.paddingTop = this._paddingTop);
	}
	setPaddingLeft(e) {
		let t = Nr(e);
		this._paddingLeft !== t && (this._paddingLeft = t, this.domNode.style.paddingLeft = this._paddingLeft);
	}
	setPaddingBottom(e) {
		let t = Nr(e);
		this._paddingBottom !== t && (this._paddingBottom = t, this.domNode.style.paddingBottom = this._paddingBottom);
	}
	setPaddingRight(e) {
		let t = Nr(e);
		this._paddingRight !== t && (this._paddingRight = t, this.domNode.style.paddingRight = this._paddingRight);
	}
	setFontFamily(e) {
		this._fontFamily !== e && (this._fontFamily = e, this.domNode.style.fontFamily = this._fontFamily);
	}
	setFontWeight(e) {
		this._fontWeight !== e && (this._fontWeight = e, this.domNode.style.fontWeight = this._fontWeight);
	}
	setFontSize(e) {
		let t = Nr(e);
		this._fontSize !== t && (this._fontSize = t, this.domNode.style.fontSize = this._fontSize);
	}
	setFontStyle(e) {
		this._fontStyle !== e && (this._fontStyle = e, this.domNode.style.fontStyle = this._fontStyle);
	}
	setFontFeatureSettings(e) {
		this._fontFeatureSettings !== e && (this._fontFeatureSettings = e, this.domNode.style.fontFeatureSettings = this._fontFeatureSettings);
	}
	setFontVariationSettings(e) {
		this._fontVariationSettings !== e && (this._fontVariationSettings = e, this.domNode.style.fontVariationSettings = this._fontVariationSettings);
	}
	setTextDecoration(e) {
		this._textDecoration !== e && (this._textDecoration = e, this.domNode.style.textDecoration = this._textDecoration);
	}
	setLineHeight(e) {
		let t = Nr(e);
		this._lineHeight !== t && (this._lineHeight = t, this.domNode.style.lineHeight = this._lineHeight);
	}
	setLetterSpacing(e) {
		let t = Nr(e);
		this._letterSpacing !== t && (this._letterSpacing = t, this.domNode.style.letterSpacing = this._letterSpacing);
	}
	setClassName(e) {
		this._className !== e && (this._className = e, this.domNode.className = this._className);
	}
	toggleClassName(e, t) {
		this.domNode.classList.toggle(e, t), this._className = this.domNode.className;
	}
	setDisplay(e) {
		this._display !== e && (this._display = e, this.domNode.style.display = this._display);
	}
	setPosition(e) {
		this._position !== e && (this._position = e, this.domNode.style.position = this._position);
	}
	setVisibility(e) {
		this._visibility !== e && (this._visibility = e, this.domNode.style.visibility = this._visibility);
	}
	setColor(e) {
		this._color !== e && (this._color = e, this.domNode.style.color = this._color);
	}
	setBackgroundColor(e) {
		this._backgroundColor !== e && (this._backgroundColor = e, this.domNode.style.backgroundColor = this._backgroundColor);
	}
	setLayerHinting(e) {
		this._layerHint !== e && (this._layerHint = e, this.domNode.style.transform = this._layerHint ? "translate3d(0px, 0px, 0px)" : "");
	}
	setBoxShadow(e) {
		this._boxShadow !== e && (this._boxShadow = e, this.domNode.style.boxShadow = e);
	}
	setContain(e) {
		this._contain !== e && (this._contain = e, this.domNode.style.contain = this._contain);
	}
	setAttribute(e, t) {
		this.domNode.setAttribute(e, t);
	}
	removeAttribute(e) {
		this.domNode.removeAttribute(e);
	}
	appendChild(e) {
		this.domNode.appendChild(e.domNode);
	}
	removeChild(e) {
		this.domNode.removeChild(e.domNode);
	}
};
function Nr(e) {
	return typeof e == "number" ? `${e}px` : e;
}
function Pr(e) {
	return new Mr(e);
}
var Fr = class {
	constructor() {
		this._hooks = new Pt(), this._pointerMoveCallback = null, this._onStopCallback = null;
	}
	dispose() {
		this.stopMonitoring(!1), this._hooks.dispose();
	}
	stopMonitoring(e, t) {
		if (!this.isMonitoring()) return;
		this._hooks.clear(), this._pointerMoveCallback = null;
		let n = this._onStopCallback;
		this._onStopCallback = null, e && n && n(t);
	}
	isMonitoring() {
		return !!this._pointerMoveCallback;
	}
	startMonitoring(e, t, n, r, i) {
		this.isMonitoring() && this.stopMonitoring(!1), this._pointerMoveCallback = r, this._onStopCallback = i;
		let a = e;
		try {
			e.setPointerCapture(t), this._hooks.add(D(() => {
				try {
					e.releasePointerCapture(t);
				} catch {}
			}));
		} catch {
			a = pr(e);
		}
		this._hooks.add(j(a, M.POINTER_MOVE, (e) => {
			e.buttons === n ? (e.preventDefault(), this._pointerMoveCallback(e)) : this.stopMonitoring(!0);
		})), this._hooks.add(j(a, M.POINTER_UP, (e) => this.stopMonitoring(!0)));
	}
};
function Ir(e, t, n) {
	let r = null, i = null;
	if (typeof n.value == "function" ? (r = "value", i = n.value, i.length !== 0 && console.warn("Memoize should only be used in functions with zero parameters")) : typeof n.get == "function" && (r = "get", i = n.get), !i) throw Error("not supported");
	let a = `$memoize$${t}`;
	n[r] = function(...e) {
		return this.hasOwnProperty(a) || Object.defineProperty(this, a, {
			configurable: !1,
			enumerable: !1,
			writable: !1,
			value: i.apply(this, e)
		}), this[a];
	};
}
var Lr;
((e) => (e.Tap = "-xterm-gesturetap", e.Change = "-xterm-gesturechange", e.Start = "-xterm-gesturestart", e.End = "-xterm-gesturesend", e.Contextmenu = "-xterm-gesturecontextmenu"))(Lr ||= {});
var Rr = class e extends O {
	constructor() {
		super(), this.dispatched = !1, this.targets = new Rt(), this.ignoreTargets = new Rt(), this.activeTouches = {}, this.handle = null, this._lastSetTapCountTime = 0, this._register(Vt.runAndSubscribe(br, ({ window: e, disposables: t }) => {
			t.add(j(e.document, "touchstart", (e) => this.onTouchStart(e), { passive: !1 })), t.add(j(e.document, "touchend", (t) => this.onTouchEnd(e, t))), t.add(j(e.document, "touchmove", (e) => this.onTouchMove(e), { passive: !1 }));
		}, {
			window: It,
			disposables: this._store
		}));
	}
	static addTarget(t) {
		return e.isTouchDevice() ? (e.INSTANCE ||= At(new e()), D(e.INSTANCE.targets.push(t))) : O.None;
	}
	static ignoreTarget(t) {
		return e.isTouchDevice() ? (e.INSTANCE ||= At(new e()), D(e.INSTANCE.ignoreTargets.push(t))) : O.None;
	}
	static isTouchDevice() {
		return "ontouchstart" in It || navigator.maxTouchPoints > 0;
	}
	dispose() {
		this.handle &&= (this.handle.dispose(), null), super.dispose();
	}
	onTouchStart(e) {
		let t = Date.now();
		this.handle &&= (this.handle.dispose(), null);
		for (let n = 0, r = e.targetTouches.length; n < r; n++) {
			let r = e.targetTouches.item(n);
			this.activeTouches[r.identifier] = {
				id: r.identifier,
				initialTarget: r.target,
				initialTimeStamp: t,
				initialPageX: r.pageX,
				initialPageY: r.pageY,
				rollingTimestamps: [t],
				rollingPageX: [r.pageX],
				rollingPageY: [r.pageY]
			};
			let i = this.newGestureEvent(Lr.Start, r.target);
			i.pageX = r.pageX, i.pageY = r.pageY, this.dispatchEvent(i);
		}
		this.dispatched &&= (e.preventDefault(), e.stopPropagation(), !1);
	}
	onTouchEnd(t, n) {
		let r = Date.now(), i = Object.keys(this.activeTouches).length;
		for (let a = 0, o = n.changedTouches.length; a < o; a++) {
			let o = n.changedTouches.item(a);
			if (!this.activeTouches.hasOwnProperty(String(o.identifier))) {
				console.warn("move of an UNKNOWN touch", o);
				continue;
			}
			let s = this.activeTouches[o.identifier], c = Date.now() - s.initialTimeStamp;
			if (c < e.HOLD_DELAY && Math.abs(s.initialPageX - xt(s.rollingPageX)) < 30 && Math.abs(s.initialPageY - xt(s.rollingPageY)) < 30) {
				let e = this.newGestureEvent(Lr.Tap, s.initialTarget);
				e.pageX = xt(s.rollingPageX), e.pageY = xt(s.rollingPageY), this.dispatchEvent(e);
			} else if (c >= e.HOLD_DELAY && Math.abs(s.initialPageX - xt(s.rollingPageX)) < 30 && Math.abs(s.initialPageY - xt(s.rollingPageY)) < 30) {
				let e = this.newGestureEvent(Lr.Contextmenu, s.initialTarget);
				e.pageX = xt(s.rollingPageX), e.pageY = xt(s.rollingPageY), this.dispatchEvent(e);
			} else if (i === 1) {
				let e = xt(s.rollingPageX), n = xt(s.rollingPageY), i = xt(s.rollingTimestamps) - s.rollingTimestamps[0], a = e - s.rollingPageX[0], o = n - s.rollingPageY[0], c = [...this.targets].filter((e) => s.initialTarget instanceof Node && e.contains(s.initialTarget));
				this.inertia(t, c, r, Math.abs(a) / i, a > 0 ? 1 : -1, e, Math.abs(o) / i, o > 0 ? 1 : -1, n);
			}
			this.dispatchEvent(this.newGestureEvent(Lr.End, s.initialTarget)), delete this.activeTouches[o.identifier];
		}
		this.dispatched &&= (n.preventDefault(), n.stopPropagation(), !1);
	}
	newGestureEvent(e, t) {
		let n = document.createEvent("CustomEvent");
		return n.initEvent(e, !1, !0), n.initialTarget = t, n.tapCount = 0, n;
	}
	dispatchEvent(t) {
		if (t.type === Lr.Tap) {
			let n = (/* @__PURE__ */ new Date()).getTime(), r = 0;
			r = n - this._lastSetTapCountTime > e.CLEAR_TAP_COUNT_TIME ? 1 : 2, this._lastSetTapCountTime = n, t.tapCount = r;
		} else (t.type === Lr.Change || t.type === Lr.Contextmenu) && (this._lastSetTapCountTime = 0);
		if (t.initialTarget instanceof Node) {
			for (let e of this.ignoreTargets) if (e.contains(t.initialTarget)) return;
			let e = [];
			for (let n of this.targets) if (n.contains(t.initialTarget)) {
				let r = 0, i = t.initialTarget;
				for (; i && i !== n;) r++, i = i.parentElement;
				e.push([r, n]);
			}
			e.sort((e, t) => e[0] - t[0]);
			for (let [n, r] of e) r.dispatchEvent(t), this.dispatched = !0;
		}
	}
	inertia(t, n, r, i, a, o, s, c, l) {
		this.handle = Dr(t, () => {
			let u = Date.now(), d = u - r, f = 0, p = 0, m = !0;
			i += e.SCROLL_FRICTION * d, s += e.SCROLL_FRICTION * d, i > 0 && (m = !1, f = a * i * d), s > 0 && (m = !1, p = c * s * d);
			let h = this.newGestureEvent(Lr.Change);
			h.translationX = f, h.translationY = p, n.forEach((e) => e.dispatchEvent(h)), m || this.inertia(t, n, u, i, a, o + f, s, c, l + p);
		});
	}
	onTouchMove(e) {
		let t = Date.now();
		for (let n = 0, r = e.changedTouches.length; n < r; n++) {
			let r = e.changedTouches.item(n);
			if (!this.activeTouches.hasOwnProperty(String(r.identifier))) {
				console.warn("end of an UNKNOWN touch", r);
				continue;
			}
			let i = this.activeTouches[r.identifier], a = this.newGestureEvent(Lr.Change, i.initialTarget);
			a.translationX = r.pageX - xt(i.rollingPageX), a.translationY = r.pageY - xt(i.rollingPageY), a.pageX = r.pageX, a.pageY = r.pageY, this.dispatchEvent(a), i.rollingPageX.length > 3 && (i.rollingPageX.shift(), i.rollingPageY.shift(), i.rollingTimestamps.shift()), i.rollingPageX.push(r.pageX), i.rollingPageY.push(r.pageY), i.rollingTimestamps.push(t);
		}
		this.dispatched &&= (e.preventDefault(), e.stopPropagation(), !1);
	}
};
Rr.SCROLL_FRICTION = -.005, Rr.HOLD_DELAY = 700, Rr.CLEAR_TAP_COUNT_TIME = 400, w([Ir], Rr, "isTouchDevice", 1);
var zr = Rr, Br = class extends O {
	onclick(e, t) {
		this._register(j(e, M.CLICK, (n) => t(new Xn(pr(e), n))));
	}
	onmousedown(e, t) {
		this._register(j(e, M.MOUSE_DOWN, (n) => t(new Xn(pr(e), n))));
	}
	onmouseover(e, t) {
		this._register(j(e, M.MOUSE_OVER, (n) => t(new Xn(pr(e), n))));
	}
	onmouseleave(e, t) {
		this._register(j(e, M.MOUSE_LEAVE, (n) => t(new Xn(pr(e), n))));
	}
	onkeydown(e, t) {
		this._register(j(e, M.KEY_DOWN, (e) => t(new Kn(e))));
	}
	onkeyup(e, t) {
		this._register(j(e, M.KEY_UP, (e) => t(new Kn(e))));
	}
	oninput(e, t) {
		this._register(j(e, M.INPUT, t));
	}
	onblur(e, t) {
		this._register(j(e, M.BLUR, t));
	}
	onfocus(e, t) {
		this._register(j(e, M.FOCUS, t));
	}
	onchange(e, t) {
		this._register(j(e, M.CHANGE, t));
	}
	ignoreGesture(e) {
		return zr.ignoreTarget(e);
	}
}, Vr = 11, Hr = class extends Br {
	constructor(e) {
		super(), this._onActivate = e.onActivate, this.bgDomNode = document.createElement("div"), this.bgDomNode.className = "arrow-background", this.bgDomNode.style.position = "absolute", this.bgDomNode.style.width = e.bgWidth + "px", this.bgDomNode.style.height = e.bgHeight + "px", typeof e.top < "u" && (this.bgDomNode.style.top = "0px"), typeof e.left < "u" && (this.bgDomNode.style.left = "0px"), typeof e.bottom < "u" && (this.bgDomNode.style.bottom = "0px"), typeof e.right < "u" && (this.bgDomNode.style.right = "0px"), this.domNode = document.createElement("div"), this.domNode.className = e.className, this.domNode.style.position = "absolute", this.domNode.style.width = Vr + "px", this.domNode.style.height = Vr + "px", typeof e.top < "u" && (this.domNode.style.top = e.top + "px"), typeof e.left < "u" && (this.domNode.style.left = e.left + "px"), typeof e.bottom < "u" && (this.domNode.style.bottom = e.bottom + "px"), typeof e.right < "u" && (this.domNode.style.right = e.right + "px"), this._pointerMoveMonitor = this._register(new Fr()), this._register(Er(this.bgDomNode, M.POINTER_DOWN, (e) => this._arrowPointerDown(e))), this._register(Er(this.domNode, M.POINTER_DOWN, (e) => this._arrowPointerDown(e))), this._pointerdownRepeatTimer = this._register(new Or()), this._pointerdownScheduleRepeatTimer = this._register(new tr());
	}
	_arrowPointerDown(e) {
		e.target && e.target instanceof Element && (this._onActivate(), this._pointerdownRepeatTimer.cancel(), this._pointerdownScheduleRepeatTimer.cancelAndSet(() => {
			this._pointerdownRepeatTimer.cancelAndSet(() => this._onActivate(), 1e3 / 24, pr(e));
		}, 200), this._pointerMoveMonitor.startMonitoring(e.target, e.pointerId, e.buttons, (e) => {}, () => {
			this._pointerdownRepeatTimer.cancel(), this._pointerdownScheduleRepeatTimer.cancel();
		}), e.preventDefault());
	}
}, Ur = class e {
	constructor(e, t, n, r, i, a, o) {
		this._forceIntegerValues = e, this._scrollStateBrand = void 0, this._forceIntegerValues && (t |= 0, n |= 0, r |= 0, i |= 0, a |= 0, o |= 0), this.rawScrollLeft = r, this.rawScrollTop = o, t < 0 && (t = 0), r + t > n && (r = n - t), r < 0 && (r = 0), i < 0 && (i = 0), o + i > a && (o = a - i), o < 0 && (o = 0), this.width = t, this.scrollWidth = n, this.scrollLeft = r, this.height = i, this.scrollHeight = a, this.scrollTop = o;
	}
	equals(e) {
		return this.rawScrollLeft === e.rawScrollLeft && this.rawScrollTop === e.rawScrollTop && this.width === e.width && this.scrollWidth === e.scrollWidth && this.scrollLeft === e.scrollLeft && this.height === e.height && this.scrollHeight === e.scrollHeight && this.scrollTop === e.scrollTop;
	}
	withScrollDimensions(t, n) {
		return new e(this._forceIntegerValues, typeof t.width < "u" ? t.width : this.width, typeof t.scrollWidth < "u" ? t.scrollWidth : this.scrollWidth, n ? this.rawScrollLeft : this.scrollLeft, typeof t.height < "u" ? t.height : this.height, typeof t.scrollHeight < "u" ? t.scrollHeight : this.scrollHeight, n ? this.rawScrollTop : this.scrollTop);
	}
	withScrollPosition(t) {
		return new e(this._forceIntegerValues, this.width, this.scrollWidth, typeof t.scrollLeft < "u" ? t.scrollLeft : this.rawScrollLeft, this.height, this.scrollHeight, typeof t.scrollTop < "u" ? t.scrollTop : this.rawScrollTop);
	}
	createScrollEvent(e, t) {
		let n = this.width !== e.width, r = this.scrollWidth !== e.scrollWidth, i = this.scrollLeft !== e.scrollLeft, a = this.height !== e.height, o = this.scrollHeight !== e.scrollHeight, s = this.scrollTop !== e.scrollTop;
		return {
			inSmoothScrolling: t,
			oldWidth: e.width,
			oldScrollWidth: e.scrollWidth,
			oldScrollLeft: e.scrollLeft,
			width: this.width,
			scrollWidth: this.scrollWidth,
			scrollLeft: this.scrollLeft,
			oldHeight: e.height,
			oldScrollHeight: e.scrollHeight,
			oldScrollTop: e.scrollTop,
			height: this.height,
			scrollHeight: this.scrollHeight,
			scrollTop: this.scrollTop,
			widthChanged: n,
			scrollWidthChanged: r,
			scrollLeftChanged: i,
			heightChanged: a,
			scrollHeightChanged: o,
			scrollTopChanged: s
		};
	}
}, Wr = class extends O {
	constructor(e) {
		super(), this._scrollableBrand = void 0, this._onScroll = this._register(new A()), this.onScroll = this._onScroll.event, this._smoothScrollDuration = e.smoothScrollDuration, this._scheduleAtNextAnimationFrame = e.scheduleAtNextAnimationFrame, this._state = new Ur(e.forceIntegerValues, 0, 0, 0, 0, 0, 0), this._smoothScrolling = null;
	}
	dispose() {
		this._smoothScrolling &&= (this._smoothScrolling.dispose(), null), super.dispose();
	}
	setSmoothScrollDuration(e) {
		this._smoothScrollDuration = e;
	}
	validateScrollPosition(e) {
		return this._state.withScrollPosition(e);
	}
	getScrollDimensions() {
		return this._state;
	}
	setScrollDimensions(e, t) {
		let n = this._state.withScrollDimensions(e, t);
		this._setState(n, !!this._smoothScrolling), this._smoothScrolling?.acceptScrollDimensions(this._state);
	}
	getFutureScrollPosition() {
		return this._smoothScrolling ? this._smoothScrolling.to : this._state;
	}
	getCurrentScrollPosition() {
		return this._state;
	}
	setScrollPositionNow(e) {
		let t = this._state.withScrollPosition(e);
		this._smoothScrolling &&= (this._smoothScrolling.dispose(), null), this._setState(t, !1);
	}
	setScrollPositionSmooth(e, t) {
		if (this._smoothScrollDuration === 0) return this.setScrollPositionNow(e);
		if (this._smoothScrolling) {
			e = {
				scrollLeft: typeof e.scrollLeft > "u" ? this._smoothScrolling.to.scrollLeft : e.scrollLeft,
				scrollTop: typeof e.scrollTop > "u" ? this._smoothScrolling.to.scrollTop : e.scrollTop
			};
			let n = this._state.withScrollPosition(e);
			if (this._smoothScrolling.to.scrollLeft === n.scrollLeft && this._smoothScrolling.to.scrollTop === n.scrollTop) return;
			let r;
			r = t ? new Jr(this._smoothScrolling.from, n, this._smoothScrolling.startTime, this._smoothScrolling.duration) : this._smoothScrolling.combine(this._state, n, this._smoothScrollDuration), this._smoothScrolling.dispose(), this._smoothScrolling = r;
		} else {
			let t = this._state.withScrollPosition(e);
			this._smoothScrolling = Jr.start(this._state, t, this._smoothScrollDuration);
		}
		this._smoothScrolling.animationFrameDisposable = this._scheduleAtNextAnimationFrame(() => {
			this._smoothScrolling && (this._smoothScrolling.animationFrameDisposable = null, this._performSmoothScrolling());
		});
	}
	hasPendingScrollAnimation() {
		return !!this._smoothScrolling;
	}
	_performSmoothScrolling() {
		if (!this._smoothScrolling) return;
		let e = this._smoothScrolling.tick(), t = this._state.withScrollPosition(e);
		if (this._setState(t, !0), this._smoothScrolling) {
			if (e.isDone) {
				this._smoothScrolling.dispose(), this._smoothScrolling = null;
				return;
			}
			this._smoothScrolling.animationFrameDisposable = this._scheduleAtNextAnimationFrame(() => {
				this._smoothScrolling && (this._smoothScrolling.animationFrameDisposable = null, this._performSmoothScrolling());
			});
		}
	}
	_setState(e, t) {
		let n = this._state;
		n.equals(e) || (this._state = e, this._onScroll.fire(this._state.createScrollEvent(n, t)));
	}
}, Gr = class {
	constructor(e, t, n) {
		this.scrollLeft = e, this.scrollTop = t, this.isDone = n;
	}
};
function Kr(e, t) {
	let n = t - e;
	return function(t) {
		return e + n * Xr(t);
	};
}
function qr(e, t, n) {
	return function(r) {
		return r < n ? e(r / n) : t((r - n) / (1 - n));
	};
}
var Jr = class e {
	constructor(e, t, n, r) {
		this.from = e, this.to = t, this.duration = r, this.startTime = n, this.animationFrameDisposable = null, this._initAnimations();
	}
	_initAnimations() {
		this.scrollLeft = this._initAnimation(this.from.scrollLeft, this.to.scrollLeft, this.to.width), this.scrollTop = this._initAnimation(this.from.scrollTop, this.to.scrollTop, this.to.height);
	}
	_initAnimation(e, t, n) {
		if (Math.abs(e - t) > 2.5 * n) {
			let r, i;
			return e < t ? (r = e + .75 * n, i = t - .75 * n) : (r = e - .75 * n, i = t + .75 * n), qr(Kr(e, r), Kr(i, t), .33);
		}
		return Kr(e, t);
	}
	dispose() {
		this.animationFrameDisposable !== null && (this.animationFrameDisposable.dispose(), this.animationFrameDisposable = null);
	}
	acceptScrollDimensions(e) {
		this.to = e.withScrollPosition(this.to), this._initAnimations();
	}
	tick() {
		return this._tick(Date.now());
	}
	_tick(e) {
		let t = (e - this.startTime) / this.duration;
		return t < 1 ? new Gr(this.scrollLeft(t), this.scrollTop(t), !1) : new Gr(this.to.scrollLeft, this.to.scrollTop, !0);
	}
	combine(t, n, r) {
		return e.start(t, n, r);
	}
	static start(t, n, r) {
		r += 10;
		let i = Date.now() - 10;
		return new e(t, n, i, r);
	}
};
function Yr(e) {
	return e ** 3;
}
function Xr(e) {
	return 1 - Yr(1 - e);
}
var Zr = class extends O {
	constructor(e, t, n) {
		super(), this._visibility = e, this._visibleClassName = t, this._invisibleClassName = n, this._domNode = null, this._isVisible = !1, this._isNeeded = !1, this._rawShouldBeVisible = !1, this._shouldBeVisible = !1, this._revealTimer = this._register(new tr());
	}
	setVisibility(e) {
		this._visibility !== e && (this._visibility = e, this._updateShouldBeVisible());
	}
	setShouldBeVisible(e) {
		this._rawShouldBeVisible = e, this._updateShouldBeVisible();
	}
	_applyVisibilitySetting() {
		return this._visibility === 2 ? !1 : this._visibility === 3 || this._rawShouldBeVisible;
	}
	_updateShouldBeVisible() {
		let e = this._applyVisibilitySetting();
		this._shouldBeVisible !== e && (this._shouldBeVisible = e, this.ensureVisibility());
	}
	setIsNeeded(e) {
		this._isNeeded !== e && (this._isNeeded = e, this.ensureVisibility());
	}
	setDomNode(e) {
		this._domNode = e, this._domNode.setClassName(this._invisibleClassName), this.setShouldBeVisible(!1);
	}
	ensureVisibility() {
		this._isNeeded ? this._shouldBeVisible ? this._reveal() : this._hide(!0) : this._hide(!1);
	}
	_reveal() {
		this._isVisible || (this._isVisible = !0, this._revealTimer.setIfNotSet(() => {
			this._domNode?.setClassName(this._visibleClassName);
		}, 0));
	}
	_hide(e) {
		this._revealTimer.cancel(), this._isVisible && (this._isVisible = !1, this._domNode?.setClassName(this._invisibleClassName + (e ? " fade" : "")));
	}
}, Qr = 140, $r = class extends Br {
	constructor(e) {
		super(), this._lazyRender = e.lazyRender, this._host = e.host, this._scrollable = e.scrollable, this._scrollByPage = e.scrollByPage, this._scrollbarState = e.scrollbarState, this._visibilityController = this._register(new Zr(e.visibility, "visible scrollbar " + e.extraScrollbarClassName, "invisible scrollbar " + e.extraScrollbarClassName)), this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._pointerMoveMonitor = this._register(new Fr()), this._shouldRender = !0, this.domNode = Pr(document.createElement("div")), this.domNode.setAttribute("role", "presentation"), this.domNode.setAttribute("aria-hidden", "true"), this._visibilityController.setDomNode(this.domNode), this.domNode.setPosition("absolute"), this._register(j(this.domNode.domNode, M.POINTER_DOWN, (e) => this._domNodePointerDown(e)));
	}
	_createArrow(e) {
		let t = this._register(new Hr(e));
		this.domNode.domNode.appendChild(t.bgDomNode), this.domNode.domNode.appendChild(t.domNode);
	}
	_createSlider(e, t, n, r) {
		this.slider = Pr(document.createElement("div")), this.slider.setClassName("slider"), this.slider.setPosition("absolute"), this.slider.setTop(e), this.slider.setLeft(t), typeof n == "number" && this.slider.setWidth(n), typeof r == "number" && this.slider.setHeight(r), this.slider.setLayerHinting(!0), this.slider.setContain("strict"), this.domNode.domNode.appendChild(this.slider.domNode), this._register(j(this.slider.domNode, M.POINTER_DOWN, (e) => {
			e.button === 0 && (e.preventDefault(), this._sliderPointerDown(e));
		})), this.onclick(this.slider.domNode, (e) => {
			e.leftButton && e.stopPropagation();
		});
	}
	_onElementSize(e) {
		return this._scrollbarState.setVisibleSize(e) && (this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._shouldRender = !0, this._lazyRender || this.render()), this._shouldRender;
	}
	_onElementScrollSize(e) {
		return this._scrollbarState.setScrollSize(e) && (this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._shouldRender = !0, this._lazyRender || this.render()), this._shouldRender;
	}
	_onElementScrollPosition(e) {
		return this._scrollbarState.setScrollPosition(e) && (this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()), this._shouldRender = !0, this._lazyRender || this.render()), this._shouldRender;
	}
	beginReveal() {
		this._visibilityController.setShouldBeVisible(!0);
	}
	beginHide() {
		this._visibilityController.setShouldBeVisible(!1);
	}
	render() {
		this._shouldRender && (this._shouldRender = !1, this._renderDomNode(this._scrollbarState.getRectangleLargeSize(), this._scrollbarState.getRectangleSmallSize()), this._updateSlider(this._scrollbarState.getSliderSize(), this._scrollbarState.getArrowSize() + this._scrollbarState.getSliderPosition()));
	}
	_domNodePointerDown(e) {
		e.target === this.domNode.domNode && this._onPointerDown(e);
	}
	delegatePointerDown(e) {
		let t = this.domNode.domNode.getClientRects()[0].top, n = t + this._scrollbarState.getSliderPosition(), r = t + this._scrollbarState.getSliderPosition() + this._scrollbarState.getSliderSize(), i = this._sliderPointerPosition(e);
		n <= i && i <= r ? e.button === 0 && (e.preventDefault(), this._sliderPointerDown(e)) : this._onPointerDown(e);
	}
	_onPointerDown(e) {
		let t, n;
		if (e.target === this.domNode.domNode && typeof e.offsetX == "number" && typeof e.offsetY == "number") t = e.offsetX, n = e.offsetY;
		else {
			let r = jr(this.domNode.domNode);
			t = e.pageX - r.left, n = e.pageY - r.top;
		}
		let r = this._pointerDownRelativePosition(t, n);
		this._setDesiredScrollPositionNow(this._scrollByPage ? this._scrollbarState.getDesiredScrollPositionFromOffsetPaged(r) : this._scrollbarState.getDesiredScrollPositionFromOffset(r)), e.button === 0 && (e.preventDefault(), this._sliderPointerDown(e));
	}
	_sliderPointerDown(e) {
		if (!e.target || !(e.target instanceof Element)) return;
		let t = this._sliderPointerPosition(e), n = this._sliderOrthogonalPointerPosition(e), r = this._scrollbarState.clone();
		this.slider.toggleClassName("active", !0), this._pointerMoveMonitor.startMonitoring(e.target, e.pointerId, e.buttons, (e) => {
			let i = this._sliderOrthogonalPointerPosition(e), a = Math.abs(i - n);
			if (Cn && a > Qr) {
				this._setDesiredScrollPositionNow(r.getScrollPosition());
				return;
			}
			let o = this._sliderPointerPosition(e) - t;
			this._setDesiredScrollPositionNow(r.getDesiredScrollPositionFromDelta(o));
		}, () => {
			this.slider.toggleClassName("active", !1), this._host.onDragEnd();
		}), this._host.onDragStart();
	}
	_setDesiredScrollPositionNow(e) {
		let t = {};
		this.writeScrollPosition(t, e), this._scrollable.setScrollPositionNow(t);
	}
	updateScrollbarSize(e) {
		this._updateScrollbarSize(e), this._scrollbarState.setScrollbarSize(e), this._shouldRender = !0, this._lazyRender || this.render();
	}
	isNeeded() {
		return this._scrollbarState.isNeeded();
	}
}, ei = class e {
	constructor(e, t, n, r, i, a) {
		this._scrollbarSize = Math.round(t), this._oppositeScrollbarSize = Math.round(n), this._arrowSize = Math.round(e), this._visibleSize = r, this._scrollSize = i, this._scrollPosition = a, this._computedAvailableSize = 0, this._computedIsNeeded = !1, this._computedSliderSize = 0, this._computedSliderRatio = 0, this._computedSliderPosition = 0, this._refreshComputedValues();
	}
	clone() {
		return new e(this._arrowSize, this._scrollbarSize, this._oppositeScrollbarSize, this._visibleSize, this._scrollSize, this._scrollPosition);
	}
	setVisibleSize(e) {
		let t = Math.round(e);
		return this._visibleSize !== t && (this._visibleSize = t, this._refreshComputedValues(), !0);
	}
	setScrollSize(e) {
		let t = Math.round(e);
		return this._scrollSize !== t && (this._scrollSize = t, this._refreshComputedValues(), !0);
	}
	setScrollPosition(e) {
		let t = Math.round(e);
		return this._scrollPosition !== t && (this._scrollPosition = t, this._refreshComputedValues(), !0);
	}
	setScrollbarSize(e) {
		this._scrollbarSize = Math.round(e);
	}
	setOppositeScrollbarSize(e) {
		this._oppositeScrollbarSize = Math.round(e);
	}
	static _computeValues(e, t, n, r, i) {
		let a = Math.max(0, n - e), o = Math.max(0, a - 2 * t), s = r > 0 && r > n;
		if (!s) return {
			computedAvailableSize: Math.round(a),
			computedIsNeeded: s,
			computedSliderSize: Math.round(o),
			computedSliderRatio: 0,
			computedSliderPosition: 0
		};
		let c = Math.round(Math.max(20, Math.floor(n * o / r))), l = (o - c) / (r - n), u = i * l;
		return {
			computedAvailableSize: Math.round(a),
			computedIsNeeded: s,
			computedSliderSize: Math.round(c),
			computedSliderRatio: l,
			computedSliderPosition: Math.round(u)
		};
	}
	_refreshComputedValues() {
		let t = e._computeValues(this._oppositeScrollbarSize, this._arrowSize, this._visibleSize, this._scrollSize, this._scrollPosition);
		this._computedAvailableSize = t.computedAvailableSize, this._computedIsNeeded = t.computedIsNeeded, this._computedSliderSize = t.computedSliderSize, this._computedSliderRatio = t.computedSliderRatio, this._computedSliderPosition = t.computedSliderPosition;
	}
	getArrowSize() {
		return this._arrowSize;
	}
	getScrollPosition() {
		return this._scrollPosition;
	}
	getRectangleLargeSize() {
		return this._computedAvailableSize;
	}
	getRectangleSmallSize() {
		return this._scrollbarSize;
	}
	isNeeded() {
		return this._computedIsNeeded;
	}
	getSliderSize() {
		return this._computedSliderSize;
	}
	getSliderPosition() {
		return this._computedSliderPosition;
	}
	getDesiredScrollPositionFromOffset(e) {
		if (!this._computedIsNeeded) return 0;
		let t = e - this._arrowSize - this._computedSliderSize / 2;
		return Math.round(t / this._computedSliderRatio);
	}
	getDesiredScrollPositionFromOffsetPaged(e) {
		if (!this._computedIsNeeded) return 0;
		let t = e - this._arrowSize, n = this._scrollPosition;
		return t < this._computedSliderPosition ? n -= this._visibleSize : n += this._visibleSize, n;
	}
	getDesiredScrollPositionFromDelta(e) {
		if (!this._computedIsNeeded) return 0;
		let t = this._computedSliderPosition + e;
		return Math.round(t / this._computedSliderRatio);
	}
}, ti = class extends $r {
	constructor(e, t, n) {
		let r = e.getScrollDimensions(), i = e.getCurrentScrollPosition();
		if (super({
			lazyRender: t.lazyRender,
			host: n,
			scrollbarState: new ei(t.horizontalHasArrows ? t.arrowSize : 0, t.horizontal === 2 ? 0 : t.horizontalScrollbarSize, t.vertical === 2 ? 0 : t.verticalScrollbarSize, r.width, r.scrollWidth, i.scrollLeft),
			visibility: t.horizontal,
			extraScrollbarClassName: "horizontal",
			scrollable: e,
			scrollByPage: t.scrollByPage
		}), t.horizontalHasArrows) throw Error("horizontalHasArrows is not supported in xterm.js");
		this._createSlider(Math.floor((t.horizontalScrollbarSize - t.horizontalSliderSize) / 2), 0, void 0, t.horizontalSliderSize);
	}
	_updateSlider(e, t) {
		this.slider.setWidth(e), this.slider.setLeft(t);
	}
	_renderDomNode(e, t) {
		this.domNode.setWidth(e), this.domNode.setHeight(t), this.domNode.setLeft(0), this.domNode.setBottom(0);
	}
	onDidScroll(e) {
		return this._shouldRender = this._onElementScrollSize(e.scrollWidth) || this._shouldRender, this._shouldRender = this._onElementScrollPosition(e.scrollLeft) || this._shouldRender, this._shouldRender = this._onElementSize(e.width) || this._shouldRender, this._shouldRender;
	}
	_pointerDownRelativePosition(e, t) {
		return e;
	}
	_sliderPointerPosition(e) {
		return e.pageX;
	}
	_sliderOrthogonalPointerPosition(e) {
		return e.pageY;
	}
	_updateScrollbarSize(e) {
		this.slider.setHeight(e);
	}
	writeScrollPosition(e, t) {
		e.scrollLeft = t;
	}
	updateOptions(e) {
		this.updateScrollbarSize(e.horizontal === 2 ? 0 : e.horizontalScrollbarSize), this._scrollbarState.setOppositeScrollbarSize(e.vertical === 2 ? 0 : e.verticalScrollbarSize), this._visibilityController.setVisibility(e.horizontal), this._scrollByPage = e.scrollByPage;
	}
}, ni = class extends $r {
	constructor(e, t, n) {
		let r = e.getScrollDimensions(), i = e.getCurrentScrollPosition();
		if (super({
			lazyRender: t.lazyRender,
			host: n,
			scrollbarState: new ei(t.verticalHasArrows ? t.arrowSize : 0, t.vertical === 2 ? 0 : t.verticalScrollbarSize, 0, r.height, r.scrollHeight, i.scrollTop),
			visibility: t.vertical,
			extraScrollbarClassName: "vertical",
			scrollable: e,
			scrollByPage: t.scrollByPage
		}), t.verticalHasArrows) throw Error("horizontalHasArrows is not supported in xterm.js");
		this._createSlider(0, Math.floor((t.verticalScrollbarSize - t.verticalSliderSize) / 2), t.verticalSliderSize, void 0);
	}
	_updateSlider(e, t) {
		this.slider.setHeight(e), this.slider.setTop(t);
	}
	_renderDomNode(e, t) {
		this.domNode.setWidth(t), this.domNode.setHeight(e), this.domNode.setRight(0), this.domNode.setTop(0);
	}
	onDidScroll(e) {
		return this._shouldRender = this._onElementScrollSize(e.scrollHeight) || this._shouldRender, this._shouldRender = this._onElementScrollPosition(e.scrollTop) || this._shouldRender, this._shouldRender = this._onElementSize(e.height) || this._shouldRender, this._shouldRender;
	}
	_pointerDownRelativePosition(e, t) {
		return t;
	}
	_sliderPointerPosition(e) {
		return e.pageY;
	}
	_sliderOrthogonalPointerPosition(e) {
		return e.pageX;
	}
	_updateScrollbarSize(e) {
		this.slider.setWidth(e);
	}
	writeScrollPosition(e, t) {
		e.scrollTop = t;
	}
	updateOptions(e) {
		this.updateScrollbarSize(e.vertical === 2 ? 0 : e.verticalScrollbarSize), this._scrollbarState.setOppositeScrollbarSize(0), this._visibilityController.setVisibility(e.vertical), this._scrollByPage = e.scrollByPage;
	}
}, ri = 500, ii = 50, ai = !0, oi = class {
	constructor(e, t, n) {
		this.timestamp = e, this.deltaX = t, this.deltaY = n, this.score = 0;
	}
}, si = class {
	constructor() {
		this._capacity = 5, this._memory = [], this._front = -1, this._rear = -1;
	}
	isPhysicalMouseWheel() {
		if (this._front === -1 && this._rear === -1) return !1;
		let e = 1, t = 0, n = 1, r = this._rear;
		do {
			let i = r === this._front ? e : 2 ** -n;
			if (e -= i, t += this._memory[r].score * i, r === this._front) break;
			r = (this._capacity + r - 1) % this._capacity, n++;
		} while (1);
		return t <= .5;
	}
	acceptStandardWheelEvent(e) {
		if (cn) {
			let t = rn(pr(e.browserEvent));
			this.accept(Date.now(), e.deltaX * t, e.deltaY * t);
		} else this.accept(Date.now(), e.deltaX, e.deltaY);
	}
	accept(e, t, n) {
		let r = null, i = new oi(e, t, n);
		this._front === -1 && this._rear === -1 ? (this._memory[0] = i, this._front = 0, this._rear = 0) : (r = this._memory[this._rear], this._rear = (this._rear + 1) % this._capacity, this._rear === this._front && (this._front = (this._front + 1) % this._capacity), this._memory[this._rear] = i), i.score = this._computeScore(i, r);
	}
	_computeScore(e, t) {
		if (Math.abs(e.deltaX) > 0 && Math.abs(e.deltaY) > 0) return 1;
		let n = .5;
		if (this._isAlmostInt(e.deltaX) && this._isAlmostInt(e.deltaY) || (n += .25), t) {
			let r = Math.abs(e.deltaX), i = Math.abs(e.deltaY), a = Math.abs(t.deltaX), o = Math.abs(t.deltaY), s = Math.max(Math.min(r, a), 1), c = Math.max(Math.min(i, o), 1), l = Math.max(r, a), u = Math.max(i, o);
			l % s === 0 && u % c === 0 && (n -= .5);
		}
		return Math.min(Math.max(n, 0), 1);
	}
	_isAlmostInt(e) {
		return Math.abs(Math.round(e) - e) < .01;
	}
};
si.INSTANCE = new si();
var ci = si, li = class extends Br {
	constructor(e, t, n) {
		super(), this._onScroll = this._register(new A()), this.onScroll = this._onScroll.event, this._onWillScroll = this._register(new A()), this.onWillScroll = this._onWillScroll.event, this._options = di(t), this._scrollable = n, this._register(this._scrollable.onScroll((e) => {
			this._onWillScroll.fire(e), this._onDidScroll(e), this._onScroll.fire(e);
		}));
		let r = {
			onMouseWheel: (e) => this._onMouseWheel(e),
			onDragStart: () => this._onDragStart(),
			onDragEnd: () => this._onDragEnd()
		};
		this._verticalScrollbar = this._register(new ni(this._scrollable, this._options, r)), this._horizontalScrollbar = this._register(new ti(this._scrollable, this._options, r)), this._domNode = document.createElement("div"), this._domNode.className = "xterm-scrollable-element " + this._options.className, this._domNode.setAttribute("role", "presentation"), this._domNode.style.position = "relative", this._domNode.appendChild(e), this._domNode.appendChild(this._horizontalScrollbar.domNode.domNode), this._domNode.appendChild(this._verticalScrollbar.domNode.domNode), this._options.useShadows ? (this._leftShadowDomNode = Pr(document.createElement("div")), this._leftShadowDomNode.setClassName("shadow"), this._domNode.appendChild(this._leftShadowDomNode.domNode), this._topShadowDomNode = Pr(document.createElement("div")), this._topShadowDomNode.setClassName("shadow"), this._domNode.appendChild(this._topShadowDomNode.domNode), this._topLeftShadowDomNode = Pr(document.createElement("div")), this._topLeftShadowDomNode.setClassName("shadow"), this._domNode.appendChild(this._topLeftShadowDomNode.domNode)) : (this._leftShadowDomNode = null, this._topShadowDomNode = null, this._topLeftShadowDomNode = null), this._listenOnDomNode = this._options.listenOnDomNode || this._domNode, this._mouseWheelToDispose = [], this._setListeningToMouseWheel(this._options.handleMouseWheel), this.onmouseover(this._listenOnDomNode, (e) => this._onMouseOver(e)), this.onmouseleave(this._listenOnDomNode, (e) => this._onMouseLeave(e)), this._hideTimeout = this._register(new tr()), this._isDragging = !1, this._mouseIsOver = !1, this._shouldRender = !0, this._revealOnScroll = !0;
	}
	get options() {
		return this._options;
	}
	dispose() {
		this._mouseWheelToDispose = jt(this._mouseWheelToDispose), super.dispose();
	}
	getDomNode() {
		return this._domNode;
	}
	getOverviewRulerLayoutInfo() {
		return {
			parent: this._domNode,
			insertBefore: this._verticalScrollbar.domNode.domNode
		};
	}
	delegateVerticalScrollbarPointerDown(e) {
		this._verticalScrollbar.delegatePointerDown(e);
	}
	getScrollDimensions() {
		return this._scrollable.getScrollDimensions();
	}
	setScrollDimensions(e) {
		this._scrollable.setScrollDimensions(e, !1);
	}
	updateClassName(e) {
		this._options.className = e, wn && (this._options.className += " mac"), this._domNode.className = "xterm-scrollable-element " + this._options.className;
	}
	updateOptions(e) {
		typeof e.handleMouseWheel < "u" && (this._options.handleMouseWheel = e.handleMouseWheel, this._setListeningToMouseWheel(this._options.handleMouseWheel)), typeof e.mouseWheelScrollSensitivity < "u" && (this._options.mouseWheelScrollSensitivity = e.mouseWheelScrollSensitivity), typeof e.fastScrollSensitivity < "u" && (this._options.fastScrollSensitivity = e.fastScrollSensitivity), typeof e.scrollPredominantAxis < "u" && (this._options.scrollPredominantAxis = e.scrollPredominantAxis), typeof e.horizontal < "u" && (this._options.horizontal = e.horizontal), typeof e.vertical < "u" && (this._options.vertical = e.vertical), typeof e.horizontalScrollbarSize < "u" && (this._options.horizontalScrollbarSize = e.horizontalScrollbarSize), typeof e.verticalScrollbarSize < "u" && (this._options.verticalScrollbarSize = e.verticalScrollbarSize), typeof e.scrollByPage < "u" && (this._options.scrollByPage = e.scrollByPage), this._horizontalScrollbar.updateOptions(this._options), this._verticalScrollbar.updateOptions(this._options), this._options.lazyRender || this._render();
	}
	setRevealOnScroll(e) {
		this._revealOnScroll = e;
	}
	delegateScrollFromMouseWheelEvent(e) {
		this._onMouseWheel(new Zn(e));
	}
	_setListeningToMouseWheel(e) {
		this._mouseWheelToDispose.length > 0 !== e && (this._mouseWheelToDispose = jt(this._mouseWheelToDispose), e) && this._mouseWheelToDispose.push(j(this._listenOnDomNode, M.MOUSE_WHEEL, (e) => {
			this._onMouseWheel(new Zn(e));
		}, { passive: !1 }));
	}
	_onMouseWheel(e) {
		if (e.browserEvent?.defaultPrevented) return;
		let t = ci.INSTANCE;
		ai && t.acceptStandardWheelEvent(e);
		let n = !1;
		if (e.deltaY || e.deltaX) {
			let r = e.deltaY * this._options.mouseWheelScrollSensitivity, i = e.deltaX * this._options.mouseWheelScrollSensitivity;
			this._options.scrollPredominantAxis && (this._options.scrollYToX && i + r === 0 ? i = r = 0 : Math.abs(r) >= Math.abs(i) ? i = 0 : r = 0), this._options.flipAxes && ([r, i] = [i, r]);
			let a = !wn && e.browserEvent && e.browserEvent.shiftKey;
			(this._options.scrollYToX || a) && !i && (i = r, r = 0), e.browserEvent && e.browserEvent.altKey && (i *= this._options.fastScrollSensitivity, r *= this._options.fastScrollSensitivity);
			let o = this._scrollable.getFutureScrollPosition(), s = {};
			if (r) {
				let e = ii * r, t = o.scrollTop - (e < 0 ? Math.floor(e) : Math.ceil(e));
				this._verticalScrollbar.writeScrollPosition(s, t);
			}
			if (i) {
				let e = ii * i, t = o.scrollLeft - (e < 0 ? Math.floor(e) : Math.ceil(e));
				this._horizontalScrollbar.writeScrollPosition(s, t);
			}
			s = this._scrollable.validateScrollPosition(s), (o.scrollLeft !== s.scrollLeft || o.scrollTop !== s.scrollTop) && (ai && this._options.mouseWheelSmoothScroll && t.isPhysicalMouseWheel() ? this._scrollable.setScrollPositionSmooth(s) : this._scrollable.setScrollPositionNow(s), n = !0);
		}
		let r = n;
		!r && this._options.alwaysConsumeMouseWheel && (r = !0), !r && this._options.consumeMouseWheelIfScrollbarIsNeeded && (this._verticalScrollbar.isNeeded() || this._horizontalScrollbar.isNeeded()) && (r = !0), r && (e.preventDefault(), e.stopPropagation());
	}
	_onDidScroll(e) {
		this._shouldRender = this._horizontalScrollbar.onDidScroll(e) || this._shouldRender, this._shouldRender = this._verticalScrollbar.onDidScroll(e) || this._shouldRender, this._options.useShadows && (this._shouldRender = !0), this._revealOnScroll && this._reveal(), this._options.lazyRender || this._render();
	}
	renderNow() {
		if (!this._options.lazyRender) throw Error("Please use `lazyRender` together with `renderNow`!");
		this._render();
	}
	_render() {
		if (this._shouldRender && (this._shouldRender = !1, this._horizontalScrollbar.render(), this._verticalScrollbar.render(), this._options.useShadows)) {
			let e = this._scrollable.getCurrentScrollPosition(), t = e.scrollTop > 0, n = e.scrollLeft > 0, r = n ? " left" : "", i = t ? " top" : "", a = n || t ? " top-left-corner" : "";
			this._leftShadowDomNode.setClassName(`shadow${r}`), this._topShadowDomNode.setClassName(`shadow${i}`), this._topLeftShadowDomNode.setClassName(`shadow${a}${i}${r}`);
		}
	}
	_onDragStart() {
		this._isDragging = !0, this._reveal();
	}
	_onDragEnd() {
		this._isDragging = !1, this._hide();
	}
	_onMouseLeave(e) {
		this._mouseIsOver = !1, this._hide();
	}
	_onMouseOver(e) {
		this._mouseIsOver = !0, this._reveal();
	}
	_reveal() {
		this._verticalScrollbar.beginReveal(), this._horizontalScrollbar.beginReveal(), this._scheduleHide();
	}
	_hide() {
		!this._mouseIsOver && !this._isDragging && (this._verticalScrollbar.beginHide(), this._horizontalScrollbar.beginHide());
	}
	_scheduleHide() {
		!this._mouseIsOver && !this._isDragging && this._hideTimeout.cancelAndSet(() => this._hide(), ri);
	}
}, ui = class extends li {
	constructor(e, t, n) {
		super(e, t, n);
	}
	setScrollPosition(e) {
		e.reuseAnimation ? this._scrollable.setScrollPositionSmooth(e, e.reuseAnimation) : this._scrollable.setScrollPositionNow(e);
	}
	getScrollPosition() {
		return this._scrollable.getCurrentScrollPosition();
	}
};
function di(e) {
	let t = {
		lazyRender: typeof e.lazyRender < "u" && e.lazyRender,
		className: typeof e.className < "u" ? e.className : "",
		useShadows: typeof e.useShadows < "u" ? e.useShadows : !0,
		handleMouseWheel: typeof e.handleMouseWheel < "u" ? e.handleMouseWheel : !0,
		flipAxes: typeof e.flipAxes < "u" && e.flipAxes,
		consumeMouseWheelIfScrollbarIsNeeded: typeof e.consumeMouseWheelIfScrollbarIsNeeded < "u" && e.consumeMouseWheelIfScrollbarIsNeeded,
		alwaysConsumeMouseWheel: typeof e.alwaysConsumeMouseWheel < "u" && e.alwaysConsumeMouseWheel,
		scrollYToX: typeof e.scrollYToX < "u" && e.scrollYToX,
		mouseWheelScrollSensitivity: typeof e.mouseWheelScrollSensitivity < "u" ? e.mouseWheelScrollSensitivity : 1,
		fastScrollSensitivity: typeof e.fastScrollSensitivity < "u" ? e.fastScrollSensitivity : 5,
		scrollPredominantAxis: typeof e.scrollPredominantAxis < "u" ? e.scrollPredominantAxis : !0,
		mouseWheelSmoothScroll: typeof e.mouseWheelSmoothScroll < "u" ? e.mouseWheelSmoothScroll : !0,
		arrowSize: typeof e.arrowSize < "u" ? e.arrowSize : 11,
		listenOnDomNode: typeof e.listenOnDomNode < "u" ? e.listenOnDomNode : null,
		horizontal: typeof e.horizontal < "u" ? e.horizontal : 1,
		horizontalScrollbarSize: typeof e.horizontalScrollbarSize < "u" ? e.horizontalScrollbarSize : 10,
		horizontalSliderSize: typeof e.horizontalSliderSize < "u" ? e.horizontalSliderSize : 0,
		horizontalHasArrows: typeof e.horizontalHasArrows < "u" && e.horizontalHasArrows,
		vertical: typeof e.vertical < "u" ? e.vertical : 1,
		verticalScrollbarSize: typeof e.verticalScrollbarSize < "u" ? e.verticalScrollbarSize : 10,
		verticalHasArrows: typeof e.verticalHasArrows < "u" && e.verticalHasArrows,
		verticalSliderSize: typeof e.verticalSliderSize < "u" ? e.verticalSliderSize : 0,
		scrollByPage: typeof e.scrollByPage < "u" && e.scrollByPage
	};
	return t.horizontalSliderSize = typeof e.horizontalSliderSize < "u" ? e.horizontalSliderSize : t.horizontalScrollbarSize, t.verticalSliderSize = typeof e.verticalSliderSize < "u" ? e.verticalSliderSize : t.verticalScrollbarSize, wn && (t.className += " mac"), t;
}
var fi = class extends O {
	constructor(e, t, n, r, i, a, o, s) {
		super(), this._bufferService = n, this._optionsService = o, this._renderService = s, this._onRequestScrollLines = this._register(new A()), this.onRequestScrollLines = this._onRequestScrollLines.event, this._isSyncing = !1, this._isHandlingScroll = !1, this._suppressOnScrollHandler = !1;
		let c = this._register(new Wr({
			forceIntegerValues: !1,
			smoothScrollDuration: this._optionsService.rawOptions.smoothScrollDuration,
			scheduleAtNextAnimationFrame: (e) => Dr(r.window, e)
		}));
		this._register(this._optionsService.onSpecificOptionChange("smoothScrollDuration", () => {
			c.setSmoothScrollDuration(this._optionsService.rawOptions.smoothScrollDuration);
		})), this._scrollableElement = this._register(new ui(t, {
			vertical: 1,
			horizontal: 2,
			useShadows: !1,
			mouseWheelSmoothScroll: !0,
			...this._getChangeOptions()
		}, c)), this._register(this._optionsService.onMultipleOptionChange([
			"scrollSensitivity",
			"fastScrollSensitivity",
			"overviewRuler"
		], () => this._scrollableElement.updateOptions(this._getChangeOptions()))), this._register(i.onProtocolChange((e) => {
			this._scrollableElement.updateOptions({ handleMouseWheel: !(e & 16) });
		})), this._scrollableElement.setScrollDimensions({
			height: 0,
			scrollHeight: 0
		}), this._register(Vt.runAndSubscribe(a.onChangeColors, () => {
			this._scrollableElement.getDomNode().style.backgroundColor = a.colors.background.css;
		})), e.appendChild(this._scrollableElement.getDomNode()), this._register(D(() => this._scrollableElement.getDomNode().remove())), this._styleElement = r.mainDocument.createElement("style"), t.appendChild(this._styleElement), this._register(D(() => this._styleElement.remove())), this._register(Vt.runAndSubscribe(a.onChangeColors, () => {
			this._styleElement.textContent = [
				".xterm .xterm-scrollable-element > .scrollbar > .slider {",
				`  background: ${a.colors.scrollbarSliderBackground.css};`,
				"}",
				".xterm .xterm-scrollable-element > .scrollbar > .slider:hover {",
				`  background: ${a.colors.scrollbarSliderHoverBackground.css};`,
				"}",
				".xterm .xterm-scrollable-element > .scrollbar > .slider.active {",
				`  background: ${a.colors.scrollbarSliderActiveBackground.css};`,
				"}"
			].join("\n");
		})), this._register(this._bufferService.onResize(() => this.queueSync())), this._register(this._bufferService.buffers.onBufferActivate(() => {
			this._latestYDisp = void 0, this.queueSync();
		})), this._register(this._bufferService.onScroll(() => this._sync())), this._register(this._scrollableElement.onScroll((e) => this._handleScroll(e)));
	}
	scrollLines(e) {
		let t = this._scrollableElement.getScrollPosition();
		this._scrollableElement.setScrollPosition({
			reuseAnimation: !0,
			scrollTop: t.scrollTop + e * this._renderService.dimensions.css.cell.height
		});
	}
	scrollToLine(e, t) {
		t && (this._latestYDisp = e), this._scrollableElement.setScrollPosition({
			reuseAnimation: !t,
			scrollTop: e * this._renderService.dimensions.css.cell.height
		});
	}
	_getChangeOptions() {
		return {
			mouseWheelScrollSensitivity: this._optionsService.rawOptions.scrollSensitivity,
			fastScrollSensitivity: this._optionsService.rawOptions.fastScrollSensitivity,
			verticalScrollbarSize: this._optionsService.rawOptions.overviewRuler?.width || 14
		};
	}
	queueSync(e) {
		e !== void 0 && (this._latestYDisp = e), this._queuedAnimationFrame === void 0 && (this._queuedAnimationFrame = this._renderService.addRefreshCallback(() => {
			this._queuedAnimationFrame = void 0, this._sync(this._latestYDisp);
		}));
	}
	_sync(e = this._bufferService.buffer.ydisp) {
		!this._renderService || this._isSyncing || (this._isSyncing = !0, this._suppressOnScrollHandler = !0, this._scrollableElement.setScrollDimensions({
			height: this._renderService.dimensions.css.canvas.height,
			scrollHeight: this._renderService.dimensions.css.cell.height * this._bufferService.buffer.lines.length
		}), this._suppressOnScrollHandler = !1, e !== this._latestYDisp && this._scrollableElement.setScrollPosition({ scrollTop: e * this._renderService.dimensions.css.cell.height }), this._isSyncing = !1);
	}
	_handleScroll(e) {
		if (!this._renderService || this._isHandlingScroll || this._suppressOnScrollHandler) return;
		this._isHandlingScroll = !0;
		let t = Math.round(e.scrollTop / this._renderService.dimensions.css.cell.height), n = t - this._bufferService.buffer.ydisp;
		n !== 0 && (this._latestYDisp = t, this._onRequestScrollLines.fire(n)), this._isHandlingScroll = !1;
	}
};
fi = w([
	T(2, qe),
	T(3, ot),
	T(4, Je),
	T(5, dt),
	T(6, $e),
	T(7, ct)
], fi);
var pi = class extends O {
	constructor(e, t, n, r, i) {
		super(), this._screenElement = e, this._bufferService = t, this._coreBrowserService = n, this._decorationService = r, this._renderService = i, this._decorationElements = /* @__PURE__ */ new Map(), this._altBufferIsActive = !1, this._dimensionsChanged = !1, this._container = document.createElement("div"), this._container.classList.add("xterm-decoration-container"), this._screenElement.appendChild(this._container), this._register(this._renderService.onRenderedViewportChange(() => this._doRefreshDecorations())), this._register(this._renderService.onDimensionsChange(() => {
			this._dimensionsChanged = !0, this._queueRefresh();
		})), this._register(this._coreBrowserService.onDprChange(() => this._queueRefresh())), this._register(this._bufferService.buffers.onBufferActivate(() => {
			this._altBufferIsActive = this._bufferService.buffer === this._bufferService.buffers.alt;
		})), this._register(this._decorationService.onDecorationRegistered(() => this._queueRefresh())), this._register(this._decorationService.onDecorationRemoved((e) => this._removeDecoration(e))), this._register(D(() => {
			this._container.remove(), this._decorationElements.clear();
		}));
	}
	_queueRefresh() {
		this._animationFrame === void 0 && (this._animationFrame = this._renderService.addRefreshCallback(() => {
			this._doRefreshDecorations(), this._animationFrame = void 0;
		}));
	}
	_doRefreshDecorations() {
		for (let e of this._decorationService.decorations) this._renderDecoration(e);
		this._dimensionsChanged = !1;
	}
	_renderDecoration(e) {
		this._refreshStyle(e), this._dimensionsChanged && this._refreshXPosition(e);
	}
	_createElement(e) {
		let t = this._coreBrowserService.mainDocument.createElement("div");
		t.classList.add("xterm-decoration"), t.classList.toggle("xterm-decoration-top-layer", e?.options?.layer === "top"), t.style.width = `${Math.round((e.options.width || 1) * this._renderService.dimensions.css.cell.width)}px`, t.style.height = `${(e.options.height || 1) * this._renderService.dimensions.css.cell.height}px`, t.style.top = `${(e.marker.line - this._bufferService.buffers.active.ydisp) * this._renderService.dimensions.css.cell.height}px`, t.style.lineHeight = `${this._renderService.dimensions.css.cell.height}px`;
		let n = e.options.x ?? 0;
		return n && n > this._bufferService.cols && (t.style.display = "none"), this._refreshXPosition(e, t), t;
	}
	_refreshStyle(e) {
		let t = e.marker.line - this._bufferService.buffers.active.ydisp;
		if (t < 0 || t >= this._bufferService.rows) e.element && (e.element.style.display = "none", e.onRenderEmitter.fire(e.element));
		else {
			let n = this._decorationElements.get(e);
			n || (n = this._createElement(e), e.element = n, this._decorationElements.set(e, n), this._container.appendChild(n), e.onDispose(() => {
				this._decorationElements.delete(e), n.remove();
			})), n.style.display = this._altBufferIsActive ? "none" : "block", this._altBufferIsActive || (n.style.width = `${Math.round((e.options.width || 1) * this._renderService.dimensions.css.cell.width)}px`, n.style.height = `${(e.options.height || 1) * this._renderService.dimensions.css.cell.height}px`, n.style.top = `${t * this._renderService.dimensions.css.cell.height}px`, n.style.lineHeight = `${this._renderService.dimensions.css.cell.height}px`), e.onRenderEmitter.fire(n);
		}
	}
	_refreshXPosition(e, t = e.element) {
		if (!t) return;
		let n = e.options.x ?? 0;
		(e.options.anchor || "left") === "right" ? t.style.right = n ? `${n * this._renderService.dimensions.css.cell.width}px` : "" : t.style.left = n ? `${n * this._renderService.dimensions.css.cell.width}px` : "";
	}
	_removeDecoration(e) {
		this._decorationElements.get(e)?.remove(), this._decorationElements.delete(e), e.dispose();
	}
};
pi = w([
	T(1, qe),
	T(2, ot),
	T(3, nt),
	T(4, ct)
], pi);
var mi = class {
	constructor() {
		this._zones = [], this._zonePool = [], this._zonePoolIndex = 0, this._linePadding = {
			full: 0,
			left: 0,
			center: 0,
			right: 0
		};
	}
	get zones() {
		return this._zonePool.length = Math.min(this._zonePool.length, this._zones.length), this._zones;
	}
	clear() {
		this._zones.length = 0, this._zonePoolIndex = 0;
	}
	addDecoration(e) {
		if (e.options.overviewRulerOptions) {
			for (let t of this._zones) if (t.color === e.options.overviewRulerOptions.color && t.position === e.options.overviewRulerOptions.position) {
				if (this._lineIntersectsZone(t, e.marker.line)) return;
				if (this._lineAdjacentToZone(t, e.marker.line, e.options.overviewRulerOptions.position)) {
					this._addLineToZone(t, e.marker.line);
					return;
				}
			}
			if (this._zonePoolIndex < this._zonePool.length) {
				this._zonePool[this._zonePoolIndex].color = e.options.overviewRulerOptions.color, this._zonePool[this._zonePoolIndex].position = e.options.overviewRulerOptions.position, this._zonePool[this._zonePoolIndex].startBufferLine = e.marker.line, this._zonePool[this._zonePoolIndex].endBufferLine = e.marker.line, this._zones.push(this._zonePool[this._zonePoolIndex++]);
				return;
			}
			this._zones.push({
				color: e.options.overviewRulerOptions.color,
				position: e.options.overviewRulerOptions.position,
				startBufferLine: e.marker.line,
				endBufferLine: e.marker.line
			}), this._zonePool.push(this._zones[this._zones.length - 1]), this._zonePoolIndex++;
		}
	}
	setPadding(e) {
		this._linePadding = e;
	}
	_lineIntersectsZone(e, t) {
		return t >= e.startBufferLine && t <= e.endBufferLine;
	}
	_lineAdjacentToZone(e, t, n) {
		return t >= e.startBufferLine - this._linePadding[n || "full"] && t <= e.endBufferLine + this._linePadding[n || "full"];
	}
	_addLineToZone(e, t) {
		e.startBufferLine = Math.min(e.startBufferLine, t), e.endBufferLine = Math.max(e.endBufferLine, t);
	}
}, hi = {
	full: 0,
	left: 0,
	center: 0,
	right: 0
}, gi = {
	full: 0,
	left: 0,
	center: 0,
	right: 0
}, _i = {
	full: 0,
	left: 0,
	center: 0,
	right: 0
}, vi = class extends O {
	constructor(e, t, n, r, i, a, o, s) {
		super(), this._viewportElement = e, this._screenElement = t, this._bufferService = n, this._decorationService = r, this._renderService = i, this._optionsService = a, this._themeService = o, this._coreBrowserService = s, this._colorZoneStore = new mi(), this._shouldUpdateDimensions = !0, this._shouldUpdateAnchor = !0, this._lastKnownBufferLength = 0, this._canvas = this._coreBrowserService.mainDocument.createElement("canvas"), this._canvas.classList.add("xterm-decoration-overview-ruler"), this._refreshCanvasDimensions(), this._viewportElement.parentElement?.insertBefore(this._canvas, this._viewportElement), this._register(D(() => this._canvas?.remove()));
		let c = this._canvas.getContext("2d");
		if (c) this._ctx = c;
		else throw Error("Ctx cannot be null");
		this._register(this._decorationService.onDecorationRegistered(() => this._queueRefresh(void 0, !0))), this._register(this._decorationService.onDecorationRemoved(() => this._queueRefresh(void 0, !0))), this._register(this._renderService.onRenderedViewportChange(() => this._queueRefresh())), this._register(this._bufferService.buffers.onBufferActivate(() => {
			this._canvas.style.display = this._bufferService.buffer === this._bufferService.buffers.alt ? "none" : "block";
		})), this._register(this._bufferService.onScroll(() => {
			this._lastKnownBufferLength !== this._bufferService.buffers.normal.lines.length && (this._refreshDrawHeightConstants(), this._refreshColorZonePadding());
		})), this._register(this._renderService.onRender(() => {
			this._containerHeight && this._containerHeight === this._screenElement.clientHeight || (this._queueRefresh(!0), this._containerHeight = this._screenElement.clientHeight);
		})), this._register(this._coreBrowserService.onDprChange(() => this._queueRefresh(!0))), this._register(this._optionsService.onSpecificOptionChange("overviewRuler", () => this._queueRefresh(!0))), this._register(this._themeService.onChangeColors(() => this._queueRefresh())), this._queueRefresh(!0);
	}
	get _width() {
		return this._optionsService.options.overviewRuler?.width || 0;
	}
	_refreshDrawConstants() {
		let e = Math.floor((this._canvas.width - 1) / 3), t = Math.ceil((this._canvas.width - 1) / 3);
		gi.full = this._canvas.width, gi.left = e, gi.center = t, gi.right = e, this._refreshDrawHeightConstants(), _i.full = 1, _i.left = 1, _i.center = 1 + gi.left, _i.right = 1 + gi.left + gi.center;
	}
	_refreshDrawHeightConstants() {
		hi.full = Math.round(2 * this._coreBrowserService.dpr);
		let e = this._canvas.height / this._bufferService.buffer.lines.length, t = Math.round(Math.max(Math.min(e, 12), 6) * this._coreBrowserService.dpr);
		hi.left = t, hi.center = t, hi.right = t;
	}
	_refreshColorZonePadding() {
		this._colorZoneStore.setPadding({
			full: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * hi.full),
			left: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * hi.left),
			center: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * hi.center),
			right: Math.floor(this._bufferService.buffers.active.lines.length / (this._canvas.height - 1) * hi.right)
		}), this._lastKnownBufferLength = this._bufferService.buffers.normal.lines.length;
	}
	_refreshCanvasDimensions() {
		this._canvas.style.width = `${this._width}px`, this._canvas.width = Math.round(this._width * this._coreBrowserService.dpr), this._canvas.style.height = `${this._screenElement.clientHeight}px`, this._canvas.height = Math.round(this._screenElement.clientHeight * this._coreBrowserService.dpr), this._refreshDrawConstants(), this._refreshColorZonePadding();
	}
	_refreshDecorations() {
		this._shouldUpdateDimensions && this._refreshCanvasDimensions(), this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height), this._colorZoneStore.clear();
		for (let e of this._decorationService.decorations) this._colorZoneStore.addDecoration(e);
		this._ctx.lineWidth = 1, this._renderRulerOutline();
		let e = this._colorZoneStore.zones;
		for (let t of e) t.position !== "full" && this._renderColorZone(t);
		for (let t of e) t.position === "full" && this._renderColorZone(t);
		this._shouldUpdateDimensions = !1, this._shouldUpdateAnchor = !1;
	}
	_renderRulerOutline() {
		this._ctx.fillStyle = this._themeService.colors.overviewRulerBorder.css, this._ctx.fillRect(0, 0, 1, this._canvas.height), this._optionsService.rawOptions.overviewRuler.showTopBorder && this._ctx.fillRect(1, 0, this._canvas.width - 1, 1), this._optionsService.rawOptions.overviewRuler.showBottomBorder && this._ctx.fillRect(1, this._canvas.height - 1, this._canvas.width - 1, this._canvas.height);
	}
	_renderColorZone(e) {
		this._ctx.fillStyle = e.color, this._ctx.fillRect(_i[e.position || "full"], Math.round((this._canvas.height - 1) * (e.startBufferLine / this._bufferService.buffers.active.lines.length) - hi[e.position || "full"] / 2), gi[e.position || "full"], Math.round((this._canvas.height - 1) * ((e.endBufferLine - e.startBufferLine) / this._bufferService.buffers.active.lines.length) + hi[e.position || "full"]));
	}
	_queueRefresh(e, t) {
		this._shouldUpdateDimensions = e || this._shouldUpdateDimensions, this._shouldUpdateAnchor = t || this._shouldUpdateAnchor, this._animationFrame === void 0 && (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => {
			this._refreshDecorations(), this._animationFrame = void 0;
		}));
	}
};
vi = w([
	T(2, qe),
	T(3, nt),
	T(4, ct),
	T(5, $e),
	T(6, dt),
	T(7, ot)
], vi);
var N;
((e) => (e.NUL = "\0", e.SOH = "", e.STX = "", e.ETX = "", e.EOT = "", e.ENQ = "", e.ACK = "", e.BEL = "\x07", e.BS = "\b", e.HT = "	", e.LF = "\n", e.VT = "\v", e.FF = "\f", e.CR = "\r", e.SO = "", e.SI = "", e.DLE = "", e.DC1 = "", e.DC2 = "", e.DC3 = "", e.DC4 = "", e.NAK = "", e.SYN = "", e.ETB = "", e.CAN = "", e.EM = "", e.SUB = "", e.ESC = "\x1B", e.FS = "", e.GS = "", e.RS = "", e.US = "", e.SP = " ", e.DEL = ""))(N ||= {});
var yi;
((e) => (e.PAD = "", e.HOP = "", e.BPH = "", e.NBH = "", e.IND = "", e.NEL = "", e.SSA = "", e.ESA = "", e.HTS = "", e.HTJ = "", e.VTS = "", e.PLD = "", e.PLU = "", e.RI = "", e.SS2 = "", e.SS3 = "", e.DCS = "", e.PU1 = "", e.PU2 = "", e.STS = "", e.CCH = "", e.MW = "", e.SPA = "", e.EPA = "", e.SOS = "", e.SGCI = "", e.SCI = "", e.CSI = "", e.ST = "", e.OSC = "", e.PM = "", e.APC = ""))(yi ||= {});
var bi;
((e) => e.ST = `${N.ESC}\\`)(bi ||= {});
var xi = class {
	constructor(e, t, n, r, i, a) {
		this._textarea = e, this._compositionView = t, this._bufferService = n, this._optionsService = r, this._coreService = i, this._renderService = a, this._isComposing = !1, this._isSendingComposition = !1, this._compositionPosition = {
			start: 0,
			end: 0
		}, this._dataAlreadySent = "";
	}
	get isComposing() {
		return this._isComposing;
	}
	compositionstart() {
		this._isComposing = !0, this._compositionPosition.start = this._textarea.value.length, this._compositionView.textContent = "", this._dataAlreadySent = "", this._compositionView.classList.add("active");
	}
	compositionupdate(e) {
		this._compositionView.textContent = e.data, this.updateCompositionElements(), setTimeout(() => {
			this._compositionPosition.end = this._textarea.value.length;
		}, 0);
	}
	compositionend() {
		this._finalizeComposition(!0);
	}
	keydown(e) {
		if (this._isComposing || this._isSendingComposition) {
			if (e.keyCode === 20 || e.keyCode === 229 || e.keyCode === 16 || e.keyCode === 17 || e.keyCode === 18) return !1;
			this._finalizeComposition(!1);
		}
		return e.keyCode !== 229 || (this._handleAnyTextareaChanges(), !1);
	}
	_finalizeComposition(e) {
		if (this._compositionView.classList.remove("active"), this._isComposing = !1, e) {
			let e = {
				start: this._compositionPosition.start,
				end: this._compositionPosition.end
			};
			this._isSendingComposition = !0, setTimeout(() => {
				if (this._isSendingComposition) {
					this._isSendingComposition = !1;
					let t;
					e.start += this._dataAlreadySent.length, t = this._isComposing ? this._textarea.value.substring(e.start, this._compositionPosition.start) : this._textarea.value.substring(e.start), t.length > 0 && this._coreService.triggerDataEvent(t, !0);
				}
			}, 0);
		} else {
			this._isSendingComposition = !1;
			let e = this._textarea.value.substring(this._compositionPosition.start, this._compositionPosition.end);
			this._coreService.triggerDataEvent(e, !0);
		}
	}
	_handleAnyTextareaChanges() {
		let e = this._textarea.value;
		setTimeout(() => {
			if (!this._isComposing) {
				let t = this._textarea.value, n = t.replace(e, "");
				this._dataAlreadySent = n, t.length > e.length ? this._coreService.triggerDataEvent(n, !0) : t.length < e.length ? this._coreService.triggerDataEvent(`${N.DEL}`, !0) : t.length === e.length && t !== e && this._coreService.triggerDataEvent(t, !0);
			}
		}, 0);
	}
	updateCompositionElements(e) {
		if (this._isComposing) {
			if (this._bufferService.buffer.isCursorInViewport) {
				let e = Math.min(this._bufferService.buffer.x, this._bufferService.cols - 1), t = this._renderService.dimensions.css.cell.height, n = this._bufferService.buffer.y * this._renderService.dimensions.css.cell.height, r = e * this._renderService.dimensions.css.cell.width;
				this._compositionView.style.left = r + "px", this._compositionView.style.top = n + "px", this._compositionView.style.height = t + "px", this._compositionView.style.lineHeight = t + "px", this._compositionView.style.fontFamily = this._optionsService.rawOptions.fontFamily, this._compositionView.style.fontSize = this._optionsService.rawOptions.fontSize + "px";
				let i = this._compositionView.getBoundingClientRect();
				this._textarea.style.left = r + "px", this._textarea.style.top = n + "px", this._textarea.style.width = Math.max(i.width, 1) + "px", this._textarea.style.height = Math.max(i.height, 1) + "px", this._textarea.style.lineHeight = i.height + "px";
			}
			e || setTimeout(() => this.updateCompositionElements(!0), 0);
		}
	}
};
xi = w([
	T(2, qe),
	T(3, $e),
	T(4, Ye),
	T(5, ct)
], xi);
var P = 0, Si = 0, F = 0, I = 0, Ci = {
	css: "#00000000",
	rgba: 0
}, L;
((e) => {
	function t(e, t, n, r) {
		return r === void 0 ? `#${Ei(e)}${Ei(t)}${Ei(n)}` : `#${Ei(e)}${Ei(t)}${Ei(n)}${Ei(r)}`;
	}
	e.toCss = t;
	function n(e, t, n, r = 255) {
		return (e << 24 | t << 16 | n << 8 | r) >>> 0;
	}
	e.toRgba = n;
	function r(t, n, r, i) {
		return {
			css: e.toCss(t, n, r, i),
			rgba: e.toRgba(t, n, r, i)
		};
	}
	e.toColor = r;
})(L ||= {});
var R;
((e) => {
	function t(e, t) {
		if (I = (t.rgba & 255) / 255, I === 1) return {
			css: t.css,
			rgba: t.rgba
		};
		let n = t.rgba >> 24 & 255, r = t.rgba >> 16 & 255, i = t.rgba >> 8 & 255, a = e.rgba >> 24 & 255, o = e.rgba >> 16 & 255, s = e.rgba >> 8 & 255;
		return P = a + Math.round((n - a) * I), Si = o + Math.round((r - o) * I), F = s + Math.round((i - s) * I), {
			css: L.toCss(P, Si, F),
			rgba: L.toRgba(P, Si, F)
		};
	}
	e.blend = t;
	function n(e) {
		return (e.rgba & 255) == 255;
	}
	e.isOpaque = n;
	function r(e, t, n) {
		let r = Ti.ensureContrastRatio(e.rgba, t.rgba, n);
		if (r) return L.toColor(r >> 24 & 255, r >> 16 & 255, r >> 8 & 255);
	}
	e.ensureContrastRatio = r;
	function i(e) {
		let t = (e.rgba | 255) >>> 0;
		return [P, Si, F] = Ti.toChannels(t), {
			css: L.toCss(P, Si, F),
			rgba: t
		};
	}
	e.opaque = i;
	function a(e, t) {
		return I = Math.round(t * 255), [P, Si, F] = Ti.toChannels(e.rgba), {
			css: L.toCss(P, Si, F, I),
			rgba: L.toRgba(P, Si, F, I)
		};
	}
	e.opacity = a;
	function o(e, t) {
		return I = e.rgba & 255, a(e, I * t / 255);
	}
	e.multiplyOpacity = o;
	function s(e) {
		return [
			e.rgba >> 24 & 255,
			e.rgba >> 16 & 255,
			e.rgba >> 8 & 255
		];
	}
	e.toColorRGB = s;
})(R ||= {});
var z;
((e) => {
	let t, n;
	try {
		let e = document.createElement("canvas");
		e.width = 1, e.height = 1;
		let r = e.getContext("2d", { willReadFrequently: !0 });
		r && (t = r, t.globalCompositeOperation = "copy", n = t.createLinearGradient(0, 0, 1, 1));
	} catch {}
	function r(e) {
		if (e.match(/#[\da-f]{3,8}/i)) switch (e.length) {
			case 4: return P = parseInt(e.slice(1, 2).repeat(2), 16), Si = parseInt(e.slice(2, 3).repeat(2), 16), F = parseInt(e.slice(3, 4).repeat(2), 16), L.toColor(P, Si, F);
			case 5: return P = parseInt(e.slice(1, 2).repeat(2), 16), Si = parseInt(e.slice(2, 3).repeat(2), 16), F = parseInt(e.slice(3, 4).repeat(2), 16), I = parseInt(e.slice(4, 5).repeat(2), 16), L.toColor(P, Si, F, I);
			case 7: return {
				css: e,
				rgba: (parseInt(e.slice(1), 16) << 8 | 255) >>> 0
			};
			case 9: return {
				css: e,
				rgba: parseInt(e.slice(1), 16) >>> 0
			};
		}
		let r = e.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(0|1|\d?\.(\d+))\s*)?\)/);
		if (r) return P = parseInt(r[1]), Si = parseInt(r[2]), F = parseInt(r[3]), I = Math.round((r[5] === void 0 ? 1 : parseFloat(r[5])) * 255), L.toColor(P, Si, F, I);
		if (!t || !n || (t.fillStyle = n, t.fillStyle = e, typeof t.fillStyle != "string") || (t.fillRect(0, 0, 1, 1), [P, Si, F, I] = t.getImageData(0, 0, 1, 1).data, I !== 255)) throw Error("css.toColor: Unsupported css format");
		return {
			rgba: L.toRgba(P, Si, F, I),
			css: e
		};
	}
	e.toColor = r;
})(z ||= {});
var wi;
((e) => {
	function t(e) {
		return n(e >> 16 & 255, e >> 8 & 255, e & 255);
	}
	e.relativeLuminance = t;
	function n(e, t, n) {
		let r = e / 255, i = t / 255, a = n / 255, o = r <= .03928 ? r / 12.92 : ((r + .055) / 1.055) ** 2.4, s = i <= .03928 ? i / 12.92 : ((i + .055) / 1.055) ** 2.4, c = a <= .03928 ? a / 12.92 : ((a + .055) / 1.055) ** 2.4;
		return o * .2126 + s * .7152 + c * .0722;
	}
	e.relativeLuminance2 = n;
})(wi ||= {});
var Ti;
((e) => {
	function t(e, t) {
		if (I = (t & 255) / 255, I === 1) return t;
		let n = t >> 24 & 255, r = t >> 16 & 255, i = t >> 8 & 255, a = e >> 24 & 255, o = e >> 16 & 255, s = e >> 8 & 255;
		return P = a + Math.round((n - a) * I), Si = o + Math.round((r - o) * I), F = s + Math.round((i - s) * I), L.toRgba(P, Si, F);
	}
	e.blend = t;
	function n(e, t, n) {
		let a = wi.relativeLuminance(e >> 8), o = wi.relativeLuminance(t >> 8);
		if (Di(a, o) < n) {
			if (o < a) {
				let o = r(e, t, n), s = Di(a, wi.relativeLuminance(o >> 8));
				if (s < n) {
					let r = i(e, t, n);
					return s > Di(a, wi.relativeLuminance(r >> 8)) ? o : r;
				}
				return o;
			}
			let s = i(e, t, n), c = Di(a, wi.relativeLuminance(s >> 8));
			if (c < n) {
				let i = r(e, t, n);
				return c > Di(a, wi.relativeLuminance(i >> 8)) ? s : i;
			}
			return s;
		}
	}
	e.ensureContrastRatio = n;
	function r(e, t, n) {
		let r = e >> 24 & 255, i = e >> 16 & 255, a = e >> 8 & 255, o = t >> 24 & 255, s = t >> 16 & 255, c = t >> 8 & 255, l = Di(wi.relativeLuminance2(o, s, c), wi.relativeLuminance2(r, i, a));
		for (; l < n && (o > 0 || s > 0 || c > 0);) o -= Math.max(0, Math.ceil(o * .1)), s -= Math.max(0, Math.ceil(s * .1)), c -= Math.max(0, Math.ceil(c * .1)), l = Di(wi.relativeLuminance2(o, s, c), wi.relativeLuminance2(r, i, a));
		return (o << 24 | s << 16 | c << 8 | 255) >>> 0;
	}
	e.reduceLuminance = r;
	function i(e, t, n) {
		let r = e >> 24 & 255, i = e >> 16 & 255, a = e >> 8 & 255, o = t >> 24 & 255, s = t >> 16 & 255, c = t >> 8 & 255, l = Di(wi.relativeLuminance2(o, s, c), wi.relativeLuminance2(r, i, a));
		for (; l < n && (o < 255 || s < 255 || c < 255);) o = Math.min(255, o + Math.ceil((255 - o) * .1)), s = Math.min(255, s + Math.ceil((255 - s) * .1)), c = Math.min(255, c + Math.ceil((255 - c) * .1)), l = Di(wi.relativeLuminance2(o, s, c), wi.relativeLuminance2(r, i, a));
		return (o << 24 | s << 16 | c << 8 | 255) >>> 0;
	}
	e.increaseLuminance = i;
	function a(e) {
		return [
			e >> 24 & 255,
			e >> 16 & 255,
			e >> 8 & 255,
			e & 255
		];
	}
	e.toChannels = a;
})(Ti ||= {});
function Ei(e) {
	let t = e.toString(16);
	return t.length < 2 ? "0" + t : t;
}
function Di(e, t) {
	return e < t ? (t + .05) / (e + .05) : (e + .05) / (t + .05);
}
var Oi = class extends ze {
	constructor(e, t, n) {
		super(), this.content = 0, this.combinedData = "", this.fg = e.fg, this.bg = e.bg, this.combinedData = t, this._width = n;
	}
	isCombined() {
		return 2097152;
	}
	getWidth() {
		return this._width;
	}
	getChars() {
		return this.combinedData;
	}
	getCode() {
		return 2097151;
	}
	setFromCharData(e) {
		throw Error("not implemented");
	}
	getAsCharData() {
		return [
			this.fg,
			this.getChars(),
			this.getWidth(),
			this.getCode()
		];
	}
}, ki = class {
	constructor(e) {
		this._bufferService = e, this._characterJoiners = [], this._nextCharacterJoinerId = 0, this._workCell = new Ve();
	}
	register(e) {
		let t = {
			id: this._nextCharacterJoinerId++,
			handler: e
		};
		return this._characterJoiners.push(t), t.id;
	}
	deregister(e) {
		for (let t = 0; t < this._characterJoiners.length; t++) if (this._characterJoiners[t].id === e) return this._characterJoiners.splice(t, 1), !0;
		return !1;
	}
	getJoinedCharacters(e) {
		if (this._characterJoiners.length === 0) return [];
		let t = this._bufferService.buffer.lines.get(e);
		if (!t || t.length === 0) return [];
		let n = [], r = t.translateToString(!0), i = 0, a = 0, o = 0, s = t.getFg(0), c = t.getBg(0);
		for (let e = 0; e < t.getTrimmedLength(); e++) if (t.loadCell(e, this._workCell), this._workCell.getWidth() !== 0) {
			if (this._workCell.fg !== s || this._workCell.bg !== c) {
				if (e - i > 1) {
					let e = this._getJoinedRanges(r, o, a, t, i);
					for (let t = 0; t < e.length; t++) n.push(e[t]);
				}
				i = e, o = a, s = this._workCell.fg, c = this._workCell.bg;
			}
			a += this._workCell.getChars().length || Re.length;
		}
		if (this._bufferService.cols - i > 1) {
			let e = this._getJoinedRanges(r, o, a, t, i);
			for (let t = 0; t < e.length; t++) n.push(e[t]);
		}
		return n;
	}
	_getJoinedRanges(e, t, n, r, i) {
		let a = e.substring(t, n), o = [];
		try {
			o = this._characterJoiners[0].handler(a);
		} catch (e) {
			console.error(e);
		}
		for (let e = 1; e < this._characterJoiners.length; e++) try {
			let t = this._characterJoiners[e].handler(a);
			for (let e = 0; e < t.length; e++) ki._mergeRanges(o, t[e]);
		} catch (e) {
			console.error(e);
		}
		return this._stringRangesToCellRanges(o, r, i), o;
	}
	_stringRangesToCellRanges(e, t, n) {
		let r = 0, i = !1, a = 0, o = e[r];
		if (o) {
			for (let s = n; s < this._bufferService.cols; s++) {
				let n = t.getWidth(s), c = t.getString(s).length || Re.length;
				if (n !== 0) {
					if (!i && o[0] <= a && (o[0] = s, i = !0), o[1] <= a) {
						if (o[1] = s, o = e[++r], !o) break;
						o[0] <= a ? (o[0] = s, i = !0) : i = !1;
					}
					a += c;
				}
			}
			o && (o[1] = this._bufferService.cols);
		}
	}
	static _mergeRanges(e, t) {
		let n = !1;
		for (let r = 0; r < e.length; r++) {
			let i = e[r];
			if (n) {
				if (t[1] <= i[0]) return e[r - 1][1] = t[1], e;
				if (t[1] <= i[1]) return e[r - 1][1] = Math.max(t[1], i[1]), e.splice(r, 1), e;
				e.splice(r, 1), r--;
			} else {
				if (t[1] <= i[0]) return e.splice(r, 0, t), e;
				if (t[1] <= i[1]) return i[0] = Math.min(t[0], i[0]), e;
				t[0] < i[1] && (i[0] = Math.min(t[0], i[0]), n = !0);
				continue;
			}
		}
		return n ? e[e.length - 1][1] = t[1] : e.push(t), e;
	}
};
ki = w([T(0, qe)], ki);
function Ai(e) {
	return 57508 <= e && e <= 57558;
}
function ji(e) {
	return 9472 <= e && e <= 9631;
}
function Mi(e) {
	return Ai(e) || ji(e);
}
function Ni() {
	return {
		css: {
			canvas: Pi(),
			cell: Pi()
		},
		device: {
			canvas: Pi(),
			cell: Pi(),
			char: {
				width: 0,
				height: 0,
				left: 0,
				top: 0
			}
		}
	};
}
function Pi() {
	return {
		width: 0,
		height: 0
	};
}
var Fi = class {
	constructor(e, t, n, r, i, a, o) {
		this._document = e, this._characterJoinerService = t, this._optionsService = n, this._coreBrowserService = r, this._coreService = i, this._decorationService = a, this._themeService = o, this._workCell = new Ve(), this._columnSelectMode = !1, this.defaultSpacing = 0;
	}
	handleSelectionChanged(e, t, n) {
		this._selectionStart = e, this._selectionEnd = t, this._columnSelectMode = n;
	}
	createRow(e, t, n, r, i, a, o, s, c, l, u) {
		let d = [], f = this._characterJoinerService.getJoinedCharacters(t), p = this._themeService.colors, m = e.getNoBgTrimmedLength();
		n && m < a + 1 && (m = a + 1);
		let h, g = 0, _ = "", v = 0, ee = 0, te = 0, y = 0, ne = !1, re = 0, ie = !1, ae = 0, oe = 0, b = [], se = l !== -1 && u !== -1;
		for (let x = 0; x < m; x++) {
			e.loadCell(x, this._workCell);
			let m = this._workCell.getWidth();
			if (m === 0) continue;
			let ce = !1, le = x >= oe, ue = x, S = this._workCell;
			if (f.length > 0 && x === f[0][0] && le) {
				let r = f.shift(), i = this._isCellInSelection(r[0], t);
				for (v = r[0] + 1; v < r[1]; v++) le &&= i === this._isCellInSelection(v, t);
				le &&= !n || a < r[0] || a >= r[1], le ? (ce = !0, S = new Oi(this._workCell, e.translateToString(!0, r[0], r[1]), r[1] - r[0]), ue = r[1] - 1, m = S.getWidth()) : oe = r[1];
			}
			let C = this._isCellInSelection(x, t), de = n && x === a, fe = se && x >= l && x <= u, pe = !1;
			this._decorationService.forEachDecorationAtCell(x, t, void 0, (e) => {
				pe = !0;
			});
			let me = S.getChars() || Re;
			if (me === " " && (S.isUnderline() || S.isOverline()) && (me = "\xA0"), ae = m * s - c.get(me, S.isBold(), S.isItalic()), !h) h = this._document.createElement("span");
			else if (g && (C && ie || !C && !ie && S.bg === ee) && (C && ie && p.selectionForeground || S.fg === te) && S.extended.ext === y && fe === ne && ae === re && !de && !ce && !pe && le) {
				S.isInvisible() ? _ += Re : _ += me, g++;
				continue;
			} else g && (h.textContent = _), h = this._document.createElement("span"), g = 0, _ = "";
			if (ee = S.bg, te = S.fg, y = S.extended.ext, ne = fe, re = ae, ie = C, ce && a >= x && a <= ue && (a = x), !this._coreService.isCursorHidden && de && this._coreService.isCursorInitialized) {
				if (b.push("xterm-cursor"), this._coreBrowserService.isFocused) o && b.push("xterm-cursor-blink"), b.push(r === "bar" ? "xterm-cursor-bar" : r === "underline" ? "xterm-cursor-underline" : "xterm-cursor-block");
				else if (i) switch (i) {
					case "outline":
						b.push("xterm-cursor-outline");
						break;
					case "block":
						b.push("xterm-cursor-block");
						break;
					case "bar":
						b.push("xterm-cursor-bar");
						break;
					case "underline": b.push("xterm-cursor-underline");
				}
			}
			if (S.isBold() && b.push("xterm-bold"), S.isItalic() && b.push("xterm-italic"), S.isDim() && b.push("xterm-dim"), _ = S.isInvisible() ? Re : S.getChars() || Re, S.isUnderline() && (b.push(`xterm-underline-${S.extended.underlineStyle}`), _ === " " && (_ = "\xA0"), !S.isUnderlineColorDefault())) {
				if (S.isUnderlineColorRGB()) h.style.textDecorationColor = `rgb(${ze.toColorRGB(S.getUnderlineColor()).join(",")})`;
				else {
					let e = S.getUnderlineColor();
					this._optionsService.rawOptions.drawBoldTextInBrightColors && S.isBold() && e < 8 && (e += 8), h.style.textDecorationColor = p.ansi[e].css;
				}
			}
			S.isOverline() && (b.push("xterm-overline"), _ === " " && (_ = "\xA0")), S.isStrikethrough() && b.push("xterm-strikethrough"), fe && (h.style.textDecoration = "underline");
			let he = S.getFgColor(), ge = S.getFgColorMode(), _e = S.getBgColor(), ve = S.getBgColorMode(), ye = !!S.isInverse();
			if (ye) {
				let e = he;
				he = _e, _e = e;
				let t = ge;
				ge = ve, ve = t;
			}
			let be, xe, w = !1;
			this._decorationService.forEachDecorationAtCell(x, t, void 0, (e) => {
				e.options.layer !== "top" && w || (e.backgroundColorRGB && (ve = 50331648, _e = e.backgroundColorRGB.rgba >> 8 & 16777215, be = e.backgroundColorRGB), e.foregroundColorRGB && (ge = 50331648, he = e.foregroundColorRGB.rgba >> 8 & 16777215, xe = e.foregroundColorRGB), w = e.options.layer === "top");
			}), !w && C && (be = this._coreBrowserService.isFocused ? p.selectionBackgroundOpaque : p.selectionInactiveBackgroundOpaque, _e = be.rgba >> 8 & 16777215, ve = 50331648, w = !0, p.selectionForeground && (ge = 50331648, he = p.selectionForeground.rgba >> 8 & 16777215, xe = p.selectionForeground)), w && b.push("xterm-decoration-top");
			let T;
			switch (ve) {
				case 16777216:
				case 33554432:
					T = p.ansi[_e], b.push(`xterm-bg-${_e}`);
					break;
				case 50331648:
					T = L.toColor(_e >> 16, _e >> 8 & 255, _e & 255), this._addStyle(h, `background-color:#${Ii((_e >>> 0).toString(16), "0", 6)}`);
					break;
				default: ye ? (T = p.foreground, b.push("xterm-bg-257")) : T = p.background;
			}
			switch (be || S.isDim() && (be = R.multiplyOpacity(T, .5)), ge) {
				case 16777216:
				case 33554432:
					S.isBold() && he < 8 && this._optionsService.rawOptions.drawBoldTextInBrightColors && (he += 8), this._applyMinimumContrast(h, T, p.ansi[he], S, be, void 0) || b.push(`xterm-fg-${he}`);
					break;
				case 50331648:
					let e = L.toColor(he >> 16 & 255, he >> 8 & 255, he & 255);
					this._applyMinimumContrast(h, T, e, S, be, xe) || this._addStyle(h, `color:#${Ii(he.toString(16), "0", 6)}`);
					break;
				default: this._applyMinimumContrast(h, T, p.foreground, S, be, xe) || ye && b.push("xterm-fg-257");
			}
			b.length &&= (h.className = b.join(" "), 0), !de && !ce && !pe && le ? g++ : h.textContent = _, ae !== this.defaultSpacing && (h.style.letterSpacing = `${ae}px`), d.push(h), x = ue;
		}
		return h && g && (h.textContent = _), d;
	}
	_applyMinimumContrast(e, t, n, r, i, a) {
		if (this._optionsService.rawOptions.minimumContrastRatio === 1 || Mi(r.getCode())) return !1;
		let o = this._getContrastCache(r), s;
		if (!i && !a && (s = o.getColor(t.rgba, n.rgba)), s === void 0) {
			let e = this._optionsService.rawOptions.minimumContrastRatio / (r.isDim() ? 2 : 1);
			s = R.ensureContrastRatio(i || t, a || n, e), o.setColor((i || t).rgba, (a || n).rgba, s ?? null);
		}
		return s ? (this._addStyle(e, `color:${s.css}`), !0) : !1;
	}
	_getContrastCache(e) {
		return e.isDim() ? this._themeService.colors.halfContrastCache : this._themeService.colors.contrastCache;
	}
	_addStyle(e, t) {
		e.setAttribute("style", `${e.getAttribute("style") || ""}${t};`);
	}
	_isCellInSelection(e, t) {
		let n = this._selectionStart, r = this._selectionEnd;
		return !n || !r ? !1 : this._columnSelectMode ? n[0] <= r[0] ? e >= n[0] && t >= n[1] && e < r[0] && t <= r[1] : e < n[0] && t >= n[1] && e >= r[0] && t <= r[1] : t > n[1] && t < r[1] || n[1] === r[1] && t === n[1] && e >= n[0] && e < r[0] || n[1] < r[1] && t === r[1] && e < r[0] || n[1] < r[1] && t === n[1] && e >= n[0];
	}
};
Fi = w([
	T(1, ut),
	T(2, $e),
	T(3, ot),
	T(4, Ye),
	T(5, nt),
	T(6, dt)
], Fi);
function Ii(e, t, n) {
	for (; e.length < n;) e = t + e;
	return e;
}
var Li = class {
	constructor(e, t) {
		this._flat = /* @__PURE__ */ new Float32Array(256), this._font = "", this._fontSize = 0, this._weight = "normal", this._weightBold = "bold", this._measureElements = [], this._container = e.createElement("div"), this._container.classList.add("xterm-width-cache-measure-container"), this._container.setAttribute("aria-hidden", "true"), this._container.style.whiteSpace = "pre", this._container.style.fontKerning = "none";
		let n = e.createElement("span");
		n.classList.add("xterm-char-measure-element");
		let r = e.createElement("span");
		r.classList.add("xterm-char-measure-element"), r.style.fontWeight = "bold";
		let i = e.createElement("span");
		i.classList.add("xterm-char-measure-element"), i.style.fontStyle = "italic";
		let a = e.createElement("span");
		a.classList.add("xterm-char-measure-element"), a.style.fontWeight = "bold", a.style.fontStyle = "italic", this._measureElements = [
			n,
			r,
			i,
			a
		], this._container.appendChild(n), this._container.appendChild(r), this._container.appendChild(i), this._container.appendChild(a), t.appendChild(this._container), this.clear();
	}
	dispose() {
		this._container.remove(), this._measureElements.length = 0, this._holey = void 0;
	}
	clear() {
		this._flat.fill(-9999), this._holey = /* @__PURE__ */ new Map();
	}
	setFont(e, t, n, r) {
		e === this._font && t === this._fontSize && n === this._weight && r === this._weightBold || (this._font = e, this._fontSize = t, this._weight = n, this._weightBold = r, this._container.style.fontFamily = this._font, this._container.style.fontSize = `${this._fontSize}px`, this._measureElements[0].style.fontWeight = `${n}`, this._measureElements[1].style.fontWeight = `${r}`, this._measureElements[2].style.fontWeight = `${n}`, this._measureElements[3].style.fontWeight = `${r}`, this.clear());
	}
	get(e, t, n) {
		let r = 0;
		if (!t && !n && e.length === 1 && (r = e.charCodeAt(0)) < 256) {
			if (this._flat[r] !== -9999) return this._flat[r];
			let t = this._measure(e, 0);
			return t > 0 && (this._flat[r] = t), t;
		}
		let i = e;
		t && (i += "B"), n && (i += "I");
		let a = this._holey.get(i);
		if (a === void 0) {
			let r = 0;
			t && (r |= 1), n && (r |= 2), a = this._measure(e, r), a > 0 && this._holey.set(i, a);
		}
		return a;
	}
	_measure(e, t) {
		let n = this._measureElements[t];
		return n.textContent = e.repeat(32), n.offsetWidth / 32;
	}
}, Ri = class {
	constructor() {
		this.clear();
	}
	clear() {
		this.hasSelection = !1, this.columnSelectMode = !1, this.viewportStartRow = 0, this.viewportEndRow = 0, this.viewportCappedStartRow = 0, this.viewportCappedEndRow = 0, this.startCol = 0, this.endCol = 0, this.selectionStart = void 0, this.selectionEnd = void 0;
	}
	update(e, t, n, r = !1) {
		if (this.selectionStart = t, this.selectionEnd = n, !t || !n || t[0] === n[0] && t[1] === n[1]) {
			this.clear();
			return;
		}
		let i = e.buffers.active.ydisp, a = t[1] - i, o = n[1] - i, s = Math.max(a, 0), c = Math.min(o, e.rows - 1);
		s >= e.rows || c < 0 ? this.clear() : (this.hasSelection = !0, this.columnSelectMode = r, this.viewportStartRow = a, this.viewportEndRow = o, this.viewportCappedStartRow = s, this.viewportCappedEndRow = c, this.startCol = t[0], this.endCol = n[0]);
	}
	isCellSelected(e, t, n) {
		return this.hasSelection ? (n -= e.buffer.active.viewportY, this.columnSelectMode ? this.startCol <= this.endCol ? t >= this.startCol && n >= this.viewportCappedStartRow && t < this.endCol && n <= this.viewportCappedEndRow : t < this.startCol && n >= this.viewportCappedStartRow && t >= this.endCol && n <= this.viewportCappedEndRow : n > this.viewportStartRow && n < this.viewportEndRow || this.viewportStartRow === this.viewportEndRow && n === this.viewportStartRow && t >= this.startCol && t < this.endCol || this.viewportStartRow < this.viewportEndRow && n === this.viewportEndRow && t < this.endCol || this.viewportStartRow < this.viewportEndRow && n === this.viewportStartRow && t >= this.startCol) : !1;
	}
};
function zi() {
	return new Ri();
}
var Bi = "xterm-dom-renderer-owner-", Vi = "xterm-rows", Hi = "xterm-fg-", Ui = "xterm-bg-", Wi = "xterm-focus", Gi = "xterm-selection", Ki = 1, qi = class extends O {
	constructor(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		super(), this._terminal = e, this._document = t, this._element = n, this._screenElement = r, this._viewportElement = i, this._helperContainer = a, this._linkifier2 = o, this._charSizeService = c, this._optionsService = l, this._bufferService = u, this._coreService = d, this._coreBrowserService = f, this._themeService = p, this._terminalClass = Ki++, this._rowElements = [], this._selectionRenderModel = zi(), this.onRequestRedraw = this._register(new A()).event, this._rowContainer = this._document.createElement("div"), this._rowContainer.classList.add(Vi), this._rowContainer.style.lineHeight = "normal", this._rowContainer.setAttribute("aria-hidden", "true"), this._refreshRowElements(this._bufferService.cols, this._bufferService.rows), this._selectionContainer = this._document.createElement("div"), this._selectionContainer.classList.add(Gi), this._selectionContainer.setAttribute("aria-hidden", "true"), this.dimensions = Ni(), this._updateDimensions(), this._register(this._optionsService.onOptionChange(() => this._handleOptionsChanged())), this._register(this._themeService.onChangeColors((e) => this._injectCss(e))), this._injectCss(this._themeService.colors), this._rowFactory = s.createInstance(Fi, document), this._element.classList.add(Bi + this._terminalClass), this._screenElement.appendChild(this._rowContainer), this._screenElement.appendChild(this._selectionContainer), this._register(this._linkifier2.onShowLinkUnderline((e) => this._handleLinkHover(e))), this._register(this._linkifier2.onHideLinkUnderline((e) => this._handleLinkLeave(e))), this._register(D(() => {
			this._element.classList.remove(Bi + this._terminalClass), this._rowContainer.remove(), this._selectionContainer.remove(), this._widthCache.dispose(), this._themeStyleElement.remove(), this._dimensionsStyleElement.remove();
		})), this._widthCache = new Li(this._document, this._helperContainer), this._widthCache.setFont(this._optionsService.rawOptions.fontFamily, this._optionsService.rawOptions.fontSize, this._optionsService.rawOptions.fontWeight, this._optionsService.rawOptions.fontWeightBold), this._setDefaultSpacing();
	}
	_updateDimensions() {
		let e = this._coreBrowserService.dpr;
		this.dimensions.device.char.width = this._charSizeService.width * e, this.dimensions.device.char.height = Math.ceil(this._charSizeService.height * e), this.dimensions.device.cell.width = this.dimensions.device.char.width + Math.round(this._optionsService.rawOptions.letterSpacing), this.dimensions.device.cell.height = Math.floor(this.dimensions.device.char.height * this._optionsService.rawOptions.lineHeight), this.dimensions.device.char.left = 0, this.dimensions.device.char.top = 0, this.dimensions.device.canvas.width = this.dimensions.device.cell.width * this._bufferService.cols, this.dimensions.device.canvas.height = this.dimensions.device.cell.height * this._bufferService.rows, this.dimensions.css.canvas.width = Math.round(this.dimensions.device.canvas.width / e), this.dimensions.css.canvas.height = Math.round(this.dimensions.device.canvas.height / e), this.dimensions.css.cell.width = this.dimensions.css.canvas.width / this._bufferService.cols, this.dimensions.css.cell.height = this.dimensions.css.canvas.height / this._bufferService.rows;
		for (let e of this._rowElements) e.style.width = `${this.dimensions.css.canvas.width}px`, e.style.height = `${this.dimensions.css.cell.height}px`, e.style.lineHeight = `${this.dimensions.css.cell.height}px`, e.style.overflow = "hidden";
		this._dimensionsStyleElement || (this._dimensionsStyleElement = this._document.createElement("style"), this._screenElement.appendChild(this._dimensionsStyleElement));
		let t = `${this._terminalSelector} .${Vi} span { display: inline-block; height: 100%; vertical-align: top;}`;
		this._dimensionsStyleElement.textContent = t, this._selectionContainer.style.height = this._viewportElement.style.height, this._screenElement.style.width = `${this.dimensions.css.canvas.width}px`, this._screenElement.style.height = `${this.dimensions.css.canvas.height}px`;
	}
	_injectCss(e) {
		this._themeStyleElement || (this._themeStyleElement = this._document.createElement("style"), this._screenElement.appendChild(this._themeStyleElement));
		let t = `${this._terminalSelector} .${Vi} { pointer-events: none; color: ${e.foreground.css}; font-family: ${this._optionsService.rawOptions.fontFamily}; font-size: ${this._optionsService.rawOptions.fontSize}px; font-kerning: none; white-space: pre}`;
		t += `${this._terminalSelector} .${Vi} .xterm-dim { color: ${R.multiplyOpacity(e.foreground, .5).css};}`, t += `${this._terminalSelector} span:not(.xterm-bold) { font-weight: ${this._optionsService.rawOptions.fontWeight};}${this._terminalSelector} span.xterm-bold { font-weight: ${this._optionsService.rawOptions.fontWeightBold};}${this._terminalSelector} span.xterm-italic { font-style: italic;}`;
		let n = `blink_underline_${this._terminalClass}`, r = `blink_bar_${this._terminalClass}`, i = `blink_block_${this._terminalClass}`;
		t += `@keyframes ${n} { 50% {  border-bottom-style: hidden; }}`, t += `@keyframes ${r} { 50% {  box-shadow: none; }}`, t += `@keyframes ${i} { 0% {  background-color: ${e.cursor.css};  color: ${e.cursorAccent.css}; } 50% {  background-color: inherit;  color: ${e.cursor.css}; }}`, t += `${this._terminalSelector} .${Vi}.${Wi} .xterm-cursor.xterm-cursor-blink.xterm-cursor-underline { animation: ${n} 1s step-end infinite;}${this._terminalSelector} .${Vi}.${Wi} .xterm-cursor.xterm-cursor-blink.xterm-cursor-bar { animation: ${r} 1s step-end infinite;}${this._terminalSelector} .${Vi}.${Wi} .xterm-cursor.xterm-cursor-blink.xterm-cursor-block { animation: ${i} 1s step-end infinite;}${this._terminalSelector} .${Vi} .xterm-cursor.xterm-cursor-block { background-color: ${e.cursor.css}; color: ${e.cursorAccent.css};}${this._terminalSelector} .${Vi} .xterm-cursor.xterm-cursor-block:not(.xterm-cursor-blink) { background-color: ${e.cursor.css} !important; color: ${e.cursorAccent.css} !important;}${this._terminalSelector} .${Vi} .xterm-cursor.xterm-cursor-outline { outline: 1px solid ${e.cursor.css}; outline-offset: -1px;}${this._terminalSelector} .${Vi} .xterm-cursor.xterm-cursor-bar { box-shadow: ${this._optionsService.rawOptions.cursorWidth}px 0 0 ${e.cursor.css} inset;}${this._terminalSelector} .${Vi} .xterm-cursor.xterm-cursor-underline { border-bottom: 1px ${e.cursor.css}; border-bottom-style: solid; height: calc(100% - 1px);}`, t += `${this._terminalSelector} .${Gi} { position: absolute; top: 0; left: 0; z-index: 1; pointer-events: none;}${this._terminalSelector}.focus .${Gi} div { position: absolute; background-color: ${e.selectionBackgroundOpaque.css};}${this._terminalSelector} .${Gi} div { position: absolute; background-color: ${e.selectionInactiveBackgroundOpaque.css};}`;
		for (let [n, r] of e.ansi.entries()) t += `${this._terminalSelector} .${Hi}${n} { color: ${r.css}; }${this._terminalSelector} .${Hi}${n}.xterm-dim { color: ${R.multiplyOpacity(r, .5).css}; }${this._terminalSelector} .${Ui}${n} { background-color: ${r.css}; }`;
		t += `${this._terminalSelector} .${Hi}257 { color: ${R.opaque(e.background).css}; }${this._terminalSelector} .${Hi}257.xterm-dim { color: ${R.multiplyOpacity(R.opaque(e.background), .5).css}; }${this._terminalSelector} .${Ui}257 { background-color: ${e.foreground.css}; }`, this._themeStyleElement.textContent = t;
	}
	_setDefaultSpacing() {
		let e = this.dimensions.css.cell.width - this._widthCache.get("W", !1, !1);
		this._rowContainer.style.letterSpacing = `${e}px`, this._rowFactory.defaultSpacing = e;
	}
	handleDevicePixelRatioChange() {
		this._updateDimensions(), this._widthCache.clear(), this._setDefaultSpacing();
	}
	_refreshRowElements(e, t) {
		for (let e = this._rowElements.length; e <= t; e++) {
			let e = this._document.createElement("div");
			this._rowContainer.appendChild(e), this._rowElements.push(e);
		}
		for (; this._rowElements.length > t;) this._rowContainer.removeChild(this._rowElements.pop());
	}
	handleResize(e, t) {
		this._refreshRowElements(e, t), this._updateDimensions(), this.handleSelectionChanged(this._selectionRenderModel.selectionStart, this._selectionRenderModel.selectionEnd, this._selectionRenderModel.columnSelectMode);
	}
	handleCharSizeChanged() {
		this._updateDimensions(), this._widthCache.clear(), this._setDefaultSpacing();
	}
	handleBlur() {
		this._rowContainer.classList.remove(Wi), this.renderRows(0, this._bufferService.rows - 1);
	}
	handleFocus() {
		this._rowContainer.classList.add(Wi), this.renderRows(this._bufferService.buffer.y, this._bufferService.buffer.y);
	}
	handleSelectionChanged(e, t, n) {
		if (this._selectionContainer.replaceChildren(), this._rowFactory.handleSelectionChanged(e, t, n), this.renderRows(0, this._bufferService.rows - 1), !e || !t || (this._selectionRenderModel.update(this._terminal, e, t, n), !this._selectionRenderModel.hasSelection)) return;
		let r = this._selectionRenderModel.viewportStartRow, i = this._selectionRenderModel.viewportEndRow, a = this._selectionRenderModel.viewportCappedStartRow, o = this._selectionRenderModel.viewportCappedEndRow, s = this._document.createDocumentFragment();
		if (n) {
			let n = e[0] > t[0];
			s.appendChild(this._createSelectionElement(a, n ? t[0] : e[0], n ? e[0] : t[0], o - a + 1));
		} else {
			let n = r === a ? e[0] : 0, c = a === i ? t[0] : this._bufferService.cols;
			s.appendChild(this._createSelectionElement(a, n, c));
			let l = o - a - 1;
			if (s.appendChild(this._createSelectionElement(a + 1, 0, this._bufferService.cols, l)), a !== o) {
				let e = i === o ? t[0] : this._bufferService.cols;
				s.appendChild(this._createSelectionElement(o, 0, e));
			}
		}
		this._selectionContainer.appendChild(s);
	}
	_createSelectionElement(e, t, n, r = 1) {
		let i = this._document.createElement("div"), a = t * this.dimensions.css.cell.width, o = this.dimensions.css.cell.width * (n - t);
		return a + o > this.dimensions.css.canvas.width && (o = this.dimensions.css.canvas.width - a), i.style.height = `${r * this.dimensions.css.cell.height}px`, i.style.top = `${e * this.dimensions.css.cell.height}px`, i.style.left = `${a}px`, i.style.width = `${o}px`, i;
	}
	handleCursorMove() {}
	_handleOptionsChanged() {
		this._updateDimensions(), this._injectCss(this._themeService.colors), this._widthCache.setFont(this._optionsService.rawOptions.fontFamily, this._optionsService.rawOptions.fontSize, this._optionsService.rawOptions.fontWeight, this._optionsService.rawOptions.fontWeightBold), this._setDefaultSpacing();
	}
	clear() {
		for (let e of this._rowElements) e.replaceChildren();
	}
	renderRows(e, t) {
		let n = this._bufferService.buffer, r = n.ybase + n.y, i = Math.min(n.x, this._bufferService.cols - 1), a = this._coreService.decPrivateModes.cursorBlink ?? this._optionsService.rawOptions.cursorBlink, o = this._coreService.decPrivateModes.cursorStyle ?? this._optionsService.rawOptions.cursorStyle, s = this._optionsService.rawOptions.cursorInactiveStyle;
		for (let c = e; c <= t; c++) {
			let e = c + n.ydisp, t = this._rowElements[c], l = n.lines.get(e);
			if (!t || !l) break;
			t.replaceChildren(...this._rowFactory.createRow(l, e, e === r, o, s, i, a, this.dimensions.css.cell.width, this._widthCache, -1, -1));
		}
	}
	get _terminalSelector() {
		return `.${Bi}${this._terminalClass}`;
	}
	_handleLinkHover(e) {
		this._setCellUnderline(e.x1, e.x2, e.y1, e.y2, e.cols, !0);
	}
	_handleLinkLeave(e) {
		this._setCellUnderline(e.x1, e.x2, e.y1, e.y2, e.cols, !1);
	}
	_setCellUnderline(e, t, n, r, i, a) {
		n < 0 && (e = 0), r < 0 && (t = 0);
		let o = this._bufferService.rows - 1;
		n = Math.max(Math.min(n, o), 0), r = Math.max(Math.min(r, o), 0), i = Math.min(i, this._bufferService.cols);
		let s = this._bufferService.buffer, c = s.ybase + s.y, l = Math.min(s.x, i - 1), u = this._optionsService.rawOptions.cursorBlink, d = this._optionsService.rawOptions.cursorStyle, f = this._optionsService.rawOptions.cursorInactiveStyle;
		for (let o = n; o <= r; ++o) {
			let p = o + s.ydisp, m = this._rowElements[o], h = s.lines.get(p);
			if (!m || !h) break;
			m.replaceChildren(...this._rowFactory.createRow(h, p, p === c, d, f, l, u, this.dimensions.css.cell.width, this._widthCache, a ? o === n ? e : 0 : -1, a ? (o === r ? t : i) - 1 : -1));
		}
	}
};
qi = w([
	T(7, Ze),
	T(8, at),
	T(9, $e),
	T(10, qe),
	T(11, Ye),
	T(12, ot),
	T(13, dt)
], qi);
var Ji = class extends O {
	constructor(e, t, n) {
		super(), this._optionsService = n, this.width = 0, this.height = 0, this._onCharSizeChange = this._register(new A()), this.onCharSizeChange = this._onCharSizeChange.event;
		try {
			this._measureStrategy = this._register(new Zi(this._optionsService));
		} catch {
			this._measureStrategy = this._register(new Xi(e, t, this._optionsService));
		}
		this._register(this._optionsService.onMultipleOptionChange(["fontFamily", "fontSize"], () => this.measure()));
	}
	get hasValidSize() {
		return this.width > 0 && this.height > 0;
	}
	measure() {
		let e = this._measureStrategy.measure();
		(e.width !== this.width || e.height !== this.height) && (this.width = e.width, this.height = e.height, this._onCharSizeChange.fire());
	}
};
Ji = w([T(2, $e)], Ji);
var Yi = class extends O {
	constructor() {
		super(...arguments), this._result = {
			width: 0,
			height: 0
		};
	}
	_validateAndSet(e, t) {
		e !== void 0 && e > 0 && t !== void 0 && t > 0 && (this._result.width = e, this._result.height = t);
	}
}, Xi = class extends Yi {
	constructor(e, t, n) {
		super(), this._document = e, this._parentElement = t, this._optionsService = n, this._measureElement = this._document.createElement("span"), this._measureElement.classList.add("xterm-char-measure-element"), this._measureElement.textContent = "W".repeat(32), this._measureElement.setAttribute("aria-hidden", "true"), this._measureElement.style.whiteSpace = "pre", this._measureElement.style.fontKerning = "none", this._parentElement.appendChild(this._measureElement);
	}
	measure() {
		return this._measureElement.style.fontFamily = this._optionsService.rawOptions.fontFamily, this._measureElement.style.fontSize = `${this._optionsService.rawOptions.fontSize}px`, this._validateAndSet(Number(this._measureElement.offsetWidth) / 32, Number(this._measureElement.offsetHeight)), this._result;
	}
}, Zi = class extends Yi {
	constructor(e) {
		super(), this._optionsService = e, this._canvas = new OffscreenCanvas(100, 100), this._ctx = this._canvas.getContext("2d");
		let t = this._ctx.measureText("W");
		if (!("width" in t && "fontBoundingBoxAscent" in t && "fontBoundingBoxDescent" in t)) throw Error("Required font metrics not supported");
	}
	measure() {
		this._ctx.font = `${this._optionsService.rawOptions.fontSize}px ${this._optionsService.rawOptions.fontFamily}`;
		let e = this._ctx.measureText("W");
		return this._validateAndSet(e.width, e.fontBoundingBoxAscent + e.fontBoundingBoxDescent), this._result;
	}
}, Qi = class extends O {
	constructor(e, t, n) {
		super(), this._textarea = e, this._window = t, this.mainDocument = n, this._isFocused = !1, this._cachedIsFocused = void 0, this._screenDprMonitor = this._register(new $i(this._window)), this._onDprChange = this._register(new A()), this.onDprChange = this._onDprChange.event, this._onWindowChange = this._register(new A()), this.onWindowChange = this._onWindowChange.event, this._register(this.onWindowChange((e) => this._screenDprMonitor.setWindow(e))), this._register(Vt.forward(this._screenDprMonitor.onDprChange, this._onDprChange)), this._register(j(this._textarea, "focus", () => this._isFocused = !0)), this._register(j(this._textarea, "blur", () => this._isFocused = !1));
	}
	get window() {
		return this._window;
	}
	set window(e) {
		this._window !== e && (this._window = e, this._onWindowChange.fire(this._window));
	}
	get dpr() {
		return this.window.devicePixelRatio;
	}
	get isFocused() {
		return this._cachedIsFocused === void 0 && (this._cachedIsFocused = this._isFocused && this._textarea.ownerDocument.hasFocus(), queueMicrotask(() => this._cachedIsFocused = void 0)), this._cachedIsFocused;
	}
}, $i = class extends O {
	constructor(e) {
		super(), this._parentWindow = e, this._windowResizeListener = this._register(new Ft()), this._onDprChange = this._register(new A()), this.onDprChange = this._onDprChange.event, this._outerListener = () => this._setDprAndFireIfDiffers(), this._currentDevicePixelRatio = this._parentWindow.devicePixelRatio, this._updateDpr(), this._setWindowResizeListener(), this._register(D(() => this.clearListener()));
	}
	setWindow(e) {
		this._parentWindow = e, this._setWindowResizeListener(), this._setDprAndFireIfDiffers();
	}
	_setWindowResizeListener() {
		this._windowResizeListener.value = j(this._parentWindow, "resize", () => this._setDprAndFireIfDiffers());
	}
	_setDprAndFireIfDiffers() {
		this._parentWindow.devicePixelRatio !== this._currentDevicePixelRatio && this._onDprChange.fire(this._parentWindow.devicePixelRatio), this._updateDpr();
	}
	_updateDpr() {
		this._outerListener && (this._resolutionMediaMatchList?.removeListener(this._outerListener), this._currentDevicePixelRatio = this._parentWindow.devicePixelRatio, this._resolutionMediaMatchList = this._parentWindow.matchMedia(`screen and (resolution: ${this._parentWindow.devicePixelRatio}dppx)`), this._resolutionMediaMatchList.addListener(this._outerListener));
	}
	clearListener() {
		!this._resolutionMediaMatchList || !this._outerListener || (this._resolutionMediaMatchList.removeListener(this._outerListener), this._resolutionMediaMatchList = void 0, this._outerListener = void 0);
	}
}, ea = class extends O {
	constructor() {
		super(), this.linkProviders = [], this._register(D(() => this.linkProviders.length = 0));
	}
	registerLinkProvider(e) {
		return this.linkProviders.push(e), { dispose: () => {
			let t = this.linkProviders.indexOf(e);
			t !== -1 && this.linkProviders.splice(t, 1);
		} };
	}
};
function ta(e, t, n) {
	let r = n.getBoundingClientRect(), i = e.getComputedStyle(n), a = parseInt(i.getPropertyValue("padding-left")), o = parseInt(i.getPropertyValue("padding-top"));
	return [t.clientX - r.left - a, t.clientY - r.top - o];
}
function na(e, t, n, r, i, a, o, s, c) {
	if (!a) return;
	let l = ta(e, t, n);
	if (l) return l[0] = Math.ceil((l[0] + (c ? o / 2 : 0)) / o), l[1] = Math.ceil(l[1] / s), l[0] = Math.min(Math.max(l[0], 1), r + +!!c), l[1] = Math.min(Math.max(l[1], 1), i), l;
}
var ra = class {
	constructor(e, t) {
		this._renderService = e, this._charSizeService = t;
	}
	getCoords(e, t, n, r, i) {
		return na(window, e, t, n, r, this._charSizeService.hasValidSize, this._renderService.dimensions.css.cell.width, this._renderService.dimensions.css.cell.height, i);
	}
	getMouseReportCoords(e, t) {
		let n = ta(window, e, t);
		if (this._charSizeService.hasValidSize) return n[0] = Math.min(Math.max(n[0], 0), this._renderService.dimensions.css.canvas.width - 1), n[1] = Math.min(Math.max(n[1], 0), this._renderService.dimensions.css.canvas.height - 1), {
			col: Math.floor(n[0] / this._renderService.dimensions.css.cell.width),
			row: Math.floor(n[1] / this._renderService.dimensions.css.cell.height),
			x: Math.floor(n[0]),
			y: Math.floor(n[1])
		};
	}
};
ra = w([T(0, ct), T(1, at)], ra);
var ia = class {
	constructor(e, t) {
		this._renderCallback = e, this._coreBrowserService = t, this._refreshCallbacks = [];
	}
	dispose() {
		this._animationFrame &&= (this._coreBrowserService.window.cancelAnimationFrame(this._animationFrame), void 0);
	}
	addRefreshCallback(e) {
		return this._refreshCallbacks.push(e), this._animationFrame ||= this._coreBrowserService.window.requestAnimationFrame(() => this._innerRefresh()), this._animationFrame;
	}
	refresh(e, t, n) {
		this._rowCount = n, e = e === void 0 ? 0 : e, t = t === void 0 ? this._rowCount - 1 : t, this._rowStart = this._rowStart === void 0 ? e : Math.min(this._rowStart, e), this._rowEnd = this._rowEnd === void 0 ? t : Math.max(this._rowEnd, t), !this._animationFrame && (this._animationFrame = this._coreBrowserService.window.requestAnimationFrame(() => this._innerRefresh()));
	}
	_innerRefresh() {
		if (this._animationFrame = void 0, this._rowStart === void 0 || this._rowEnd === void 0 || this._rowCount === void 0) {
			this._runRefreshCallbacks();
			return;
		}
		let e = Math.max(this._rowStart, 0), t = Math.min(this._rowEnd, this._rowCount - 1);
		this._rowStart = void 0, this._rowEnd = void 0, this._renderCallback(e, t), this._runRefreshCallbacks();
	}
	_runRefreshCallbacks() {
		for (let e of this._refreshCallbacks) e(0);
		this._refreshCallbacks = [];
	}
}, aa = {};
xe(aa, {
	getSafariVersion: () => fa,
	isChromeOS: () => va,
	isFirefox: () => la,
	isIpad: () => ma,
	isIphone: () => ha,
	isLegacyEdge: () => ua,
	isLinux: () => _a,
	isMac: () => pa,
	isNode: () => oa,
	isSafari: () => da,
	isWindows: () => ga
});
var oa = typeof process < "u" && "title" in process, sa = oa ? "node" : navigator.userAgent, ca = oa ? "node" : navigator.platform, la = sa.includes("Firefox"), ua = sa.includes("Edge"), da = /^((?!chrome|android).)*safari/i.test(sa);
function fa() {
	if (!da) return 0;
	let e = sa.match(/Version\/(\d+)/);
	return e === null || e.length < 2 ? 0 : parseInt(e[1]);
}
var pa = [
	"Macintosh",
	"MacIntel",
	"MacPPC",
	"Mac68K"
].includes(ca), ma = ca === "iPad", ha = ca === "iPhone", ga = [
	"Windows",
	"Win16",
	"Win32",
	"WinCE"
].includes(ca), _a = ca.indexOf("Linux") >= 0, va = /\bCrOS\b/.test(sa), ya = class {
	constructor() {
		this._tasks = [], this._i = 0;
	}
	enqueue(e) {
		this._tasks.push(e), this._start();
	}
	flush() {
		for (; this._i < this._tasks.length;) this._tasks[this._i]() || this._i++;
		this.clear();
	}
	clear() {
		this._idleCallback &&= (this._cancelCallback(this._idleCallback), void 0), this._i = 0, this._tasks.length = 0;
	}
	_start() {
		this._idleCallback ||= this._requestCallback(this._process.bind(this));
	}
	_process(e) {
		this._idleCallback = void 0;
		let t = 0, n = 0, r = e.timeRemaining(), i = 0;
		for (; this._i < this._tasks.length;) {
			if (t = performance.now(), this._tasks[this._i]() || this._i++, t = Math.max(1, performance.now() - t), n = Math.max(t, n), i = e.timeRemaining(), n * 1.5 > i) {
				r - t < -20 && console.warn(`task queue exceeded allotted deadline by ${Math.abs(Math.round(r - t))}ms`), this._start();
				return;
			}
			r = i;
		}
		this.clear();
	}
}, ba = class extends ya {
	_requestCallback(e) {
		return setTimeout(() => e(this._createDeadline(16)));
	}
	_cancelCallback(e) {
		clearTimeout(e);
	}
	_createDeadline(e) {
		let t = performance.now() + e;
		return { timeRemaining: () => Math.max(0, t - performance.now()) };
	}
}, xa = class extends ya {
	_requestCallback(e) {
		return requestIdleCallback(e);
	}
	_cancelCallback(e) {
		cancelIdleCallback(e);
	}
}, Sa = !oa && "requestIdleCallback" in window ? xa : ba, Ca = class {
	constructor() {
		this._queue = new Sa();
	}
	set(e) {
		this._queue.clear(), this._queue.enqueue(e);
	}
	flush() {
		this._queue.flush();
	}
}, wa = class extends O {
	constructor(e, t, n, r, i, a, o, s, c) {
		super(), this._rowCount = e, this._optionsService = n, this._charSizeService = r, this._coreService = i, this._coreBrowserService = s, this._renderer = this._register(new Ft()), this._pausedResizeTask = new Ca(), this._observerDisposable = this._register(new Ft()), this._isPaused = !1, this._needsFullRefresh = !1, this._isNextRenderRedrawOnly = !0, this._needsSelectionRefresh = !1, this._canvasWidth = 0, this._canvasHeight = 0, this._selectionState = {
			start: void 0,
			end: void 0,
			columnSelectMode: !1
		}, this._onDimensionsChange = this._register(new A()), this.onDimensionsChange = this._onDimensionsChange.event, this._onRenderedViewportChange = this._register(new A()), this.onRenderedViewportChange = this._onRenderedViewportChange.event, this._onRender = this._register(new A()), this.onRender = this._onRender.event, this._onRefreshRequest = this._register(new A()), this.onRefreshRequest = this._onRefreshRequest.event, this._renderDebouncer = new ia((e, t) => this._renderRows(e, t), this._coreBrowserService), this._register(this._renderDebouncer), this._syncOutputHandler = new Ta(this._coreBrowserService, this._coreService, () => this._fullRefresh()), this._register(D(() => this._syncOutputHandler.dispose())), this._register(this._coreBrowserService.onDprChange(() => this.handleDevicePixelRatioChange())), this._register(o.onResize(() => this._fullRefresh())), this._register(o.buffers.onBufferActivate(() => this._renderer.value?.clear())), this._register(this._optionsService.onOptionChange(() => this._handleOptionsChanged())), this._register(this._charSizeService.onCharSizeChange(() => this.handleCharSizeChanged())), this._register(a.onDecorationRegistered(() => this._fullRefresh())), this._register(a.onDecorationRemoved(() => this._fullRefresh())), this._register(this._optionsService.onMultipleOptionChange([
			"customGlyphs",
			"drawBoldTextInBrightColors",
			"letterSpacing",
			"lineHeight",
			"fontFamily",
			"fontSize",
			"fontWeight",
			"fontWeightBold",
			"minimumContrastRatio",
			"rescaleOverlappingGlyphs"
		], () => {
			this.clear(), this.handleResize(o.cols, o.rows), this._fullRefresh();
		})), this._register(this._optionsService.onMultipleOptionChange(["cursorBlink", "cursorStyle"], () => this.refreshRows(o.buffer.y, o.buffer.y, !0))), this._register(c.onChangeColors(() => this._fullRefresh())), this._registerIntersectionObserver(this._coreBrowserService.window, t), this._register(this._coreBrowserService.onWindowChange((e) => this._registerIntersectionObserver(e, t)));
	}
	get dimensions() {
		return this._renderer.value.dimensions;
	}
	_registerIntersectionObserver(e, t) {
		if ("IntersectionObserver" in e) {
			let n = new e.IntersectionObserver((e) => this._handleIntersectionChange(e[e.length - 1]), { threshold: 0 });
			n.observe(t), this._observerDisposable.value = D(() => n.disconnect());
		}
	}
	_handleIntersectionChange(e) {
		this._isPaused = e.isIntersecting === void 0 ? e.intersectionRatio === 0 : !e.isIntersecting, !this._isPaused && !this._charSizeService.hasValidSize && this._charSizeService.measure(), !this._isPaused && this._needsFullRefresh && (this._pausedResizeTask.flush(), this.refreshRows(0, this._rowCount - 1), this._needsFullRefresh = !1);
	}
	refreshRows(e, t, n = !1) {
		if (this._isPaused) {
			this._needsFullRefresh = !0;
			return;
		}
		if (this._coreService.decPrivateModes.synchronizedOutput) {
			this._syncOutputHandler.bufferRows(e, t);
			return;
		}
		let r = this._syncOutputHandler.flush();
		r && (e = Math.min(e, r.start), t = Math.max(t, r.end)), n || (this._isNextRenderRedrawOnly = !1), this._renderDebouncer.refresh(e, t, this._rowCount);
	}
	_renderRows(e, t) {
		if (this._renderer.value) {
			if (this._coreService.decPrivateModes.synchronizedOutput) {
				this._syncOutputHandler.bufferRows(e, t);
				return;
			}
			e = Math.min(e, this._rowCount - 1), t = Math.min(t, this._rowCount - 1), this._renderer.value.renderRows(e, t), this._needsSelectionRefresh &&= (this._renderer.value.handleSelectionChanged(this._selectionState.start, this._selectionState.end, this._selectionState.columnSelectMode), !1), this._isNextRenderRedrawOnly || this._onRenderedViewportChange.fire({
				start: e,
				end: t
			}), this._onRender.fire({
				start: e,
				end: t
			}), this._isNextRenderRedrawOnly = !0;
		}
	}
	resize(e, t) {
		this._rowCount = t, this._fireOnCanvasResize();
	}
	_handleOptionsChanged() {
		this._renderer.value && (this.refreshRows(0, this._rowCount - 1), this._fireOnCanvasResize());
	}
	_fireOnCanvasResize() {
		this._renderer.value && (this._renderer.value.dimensions.css.canvas.width === this._canvasWidth && this._renderer.value.dimensions.css.canvas.height === this._canvasHeight || this._onDimensionsChange.fire(this._renderer.value.dimensions));
	}
	hasRenderer() {
		return !!this._renderer.value;
	}
	setRenderer(e) {
		this._renderer.value = e, this._renderer.value && (this._renderer.value.onRequestRedraw((e) => this.refreshRows(e.start, e.end, !0)), this._needsSelectionRefresh = !0, this._fullRefresh());
	}
	addRefreshCallback(e) {
		return this._renderDebouncer.addRefreshCallback(e);
	}
	_fullRefresh() {
		this._isPaused ? this._needsFullRefresh = !0 : this.refreshRows(0, this._rowCount - 1);
	}
	clearTextureAtlas() {
		this._renderer.value && (this._renderer.value.clearTextureAtlas?.(), this._fullRefresh());
	}
	handleDevicePixelRatioChange() {
		this._charSizeService.measure(), this._renderer.value && (this._renderer.value.handleDevicePixelRatioChange(), this.refreshRows(0, this._rowCount - 1));
	}
	handleResize(e, t) {
		this._renderer.value && (this._isPaused ? this._pausedResizeTask.set(() => this._renderer.value?.handleResize(e, t)) : this._renderer.value.handleResize(e, t), this._fullRefresh());
	}
	handleCharSizeChanged() {
		this._renderer.value?.handleCharSizeChanged();
	}
	handleBlur() {
		this._renderer.value?.handleBlur();
	}
	handleFocus() {
		this._renderer.value?.handleFocus();
	}
	handleSelectionChanged(e, t, n) {
		this._selectionState.start = e, this._selectionState.end = t, this._selectionState.columnSelectMode = n, this._renderer.value?.handleSelectionChanged(e, t, n);
	}
	handleCursorMove() {
		this._renderer.value?.handleCursorMove();
	}
	clear() {
		this._renderer.value?.clear();
	}
};
wa = w([
	T(2, $e),
	T(3, at),
	T(4, Ye),
	T(5, nt),
	T(6, qe),
	T(7, ot),
	T(8, dt)
], wa);
var Ta = class {
	constructor(e, t, n) {
		this._coreBrowserService = e, this._coreService = t, this._onTimeout = n, this._start = 0, this._end = 0, this._isBuffering = !1;
	}
	bufferRows(e, t) {
		this._isBuffering ? (this._start = Math.min(this._start, e), this._end = Math.max(this._end, t)) : (this._start = e, this._end = t, this._isBuffering = !0), this._timeout === void 0 && (this._timeout = this._coreBrowserService.window.setTimeout(() => {
			this._timeout = void 0, this._coreService.decPrivateModes.synchronizedOutput = !1, this._onTimeout();
		}, 1e3));
	}
	flush() {
		if (this._timeout !== void 0 && (this._coreBrowserService.window.clearTimeout(this._timeout), this._timeout = void 0), !this._isBuffering) return;
		let e = {
			start: this._start,
			end: this._end
		};
		return this._isBuffering = !1, e;
	}
	dispose() {
		this._timeout !== void 0 && (this._coreBrowserService.window.clearTimeout(this._timeout), this._timeout = void 0);
	}
};
function Ea(e, t, n, r) {
	let i = n.buffer.x, a = n.buffer.y;
	if (!n.buffer.hasScrollback) return ka(i, a, e, t, n, r) + Aa(a, t, n, r) + ja(i, a, e, t, n, r);
	let o;
	if (a === t) return o = i > e ? "D" : "C", Ra(Math.abs(i - e), La(o, r));
	o = a > t ? "D" : "C";
	let s = Math.abs(a - t);
	return Ra(Oa(a > t ? e : i, n) + (s - 1) * n.cols + 1 + Da(a > t ? i : e, n), La(o, r));
}
function Da(e, t) {
	return e - 1;
}
function Oa(e, t) {
	return t.cols - e;
}
function ka(e, t, n, r, i, a) {
	return Aa(t, r, i, a).length === 0 ? "" : Ra(Ia(e, t, e, t - Na(t, i), !1, i).length, La("D", a));
}
function Aa(e, t, n, r) {
	let i = e - Na(e, n), a = t - Na(t, n);
	return Ra(Math.abs(i - a) - Ma(e, t, n), La(Fa(e, t), r));
}
function ja(e, t, n, r, i, a) {
	let o;
	o = Aa(t, r, i, a).length > 0 ? r - Na(r, i) : t;
	let s = r, c = Pa(e, t, n, r, i, a);
	return Ra(Ia(e, o, n, s, c === "C", i).length, La(c, a));
}
function Ma(e, t, n) {
	let r = 0, i = e - Na(e, n), a = t - Na(t, n);
	for (let o = 0; o < Math.abs(i - a); o++) {
		let a = Fa(e, t) === "A" ? -1 : 1;
		n.buffer.lines.get(i + a * o)?.isWrapped && r++;
	}
	return r;
}
function Na(e, t) {
	let n = 0, r = t.buffer.lines.get(e), i = r?.isWrapped;
	for (; i && e >= 0 && e < t.rows;) n++, r = t.buffer.lines.get(--e), i = r?.isWrapped;
	return n;
}
function Pa(e, t, n, r, i, a) {
	let o;
	return o = Aa(n, r, i, a).length > 0 ? r - Na(r, i) : t, e < n && o <= r || e >= n && o < r ? "C" : "D";
}
function Fa(e, t) {
	return e > t ? "A" : "B";
}
function Ia(e, t, n, r, i, a) {
	let o = e, s = t, c = "";
	for (; (o !== n || s !== r) && s >= 0 && s < a.buffer.lines.length;) o += i ? 1 : -1, i && o > a.cols - 1 ? (c += a.buffer.translateBufferLineToString(s, !1, e, o), o = 0, e = 0, s++) : !i && o < 0 && (c += a.buffer.translateBufferLineToString(s, !1, 0, e + 1), o = a.cols - 1, e = o, s--);
	return c + a.buffer.translateBufferLineToString(s, !1, e, o);
}
function La(e, t) {
	let n = t ? "O" : "[";
	return N.ESC + n + e;
}
function Ra(e, t) {
	e = Math.floor(e);
	let n = "";
	for (let r = 0; r < e; r++) n += t;
	return n;
}
var za = class {
	constructor(e) {
		this._bufferService = e, this.isSelectAllActive = !1, this.selectionStartLength = 0;
	}
	clearSelection() {
		this.selectionStart = void 0, this.selectionEnd = void 0, this.isSelectAllActive = !1, this.selectionStartLength = 0;
	}
	get finalSelectionStart() {
		return this.isSelectAllActive ? [0, 0] : !this.selectionEnd || !this.selectionStart ? this.selectionStart : this.areSelectionValuesReversed() ? this.selectionEnd : this.selectionStart;
	}
	get finalSelectionEnd() {
		if (this.isSelectAllActive) return [this._bufferService.cols, this._bufferService.buffer.ybase + this._bufferService.rows - 1];
		if (this.selectionStart) {
			if (!this.selectionEnd || this.areSelectionValuesReversed()) {
				let e = this.selectionStart[0] + this.selectionStartLength;
				return e > this._bufferService.cols ? e % this._bufferService.cols === 0 ? [this._bufferService.cols, this.selectionStart[1] + Math.floor(e / this._bufferService.cols) - 1] : [e % this._bufferService.cols, this.selectionStart[1] + Math.floor(e / this._bufferService.cols)] : [e, this.selectionStart[1]];
			}
			if (this.selectionStartLength && this.selectionEnd[1] === this.selectionStart[1]) {
				let e = this.selectionStart[0] + this.selectionStartLength;
				return e > this._bufferService.cols ? [e % this._bufferService.cols, this.selectionStart[1] + Math.floor(e / this._bufferService.cols)] : [Math.max(e, this.selectionEnd[0]), this.selectionEnd[1]];
			}
			return this.selectionEnd;
		}
	}
	areSelectionValuesReversed() {
		let e = this.selectionStart, t = this.selectionEnd;
		return !e || !t ? !1 : e[1] > t[1] || e[1] === t[1] && e[0] > t[0];
	}
	handleTrim(e) {
		return this.selectionStart && (this.selectionStart[1] -= e), this.selectionEnd && (this.selectionEnd[1] -= e), this.selectionEnd && this.selectionEnd[1] < 0 ? (this.clearSelection(), !0) : (this.selectionStart && this.selectionStart[1] < 0 && (this.selectionStart[1] = 0), !1);
	}
};
function Ba(e, t) {
	if (e.start.y > e.end.y) throw Error(`Buffer range end (${e.end.x}, ${e.end.y}) cannot be before start (${e.start.x}, ${e.start.y})`);
	return t * (e.end.y - e.start.y) + (e.end.x - e.start.x + 1);
}
var Va = 50, Ha = 15, Ua = 50, Wa = 500, Ga = /* @__PURE__ */ RegExp("\xA0", "g"), Ka = class extends O {
	constructor(e, t, n, r, i, a, o, s, c) {
		super(), this._element = e, this._screenElement = t, this._linkifier = n, this._bufferService = r, this._coreService = i, this._mouseService = a, this._optionsService = o, this._renderService = s, this._coreBrowserService = c, this._dragScrollAmount = 0, this._enabled = !0, this._workCell = new Ve(), this._mouseDownTimeStamp = 0, this._oldHasSelection = !1, this._oldSelectionStart = void 0, this._oldSelectionEnd = void 0, this._onLinuxMouseSelection = this._register(new A()), this.onLinuxMouseSelection = this._onLinuxMouseSelection.event, this._onRedrawRequest = this._register(new A()), this.onRequestRedraw = this._onRedrawRequest.event, this._onSelectionChange = this._register(new A()), this.onSelectionChange = this._onSelectionChange.event, this._onRequestScrollLines = this._register(new A()), this.onRequestScrollLines = this._onRequestScrollLines.event, this._mouseMoveListener = (e) => this._handleMouseMove(e), this._mouseUpListener = (e) => this._handleMouseUp(e), this._coreService.onUserInput(() => {
			this.hasSelection && this.clearSelection();
		}), this._trimListener = this._bufferService.buffer.lines.onTrim((e) => this._handleTrim(e)), this._register(this._bufferService.buffers.onBufferActivate((e) => this._handleBufferActivate(e))), this.enable(), this._model = new za(this._bufferService), this._activeSelectionMode = 0, this._register(D(() => {
			this._removeMouseDownListeners();
		})), this._register(this._bufferService.onResize((e) => {
			e.rowsChanged && this.clearSelection();
		}));
	}
	reset() {
		this.clearSelection();
	}
	disable() {
		this.clearSelection(), this._enabled = !1;
	}
	enable() {
		this._enabled = !0;
	}
	get selectionStart() {
		return this._model.finalSelectionStart;
	}
	get selectionEnd() {
		return this._model.finalSelectionEnd;
	}
	get hasSelection() {
		let e = this._model.finalSelectionStart, t = this._model.finalSelectionEnd;
		return !e || !t ? !1 : e[0] !== t[0] || e[1] !== t[1];
	}
	get selectionText() {
		let e = this._model.finalSelectionStart, t = this._model.finalSelectionEnd;
		if (!e || !t) return "";
		let n = this._bufferService.buffer, r = [];
		if (this._activeSelectionMode === 3) {
			if (e[0] === t[0]) return "";
			let i = e[0] < t[0] ? e[0] : t[0], a = e[0] < t[0] ? t[0] : e[0];
			for (let o = e[1]; o <= t[1]; o++) {
				let e = n.translateBufferLineToString(o, !0, i, a);
				r.push(e);
			}
		} else {
			let i = e[1] === t[1] ? t[0] : void 0;
			r.push(n.translateBufferLineToString(e[1], !0, e[0], i));
			for (let i = e[1] + 1; i <= t[1] - 1; i++) {
				let e = n.lines.get(i), t = n.translateBufferLineToString(i, !0);
				e?.isWrapped ? r[r.length - 1] += t : r.push(t);
			}
			if (e[1] !== t[1]) {
				let e = n.lines.get(t[1]), i = n.translateBufferLineToString(t[1], !0, 0, t[0]);
				e && e.isWrapped ? r[r.length - 1] += i : r.push(i);
			}
		}
		return r.map((e) => e.replace(Ga, " ")).join(ga ? "\r\n" : "\n");
	}
	clearSelection() {
		this._model.clearSelection(), this._removeMouseDownListeners(), this.refresh(), this._onSelectionChange.fire();
	}
	refresh(e) {
		this._refreshAnimationFrame ||= this._coreBrowserService.window.requestAnimationFrame(() => this._refresh()), _a && e && this.selectionText.length && this._onLinuxMouseSelection.fire(this.selectionText);
	}
	_refresh() {
		this._refreshAnimationFrame = void 0, this._onRedrawRequest.fire({
			start: this._model.finalSelectionStart,
			end: this._model.finalSelectionEnd,
			columnSelectMode: this._activeSelectionMode === 3
		});
	}
	_isClickInSelection(e) {
		let t = this._getMouseBufferCoords(e), n = this._model.finalSelectionStart, r = this._model.finalSelectionEnd;
		return !n || !r || !t ? !1 : this._areCoordsInSelection(t, n, r);
	}
	isCellInSelection(e, t) {
		let n = this._model.finalSelectionStart, r = this._model.finalSelectionEnd;
		return !n || !r ? !1 : this._areCoordsInSelection([e, t], n, r);
	}
	_areCoordsInSelection(e, t, n) {
		return e[1] > t[1] && e[1] < n[1] || t[1] === n[1] && e[1] === t[1] && e[0] >= t[0] && e[0] < n[0] || t[1] < n[1] && e[1] === n[1] && e[0] < n[0] || t[1] < n[1] && e[1] === t[1] && e[0] >= t[0];
	}
	_selectWordAtCursor(e, t) {
		let n = this._linkifier.currentLink?.link?.range;
		if (n) return this._model.selectionStart = [n.start.x - 1, n.start.y - 1], this._model.selectionStartLength = Ba(n, this._bufferService.cols), this._model.selectionEnd = void 0, !0;
		let r = this._getMouseBufferCoords(e);
		return r ? (this._selectWordAt(r, t), this._model.selectionEnd = void 0, !0) : !1;
	}
	selectAll() {
		this._model.isSelectAllActive = !0, this.refresh(), this._onSelectionChange.fire();
	}
	selectLines(e, t) {
		this._model.clearSelection(), e = Math.max(e, 0), t = Math.min(t, this._bufferService.buffer.lines.length - 1), this._model.selectionStart = [0, e], this._model.selectionEnd = [this._bufferService.cols, t], this.refresh(), this._onSelectionChange.fire();
	}
	_handleTrim(e) {
		this._model.handleTrim(e) && this.refresh();
	}
	_getMouseBufferCoords(e) {
		let t = this._mouseService.getCoords(e, this._screenElement, this._bufferService.cols, this._bufferService.rows, !0);
		if (t) return t[0]--, t[1]--, t[1] += this._bufferService.buffer.ydisp, t;
	}
	_getMouseEventScrollAmount(e) {
		let t = ta(this._coreBrowserService.window, e, this._screenElement)[1], n = this._renderService.dimensions.css.canvas.height;
		return t >= 0 && t <= n ? 0 : (t > n && (t -= n), t = Math.min(Math.max(t, -Va), Va), t /= Va, t / Math.abs(t) + Math.round(t * (Ha - 1)));
	}
	shouldForceSelection(e) {
		return pa ? e.altKey && this._optionsService.rawOptions.macOptionClickForcesSelection : e.shiftKey;
	}
	handleMouseDown(e) {
		if (this._mouseDownTimeStamp = e.timeStamp, !(e.button === 2 && this.hasSelection) && e.button === 0) {
			if (!this._enabled) {
				if (!this.shouldForceSelection(e)) return;
				e.stopPropagation();
			}
			e.preventDefault(), this._dragScrollAmount = 0, this._enabled && e.shiftKey ? this._handleIncrementalClick(e) : e.detail === 1 ? this._handleSingleClick(e) : e.detail === 2 ? this._handleDoubleClick(e) : e.detail === 3 && this._handleTripleClick(e), this._addMouseDownListeners(), this.refresh(!0);
		}
	}
	_addMouseDownListeners() {
		this._screenElement.ownerDocument && (this._screenElement.ownerDocument.addEventListener("mousemove", this._mouseMoveListener), this._screenElement.ownerDocument.addEventListener("mouseup", this._mouseUpListener)), this._dragScrollIntervalTimer = this._coreBrowserService.window.setInterval(() => this._dragScroll(), Ua);
	}
	_removeMouseDownListeners() {
		this._screenElement.ownerDocument && (this._screenElement.ownerDocument.removeEventListener("mousemove", this._mouseMoveListener), this._screenElement.ownerDocument.removeEventListener("mouseup", this._mouseUpListener)), this._coreBrowserService.window.clearInterval(this._dragScrollIntervalTimer), this._dragScrollIntervalTimer = void 0;
	}
	_handleIncrementalClick(e) {
		this._model.selectionStart && (this._model.selectionEnd = this._getMouseBufferCoords(e));
	}
	_handleSingleClick(e) {
		if (this._model.selectionStartLength = 0, this._model.isSelectAllActive = !1, this._activeSelectionMode = this.shouldColumnSelect(e) ? 3 : 0, this._model.selectionStart = this._getMouseBufferCoords(e), !this._model.selectionStart) return;
		this._model.selectionEnd = void 0;
		let t = this._bufferService.buffer.lines.get(this._model.selectionStart[1]);
		t && t.length !== this._model.selectionStart[0] && t.hasWidth(this._model.selectionStart[0]) === 0 && this._model.selectionStart[0]++;
	}
	_handleDoubleClick(e) {
		this._selectWordAtCursor(e, !0) && (this._activeSelectionMode = 1);
	}
	_handleTripleClick(e) {
		let t = this._getMouseBufferCoords(e);
		t && (this._activeSelectionMode = 2, this._selectLineAt(t[1]));
	}
	shouldColumnSelect(e) {
		return e.altKey && !(pa && this._optionsService.rawOptions.macOptionClickForcesSelection);
	}
	_handleMouseMove(e) {
		if (e.stopImmediatePropagation(), !this._model.selectionStart) return;
		let t = this._model.selectionEnd ? [this._model.selectionEnd[0], this._model.selectionEnd[1]] : null;
		if (this._model.selectionEnd = this._getMouseBufferCoords(e), !this._model.selectionEnd) {
			this.refresh(!0);
			return;
		}
		this._activeSelectionMode === 2 ? this._model.selectionEnd[1] < this._model.selectionStart[1] ? this._model.selectionEnd[0] = 0 : this._model.selectionEnd[0] = this._bufferService.cols : this._activeSelectionMode === 1 && this._selectToWordAt(this._model.selectionEnd), this._dragScrollAmount = this._getMouseEventScrollAmount(e), this._activeSelectionMode !== 3 && (this._dragScrollAmount > 0 ? this._model.selectionEnd[0] = this._bufferService.cols : this._dragScrollAmount < 0 && (this._model.selectionEnd[0] = 0));
		let n = this._bufferService.buffer;
		if (this._model.selectionEnd[1] < n.lines.length) {
			let e = n.lines.get(this._model.selectionEnd[1]);
			e && e.hasWidth(this._model.selectionEnd[0]) === 0 && this._model.selectionEnd[0] < this._bufferService.cols && this._model.selectionEnd[0]++;
		}
		t && t[0] === this._model.selectionEnd[0] && t[1] === this._model.selectionEnd[1] || this.refresh(!0);
	}
	_dragScroll() {
		if (this._model.selectionEnd && this._model.selectionStart && this._dragScrollAmount) {
			this._onRequestScrollLines.fire({
				amount: this._dragScrollAmount,
				suppressScrollEvent: !1
			});
			let e = this._bufferService.buffer;
			this._dragScrollAmount > 0 ? (this._activeSelectionMode !== 3 && (this._model.selectionEnd[0] = this._bufferService.cols), this._model.selectionEnd[1] = Math.min(e.ydisp + this._bufferService.rows, e.lines.length - 1)) : (this._activeSelectionMode !== 3 && (this._model.selectionEnd[0] = 0), this._model.selectionEnd[1] = e.ydisp), this.refresh();
		}
	}
	_handleMouseUp(e) {
		let t = e.timeStamp - this._mouseDownTimeStamp;
		if (this._removeMouseDownListeners(), this.selectionText.length <= 1 && t < Wa && e.altKey && this._optionsService.rawOptions.altClickMovesCursor) {
			if (this._bufferService.buffer.ybase === this._bufferService.buffer.ydisp) {
				let t = this._mouseService.getCoords(e, this._element, this._bufferService.cols, this._bufferService.rows, !1);
				if (t && t[0] !== void 0 && t[1] !== void 0) {
					let e = Ea(t[0] - 1, t[1] - 1, this._bufferService, this._coreService.decPrivateModes.applicationCursorKeys);
					this._coreService.triggerDataEvent(e, !0);
				}
			}
		} else this._fireEventIfSelectionChanged();
	}
	_fireEventIfSelectionChanged() {
		let e = this._model.finalSelectionStart, t = this._model.finalSelectionEnd, n = !!e && !!t && (e[0] !== t[0] || e[1] !== t[1]);
		n ? !e || !t || this._oldSelectionStart && this._oldSelectionEnd && e[0] === this._oldSelectionStart[0] && e[1] === this._oldSelectionStart[1] && t[0] === this._oldSelectionEnd[0] && t[1] === this._oldSelectionEnd[1] || this._fireOnSelectionChange(e, t, n) : this._oldHasSelection && this._fireOnSelectionChange(e, t, n);
	}
	_fireOnSelectionChange(e, t, n) {
		this._oldSelectionStart = e, this._oldSelectionEnd = t, this._oldHasSelection = n, this._onSelectionChange.fire();
	}
	_handleBufferActivate(e) {
		this.clearSelection(), this._trimListener.dispose(), this._trimListener = e.activeBuffer.lines.onTrim((e) => this._handleTrim(e));
	}
	_convertViewportColToCharacterIndex(e, t) {
		let n = t;
		for (let r = 0; t >= r; r++) {
			let i = e.loadCell(r, this._workCell).getChars().length;
			this._workCell.getWidth() === 0 ? n-- : i > 1 && t !== r && (n += i - 1);
		}
		return n;
	}
	setSelection(e, t, n) {
		this._model.clearSelection(), this._removeMouseDownListeners(), this._model.selectionStart = [e, t], this._model.selectionStartLength = n, this.refresh(), this._fireEventIfSelectionChanged();
	}
	rightClickSelect(e) {
		this._isClickInSelection(e) || (this._selectWordAtCursor(e, !1) && this.refresh(!0), this._fireEventIfSelectionChanged());
	}
	_getWordAt(e, t, n = !0, r = !0) {
		if (e[0] >= this._bufferService.cols) return;
		let i = this._bufferService.buffer, a = i.lines.get(e[1]);
		if (!a) return;
		let o = i.translateBufferLineToString(e[1], !1), s = this._convertViewportColToCharacterIndex(a, e[0]), c = s, l = e[0] - s, u = 0, d = 0, f = 0, p = 0;
		if (o.charAt(s) === " ") {
			for (; s > 0 && o.charAt(s - 1) === " ";) s--;
			for (; c < o.length && o.charAt(c + 1) === " ";) c++;
		} else {
			let t = e[0], n = e[0];
			a.getWidth(t) === 0 && (u++, t--), a.getWidth(n) === 2 && (d++, n++);
			let r = a.getString(n).length;
			for (r > 1 && (p += r - 1, c += r - 1); t > 0 && s > 0 && !this._isCharWordSeparator(a.loadCell(t - 1, this._workCell));) {
				a.loadCell(t - 1, this._workCell);
				let e = this._workCell.getChars().length;
				this._workCell.getWidth() === 0 ? (u++, t--) : e > 1 && (f += e - 1, s -= e - 1), s--, t--;
			}
			for (; n < a.length && c + 1 < o.length && !this._isCharWordSeparator(a.loadCell(n + 1, this._workCell));) {
				a.loadCell(n + 1, this._workCell);
				let e = this._workCell.getChars().length;
				this._workCell.getWidth() === 2 ? (d++, n++) : e > 1 && (p += e - 1, c += e - 1), c++, n++;
			}
		}
		c++;
		let m = s + l - u + f, h = Math.min(this._bufferService.cols, c - s + u + d - f - p);
		if (t || o.slice(s, c).trim() !== "") {
			if (n && m === 0 && a.getCodePoint(0) !== 32) {
				let t = i.lines.get(e[1] - 1);
				if (t && a.isWrapped && t.getCodePoint(this._bufferService.cols - 1) !== 32) {
					let t = this._getWordAt([this._bufferService.cols - 1, e[1] - 1], !1, !0, !1);
					if (t) {
						let e = this._bufferService.cols - t.start;
						m -= e, h += e;
					}
				}
			}
			if (r && m + h === this._bufferService.cols && a.getCodePoint(this._bufferService.cols - 1) !== 32) {
				let t = i.lines.get(e[1] + 1);
				if (t?.isWrapped && t.getCodePoint(0) !== 32) {
					let t = this._getWordAt([0, e[1] + 1], !1, !1, !0);
					t && (h += t.length);
				}
			}
			return {
				start: m,
				length: h
			};
		}
	}
	_selectWordAt(e, t) {
		let n = this._getWordAt(e, t);
		if (n) {
			for (; n.start < 0;) n.start += this._bufferService.cols, e[1]--;
			this._model.selectionStart = [n.start, e[1]], this._model.selectionStartLength = n.length;
		}
	}
	_selectToWordAt(e) {
		let t = this._getWordAt(e, !0);
		if (t) {
			let n = e[1];
			for (; t.start < 0;) t.start += this._bufferService.cols, n--;
			if (!this._model.areSelectionValuesReversed()) for (; t.start + t.length > this._bufferService.cols;) t.length -= this._bufferService.cols, n++;
			this._model.selectionEnd = [this._model.areSelectionValuesReversed() ? t.start : t.start + t.length, n];
		}
	}
	_isCharWordSeparator(e) {
		return e.getWidth() !== 0 && this._optionsService.rawOptions.wordSeparator.indexOf(e.getChars()) >= 0;
	}
	_selectLineAt(e) {
		let t = this._bufferService.buffer.getWrappedRangeForLine(e), n = {
			start: {
				x: 0,
				y: t.first
			},
			end: {
				x: this._bufferService.cols - 1,
				y: t.last
			}
		};
		this._model.selectionStart = [0, t.first], this._model.selectionEnd = void 0, this._model.selectionStartLength = Ba(n, this._bufferService.cols);
	}
};
Ka = w([
	T(3, qe),
	T(4, Ye),
	T(5, st),
	T(6, $e),
	T(7, ct),
	T(8, ot)
], Ka);
var qa = class {
	constructor() {
		this._data = {};
	}
	set(e, t, n) {
		this._data[e] || (this._data[e] = {}), this._data[e][t] = n;
	}
	get(e, t) {
		return this._data[e] ? this._data[e][t] : void 0;
	}
	clear() {
		this._data = {};
	}
}, Ja = class {
	constructor() {
		this._color = new qa(), this._css = new qa();
	}
	setCss(e, t, n) {
		this._css.set(e, t, n);
	}
	getCss(e, t) {
		return this._css.get(e, t);
	}
	setColor(e, t, n) {
		this._color.set(e, t, n);
	}
	getColor(e, t) {
		return this._color.get(e, t);
	}
	clear() {
		this._color.clear(), this._css.clear();
	}
}, B = Object.freeze((() => {
	let e = [
		z.toColor("#2e3436"),
		z.toColor("#cc0000"),
		z.toColor("#4e9a06"),
		z.toColor("#c4a000"),
		z.toColor("#3465a4"),
		z.toColor("#75507b"),
		z.toColor("#06989a"),
		z.toColor("#d3d7cf"),
		z.toColor("#555753"),
		z.toColor("#ef2929"),
		z.toColor("#8ae234"),
		z.toColor("#fce94f"),
		z.toColor("#729fcf"),
		z.toColor("#ad7fa8"),
		z.toColor("#34e2e2"),
		z.toColor("#eeeeec")
	], t = [
		0,
		95,
		135,
		175,
		215,
		255
	];
	for (let n = 0; n < 216; n++) {
		let r = t[n / 36 % 6 | 0], i = t[n / 6 % 6 | 0], a = t[n % 6];
		e.push({
			css: L.toCss(r, i, a),
			rgba: L.toRgba(r, i, a)
		});
	}
	for (let t = 0; t < 24; t++) {
		let n = 8 + t * 10;
		e.push({
			css: L.toCss(n, n, n),
			rgba: L.toRgba(n, n, n)
		});
	}
	return e;
})()), Ya = z.toColor("#ffffff"), Xa = z.toColor("#000000"), Za = z.toColor("#ffffff"), Qa = Xa, $a = {
	css: "rgba(255, 255, 255, 0.3)",
	rgba: 4294967117
}, eo = Ya, to = class extends O {
	constructor(e) {
		super(), this._optionsService = e, this._contrastCache = new Ja(), this._halfContrastCache = new Ja(), this._onChangeColors = this._register(new A()), this.onChangeColors = this._onChangeColors.event, this._colors = {
			foreground: Ya,
			background: Xa,
			cursor: Za,
			cursorAccent: Qa,
			selectionForeground: void 0,
			selectionBackgroundTransparent: $a,
			selectionBackgroundOpaque: R.blend(Xa, $a),
			selectionInactiveBackgroundTransparent: $a,
			selectionInactiveBackgroundOpaque: R.blend(Xa, $a),
			scrollbarSliderBackground: R.opacity(Ya, .2),
			scrollbarSliderHoverBackground: R.opacity(Ya, .4),
			scrollbarSliderActiveBackground: R.opacity(Ya, .5),
			overviewRulerBorder: Ya,
			ansi: B.slice(),
			contrastCache: this._contrastCache,
			halfContrastCache: this._halfContrastCache
		}, this._updateRestoreColors(), this._setTheme(this._optionsService.rawOptions.theme), this._register(this._optionsService.onSpecificOptionChange("minimumContrastRatio", () => this._contrastCache.clear())), this._register(this._optionsService.onSpecificOptionChange("theme", () => this._setTheme(this._optionsService.rawOptions.theme)));
	}
	get colors() {
		return this._colors;
	}
	_setTheme(e = {}) {
		let t = this._colors;
		if (t.foreground = V(e.foreground, Ya), t.background = V(e.background, Xa), t.cursor = R.blend(t.background, V(e.cursor, Za)), t.cursorAccent = R.blend(t.background, V(e.cursorAccent, Qa)), t.selectionBackgroundTransparent = V(e.selectionBackground, $a), t.selectionBackgroundOpaque = R.blend(t.background, t.selectionBackgroundTransparent), t.selectionInactiveBackgroundTransparent = V(e.selectionInactiveBackground, t.selectionBackgroundTransparent), t.selectionInactiveBackgroundOpaque = R.blend(t.background, t.selectionInactiveBackgroundTransparent), t.selectionForeground = e.selectionForeground ? V(e.selectionForeground, Ci) : void 0, t.selectionForeground === Ci && (t.selectionForeground = void 0), R.isOpaque(t.selectionBackgroundTransparent) && (t.selectionBackgroundTransparent = R.opacity(t.selectionBackgroundTransparent, .3)), R.isOpaque(t.selectionInactiveBackgroundTransparent) && (t.selectionInactiveBackgroundTransparent = R.opacity(t.selectionInactiveBackgroundTransparent, .3)), t.scrollbarSliderBackground = V(e.scrollbarSliderBackground, R.opacity(t.foreground, .2)), t.scrollbarSliderHoverBackground = V(e.scrollbarSliderHoverBackground, R.opacity(t.foreground, .4)), t.scrollbarSliderActiveBackground = V(e.scrollbarSliderActiveBackground, R.opacity(t.foreground, .5)), t.overviewRulerBorder = V(e.overviewRulerBorder, eo), t.ansi = B.slice(), t.ansi[0] = V(e.black, B[0]), t.ansi[1] = V(e.red, B[1]), t.ansi[2] = V(e.green, B[2]), t.ansi[3] = V(e.yellow, B[3]), t.ansi[4] = V(e.blue, B[4]), t.ansi[5] = V(e.magenta, B[5]), t.ansi[6] = V(e.cyan, B[6]), t.ansi[7] = V(e.white, B[7]), t.ansi[8] = V(e.brightBlack, B[8]), t.ansi[9] = V(e.brightRed, B[9]), t.ansi[10] = V(e.brightGreen, B[10]), t.ansi[11] = V(e.brightYellow, B[11]), t.ansi[12] = V(e.brightBlue, B[12]), t.ansi[13] = V(e.brightMagenta, B[13]), t.ansi[14] = V(e.brightCyan, B[14]), t.ansi[15] = V(e.brightWhite, B[15]), e.extendedAnsi) {
			let n = Math.min(t.ansi.length - 16, e.extendedAnsi.length);
			for (let r = 0; r < n; r++) t.ansi[r + 16] = V(e.extendedAnsi[r], B[r + 16]);
		}
		this._contrastCache.clear(), this._halfContrastCache.clear(), this._updateRestoreColors(), this._onChangeColors.fire(this.colors);
	}
	restoreColor(e) {
		this._restoreColor(e), this._onChangeColors.fire(this.colors);
	}
	_restoreColor(e) {
		if (e === void 0) for (let e = 0; e < this._restoreColors.ansi.length; ++e) this._colors.ansi[e] = this._restoreColors.ansi[e];
		else switch (e) {
			case 256:
				this._colors.foreground = this._restoreColors.foreground;
				break;
			case 257:
				this._colors.background = this._restoreColors.background;
				break;
			case 258:
				this._colors.cursor = this._restoreColors.cursor;
				break;
			default: this._colors.ansi[e] = this._restoreColors.ansi[e];
		}
	}
	modifyColors(e) {
		e(this._colors), this._onChangeColors.fire(this.colors);
	}
	_updateRestoreColors() {
		this._restoreColors = {
			foreground: this._colors.foreground,
			background: this._colors.background,
			cursor: this._colors.cursor,
			ansi: this._colors.ansi.slice()
		};
	}
};
to = w([T(0, $e)], to);
function V(e, t) {
	if (e !== void 0) try {
		return z.toColor(e);
	} catch {}
	return t;
}
var no = class {
	constructor(...e) {
		this._entries = /* @__PURE__ */ new Map();
		for (let [t, n] of e) this.set(t, n);
	}
	set(e, t) {
		let n = this._entries.get(e);
		return this._entries.set(e, t), n;
	}
	forEach(e) {
		for (let [t, n] of this._entries.entries()) e(t, n);
	}
	has(e) {
		return this._entries.has(e);
	}
	get(e) {
		return this._entries.get(e);
	}
}, ro = class {
	constructor() {
		this._services = new no(), this._services.set(Ze, this);
	}
	setService(e, t) {
		this._services.set(e, t);
	}
	getService(e) {
		return this._services.get(e);
	}
	createInstance(e, ...t) {
		let n = Ge(e).sort((e, t) => e.index - t.index), r = [];
		for (let t of n) {
			let n = this._services.get(t.id);
			if (!n) throw Error(`[createInstance] ${e.name} depends on UNKNOWN service ${t.id._id}.`);
			r.push(n);
		}
		let i = n.length > 0 ? n[0].index : t.length;
		if (t.length !== i) throw Error(`[createInstance] First service dependency of ${e.name} at position ${i + 1} conflicts with ${t.length} static arguments`);
		return new e(...t, ...r);
	}
}, io = {
	trace: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4,
	off: 5
}, ao = "xterm.js: ", oo = class extends O {
	constructor(e) {
		super(), this._optionsService = e, this._logLevel = 5, this._updateLogLevel(), this._register(this._optionsService.onSpecificOptionChange("logLevel", () => this._updateLogLevel())), so = this;
	}
	get logLevel() {
		return this._logLevel;
	}
	_updateLogLevel() {
		this._logLevel = io[this._optionsService.rawOptions.logLevel];
	}
	_evalLazyOptionalParams(e) {
		for (let t = 0; t < e.length; t++) typeof e[t] == "function" && (e[t] = e[t]());
	}
	_log(e, t, n) {
		this._evalLazyOptionalParams(n), e.call(console, (this._optionsService.options.logger ? "" : ao) + t, ...n);
	}
	trace(e, ...t) {
		this._logLevel <= 0 && this._log(this._optionsService.options.logger?.trace.bind(this._optionsService.options.logger) ?? console.log, e, t);
	}
	debug(e, ...t) {
		this._logLevel <= 1 && this._log(this._optionsService.options.logger?.debug.bind(this._optionsService.options.logger) ?? console.log, e, t);
	}
	info(e, ...t) {
		this._logLevel <= 2 && this._log(this._optionsService.options.logger?.info.bind(this._optionsService.options.logger) ?? console.info, e, t);
	}
	warn(e, ...t) {
		this._logLevel <= 3 && this._log(this._optionsService.options.logger?.warn.bind(this._optionsService.options.logger) ?? console.warn, e, t);
	}
	error(e, ...t) {
		this._logLevel <= 4 && this._log(this._optionsService.options.logger?.error.bind(this._optionsService.options.logger) ?? console.error, e, t);
	}
};
oo = w([T(0, $e)], oo);
var so, co = class extends O {
	constructor(e) {
		super(), this._maxLength = e, this.onDeleteEmitter = this._register(new A()), this.onDelete = this.onDeleteEmitter.event, this.onInsertEmitter = this._register(new A()), this.onInsert = this.onInsertEmitter.event, this.onTrimEmitter = this._register(new A()), this.onTrim = this.onTrimEmitter.event, this._array = Array(this._maxLength), this._startIndex = 0, this._length = 0;
	}
	get maxLength() {
		return this._maxLength;
	}
	set maxLength(e) {
		if (this._maxLength === e) return;
		let t = Array(e);
		for (let n = 0; n < Math.min(e, this.length); n++) t[n] = this._array[this._getCyclicIndex(n)];
		this._array = t, this._maxLength = e, this._startIndex = 0;
	}
	get length() {
		return this._length;
	}
	set length(e) {
		if (e > this._length) for (let t = this._length; t < e; t++) this._array[t] = void 0;
		this._length = e;
	}
	get(e) {
		return this._array[this._getCyclicIndex(e)];
	}
	set(e, t) {
		this._array[this._getCyclicIndex(e)] = t;
	}
	push(e) {
		this._array[this._getCyclicIndex(this._length)] = e, this._length === this._maxLength ? (this._startIndex = ++this._startIndex % this._maxLength, this.onTrimEmitter.fire(1)) : this._length++;
	}
	recycle() {
		if (this._length !== this._maxLength) throw Error("Can only recycle when the buffer is full");
		return this._startIndex = ++this._startIndex % this._maxLength, this.onTrimEmitter.fire(1), this._array[this._getCyclicIndex(this._length - 1)];
	}
	get isFull() {
		return this._length === this._maxLength;
	}
	pop() {
		return this._array[this._getCyclicIndex(this._length-- - 1)];
	}
	splice(e, t, ...n) {
		if (t) {
			for (let n = e; n < this._length - t; n++) this._array[this._getCyclicIndex(n)] = this._array[this._getCyclicIndex(n + t)];
			this._length -= t, this.onDeleteEmitter.fire({
				index: e,
				amount: t
			});
		}
		for (let t = this._length - 1; t >= e; t--) this._array[this._getCyclicIndex(t + n.length)] = this._array[this._getCyclicIndex(t)];
		for (let t = 0; t < n.length; t++) this._array[this._getCyclicIndex(e + t)] = n[t];
		if (n.length && this.onInsertEmitter.fire({
			index: e,
			amount: n.length
		}), this._length + n.length > this._maxLength) {
			let e = this._length + n.length - this._maxLength;
			this._startIndex += e, this._length = this._maxLength, this.onTrimEmitter.fire(e);
		} else this._length += n.length;
	}
	trimStart(e) {
		e > this._length && (e = this._length), this._startIndex += e, this._length -= e, this.onTrimEmitter.fire(e);
	}
	shiftElements(e, t, n) {
		if (!(t <= 0)) {
			if (e < 0 || e >= this._length) throw Error("start argument out of range");
			if (e + n < 0) throw Error("Cannot shift elements in list beyond index 0");
			if (n > 0) {
				for (let r = t - 1; r >= 0; r--) this.set(e + r + n, this.get(e + r));
				let r = e + t + n - this._length;
				if (r > 0) for (this._length += r; this._length > this._maxLength;) this._length--, this._startIndex++, this.onTrimEmitter.fire(1);
			} else for (let r = 0; r < t; r++) this.set(e + r + n, this.get(e + r));
		}
	}
	_getCyclicIndex(e) {
		return (this._startIndex + e) % this._maxLength;
	}
}, H = 3, U = Object.freeze(new ze()), lo = 0, uo = 2, fo = class e {
	constructor(e, t, n = !1) {
		this.isWrapped = n, this._combined = {}, this._extendedAttrs = {}, this._data = new Uint32Array(e * H);
		let r = t || Ve.fromCharData([
			0,
			Le,
			1,
			0
		]);
		for (let t = 0; t < e; ++t) this.setCell(t, r);
		this.length = e;
	}
	get(e) {
		let t = this._data[e * H + 0], n = t & 2097151;
		return [
			this._data[e * H + 1],
			t & 2097152 ? this._combined[e] : n ? Ne(n) : "",
			t >> 22,
			t & 2097152 ? this._combined[e].charCodeAt(this._combined[e].length - 1) : n
		];
	}
	set(e, t) {
		this._data[e * H + 1] = t[0], t[1].length > 1 ? (this._combined[e] = t[1], this._data[e * H + 0] = e | 2097152 | t[2] << 22) : this._data[e * H + 0] = t[1].charCodeAt(0) | t[2] << 22;
	}
	getWidth(e) {
		return this._data[e * H + 0] >> 22;
	}
	hasWidth(e) {
		return this._data[e * H + 0] & 12582912;
	}
	getFg(e) {
		return this._data[e * H + 1];
	}
	getBg(e) {
		return this._data[e * H + 2];
	}
	hasContent(e) {
		return this._data[e * H + 0] & 4194303;
	}
	getCodePoint(e) {
		let t = this._data[e * H + 0];
		return t & 2097152 ? this._combined[e].charCodeAt(this._combined[e].length - 1) : t & 2097151;
	}
	isCombined(e) {
		return this._data[e * H + 0] & 2097152;
	}
	getString(e) {
		let t = this._data[e * H + 0];
		return t & 2097152 ? this._combined[e] : t & 2097151 ? Ne(t & 2097151) : "";
	}
	isProtected(e) {
		return this._data[e * H + 2] & 536870912;
	}
	loadCell(e, t) {
		return lo = e * H, t.content = this._data[lo + 0], t.fg = this._data[lo + 1], t.bg = this._data[lo + 2], t.content & 2097152 && (t.combinedData = this._combined[e]), t.bg & 268435456 && (t.extended = this._extendedAttrs[e]), t;
	}
	setCell(e, t) {
		t.content & 2097152 && (this._combined[e] = t.combinedData), t.bg & 268435456 && (this._extendedAttrs[e] = t.extended), this._data[e * H + 0] = t.content, this._data[e * H + 1] = t.fg, this._data[e * H + 2] = t.bg;
	}
	setCellFromCodepoint(e, t, n, r) {
		r.bg & 268435456 && (this._extendedAttrs[e] = r.extended), this._data[e * H + 0] = t | n << 22, this._data[e * H + 1] = r.fg, this._data[e * H + 2] = r.bg;
	}
	addCodepointToCell(e, t, n) {
		let r = this._data[e * H + 0];
		r & 2097152 ? this._combined[e] += Ne(t) : r & 2097151 ? (this._combined[e] = Ne(r & 2097151) + Ne(t), r &= -2097152, r |= 2097152) : r = t | 1 << 22, n && (r &= -12582913, r |= n << 22), this._data[e * H + 0] = r;
	}
	insertCells(e, t, n) {
		if (e %= this.length, e && this.getWidth(e - 1) === 2 && this.setCellFromCodepoint(e - 1, 0, 1, n), t < this.length - e) {
			let r = new Ve();
			for (let n = this.length - e - t - 1; n >= 0; --n) this.setCell(e + t + n, this.loadCell(e + n, r));
			for (let r = 0; r < t; ++r) this.setCell(e + r, n);
		} else for (let t = e; t < this.length; ++t) this.setCell(t, n);
		this.getWidth(this.length - 1) === 2 && this.setCellFromCodepoint(this.length - 1, 0, 1, n);
	}
	deleteCells(e, t, n) {
		if (e %= this.length, t < this.length - e) {
			let r = new Ve();
			for (let n = 0; n < this.length - e - t; ++n) this.setCell(e + n, this.loadCell(e + t + n, r));
			for (let e = this.length - t; e < this.length; ++e) this.setCell(e, n);
		} else for (let t = e; t < this.length; ++t) this.setCell(t, n);
		e && this.getWidth(e - 1) === 2 && this.setCellFromCodepoint(e - 1, 0, 1, n), this.getWidth(e) === 0 && !this.hasContent(e) && this.setCellFromCodepoint(e, 0, 1, n);
	}
	replaceCells(e, t, n, r = !1) {
		if (r) for (e && this.getWidth(e - 1) === 2 && !this.isProtected(e - 1) && this.setCellFromCodepoint(e - 1, 0, 1, n), t < this.length && this.getWidth(t - 1) === 2 && !this.isProtected(t) && this.setCellFromCodepoint(t, 0, 1, n); e < t && e < this.length;) this.isProtected(e) || this.setCell(e, n), e++;
		else for (e && this.getWidth(e - 1) === 2 && this.setCellFromCodepoint(e - 1, 0, 1, n), t < this.length && this.getWidth(t - 1) === 2 && this.setCellFromCodepoint(t, 0, 1, n); e < t && e < this.length;) this.setCell(e++, n);
	}
	resize(e, t) {
		if (e === this.length) return this._data.length * 4 * uo < this._data.buffer.byteLength;
		let n = e * H;
		if (e > this.length) {
			if (this._data.buffer.byteLength >= n * 4) this._data = new Uint32Array(this._data.buffer, 0, n);
			else {
				let e = new Uint32Array(n);
				e.set(this._data), this._data = e;
			}
			for (let n = this.length; n < e; ++n) this.setCell(n, t);
		} else {
			this._data = this._data.subarray(0, n);
			let t = Object.keys(this._combined);
			for (let n = 0; n < t.length; n++) {
				let r = parseInt(t[n], 10);
				r >= e && delete this._combined[r];
			}
			let r = Object.keys(this._extendedAttrs);
			for (let t = 0; t < r.length; t++) {
				let n = parseInt(r[t], 10);
				n >= e && delete this._extendedAttrs[n];
			}
		}
		return this.length = e, n * 4 * uo < this._data.buffer.byteLength;
	}
	cleanupMemory() {
		if (this._data.length * 4 * uo < this._data.buffer.byteLength) {
			let e = new Uint32Array(this._data.length);
			return e.set(this._data), this._data = e, 1;
		}
		return 0;
	}
	fill(e, t = !1) {
		if (t) for (let t = 0; t < this.length; ++t) this.isProtected(t) || this.setCell(t, e);
		else {
			this._combined = {}, this._extendedAttrs = {};
			for (let t = 0; t < this.length; ++t) this.setCell(t, e);
		}
	}
	copyFrom(e) {
		this.length === e.length ? this._data.set(e._data) : this._data = new Uint32Array(e._data), this.length = e.length, this._combined = {};
		for (let t in e._combined) this._combined[t] = e._combined[t];
		this._extendedAttrs = {};
		for (let t in e._extendedAttrs) this._extendedAttrs[t] = e._extendedAttrs[t];
		this.isWrapped = e.isWrapped;
	}
	clone() {
		let t = new e(0);
		t._data = new Uint32Array(this._data), t.length = this.length;
		for (let e in this._combined) t._combined[e] = this._combined[e];
		for (let e in this._extendedAttrs) t._extendedAttrs[e] = this._extendedAttrs[e];
		return t.isWrapped = this.isWrapped, t;
	}
	getTrimmedLength() {
		for (let e = this.length - 1; e >= 0; --e) if (this._data[e * H + 0] & 4194303) return e + (this._data[e * H + 0] >> 22);
		return 0;
	}
	getNoBgTrimmedLength() {
		for (let e = this.length - 1; e >= 0; --e) if (this._data[e * H + 0] & 4194303 || this._data[e * H + 2] & 50331648) return e + (this._data[e * H + 0] >> 22);
		return 0;
	}
	copyCellsFrom(e, t, n, r, i) {
		let a = e._data;
		if (i) for (let i = r - 1; i >= 0; i--) {
			for (let e = 0; e < H; e++) this._data[(n + i) * H + e] = a[(t + i) * H + e];
			a[(t + i) * H + 2] & 268435456 && (this._extendedAttrs[n + i] = e._extendedAttrs[t + i]);
		}
		else for (let i = 0; i < r; i++) {
			for (let e = 0; e < H; e++) this._data[(n + i) * H + e] = a[(t + i) * H + e];
			a[(t + i) * H + 2] & 268435456 && (this._extendedAttrs[n + i] = e._extendedAttrs[t + i]);
		}
		let o = Object.keys(e._combined);
		for (let r = 0; r < o.length; r++) {
			let i = parseInt(o[r], 10);
			i >= t && (this._combined[i - t + n] = e._combined[i]);
		}
	}
	translateToString(e, t, n, r) {
		t ??= 0, n ??= this.length, e && (n = Math.min(n, this.getTrimmedLength())), r && (r.length = 0);
		let i = "";
		for (; t < n;) {
			let e = this._data[t * H + 0], n = e & 2097151, a = e & 2097152 ? this._combined[t] : n ? Ne(n) : Re;
			if (i += a, r) for (let e = 0; e < a.length; ++e) r.push(t);
			t += e >> 22 || 1;
		}
		return r && r.push(t), i;
	}
};
function po(e, t, n, r, i, a) {
	let o = [];
	for (let s = 0; s < e.length - 1; s++) {
		let c = s, l = e.get(++c);
		if (!l.isWrapped) continue;
		let u = [e.get(s)];
		for (; c < e.length && l.isWrapped;) u.push(l), l = e.get(++c);
		if (!a && r >= s && r < c) {
			s += u.length - 1;
			continue;
		}
		let d = 0, f = _o(u, d, t), p = 1, m = 0;
		for (; p < u.length;) {
			let e = _o(u, p, t), r = e - m, a = n - f, o = Math.min(r, a);
			u[d].copyCellsFrom(u[p], m, f, o, !1), f += o, f === n && (d++, f = 0), m += o, m === e && (p++, m = 0), f === 0 && d !== 0 && u[d - 1].getWidth(n - 1) === 2 && (u[d].copyCellsFrom(u[d - 1], n - 1, f++, 1, !1), u[d - 1].setCell(n - 1, i));
		}
		u[d].replaceCells(f, n, i);
		let h = 0;
		for (let e = u.length - 1; e > 0 && (e > d || u[e].getTrimmedLength() === 0); e--) h++;
		h > 0 && (o.push(s + u.length - h), o.push(h)), s += u.length - 1;
	}
	return o;
}
function mo(e, t) {
	let n = [], r = 0, i = t[r], a = 0;
	for (let o = 0; o < e.length; o++) if (i === o) {
		let n = t[++r];
		e.onDeleteEmitter.fire({
			index: o - a,
			amount: n
		}), o += n - 1, a += n, i = t[++r];
	} else n.push(o);
	return {
		layout: n,
		countRemoved: a
	};
}
function ho(e, t) {
	let n = [];
	for (let r = 0; r < t.length; r++) n.push(e.get(t[r]));
	for (let t = 0; t < n.length; t++) e.set(t, n[t]);
	e.length = t.length;
}
function go(e, t, n) {
	let r = [], i = e.map((n, r) => _o(e, r, t)).reduce((e, t) => e + t), a = 0, o = 0, s = 0;
	for (; s < i;) {
		if (i - s < n) {
			r.push(i - s);
			break;
		}
		a += n;
		let c = _o(e, o, t);
		a > c && (a -= c, o++);
		let l = e[o].getWidth(a - 1) === 2;
		l && a--;
		let u = l ? n - 1 : n;
		r.push(u), s += u;
	}
	return r;
}
function _o(e, t, n) {
	if (t === e.length - 1) return e[t].getTrimmedLength();
	let r = !e[t].hasContent(n - 1) && e[t].getWidth(n - 1) === 1, i = e[t + 1].getWidth(0) === 2;
	return r && i ? n - 1 : n;
}
var vo = class e {
	constructor(t) {
		this.line = t, this.isDisposed = !1, this._disposables = [], this._id = e._nextId++, this._onDispose = this.register(new A()), this.onDispose = this._onDispose.event;
	}
	get id() {
		return this._id;
	}
	dispose() {
		this.isDisposed || (this.isDisposed = !0, this.line = -1, this._onDispose.fire(), jt(this._disposables), this._disposables.length = 0);
	}
	register(e) {
		return this._disposables.push(e), e;
	}
};
vo._nextId = 1;
var yo = vo, W = {}, bo = W.B;
W[0] = {
	"`": "◆",
	a: "▒",
	b: "␉",
	c: "␌",
	d: "␍",
	e: "␊",
	f: "°",
	g: "±",
	h: "␤",
	i: "␋",
	j: "┘",
	k: "┐",
	l: "┌",
	m: "└",
	n: "┼",
	o: "⎺",
	p: "⎻",
	q: "─",
	r: "⎼",
	s: "⎽",
	t: "├",
	u: "┤",
	v: "┴",
	w: "┬",
	x: "│",
	y: "≤",
	z: "≥",
	"{": "π",
	"|": "≠",
	"}": "£",
	"~": "·"
}, W.A = { "#": "£" }, W.B = void 0, W[4] = {
	"#": "£",
	"@": "¾",
	"[": "ij",
	"\\": "½",
	"]": "|",
	"{": "¨",
	"|": "f",
	"}": "¼",
	"~": "´"
}, W.C = W[5] = {
	"[": "Ä",
	"\\": "Ö",
	"]": "Å",
	"^": "Ü",
	"`": "é",
	"{": "ä",
	"|": "ö",
	"}": "å",
	"~": "ü"
}, W.R = {
	"#": "£",
	"@": "à",
	"[": "°",
	"\\": "ç",
	"]": "§",
	"{": "é",
	"|": "ù",
	"}": "è",
	"~": "¨"
}, W.Q = {
	"@": "à",
	"[": "â",
	"\\": "ç",
	"]": "ê",
	"^": "î",
	"`": "ô",
	"{": "é",
	"|": "ù",
	"}": "è",
	"~": "û"
}, W.K = {
	"@": "§",
	"[": "Ä",
	"\\": "Ö",
	"]": "Ü",
	"{": "ä",
	"|": "ö",
	"}": "ü",
	"~": "ß"
}, W.Y = {
	"#": "£",
	"@": "§",
	"[": "°",
	"\\": "ç",
	"]": "é",
	"`": "ù",
	"{": "à",
	"|": "ò",
	"}": "è",
	"~": "ì"
}, W.E = W[6] = {
	"@": "Ä",
	"[": "Æ",
	"\\": "Ø",
	"]": "Å",
	"^": "Ü",
	"`": "ä",
	"{": "æ",
	"|": "ø",
	"}": "å",
	"~": "ü"
}, W.Z = {
	"#": "£",
	"@": "§",
	"[": "¡",
	"\\": "Ñ",
	"]": "¿",
	"{": "°",
	"|": "ñ",
	"}": "ç"
}, W.H = W[7] = {
	"@": "É",
	"[": "Ä",
	"\\": "Ö",
	"]": "Å",
	"^": "Ü",
	"`": "é",
	"{": "ä",
	"|": "ö",
	"}": "å",
	"~": "ü"
}, W["="] = {
	"#": "ù",
	"@": "à",
	"[": "é",
	"\\": "ç",
	"]": "ê",
	"^": "î",
	_: "è",
	"`": "ô",
	"{": "ä",
	"|": "ö",
	"}": "ü",
	"~": "û"
};
var xo = 4294967295, So = class {
	constructor(e, t, n) {
		this._hasScrollback = e, this._optionsService = t, this._bufferService = n, this.ydisp = 0, this.ybase = 0, this.y = 0, this.x = 0, this.tabs = {}, this.savedY = 0, this.savedX = 0, this.savedCurAttrData = U.clone(), this.savedCharset = bo, this.markers = [], this._nullCell = Ve.fromCharData([
			0,
			Le,
			1,
			0
		]), this._whitespaceCell = Ve.fromCharData([
			0,
			Re,
			1,
			32
		]), this._isClearing = !1, this._memoryCleanupQueue = new Sa(), this._memoryCleanupPosition = 0, this._cols = this._bufferService.cols, this._rows = this._bufferService.rows, this.lines = new co(this._getCorrectBufferLength(this._rows)), this.scrollTop = 0, this.scrollBottom = this._rows - 1, this.setupTabStops();
	}
	getNullCell(e) {
		return e ? (this._nullCell.fg = e.fg, this._nullCell.bg = e.bg, this._nullCell.extended = e.extended) : (this._nullCell.fg = 0, this._nullCell.bg = 0, this._nullCell.extended = new Be()), this._nullCell;
	}
	getWhitespaceCell(e) {
		return e ? (this._whitespaceCell.fg = e.fg, this._whitespaceCell.bg = e.bg, this._whitespaceCell.extended = e.extended) : (this._whitespaceCell.fg = 0, this._whitespaceCell.bg = 0, this._whitespaceCell.extended = new Be()), this._whitespaceCell;
	}
	getBlankLine(e, t) {
		return new fo(this._bufferService.cols, this.getNullCell(e), t);
	}
	get hasScrollback() {
		return this._hasScrollback && this.lines.maxLength > this._rows;
	}
	get isCursorInViewport() {
		let e = this.ybase + this.y - this.ydisp;
		return e >= 0 && e < this._rows;
	}
	_getCorrectBufferLength(e) {
		if (!this._hasScrollback) return e;
		let t = e + this._optionsService.rawOptions.scrollback;
		return t > xo ? xo : t;
	}
	fillViewportRows(e) {
		if (this.lines.length === 0) {
			e === void 0 && (e = U);
			let t = this._rows;
			for (; t--;) this.lines.push(this.getBlankLine(e));
		}
	}
	clear() {
		this.ydisp = 0, this.ybase = 0, this.y = 0, this.x = 0, this.lines = new co(this._getCorrectBufferLength(this._rows)), this.scrollTop = 0, this.scrollBottom = this._rows - 1, this.setupTabStops();
	}
	resize(e, t) {
		let n = this.getNullCell(U), r = 0, i = this._getCorrectBufferLength(t);
		if (i > this.lines.maxLength && (this.lines.maxLength = i), this.lines.length > 0) {
			if (this._cols < e) for (let t = 0; t < this.lines.length; t++) r += +this.lines.get(t).resize(e, n);
			let a = 0;
			if (this._rows < t) for (let r = this._rows; r < t; r++) this.lines.length < t + this.ybase && (this._optionsService.rawOptions.windowsMode || this._optionsService.rawOptions.windowsPty.backend !== void 0 || this._optionsService.rawOptions.windowsPty.buildNumber !== void 0 ? this.lines.push(new fo(e, n)) : this.ybase > 0 && this.lines.length <= this.ybase + this.y + a + 1 ? (this.ybase--, a++, this.ydisp > 0 && this.ydisp--) : this.lines.push(new fo(e, n)));
			else for (let e = this._rows; e > t; e--) this.lines.length > t + this.ybase && (this.lines.length > this.ybase + this.y + 1 ? this.lines.pop() : (this.ybase++, this.ydisp++));
			if (i < this.lines.maxLength) {
				let e = this.lines.length - i;
				e > 0 && (this.lines.trimStart(e), this.ybase = Math.max(this.ybase - e, 0), this.ydisp = Math.max(this.ydisp - e, 0), this.savedY = Math.max(this.savedY - e, 0)), this.lines.maxLength = i;
			}
			this.x = Math.min(this.x, e - 1), this.y = Math.min(this.y, t - 1), a && (this.y += a), this.savedX = Math.min(this.savedX, e - 1), this.scrollTop = 0;
		}
		if (this.scrollBottom = t - 1, this._isReflowEnabled && (this._reflow(e, t), this._cols > e)) for (let t = 0; t < this.lines.length; t++) r += +this.lines.get(t).resize(e, n);
		this._cols = e, this._rows = t, this._memoryCleanupQueue.clear(), r > .1 * this.lines.length && (this._memoryCleanupPosition = 0, this._memoryCleanupQueue.enqueue(() => this._batchedMemoryCleanup()));
	}
	_batchedMemoryCleanup() {
		let e = !0;
		this._memoryCleanupPosition >= this.lines.length && (this._memoryCleanupPosition = 0, e = !1);
		let t = 0;
		for (; this._memoryCleanupPosition < this.lines.length;) if (t += this.lines.get(this._memoryCleanupPosition++).cleanupMemory(), t > 100) return !0;
		return e;
	}
	get _isReflowEnabled() {
		let e = this._optionsService.rawOptions.windowsPty;
		return e && e.buildNumber ? this._hasScrollback && e.backend === "conpty" && e.buildNumber >= 21376 : this._hasScrollback && !this._optionsService.rawOptions.windowsMode;
	}
	_reflow(e, t) {
		this._cols !== e && (e > this._cols ? this._reflowLarger(e, t) : this._reflowSmaller(e, t));
	}
	_reflowLarger(e, t) {
		let n = this._optionsService.rawOptions.reflowCursorLine, r = po(this.lines, this._cols, e, this.ybase + this.y, this.getNullCell(U), n);
		if (r.length > 0) {
			let n = mo(this.lines, r);
			ho(this.lines, n.layout), this._reflowLargerAdjustViewport(e, t, n.countRemoved);
		}
	}
	_reflowLargerAdjustViewport(e, t, n) {
		let r = this.getNullCell(U), i = n;
		for (; i-- > 0;) this.ybase === 0 ? (this.y > 0 && this.y--, this.lines.length < t && this.lines.push(new fo(e, r))) : (this.ydisp === this.ybase && this.ydisp--, this.ybase--);
		this.savedY = Math.max(this.savedY - n, 0);
	}
	_reflowSmaller(e, t) {
		let n = this._optionsService.rawOptions.reflowCursorLine, r = this.getNullCell(U), i = [], a = 0;
		for (let o = this.lines.length - 1; o >= 0; o--) {
			let s = this.lines.get(o);
			if (!s || !s.isWrapped && s.getTrimmedLength() <= e) continue;
			let c = [s];
			for (; s.isWrapped && o > 0;) s = this.lines.get(--o), c.unshift(s);
			if (!n) {
				let e = this.ybase + this.y;
				if (e >= o && e < o + c.length) continue;
			}
			let l = c[c.length - 1].getTrimmedLength(), u = go(c, this._cols, e), d = u.length - c.length, f;
			f = this.ybase === 0 && this.y !== this.lines.length - 1 ? Math.max(0, this.y - this.lines.maxLength + d) : Math.max(0, this.lines.length - this.lines.maxLength + d);
			let p = [];
			for (let e = 0; e < d; e++) {
				let e = this.getBlankLine(U, !0);
				p.push(e);
			}
			p.length > 0 && (i.push({
				start: o + c.length + a,
				newLines: p
			}), a += p.length), c.push(...p);
			let m = u.length - 1, h = u[m];
			h === 0 && (m--, h = u[m]);
			let g = c.length - d - 1, _ = l;
			for (; g >= 0;) {
				let e = Math.min(_, h);
				if (c[m] === void 0) break;
				c[m].copyCellsFrom(c[g], _ - e, h - e, e, !0), h -= e, h === 0 && (m--, h = u[m]), _ -= e, _ === 0 && (g--, _ = _o(c, Math.max(g, 0), this._cols));
			}
			for (let t = 0; t < c.length; t++) u[t] < e && c[t].setCell(u[t], r);
			let v = d - f;
			for (; v-- > 0;) this.ybase === 0 ? this.y < t - 1 ? (this.y++, this.lines.pop()) : (this.ybase++, this.ydisp++) : this.ybase < Math.min(this.lines.maxLength, this.lines.length + a) - t && (this.ybase === this.ydisp && this.ydisp++, this.ybase++);
			this.savedY = Math.min(this.savedY + d, this.ybase + t - 1);
		}
		if (i.length > 0) {
			let e = [], t = [];
			for (let e = 0; e < this.lines.length; e++) t.push(this.lines.get(e));
			let n = this.lines.length, r = n - 1, o = 0, s = i[o];
			this.lines.length = Math.min(this.lines.maxLength, this.lines.length + a);
			let c = 0;
			for (let l = Math.min(this.lines.maxLength - 1, n + a - 1); l >= 0; l--) if (s && s.start > r + c) {
				for (let e = s.newLines.length - 1; e >= 0; e--) this.lines.set(l--, s.newLines[e]);
				l++, e.push({
					index: r + 1,
					amount: s.newLines.length
				}), c += s.newLines.length, s = i[++o];
			} else this.lines.set(l, t[r--]);
			let l = 0;
			for (let t = e.length - 1; t >= 0; t--) e[t].index += l, this.lines.onInsertEmitter.fire(e[t]), l += e[t].amount;
			let u = Math.max(0, n + a - this.lines.maxLength);
			u > 0 && this.lines.onTrimEmitter.fire(u);
		}
	}
	translateBufferLineToString(e, t, n = 0, r) {
		let i = this.lines.get(e);
		return i ? i.translateToString(t, n, r) : "";
	}
	getWrappedRangeForLine(e) {
		let t = e, n = e;
		for (; t > 0 && this.lines.get(t).isWrapped;) t--;
		for (; n + 1 < this.lines.length && this.lines.get(n + 1).isWrapped;) n++;
		return {
			first: t,
			last: n
		};
	}
	setupTabStops(e) {
		for (e == null ? (this.tabs = {}, e = 0) : this.tabs[e] || (e = this.prevStop(e)); e < this._cols; e += this._optionsService.rawOptions.tabStopWidth) this.tabs[e] = !0;
	}
	prevStop(e) {
		for (e ??= this.x; !this.tabs[--e] && e > 0;);
		return e >= this._cols ? this._cols - 1 : e < 0 ? 0 : e;
	}
	nextStop(e) {
		for (e ??= this.x; !this.tabs[++e] && e < this._cols;);
		return e >= this._cols ? this._cols - 1 : e < 0 ? 0 : e;
	}
	clearMarkers(e) {
		this._isClearing = !0;
		for (let t = 0; t < this.markers.length; t++) this.markers[t].line === e && (this.markers[t].dispose(), this.markers.splice(t--, 1));
		this._isClearing = !1;
	}
	clearAllMarkers() {
		this._isClearing = !0;
		for (let e = 0; e < this.markers.length; e++) this.markers[e].dispose();
		this.markers.length = 0, this._isClearing = !1;
	}
	addMarker(e) {
		let t = new yo(e);
		return this.markers.push(t), t.register(this.lines.onTrim((e) => {
			t.line -= e, t.line < 0 && t.dispose();
		})), t.register(this.lines.onInsert((e) => {
			t.line >= e.index && (t.line += e.amount);
		})), t.register(this.lines.onDelete((e) => {
			t.line >= e.index && t.line < e.index + e.amount && t.dispose(), t.line > e.index && (t.line -= e.amount);
		})), t.register(t.onDispose(() => this._removeMarker(t))), t;
	}
	_removeMarker(e) {
		this._isClearing || this.markers.splice(this.markers.indexOf(e), 1);
	}
}, Co = class extends O {
	constructor(e, t) {
		super(), this._optionsService = e, this._bufferService = t, this._onBufferActivate = this._register(new A()), this.onBufferActivate = this._onBufferActivate.event, this.reset(), this._register(this._optionsService.onSpecificOptionChange("scrollback", () => this.resize(this._bufferService.cols, this._bufferService.rows))), this._register(this._optionsService.onSpecificOptionChange("tabStopWidth", () => this.setupTabStops()));
	}
	reset() {
		this._normal = new So(!0, this._optionsService, this._bufferService), this._normal.fillViewportRows(), this._alt = new So(!1, this._optionsService, this._bufferService), this._activeBuffer = this._normal, this._onBufferActivate.fire({
			activeBuffer: this._normal,
			inactiveBuffer: this._alt
		}), this.setupTabStops();
	}
	get alt() {
		return this._alt;
	}
	get active() {
		return this._activeBuffer;
	}
	get normal() {
		return this._normal;
	}
	activateNormalBuffer() {
		this._activeBuffer !== this._normal && (this._normal.x = this._alt.x, this._normal.y = this._alt.y, this._alt.clearAllMarkers(), this._alt.clear(), this._activeBuffer = this._normal, this._onBufferActivate.fire({
			activeBuffer: this._normal,
			inactiveBuffer: this._alt
		}));
	}
	activateAltBuffer(e) {
		this._activeBuffer !== this._alt && (this._alt.fillViewportRows(e), this._alt.x = this._normal.x, this._alt.y = this._normal.y, this._activeBuffer = this._alt, this._onBufferActivate.fire({
			activeBuffer: this._alt,
			inactiveBuffer: this._normal
		}));
	}
	resize(e, t) {
		this._normal.resize(e, t), this._alt.resize(e, t), this.setupTabStops(e);
	}
	setupTabStops(e) {
		this._normal.setupTabStops(e), this._alt.setupTabStops(e);
	}
}, wo = 2, To = 1, Eo = class extends O {
	constructor(e) {
		super(), this.isUserScrolling = !1, this._onResize = this._register(new A()), this.onResize = this._onResize.event, this._onScroll = this._register(new A()), this.onScroll = this._onScroll.event, this.cols = Math.max(e.rawOptions.cols || 0, wo), this.rows = Math.max(e.rawOptions.rows || 0, To), this.buffers = this._register(new Co(e, this)), this._register(this.buffers.onBufferActivate((e) => {
			this._onScroll.fire(e.activeBuffer.ydisp);
		}));
	}
	get buffer() {
		return this.buffers.active;
	}
	resize(e, t) {
		let n = this.cols !== e, r = this.rows !== t;
		this.cols = e, this.rows = t, this.buffers.resize(e, t), this._onResize.fire({
			cols: e,
			rows: t,
			colsChanged: n,
			rowsChanged: r
		});
	}
	reset() {
		this.buffers.reset(), this.isUserScrolling = !1;
	}
	scroll(e, t = !1) {
		let n = this.buffer, r;
		r = this._cachedBlankLine, r && r.length === this.cols && r.getFg(0) === e.fg && r.getBg(0) === e.bg || (r = n.getBlankLine(e, t), this._cachedBlankLine = r), r.isWrapped = t;
		let i = n.ybase + n.scrollTop, a = n.ybase + n.scrollBottom;
		if (n.scrollTop === 0) {
			let e = n.lines.isFull;
			a === n.lines.length - 1 ? e ? n.lines.recycle().copyFrom(r) : n.lines.push(r.clone()) : n.lines.splice(a + 1, 0, r.clone()), e ? this.isUserScrolling && (n.ydisp = Math.max(n.ydisp - 1, 0)) : (n.ybase++, this.isUserScrolling || n.ydisp++);
		} else {
			let e = a - i + 1;
			n.lines.shiftElements(i + 1, e - 1, -1), n.lines.set(a, r.clone());
		}
		this.isUserScrolling || (n.ydisp = n.ybase), this._onScroll.fire(n.ydisp);
	}
	scrollLines(e, t) {
		let n = this.buffer;
		if (e < 0) {
			if (n.ydisp === 0) return;
			this.isUserScrolling = !0;
		} else e + n.ydisp >= n.ybase && (this.isUserScrolling = !1);
		let r = n.ydisp;
		n.ydisp = Math.max(Math.min(n.ydisp + e, n.ybase), 0), r !== n.ydisp && (t || this._onScroll.fire(n.ydisp));
	}
};
Eo = w([T(0, $e)], Eo);
var Do = {
	cols: 80,
	rows: 24,
	cursorBlink: !1,
	cursorStyle: "block",
	cursorWidth: 1,
	cursorInactiveStyle: "outline",
	customGlyphs: !0,
	drawBoldTextInBrightColors: !0,
	documentOverride: null,
	fastScrollModifier: "alt",
	fastScrollSensitivity: 5,
	fontFamily: "monospace",
	fontSize: 15,
	fontWeight: "normal",
	fontWeightBold: "bold",
	ignoreBracketedPasteMode: !1,
	lineHeight: 1,
	letterSpacing: 0,
	linkHandler: null,
	logLevel: "info",
	logger: null,
	scrollback: 1e3,
	scrollOnEraseInDisplay: !1,
	scrollOnUserInput: !0,
	scrollSensitivity: 1,
	screenReaderMode: !1,
	smoothScrollDuration: 0,
	macOptionIsMeta: !1,
	macOptionClickForcesSelection: !1,
	minimumContrastRatio: 1,
	disableStdin: !1,
	allowProposedApi: !1,
	allowTransparency: !1,
	tabStopWidth: 8,
	theme: {},
	reflowCursorLine: !1,
	rescaleOverlappingGlyphs: !1,
	rightClickSelectsWord: pa,
	windowOptions: {},
	windowsMode: !1,
	windowsPty: {},
	wordSeparator: " ()[]{}',\"`",
	altClickMovesCursor: !0,
	convertEol: !1,
	termName: "xterm",
	cancelEvents: !1,
	overviewRuler: {}
}, Oo = [
	"normal",
	"bold",
	"100",
	"200",
	"300",
	"400",
	"500",
	"600",
	"700",
	"800",
	"900"
], ko = class extends O {
	constructor(e) {
		super(), this._onOptionChange = this._register(new A()), this.onOptionChange = this._onOptionChange.event;
		let t = { ...Do };
		for (let n in e) if (n in t) try {
			let r = e[n];
			t[n] = this._sanitizeAndValidateOption(n, r);
		} catch (e) {
			console.error(e);
		}
		this.rawOptions = t, this.options = { ...t }, this._setupOptions(), this._register(D(() => {
			this.rawOptions.linkHandler = null, this.rawOptions.documentOverride = null;
		}));
	}
	onSpecificOptionChange(e, t) {
		return this.onOptionChange((n) => {
			n === e && t(this.rawOptions[e]);
		});
	}
	onMultipleOptionChange(e, t) {
		return this.onOptionChange((n) => {
			e.indexOf(n) !== -1 && t();
		});
	}
	_setupOptions() {
		let e = (e) => {
			if (!(e in Do)) throw Error(`No option with key "${e}"`);
			return this.rawOptions[e];
		}, t = (e, t) => {
			if (!(e in Do)) throw Error(`No option with key "${e}"`);
			t = this._sanitizeAndValidateOption(e, t), this.rawOptions[e] !== t && (this.rawOptions[e] = t, this._onOptionChange.fire(e));
		};
		for (let n in this.rawOptions) {
			let r = {
				get: e.bind(this, n),
				set: t.bind(this, n)
			};
			Object.defineProperty(this.options, n, r);
		}
	}
	_sanitizeAndValidateOption(e, t) {
		switch (e) {
			case "cursorStyle":
				if (t ||= Do[e], !Ao(t)) throw Error(`"${t}" is not a valid value for ${e}`);
				break;
			case "wordSeparator":
				t ||= Do[e];
				break;
			case "fontWeight":
			case "fontWeightBold":
				if (typeof t == "number" && 1 <= t && t <= 1e3) break;
				t = Oo.includes(t) ? t : Do[e];
				break;
			case "cursorWidth": t = Math.floor(t);
			case "lineHeight":
			case "tabStopWidth":
				if (t < 1) throw Error(`${e} cannot be less than 1, value: ${t}`);
				break;
			case "minimumContrastRatio":
				t = Math.max(1, Math.min(21, Math.round(t * 10) / 10));
				break;
			case "scrollback":
				if (t = Math.min(t, 4294967295), t < 0) throw Error(`${e} cannot be less than 0, value: ${t}`);
				break;
			case "fastScrollSensitivity":
			case "scrollSensitivity":
				if (t <= 0) throw Error(`${e} cannot be less than or equal to 0, value: ${t}`);
				break;
			case "rows":
			case "cols":
				if (!t && t !== 0) throw Error(`${e} must be numeric, value: ${t}`);
				break;
			case "windowsPty": t ??= {};
		}
		return t;
	}
};
function Ao(e) {
	return e === "block" || e === "underline" || e === "bar";
}
function jo(e, t = 5) {
	if (typeof e != "object") return e;
	let n = Array.isArray(e) ? [] : {};
	for (let r in e) n[r] = t <= 1 ? e[r] : e[r] && jo(e[r], t - 1);
	return n;
}
var Mo = Object.freeze({ insertMode: !1 }), No = Object.freeze({
	applicationCursorKeys: !1,
	applicationKeypad: !1,
	bracketedPasteMode: !1,
	cursorBlink: void 0,
	cursorStyle: void 0,
	origin: !1,
	reverseWraparound: !1,
	sendFocus: !1,
	synchronizedOutput: !1,
	wraparound: !0
}), Po = class extends O {
	constructor(e, t, n) {
		super(), this._bufferService = e, this._logService = t, this._optionsService = n, this.isCursorInitialized = !1, this.isCursorHidden = !1, this._onData = this._register(new A()), this.onData = this._onData.event, this._onUserInput = this._register(new A()), this.onUserInput = this._onUserInput.event, this._onBinary = this._register(new A()), this.onBinary = this._onBinary.event, this._onRequestScrollToBottom = this._register(new A()), this.onRequestScrollToBottom = this._onRequestScrollToBottom.event, this.modes = jo(Mo), this.decPrivateModes = jo(No);
	}
	reset() {
		this.modes = jo(Mo), this.decPrivateModes = jo(No);
	}
	triggerDataEvent(e, t = !1) {
		if (this._optionsService.rawOptions.disableStdin) return;
		let n = this._bufferService.buffer;
		t && this._optionsService.rawOptions.scrollOnUserInput && n.ybase !== n.ydisp && this._onRequestScrollToBottom.fire(), t && this._onUserInput.fire(), this._logService.debug(`sending data "${e}"`), this._logService.trace("sending data (codes)", () => e.split("").map((e) => e.charCodeAt(0))), this._onData.fire(e);
	}
	triggerBinaryEvent(e) {
		this._optionsService.rawOptions.disableStdin || (this._logService.debug(`sending binary "${e}"`), this._logService.trace("sending binary (codes)", () => e.split("").map((e) => e.charCodeAt(0))), this._onBinary.fire(e));
	}
};
Po = w([
	T(0, qe),
	T(1, Qe),
	T(2, $e)
], Po);
var Fo = {
	NONE: {
		events: 0,
		restrict: () => !1
	},
	X10: {
		events: 1,
		restrict: (e) => e.button === 4 || e.action !== 1 ? !1 : (e.ctrl = !1, e.alt = !1, e.shift = !1, !0)
	},
	VT200: {
		events: 19,
		restrict: (e) => e.action !== 32
	},
	DRAG: {
		events: 23,
		restrict: (e) => e.action !== 32 || e.button !== 3
	},
	ANY: {
		events: 31,
		restrict: (e) => !0
	}
};
function Io(e, t) {
	let n = (e.ctrl ? 16 : 0) | (e.shift ? 4 : 0) | (e.alt ? 8 : 0);
	return e.button === 4 ? (n |= 64, n |= e.action) : (n |= e.button & 3, e.button & 4 && (n |= 64), e.button & 8 && (n |= 128), e.action === 32 ? n |= 32 : e.action === 0 && !t && (n |= 3)), n;
}
var Lo = String.fromCharCode, Ro = {
	DEFAULT: (e) => {
		let t = [
			Io(e, !1) + 32,
			e.col + 32,
			e.row + 32
		];
		return t[0] > 255 || t[1] > 255 || t[2] > 255 ? "" : `\x1B[M${Lo(t[0])}${Lo(t[1])}${Lo(t[2])}`;
	},
	SGR: (e) => {
		let t = e.action === 0 && e.button !== 4 ? "m" : "M";
		return `\x1B[<${Io(e, !0)};${e.col};${e.row}${t}`;
	},
	SGR_PIXELS: (e) => {
		let t = e.action === 0 && e.button !== 4 ? "m" : "M";
		return `\x1B[<${Io(e, !0)};${e.x};${e.y}${t}`;
	}
}, zo = class extends O {
	constructor(e, t, n) {
		super(), this._bufferService = e, this._coreService = t, this._optionsService = n, this._protocols = {}, this._encodings = {}, this._activeProtocol = "", this._activeEncoding = "", this._lastEvent = null, this._wheelPartialScroll = 0, this._onProtocolChange = this._register(new A()), this.onProtocolChange = this._onProtocolChange.event;
		for (let e of Object.keys(Fo)) this.addProtocol(e, Fo[e]);
		for (let e of Object.keys(Ro)) this.addEncoding(e, Ro[e]);
		this.reset();
	}
	addProtocol(e, t) {
		this._protocols[e] = t;
	}
	addEncoding(e, t) {
		this._encodings[e] = t;
	}
	get activeProtocol() {
		return this._activeProtocol;
	}
	get areMouseEventsActive() {
		return this._protocols[this._activeProtocol].events !== 0;
	}
	set activeProtocol(e) {
		if (!this._protocols[e]) throw Error(`unknown protocol "${e}"`);
		this._activeProtocol = e, this._onProtocolChange.fire(this._protocols[e].events);
	}
	get activeEncoding() {
		return this._activeEncoding;
	}
	set activeEncoding(e) {
		if (!this._encodings[e]) throw Error(`unknown encoding "${e}"`);
		this._activeEncoding = e;
	}
	reset() {
		this.activeProtocol = "NONE", this.activeEncoding = "DEFAULT", this._lastEvent = null, this._wheelPartialScroll = 0;
	}
	consumeWheelEvent(e, t, n) {
		if (e.deltaY === 0 || e.shiftKey || t === void 0 || n === void 0) return 0;
		let r = t / n, i = this._applyScrollModifier(e.deltaY, e);
		return e.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? (i /= r + 0, Math.abs(e.deltaY) < 50 && (i *= .3), this._wheelPartialScroll += i, i = Math.floor(Math.abs(this._wheelPartialScroll)) * (this._wheelPartialScroll > 0 ? 1 : -1), this._wheelPartialScroll %= 1) : e.deltaMode === WheelEvent.DOM_DELTA_PAGE && (i *= this._bufferService.rows), i;
	}
	_applyScrollModifier(e, t) {
		return t.altKey || t.ctrlKey || t.shiftKey ? e * this._optionsService.rawOptions.fastScrollSensitivity * this._optionsService.rawOptions.scrollSensitivity : e * this._optionsService.rawOptions.scrollSensitivity;
	}
	triggerMouseEvent(e) {
		if (e.col < 0 || e.col >= this._bufferService.cols || e.row < 0 || e.row >= this._bufferService.rows || e.button === 4 && e.action === 32 || e.button === 3 && e.action !== 32 || e.button !== 4 && (e.action === 2 || e.action === 3) || (e.col++, e.row++, e.action === 32 && this._lastEvent && this._equalEvents(this._lastEvent, e, this._activeEncoding === "SGR_PIXELS")) || !this._protocols[this._activeProtocol].restrict(e)) return !1;
		let t = this._encodings[this._activeEncoding](e);
		return t && (this._activeEncoding === "DEFAULT" ? this._coreService.triggerBinaryEvent(t) : this._coreService.triggerDataEvent(t, !0)), this._lastEvent = e, !0;
	}
	explainEvents(e) {
		return {
			down: !!(e & 1),
			up: !!(e & 2),
			drag: !!(e & 4),
			move: !!(e & 8),
			wheel: !!(e & 16)
		};
	}
	_equalEvents(e, t, n) {
		if (n) {
			if (e.x !== t.x || e.y !== t.y) return !1;
		} else if (e.col !== t.col || e.row !== t.row) return !1;
		return e.button === t.button && e.action === t.action && e.ctrl === t.ctrl && e.alt === t.alt && e.shift === t.shift;
	}
};
zo = w([
	T(0, qe),
	T(1, Ye),
	T(2, $e)
], zo);
var Bo = [
	[768, 879],
	[1155, 1158],
	[1160, 1161],
	[1425, 1469],
	[1471, 1471],
	[1473, 1474],
	[1476, 1477],
	[1479, 1479],
	[1536, 1539],
	[1552, 1557],
	[1611, 1630],
	[1648, 1648],
	[1750, 1764],
	[1767, 1768],
	[1770, 1773],
	[1807, 1807],
	[1809, 1809],
	[1840, 1866],
	[1958, 1968],
	[2027, 2035],
	[2305, 2306],
	[2364, 2364],
	[2369, 2376],
	[2381, 2381],
	[2385, 2388],
	[2402, 2403],
	[2433, 2433],
	[2492, 2492],
	[2497, 2500],
	[2509, 2509],
	[2530, 2531],
	[2561, 2562],
	[2620, 2620],
	[2625, 2626],
	[2631, 2632],
	[2635, 2637],
	[2672, 2673],
	[2689, 2690],
	[2748, 2748],
	[2753, 2757],
	[2759, 2760],
	[2765, 2765],
	[2786, 2787],
	[2817, 2817],
	[2876, 2876],
	[2879, 2879],
	[2881, 2883],
	[2893, 2893],
	[2902, 2902],
	[2946, 2946],
	[3008, 3008],
	[3021, 3021],
	[3134, 3136],
	[3142, 3144],
	[3146, 3149],
	[3157, 3158],
	[3260, 3260],
	[3263, 3263],
	[3270, 3270],
	[3276, 3277],
	[3298, 3299],
	[3393, 3395],
	[3405, 3405],
	[3530, 3530],
	[3538, 3540],
	[3542, 3542],
	[3633, 3633],
	[3636, 3642],
	[3655, 3662],
	[3761, 3761],
	[3764, 3769],
	[3771, 3772],
	[3784, 3789],
	[3864, 3865],
	[3893, 3893],
	[3895, 3895],
	[3897, 3897],
	[3953, 3966],
	[3968, 3972],
	[3974, 3975],
	[3984, 3991],
	[3993, 4028],
	[4038, 4038],
	[4141, 4144],
	[4146, 4146],
	[4150, 4151],
	[4153, 4153],
	[4184, 4185],
	[4448, 4607],
	[4959, 4959],
	[5906, 5908],
	[5938, 5940],
	[5970, 5971],
	[6002, 6003],
	[6068, 6069],
	[6071, 6077],
	[6086, 6086],
	[6089, 6099],
	[6109, 6109],
	[6155, 6157],
	[6313, 6313],
	[6432, 6434],
	[6439, 6440],
	[6450, 6450],
	[6457, 6459],
	[6679, 6680],
	[6912, 6915],
	[6964, 6964],
	[6966, 6970],
	[6972, 6972],
	[6978, 6978],
	[7019, 7027],
	[7616, 7626],
	[7678, 7679],
	[8203, 8207],
	[8234, 8238],
	[8288, 8291],
	[8298, 8303],
	[8400, 8431],
	[12330, 12335],
	[12441, 12442],
	[43014, 43014],
	[43019, 43019],
	[43045, 43046],
	[64286, 64286],
	[65024, 65039],
	[65056, 65059],
	[65279, 65279],
	[65529, 65531]
], Vo = [
	[68097, 68099],
	[68101, 68102],
	[68108, 68111],
	[68152, 68154],
	[68159, 68159],
	[119143, 119145],
	[119155, 119170],
	[119173, 119179],
	[119210, 119213],
	[119362, 119364],
	[917505, 917505],
	[917536, 917631],
	[917760, 917999]
], G;
function Ho(e, t) {
	let n = 0, r = t.length - 1, i;
	if (e < t[0][0] || e > t[r][1]) return !1;
	for (; r >= n;) if (i = n + r >> 1, e > t[i][1]) n = i + 1;
	else if (e < t[i][0]) r = i - 1;
	else return !0;
	return !1;
}
var Uo = class {
	constructor() {
		if (this.version = "6", !G) {
			G = /* @__PURE__ */ new Uint8Array(65536), G.fill(1), G[0] = 0, G.fill(0, 1, 32), G.fill(0, 127, 160), G.fill(2, 4352, 4448), G[9001] = 2, G[9002] = 2, G.fill(2, 11904, 42192), G[12351] = 1, G.fill(2, 44032, 55204), G.fill(2, 63744, 64256), G.fill(2, 65040, 65050), G.fill(2, 65072, 65136), G.fill(2, 65280, 65377), G.fill(2, 65504, 65511);
			for (let e = 0; e < Bo.length; ++e) G.fill(0, Bo[e][0], Bo[e][1] + 1);
		}
	}
	wcwidth(e) {
		return e < 32 ? 0 : e < 127 ? 1 : e < 65536 ? G[e] : Ho(e, Vo) ? 0 : e >= 131072 && e <= 196605 || e >= 196608 && e <= 262141 ? 2 : 1;
	}
	charProperties(e, t) {
		let n = this.wcwidth(e), r = n === 0 && t !== 0;
		if (r) {
			let e = Wo.extractWidth(t);
			e === 0 ? r = !1 : e > n && (n = e);
		}
		return Wo.createPropertyValue(0, n, r);
	}
}, Wo = class e {
	constructor() {
		this._providers = Object.create(null), this._active = "", this._onChange = new A(), this.onChange = this._onChange.event;
		let e = new Uo();
		this.register(e), this._active = e.version, this._activeProvider = e;
	}
	static extractShouldJoin(e) {
		return !!(e & 1);
	}
	static extractWidth(e) {
		return e >> 1 & 3;
	}
	static extractCharKind(e) {
		return e >> 3;
	}
	static createPropertyValue(e, t, n = !1) {
		return (e & 16777215) << 3 | (t & 3) << 1 | !!n;
	}
	dispose() {
		this._onChange.dispose();
	}
	get versions() {
		return Object.keys(this._providers);
	}
	get activeVersion() {
		return this._active;
	}
	set activeVersion(e) {
		if (!this._providers[e]) throw Error(`unknown Unicode version "${e}"`);
		this._active = e, this._activeProvider = this._providers[e], this._onChange.fire(e);
	}
	register(e) {
		this._providers[e.version] = e;
	}
	wcwidth(e) {
		return this._activeProvider.wcwidth(e);
	}
	getStringCellWidth(t) {
		let n = 0, r = 0, i = t.length;
		for (let a = 0; a < i; ++a) {
			let o = t.charCodeAt(a);
			if (55296 <= o && o <= 56319) {
				if (++a >= i) return n + this.wcwidth(o);
				let e = t.charCodeAt(a);
				56320 <= e && e <= 57343 ? o = (o - 55296) * 1024 + e - 56320 + 65536 : n += this.wcwidth(e);
			}
			let s = this.charProperties(o, r), c = e.extractWidth(s);
			e.extractShouldJoin(s) && (c -= e.extractWidth(r)), n += c, r = s;
		}
		return n;
	}
	charProperties(e, t) {
		return this._activeProvider.charProperties(e, t);
	}
}, Go = class {
	constructor() {
		this.glevel = 0, this._charsets = [];
	}
	reset() {
		this.charset = void 0, this._charsets = [], this.glevel = 0;
	}
	setgLevel(e) {
		this.glevel = e, this.charset = this._charsets[e];
	}
	setgCharset(e, t) {
		this._charsets[e] = t, this.glevel === e && (this.charset = t);
	}
};
function Ko(e) {
	let t = e.buffer.lines.get(e.buffer.ybase + e.buffer.y - 1)?.get(e.cols - 1), n = e.buffer.lines.get(e.buffer.ybase + e.buffer.y);
	n && t && (n.isWrapped = t[3] !== 0 && t[3] !== 32);
}
var qo = 2147483647, Jo = 256, Yo = class e {
	constructor(e = 32, t = 32) {
		if (this.maxLength = e, this.maxSubParamsLength = t, t > Jo) throw Error("maxSubParamsLength must not be greater than 256");
		this.params = new Int32Array(e), this.length = 0, this._subParams = new Int32Array(t), this._subParamsLength = 0, this._subParamsIdx = new Uint16Array(e), this._rejectDigits = !1, this._rejectSubDigits = !1, this._digitIsSub = !1;
	}
	static fromArray(t) {
		let n = new e();
		if (!t.length) return n;
		for (let e = +!!Array.isArray(t[0]); e < t.length; ++e) {
			let r = t[e];
			if (Array.isArray(r)) for (let e = 0; e < r.length; ++e) n.addSubParam(r[e]);
			else n.addParam(r);
		}
		return n;
	}
	clone() {
		let t = new e(this.maxLength, this.maxSubParamsLength);
		return t.params.set(this.params), t.length = this.length, t._subParams.set(this._subParams), t._subParamsLength = this._subParamsLength, t._subParamsIdx.set(this._subParamsIdx), t._rejectDigits = this._rejectDigits, t._rejectSubDigits = this._rejectSubDigits, t._digitIsSub = this._digitIsSub, t;
	}
	toArray() {
		let e = [];
		for (let t = 0; t < this.length; ++t) {
			e.push(this.params[t]);
			let n = this._subParamsIdx[t] >> 8, r = this._subParamsIdx[t] & 255;
			r - n > 0 && e.push(Array.prototype.slice.call(this._subParams, n, r));
		}
		return e;
	}
	reset() {
		this.length = 0, this._subParamsLength = 0, this._rejectDigits = !1, this._rejectSubDigits = !1, this._digitIsSub = !1;
	}
	addParam(e) {
		if (this._digitIsSub = !1, this.length >= this.maxLength) this._rejectDigits = !0;
		else {
			if (e < -1) throw Error("values lesser than -1 are not allowed");
			this._subParamsIdx[this.length] = this._subParamsLength << 8 | this._subParamsLength, this.params[this.length++] = e > qo ? qo : e;
		}
	}
	addSubParam(e) {
		if (this._digitIsSub = !0, this.length) {
			if (this._rejectDigits || this._subParamsLength >= this.maxSubParamsLength) {
				this._rejectSubDigits = !0;
				return;
			}
			if (e < -1) throw Error("values lesser than -1 are not allowed");
			this._subParams[this._subParamsLength++] = e > qo ? qo : e, this._subParamsIdx[this.length - 1]++;
		}
	}
	hasSubParams(e) {
		return (this._subParamsIdx[e] & 255) - (this._subParamsIdx[e] >> 8) > 0;
	}
	getSubParams(e) {
		let t = this._subParamsIdx[e] >> 8, n = this._subParamsIdx[e] & 255;
		return n - t > 0 ? this._subParams.subarray(t, n) : null;
	}
	getSubParamsAll() {
		let e = {};
		for (let t = 0; t < this.length; ++t) {
			let n = this._subParamsIdx[t] >> 8, r = this._subParamsIdx[t] & 255;
			r - n > 0 && (e[t] = this._subParams.slice(n, r));
		}
		return e;
	}
	addDigit(e) {
		let t;
		if (this._rejectDigits || !(t = this._digitIsSub ? this._subParamsLength : this.length) || this._digitIsSub && this._rejectSubDigits) return;
		let n = this._digitIsSub ? this._subParams : this.params, r = n[t - 1];
		n[t - 1] = ~r ? Math.min(r * 10 + e, qo) : e;
	}
}, Xo = [], Zo = class {
	constructor() {
		this._state = 0, this._active = Xo, this._id = -1, this._handlers = Object.create(null), this._handlerFb = () => {}, this._stack = {
			paused: !1,
			loopPosition: 0,
			fallThrough: !1
		};
	}
	registerHandler(e, t) {
		this._handlers[e] === void 0 && (this._handlers[e] = []);
		let n = this._handlers[e];
		return n.push(t), { dispose: () => {
			let e = n.indexOf(t);
			e !== -1 && n.splice(e, 1);
		} };
	}
	clearHandler(e) {
		this._handlers[e] && delete this._handlers[e];
	}
	setHandlerFallback(e) {
		this._handlerFb = e;
	}
	dispose() {
		this._handlers = Object.create(null), this._handlerFb = () => {}, this._active = Xo;
	}
	reset() {
		if (this._state === 2) for (let e = this._stack.paused ? this._stack.loopPosition - 1 : this._active.length - 1; e >= 0; --e) this._active[e].end(!1);
		this._stack.paused = !1, this._active = Xo, this._id = -1, this._state = 0;
	}
	_start() {
		if (this._active = this._handlers[this._id] || Xo, !this._active.length) this._handlerFb(this._id, "START");
		else for (let e = this._active.length - 1; e >= 0; e--) this._active[e].start();
	}
	_put(e, t, n) {
		if (!this._active.length) this._handlerFb(this._id, "PUT", Pe(e, t, n));
		else for (let r = this._active.length - 1; r >= 0; r--) this._active[r].put(e, t, n);
	}
	start() {
		this.reset(), this._state = 1;
	}
	put(e, t, n) {
		if (this._state !== 3) {
			if (this._state === 1) for (; t < n;) {
				let n = e[t++];
				if (n === 59) {
					this._state = 2, this._start();
					break;
				}
				if (n < 48 || 57 < n) {
					this._state = 3;
					return;
				}
				this._id === -1 && (this._id = 0), this._id = this._id * 10 + n - 48;
			}
			this._state === 2 && n - t > 0 && this._put(e, t, n);
		}
	}
	end(e, t = !0) {
		if (this._state !== 0) {
			if (this._state !== 3) {
				if (this._state === 1 && this._start(), !this._active.length) this._handlerFb(this._id, "END", e);
				else {
					let n = !1, r = this._active.length - 1, i = !1;
					if (this._stack.paused && (r = this._stack.loopPosition - 1, n = t, i = this._stack.fallThrough, this._stack.paused = !1), !i && n === !1) {
						for (; r >= 0 && (n = this._active[r].end(e), n !== !0); r--) if (n instanceof Promise) return this._stack.paused = !0, this._stack.loopPosition = r, this._stack.fallThrough = !1, n;
						r--;
					}
					for (; r >= 0; r--) if (n = this._active[r].end(!1), n instanceof Promise) return this._stack.paused = !0, this._stack.loopPosition = r, this._stack.fallThrough = !0, n;
				}
			}
			this._active = Xo, this._id = -1, this._state = 0;
		}
	}
}, Qo = class {
	constructor(e) {
		this._handler = e, this._data = "", this._hitLimit = !1;
	}
	start() {
		this._data = "", this._hitLimit = !1;
	}
	put(e, t, n) {
		this._hitLimit || (this._data += Pe(e, t, n), this._data.length > 1e7 && (this._data = "", this._hitLimit = !0));
	}
	end(e) {
		let t = !1;
		if (this._hitLimit) t = !1;
		else if (e && (t = this._handler(this._data), t instanceof Promise)) return t.then((e) => (this._data = "", this._hitLimit = !1, e));
		return this._data = "", this._hitLimit = !1, t;
	}
}, $o = [], es = class {
	constructor() {
		this._handlers = Object.create(null), this._active = $o, this._ident = 0, this._handlerFb = () => {}, this._stack = {
			paused: !1,
			loopPosition: 0,
			fallThrough: !1
		};
	}
	dispose() {
		this._handlers = Object.create(null), this._handlerFb = () => {}, this._active = $o;
	}
	registerHandler(e, t) {
		this._handlers[e] === void 0 && (this._handlers[e] = []);
		let n = this._handlers[e];
		return n.push(t), { dispose: () => {
			let e = n.indexOf(t);
			e !== -1 && n.splice(e, 1);
		} };
	}
	clearHandler(e) {
		this._handlers[e] && delete this._handlers[e];
	}
	setHandlerFallback(e) {
		this._handlerFb = e;
	}
	reset() {
		if (this._active.length) for (let e = this._stack.paused ? this._stack.loopPosition - 1 : this._active.length - 1; e >= 0; --e) this._active[e].unhook(!1);
		this._stack.paused = !1, this._active = $o, this._ident = 0;
	}
	hook(e, t) {
		if (this.reset(), this._ident = e, this._active = this._handlers[e] || $o, !this._active.length) this._handlerFb(this._ident, "HOOK", t);
		else for (let e = this._active.length - 1; e >= 0; e--) this._active[e].hook(t);
	}
	put(e, t, n) {
		if (!this._active.length) this._handlerFb(this._ident, "PUT", Pe(e, t, n));
		else for (let r = this._active.length - 1; r >= 0; r--) this._active[r].put(e, t, n);
	}
	unhook(e, t = !0) {
		if (!this._active.length) this._handlerFb(this._ident, "UNHOOK", e);
		else {
			let n = !1, r = this._active.length - 1, i = !1;
			if (this._stack.paused && (r = this._stack.loopPosition - 1, n = t, i = this._stack.fallThrough, this._stack.paused = !1), !i && n === !1) {
				for (; r >= 0 && (n = this._active[r].unhook(e), n !== !0); r--) if (n instanceof Promise) return this._stack.paused = !0, this._stack.loopPosition = r, this._stack.fallThrough = !1, n;
				r--;
			}
			for (; r >= 0; r--) if (n = this._active[r].unhook(!1), n instanceof Promise) return this._stack.paused = !0, this._stack.loopPosition = r, this._stack.fallThrough = !0, n;
		}
		this._active = $o, this._ident = 0;
	}
}, ts = new Yo();
ts.addParam(0);
var ns = class {
	constructor(e) {
		this._handler = e, this._data = "", this._params = ts, this._hitLimit = !1;
	}
	hook(e) {
		this._params = e.length > 1 || e.params[0] ? e.clone() : ts, this._data = "", this._hitLimit = !1;
	}
	put(e, t, n) {
		this._hitLimit || (this._data += Pe(e, t, n), this._data.length > 1e7 && (this._data = "", this._hitLimit = !0));
	}
	unhook(e) {
		let t = !1;
		if (this._hitLimit) t = !1;
		else if (e && (t = this._handler(this._data, this._params), t instanceof Promise)) return t.then((e) => (this._params = ts, this._data = "", this._hitLimit = !1, e));
		return this._params = ts, this._data = "", this._hitLimit = !1, t;
	}
}, rs = class {
	constructor(e) {
		this.table = new Uint8Array(e);
	}
	setDefault(e, t) {
		this.table.fill(e << 4 | t);
	}
	add(e, t, n, r) {
		this.table[t << 8 | e] = n << 4 | r;
	}
	addMany(e, t, n, r) {
		for (let i = 0; i < e.length; i++) this.table[t << 8 | e[i]] = n << 4 | r;
	}
}, is = 160, as = function() {
	let e = new rs(4095), t = Array.apply(null, Array(256)).map((e, t) => t), n = (e, n) => t.slice(e, n), r = n(32, 127), i = n(0, 24);
	i.push(25), i.push.apply(i, n(28, 32));
	let a = n(0, 14), o;
	for (o in e.setDefault(1, 0), e.addMany(r, 0, 2, 0), a) e.addMany([
		24,
		26,
		153,
		154
	], o, 3, 0), e.addMany(n(128, 144), o, 3, 0), e.addMany(n(144, 152), o, 3, 0), e.add(156, o, 0, 0), e.add(27, o, 11, 1), e.add(157, o, 4, 8), e.addMany([
		152,
		158,
		159
	], o, 0, 7), e.add(155, o, 11, 3), e.add(144, o, 11, 9);
	return e.addMany(i, 0, 3, 0), e.addMany(i, 1, 3, 1), e.add(127, 1, 0, 1), e.addMany(i, 8, 0, 8), e.addMany(i, 3, 3, 3), e.add(127, 3, 0, 3), e.addMany(i, 4, 3, 4), e.add(127, 4, 0, 4), e.addMany(i, 6, 3, 6), e.addMany(i, 5, 3, 5), e.add(127, 5, 0, 5), e.addMany(i, 2, 3, 2), e.add(127, 2, 0, 2), e.add(93, 1, 4, 8), e.addMany(r, 8, 5, 8), e.add(127, 8, 5, 8), e.addMany([
		156,
		27,
		24,
		26,
		7
	], 8, 6, 0), e.addMany(n(28, 32), 8, 0, 8), e.addMany([
		88,
		94,
		95
	], 1, 0, 7), e.addMany(r, 7, 0, 7), e.addMany(i, 7, 0, 7), e.add(156, 7, 0, 0), e.add(127, 7, 0, 7), e.add(91, 1, 11, 3), e.addMany(n(64, 127), 3, 7, 0), e.addMany(n(48, 60), 3, 8, 4), e.addMany([
		60,
		61,
		62,
		63
	], 3, 9, 4), e.addMany(n(48, 60), 4, 8, 4), e.addMany(n(64, 127), 4, 7, 0), e.addMany([
		60,
		61,
		62,
		63
	], 4, 0, 6), e.addMany(n(32, 64), 6, 0, 6), e.add(127, 6, 0, 6), e.addMany(n(64, 127), 6, 0, 0), e.addMany(n(32, 48), 3, 9, 5), e.addMany(n(32, 48), 5, 9, 5), e.addMany(n(48, 64), 5, 0, 6), e.addMany(n(64, 127), 5, 7, 0), e.addMany(n(32, 48), 4, 9, 5), e.addMany(n(32, 48), 1, 9, 2), e.addMany(n(32, 48), 2, 9, 2), e.addMany(n(48, 127), 2, 10, 0), e.addMany(n(48, 80), 1, 10, 0), e.addMany(n(81, 88), 1, 10, 0), e.addMany([
		89,
		90,
		92
	], 1, 10, 0), e.addMany(n(96, 127), 1, 10, 0), e.add(80, 1, 11, 9), e.addMany(i, 9, 0, 9), e.add(127, 9, 0, 9), e.addMany(n(28, 32), 9, 0, 9), e.addMany(n(32, 48), 9, 9, 12), e.addMany(n(48, 60), 9, 8, 10), e.addMany([
		60,
		61,
		62,
		63
	], 9, 9, 10), e.addMany(i, 11, 0, 11), e.addMany(n(32, 128), 11, 0, 11), e.addMany(n(28, 32), 11, 0, 11), e.addMany(i, 10, 0, 10), e.add(127, 10, 0, 10), e.addMany(n(28, 32), 10, 0, 10), e.addMany(n(48, 60), 10, 8, 10), e.addMany([
		60,
		61,
		62,
		63
	], 10, 0, 11), e.addMany(n(32, 48), 10, 9, 12), e.addMany(i, 12, 0, 12), e.add(127, 12, 0, 12), e.addMany(n(28, 32), 12, 0, 12), e.addMany(n(32, 48), 12, 9, 12), e.addMany(n(48, 64), 12, 0, 11), e.addMany(n(64, 127), 12, 12, 13), e.addMany(n(64, 127), 10, 12, 13), e.addMany(n(64, 127), 9, 12, 13), e.addMany(i, 13, 13, 13), e.addMany(r, 13, 13, 13), e.add(127, 13, 0, 13), e.addMany([
		27,
		156,
		24,
		26
	], 13, 14, 0), e.add(is, 0, 2, 0), e.add(is, 8, 5, 8), e.add(is, 6, 0, 6), e.add(is, 11, 0, 11), e.add(is, 13, 13, 13), e;
}(), os = class extends O {
	constructor(e = as) {
		super(), this._transitions = e, this._parseStack = {
			state: 0,
			handlers: [],
			handlerPos: 0,
			transition: 0,
			chunkPos: 0
		}, this.initialState = 0, this.currentState = this.initialState, this._params = new Yo(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0, this._printHandlerFb = (e, t, n) => {}, this._executeHandlerFb = (e) => {}, this._csiHandlerFb = (e, t) => {}, this._escHandlerFb = (e) => {}, this._errorHandlerFb = (e) => e, this._printHandler = this._printHandlerFb, this._executeHandlers = Object.create(null), this._csiHandlers = Object.create(null), this._escHandlers = Object.create(null), this._register(D(() => {
			this._csiHandlers = Object.create(null), this._executeHandlers = Object.create(null), this._escHandlers = Object.create(null);
		})), this._oscParser = this._register(new Zo()), this._dcsParser = this._register(new es()), this._errorHandler = this._errorHandlerFb, this.registerEscHandler({ final: "\\" }, () => !0);
	}
	_identifier(e, t = [64, 126]) {
		let n = 0;
		if (e.prefix) {
			if (e.prefix.length > 1) throw Error("only one byte as prefix supported");
			if (n = e.prefix.charCodeAt(0), n && 60 > n || n > 63) throw Error("prefix must be in range 0x3c .. 0x3f");
		}
		if (e.intermediates) {
			if (e.intermediates.length > 2) throw Error("only two bytes as intermediates are supported");
			for (let t = 0; t < e.intermediates.length; ++t) {
				let r = e.intermediates.charCodeAt(t);
				if (32 > r || r > 47) throw Error("intermediate must be in range 0x20 .. 0x2f");
				n <<= 8, n |= r;
			}
		}
		if (e.final.length !== 1) throw Error("final must be a single byte");
		let r = e.final.charCodeAt(0);
		if (t[0] > r || r > t[1]) throw Error(`final must be in range ${t[0]} .. ${t[1]}`);
		return n <<= 8, n |= r, n;
	}
	identToString(e) {
		let t = [];
		for (; e;) t.push(String.fromCharCode(e & 255)), e >>= 8;
		return t.reverse().join("");
	}
	setPrintHandler(e) {
		this._printHandler = e;
	}
	clearPrintHandler() {
		this._printHandler = this._printHandlerFb;
	}
	registerEscHandler(e, t) {
		let n = this._identifier(e, [48, 126]);
		this._escHandlers[n] === void 0 && (this._escHandlers[n] = []);
		let r = this._escHandlers[n];
		return r.push(t), { dispose: () => {
			let e = r.indexOf(t);
			e !== -1 && r.splice(e, 1);
		} };
	}
	clearEscHandler(e) {
		this._escHandlers[this._identifier(e, [48, 126])] && delete this._escHandlers[this._identifier(e, [48, 126])];
	}
	setEscHandlerFallback(e) {
		this._escHandlerFb = e;
	}
	setExecuteHandler(e, t) {
		this._executeHandlers[e.charCodeAt(0)] = t;
	}
	clearExecuteHandler(e) {
		this._executeHandlers[e.charCodeAt(0)] && delete this._executeHandlers[e.charCodeAt(0)];
	}
	setExecuteHandlerFallback(e) {
		this._executeHandlerFb = e;
	}
	registerCsiHandler(e, t) {
		let n = this._identifier(e);
		this._csiHandlers[n] === void 0 && (this._csiHandlers[n] = []);
		let r = this._csiHandlers[n];
		return r.push(t), { dispose: () => {
			let e = r.indexOf(t);
			e !== -1 && r.splice(e, 1);
		} };
	}
	clearCsiHandler(e) {
		this._csiHandlers[this._identifier(e)] && delete this._csiHandlers[this._identifier(e)];
	}
	setCsiHandlerFallback(e) {
		this._csiHandlerFb = e;
	}
	registerDcsHandler(e, t) {
		return this._dcsParser.registerHandler(this._identifier(e), t);
	}
	clearDcsHandler(e) {
		this._dcsParser.clearHandler(this._identifier(e));
	}
	setDcsHandlerFallback(e) {
		this._dcsParser.setHandlerFallback(e);
	}
	registerOscHandler(e, t) {
		return this._oscParser.registerHandler(e, t);
	}
	clearOscHandler(e) {
		this._oscParser.clearHandler(e);
	}
	setOscHandlerFallback(e) {
		this._oscParser.setHandlerFallback(e);
	}
	setErrorHandler(e) {
		this._errorHandler = e;
	}
	clearErrorHandler() {
		this._errorHandler = this._errorHandlerFb;
	}
	reset() {
		this.currentState = this.initialState, this._oscParser.reset(), this._dcsParser.reset(), this._params.reset(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0, this._parseStack.state !== 0 && (this._parseStack.state = 2, this._parseStack.handlers = []);
	}
	_preserveStack(e, t, n, r, i) {
		this._parseStack.state = e, this._parseStack.handlers = t, this._parseStack.handlerPos = n, this._parseStack.transition = r, this._parseStack.chunkPos = i;
	}
	parse(e, t, n) {
		let r = 0, i = 0, a = 0, o;
		if (this._parseStack.state) {
			if (this._parseStack.state === 2) this._parseStack.state = 0, a = this._parseStack.chunkPos + 1;
			else {
				if (n === void 0 || this._parseStack.state === 1) throw this._parseStack.state = 1, /* @__PURE__ */ Error("improper continuation due to previous async handler, giving up parsing");
				let t = this._parseStack.handlers, i = this._parseStack.handlerPos - 1;
				switch (this._parseStack.state) {
					case 3:
						if (n === !1 && i > -1) {
							for (; i >= 0 && (o = t[i](this._params), o !== !0); i--) if (o instanceof Promise) return this._parseStack.handlerPos = i, o;
						}
						this._parseStack.handlers = [];
						break;
					case 4:
						if (n === !1 && i > -1) {
							for (; i >= 0 && (o = t[i](), o !== !0); i--) if (o instanceof Promise) return this._parseStack.handlerPos = i, o;
						}
						this._parseStack.handlers = [];
						break;
					case 6:
						if (r = e[this._parseStack.chunkPos], o = this._dcsParser.unhook(r !== 24 && r !== 26, n), o) return o;
						r === 27 && (this._parseStack.transition |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0;
						break;
					case 5:
						if (r = e[this._parseStack.chunkPos], o = this._oscParser.end(r !== 24 && r !== 26, n), o) return o;
						r === 27 && (this._parseStack.transition |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0;
				}
				this._parseStack.state = 0, a = this._parseStack.chunkPos + 1, this.precedingJoinState = 0, this.currentState = this._parseStack.transition & 15;
			}
		}
		for (let n = a; n < t; ++n) {
			switch (r = e[n], i = this._transitions.table[this.currentState << 8 | (r < 160 ? r : is)], i >> 4) {
				case 2:
					for (let i = n + 1;; ++i) if (i >= t || (r = e[i]) < 32 || r > 126 && r < is || ++i >= t || (r = e[i]) < 32 || r > 126 && r < is || ++i >= t || (r = e[i]) < 32 || r > 126 && r < is || ++i >= t || (r = e[i]) < 32 || r > 126 && r < is) {
						this._printHandler(e, n, i), n = i - 1;
						break;
					}
					break;
				case 3:
					this._executeHandlers[r] ? this._executeHandlers[r]() : this._executeHandlerFb(r), this.precedingJoinState = 0;
					break;
				case 0: break;
				case 1:
					if (this._errorHandler({
						position: n,
						code: r,
						currentState: this.currentState,
						collect: this._collect,
						params: this._params,
						abort: !1
					}).abort) return;
					break;
				case 7:
					let a = this._csiHandlers[this._collect << 8 | r], s = a ? a.length - 1 : -1;
					for (; s >= 0 && (o = a[s](this._params), o !== !0); s--) if (o instanceof Promise) return this._preserveStack(3, a, s, i, n), o;
					s < 0 && this._csiHandlerFb(this._collect << 8 | r, this._params), this.precedingJoinState = 0;
					break;
				case 8:
					do
						switch (r) {
							case 59:
								this._params.addParam(0);
								break;
							case 58:
								this._params.addSubParam(-1);
								break;
							default: this._params.addDigit(r - 48);
						}
					while (++n < t && (r = e[n]) > 47 && r < 60);
					n--;
					break;
				case 9:
					this._collect <<= 8, this._collect |= r;
					break;
				case 10:
					let c = this._escHandlers[this._collect << 8 | r], l = c ? c.length - 1 : -1;
					for (; l >= 0 && (o = c[l](), o !== !0); l--) if (o instanceof Promise) return this._preserveStack(4, c, l, i, n), o;
					l < 0 && this._escHandlerFb(this._collect << 8 | r), this.precedingJoinState = 0;
					break;
				case 11:
					this._params.reset(), this._params.addParam(0), this._collect = 0;
					break;
				case 12:
					this._dcsParser.hook(this._collect << 8 | r, this._params);
					break;
				case 13:
					for (let i = n + 1;; ++i) if (i >= t || (r = e[i]) === 24 || r === 26 || r === 27 || r > 127 && r < is) {
						this._dcsParser.put(e, n, i), n = i - 1;
						break;
					}
					break;
				case 14:
					if (o = this._dcsParser.unhook(r !== 24 && r !== 26), o) return this._preserveStack(6, [], 0, i, n), o;
					r === 27 && (i |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0;
					break;
				case 4:
					this._oscParser.start();
					break;
				case 5:
					for (let i = n + 1;; i++) if (i >= t || (r = e[i]) < 32 || r > 127 && r < is) {
						this._oscParser.put(e, n, i), n = i - 1;
						break;
					}
					break;
				case 6:
					if (o = this._oscParser.end(r !== 24 && r !== 26), o) return this._preserveStack(5, [], 0, i, n), o;
					r === 27 && (i |= 1), this._params.reset(), this._params.addParam(0), this._collect = 0, this.precedingJoinState = 0;
			}
			this.currentState = i & 15;
		}
	}
}, ss = /^([\da-f])\/([\da-f])\/([\da-f])$|^([\da-f]{2})\/([\da-f]{2})\/([\da-f]{2})$|^([\da-f]{3})\/([\da-f]{3})\/([\da-f]{3})$|^([\da-f]{4})\/([\da-f]{4})\/([\da-f]{4})$/, cs = /^[\da-f]+$/;
function ls(e) {
	if (!e) return;
	let t = e.toLowerCase();
	if (t.indexOf("rgb:") === 0) {
		t = t.slice(4);
		let e = ss.exec(t);
		if (e) {
			let t = e[1] ? 15 : e[4] ? 255 : e[7] ? 4095 : 65535;
			return [
				Math.round(parseInt(e[1] || e[4] || e[7] || e[10], 16) / t * 255),
				Math.round(parseInt(e[2] || e[5] || e[8] || e[11], 16) / t * 255),
				Math.round(parseInt(e[3] || e[6] || e[9] || e[12], 16) / t * 255)
			];
		}
	} else if (t.indexOf("#") === 0 && (t = t.slice(1), cs.exec(t) && [
		3,
		6,
		9,
		12
	].includes(t.length))) {
		let e = t.length / 3, n = [
			0,
			0,
			0
		];
		for (let r = 0; r < 3; ++r) {
			let i = parseInt(t.slice(e * r, e * r + e), 16);
			n[r] = e === 1 ? i << 4 : e === 2 ? i : e === 3 ? i >> 4 : i >> 8;
		}
		return n;
	}
}
function us(e, t) {
	let n = e.toString(16), r = n.length < 2 ? "0" + n : n;
	switch (t) {
		case 4: return n[0];
		case 8: return r;
		case 12: return (r + r).slice(0, 3);
		default: return r + r;
	}
}
function ds(e, t = 16) {
	let [n, r, i] = e;
	return `rgb:${us(n, t)}/${us(r, t)}/${us(i, t)}`;
}
var fs = {
	"(": 0,
	")": 1,
	"*": 2,
	"+": 3,
	"-": 1,
	".": 2
}, ps = 131072, ms = 10;
function hs(e, t) {
	if (e > 24) return t.setWinLines || !1;
	switch (e) {
		case 1: return !!t.restoreWin;
		case 2: return !!t.minimizeWin;
		case 3: return !!t.setWinPosition;
		case 4: return !!t.setWinSizePixels;
		case 5: return !!t.raiseWin;
		case 6: return !!t.lowerWin;
		case 7: return !!t.refreshWin;
		case 8: return !!t.setWinSizeChars;
		case 9: return !!t.maximizeWin;
		case 10: return !!t.fullscreenWin;
		case 11: return !!t.getWinState;
		case 13: return !!t.getWinPosition;
		case 14: return !!t.getWinSizePixels;
		case 15: return !!t.getScreenSizePixels;
		case 16: return !!t.getCellSizePixels;
		case 18: return !!t.getWinSizeChars;
		case 19: return !!t.getScreenSizeChars;
		case 20: return !!t.getIconTitle;
		case 21: return !!t.getWinTitle;
		case 22: return !!t.pushTitle;
		case 23: return !!t.popTitle;
		case 24: return !!t.setWinLines;
	}
	return !1;
}
var gs = 5e3, _s = 0, vs = class extends O {
	constructor(e, t, n, r, i, a, o, s, c = new os()) {
		super(), this._bufferService = e, this._charsetService = t, this._coreService = n, this._logService = r, this._optionsService = i, this._oscLinkService = a, this._coreMouseService = o, this._unicodeService = s, this._parser = c, this._parseBuffer = /* @__PURE__ */ new Uint32Array(4096), this._stringDecoder = new Fe(), this._utf8Decoder = new Ie(), this._windowTitle = "", this._iconName = "", this._windowTitleStack = [], this._iconNameStack = [], this._curAttrData = U.clone(), this._eraseAttrDataInternal = U.clone(), this._onRequestBell = this._register(new A()), this.onRequestBell = this._onRequestBell.event, this._onRequestRefreshRows = this._register(new A()), this.onRequestRefreshRows = this._onRequestRefreshRows.event, this._onRequestReset = this._register(new A()), this.onRequestReset = this._onRequestReset.event, this._onRequestSendFocus = this._register(new A()), this.onRequestSendFocus = this._onRequestSendFocus.event, this._onRequestSyncScrollBar = this._register(new A()), this.onRequestSyncScrollBar = this._onRequestSyncScrollBar.event, this._onRequestWindowsOptionsReport = this._register(new A()), this.onRequestWindowsOptionsReport = this._onRequestWindowsOptionsReport.event, this._onA11yChar = this._register(new A()), this.onA11yChar = this._onA11yChar.event, this._onA11yTab = this._register(new A()), this.onA11yTab = this._onA11yTab.event, this._onCursorMove = this._register(new A()), this.onCursorMove = this._onCursorMove.event, this._onLineFeed = this._register(new A()), this.onLineFeed = this._onLineFeed.event, this._onScroll = this._register(new A()), this.onScroll = this._onScroll.event, this._onTitleChange = this._register(new A()), this.onTitleChange = this._onTitleChange.event, this._onColor = this._register(new A()), this.onColor = this._onColor.event, this._parseStack = {
			paused: !1,
			cursorStartX: 0,
			cursorStartY: 0,
			decodedLength: 0,
			position: 0
		}, this._specialColors = [
			256,
			257,
			258
		], this._register(this._parser), this._dirtyRowTracker = new ys(this._bufferService), this._activeBuffer = this._bufferService.buffer, this._register(this._bufferService.buffers.onBufferActivate((e) => this._activeBuffer = e.activeBuffer)), this._parser.setCsiHandlerFallback((e, t) => {
			this._logService.debug("Unknown CSI code: ", {
				identifier: this._parser.identToString(e),
				params: t.toArray()
			});
		}), this._parser.setEscHandlerFallback((e) => {
			this._logService.debug("Unknown ESC code: ", { identifier: this._parser.identToString(e) });
		}), this._parser.setExecuteHandlerFallback((e) => {
			this._logService.debug("Unknown EXECUTE code: ", { code: e });
		}), this._parser.setOscHandlerFallback((e, t, n) => {
			this._logService.debug("Unknown OSC code: ", {
				identifier: e,
				action: t,
				data: n
			});
		}), this._parser.setDcsHandlerFallback((e, t, n) => {
			t === "HOOK" && (n = n.toArray()), this._logService.debug("Unknown DCS code: ", {
				identifier: this._parser.identToString(e),
				action: t,
				payload: n
			});
		}), this._parser.setPrintHandler((e, t, n) => this.print(e, t, n)), this._parser.registerCsiHandler({ final: "@" }, (e) => this.insertChars(e)), this._parser.registerCsiHandler({
			intermediates: " ",
			final: "@"
		}, (e) => this.scrollLeft(e)), this._parser.registerCsiHandler({ final: "A" }, (e) => this.cursorUp(e)), this._parser.registerCsiHandler({
			intermediates: " ",
			final: "A"
		}, (e) => this.scrollRight(e)), this._parser.registerCsiHandler({ final: "B" }, (e) => this.cursorDown(e)), this._parser.registerCsiHandler({ final: "C" }, (e) => this.cursorForward(e)), this._parser.registerCsiHandler({ final: "D" }, (e) => this.cursorBackward(e)), this._parser.registerCsiHandler({ final: "E" }, (e) => this.cursorNextLine(e)), this._parser.registerCsiHandler({ final: "F" }, (e) => this.cursorPrecedingLine(e)), this._parser.registerCsiHandler({ final: "G" }, (e) => this.cursorCharAbsolute(e)), this._parser.registerCsiHandler({ final: "H" }, (e) => this.cursorPosition(e)), this._parser.registerCsiHandler({ final: "I" }, (e) => this.cursorForwardTab(e)), this._parser.registerCsiHandler({ final: "J" }, (e) => this.eraseInDisplay(e, !1)), this._parser.registerCsiHandler({
			prefix: "?",
			final: "J"
		}, (e) => this.eraseInDisplay(e, !0)), this._parser.registerCsiHandler({ final: "K" }, (e) => this.eraseInLine(e, !1)), this._parser.registerCsiHandler({
			prefix: "?",
			final: "K"
		}, (e) => this.eraseInLine(e, !0)), this._parser.registerCsiHandler({ final: "L" }, (e) => this.insertLines(e)), this._parser.registerCsiHandler({ final: "M" }, (e) => this.deleteLines(e)), this._parser.registerCsiHandler({ final: "P" }, (e) => this.deleteChars(e)), this._parser.registerCsiHandler({ final: "S" }, (e) => this.scrollUp(e)), this._parser.registerCsiHandler({ final: "T" }, (e) => this.scrollDown(e)), this._parser.registerCsiHandler({ final: "X" }, (e) => this.eraseChars(e)), this._parser.registerCsiHandler({ final: "Z" }, (e) => this.cursorBackwardTab(e)), this._parser.registerCsiHandler({ final: "`" }, (e) => this.charPosAbsolute(e)), this._parser.registerCsiHandler({ final: "a" }, (e) => this.hPositionRelative(e)), this._parser.registerCsiHandler({ final: "b" }, (e) => this.repeatPrecedingCharacter(e)), this._parser.registerCsiHandler({ final: "c" }, (e) => this.sendDeviceAttributesPrimary(e)), this._parser.registerCsiHandler({
			prefix: ">",
			final: "c"
		}, (e) => this.sendDeviceAttributesSecondary(e)), this._parser.registerCsiHandler({ final: "d" }, (e) => this.linePosAbsolute(e)), this._parser.registerCsiHandler({ final: "e" }, (e) => this.vPositionRelative(e)), this._parser.registerCsiHandler({ final: "f" }, (e) => this.hVPosition(e)), this._parser.registerCsiHandler({ final: "g" }, (e) => this.tabClear(e)), this._parser.registerCsiHandler({ final: "h" }, (e) => this.setMode(e)), this._parser.registerCsiHandler({
			prefix: "?",
			final: "h"
		}, (e) => this.setModePrivate(e)), this._parser.registerCsiHandler({ final: "l" }, (e) => this.resetMode(e)), this._parser.registerCsiHandler({
			prefix: "?",
			final: "l"
		}, (e) => this.resetModePrivate(e)), this._parser.registerCsiHandler({ final: "m" }, (e) => this.charAttributes(e)), this._parser.registerCsiHandler({ final: "n" }, (e) => this.deviceStatus(e)), this._parser.registerCsiHandler({
			prefix: "?",
			final: "n"
		}, (e) => this.deviceStatusPrivate(e)), this._parser.registerCsiHandler({
			intermediates: "!",
			final: "p"
		}, (e) => this.softReset(e)), this._parser.registerCsiHandler({
			intermediates: " ",
			final: "q"
		}, (e) => this.setCursorStyle(e)), this._parser.registerCsiHandler({ final: "r" }, (e) => this.setScrollRegion(e)), this._parser.registerCsiHandler({ final: "s" }, (e) => this.saveCursor(e)), this._parser.registerCsiHandler({ final: "t" }, (e) => this.windowOptions(e)), this._parser.registerCsiHandler({ final: "u" }, (e) => this.restoreCursor(e)), this._parser.registerCsiHandler({
			intermediates: "'",
			final: "}"
		}, (e) => this.insertColumns(e)), this._parser.registerCsiHandler({
			intermediates: "'",
			final: "~"
		}, (e) => this.deleteColumns(e)), this._parser.registerCsiHandler({
			intermediates: "\"",
			final: "q"
		}, (e) => this.selectProtected(e)), this._parser.registerCsiHandler({
			intermediates: "$",
			final: "p"
		}, (e) => this.requestMode(e, !0)), this._parser.registerCsiHandler({
			prefix: "?",
			intermediates: "$",
			final: "p"
		}, (e) => this.requestMode(e, !1)), this._parser.setExecuteHandler(N.BEL, () => this.bell()), this._parser.setExecuteHandler(N.LF, () => this.lineFeed()), this._parser.setExecuteHandler(N.VT, () => this.lineFeed()), this._parser.setExecuteHandler(N.FF, () => this.lineFeed()), this._parser.setExecuteHandler(N.CR, () => this.carriageReturn()), this._parser.setExecuteHandler(N.BS, () => this.backspace()), this._parser.setExecuteHandler(N.HT, () => this.tab()), this._parser.setExecuteHandler(N.SO, () => this.shiftOut()), this._parser.setExecuteHandler(N.SI, () => this.shiftIn()), this._parser.setExecuteHandler(yi.IND, () => this.index()), this._parser.setExecuteHandler(yi.NEL, () => this.nextLine()), this._parser.setExecuteHandler(yi.HTS, () => this.tabSet()), this._parser.registerOscHandler(0, new Qo((e) => (this.setTitle(e), this.setIconName(e), !0))), this._parser.registerOscHandler(1, new Qo((e) => this.setIconName(e))), this._parser.registerOscHandler(2, new Qo((e) => this.setTitle(e))), this._parser.registerOscHandler(4, new Qo((e) => this.setOrReportIndexedColor(e))), this._parser.registerOscHandler(8, new Qo((e) => this.setHyperlink(e))), this._parser.registerOscHandler(10, new Qo((e) => this.setOrReportFgColor(e))), this._parser.registerOscHandler(11, new Qo((e) => this.setOrReportBgColor(e))), this._parser.registerOscHandler(12, new Qo((e) => this.setOrReportCursorColor(e))), this._parser.registerOscHandler(104, new Qo((e) => this.restoreIndexedColor(e))), this._parser.registerOscHandler(110, new Qo((e) => this.restoreFgColor(e))), this._parser.registerOscHandler(111, new Qo((e) => this.restoreBgColor(e))), this._parser.registerOscHandler(112, new Qo((e) => this.restoreCursorColor(e))), this._parser.registerEscHandler({ final: "7" }, () => this.saveCursor()), this._parser.registerEscHandler({ final: "8" }, () => this.restoreCursor()), this._parser.registerEscHandler({ final: "D" }, () => this.index()), this._parser.registerEscHandler({ final: "E" }, () => this.nextLine()), this._parser.registerEscHandler({ final: "H" }, () => this.tabSet()), this._parser.registerEscHandler({ final: "M" }, () => this.reverseIndex()), this._parser.registerEscHandler({ final: "=" }, () => this.keypadApplicationMode()), this._parser.registerEscHandler({ final: ">" }, () => this.keypadNumericMode()), this._parser.registerEscHandler({ final: "c" }, () => this.fullReset()), this._parser.registerEscHandler({ final: "n" }, () => this.setgLevel(2)), this._parser.registerEscHandler({ final: "o" }, () => this.setgLevel(3)), this._parser.registerEscHandler({ final: "|" }, () => this.setgLevel(3)), this._parser.registerEscHandler({ final: "}" }, () => this.setgLevel(2)), this._parser.registerEscHandler({ final: "~" }, () => this.setgLevel(1)), this._parser.registerEscHandler({
			intermediates: "%",
			final: "@"
		}, () => this.selectDefaultCharset()), this._parser.registerEscHandler({
			intermediates: "%",
			final: "G"
		}, () => this.selectDefaultCharset());
		for (let e in W) this._parser.registerEscHandler({
			intermediates: "(",
			final: e
		}, () => this.selectCharset("(" + e)), this._parser.registerEscHandler({
			intermediates: ")",
			final: e
		}, () => this.selectCharset(")" + e)), this._parser.registerEscHandler({
			intermediates: "*",
			final: e
		}, () => this.selectCharset("*" + e)), this._parser.registerEscHandler({
			intermediates: "+",
			final: e
		}, () => this.selectCharset("+" + e)), this._parser.registerEscHandler({
			intermediates: "-",
			final: e
		}, () => this.selectCharset("-" + e)), this._parser.registerEscHandler({
			intermediates: ".",
			final: e
		}, () => this.selectCharset("." + e)), this._parser.registerEscHandler({
			intermediates: "/",
			final: e
		}, () => this.selectCharset("/" + e));
		this._parser.registerEscHandler({
			intermediates: "#",
			final: "8"
		}, () => this.screenAlignmentPattern()), this._parser.setErrorHandler((e) => (this._logService.error("Parsing error: ", e), e)), this._parser.registerDcsHandler({
			intermediates: "$",
			final: "q"
		}, new ns((e, t) => this.requestStatusString(e, t)));
	}
	getAttrData() {
		return this._curAttrData;
	}
	_preserveStack(e, t, n, r) {
		this._parseStack.paused = !0, this._parseStack.cursorStartX = e, this._parseStack.cursorStartY = t, this._parseStack.decodedLength = n, this._parseStack.position = r;
	}
	_logSlowResolvingAsync(e) {
		this._logService.logLevel <= 3 && Promise.race([e, new Promise((e, t) => setTimeout(() => t("#SLOW_TIMEOUT"), gs))]).catch((e) => {
			if (e !== "#SLOW_TIMEOUT") throw e;
			console.warn(`async parser handler taking longer than ${gs} ms`);
		});
	}
	_getCurrentLinkId() {
		return this._curAttrData.extended.urlId;
	}
	parse(e, t) {
		let n, r = this._activeBuffer.x, i = this._activeBuffer.y, a = 0, o = this._parseStack.paused;
		if (o) {
			if (n = this._parser.parse(this._parseBuffer, this._parseStack.decodedLength, t)) return this._logSlowResolvingAsync(n), n;
			r = this._parseStack.cursorStartX, i = this._parseStack.cursorStartY, this._parseStack.paused = !1, e.length > ps && (a = this._parseStack.position + ps);
		}
		if (this._logService.logLevel <= 1 && this._logService.debug(`parsing data ${typeof e == "string" ? ` "${e}"` : ` "${Array.prototype.map.call(e, (e) => String.fromCharCode(e)).join("")}"`}`), this._logService.logLevel === 0 && this._logService.trace("parsing data (codes)", typeof e == "string" ? e.split("").map((e) => e.charCodeAt(0)) : e), this._parseBuffer.length < e.length && this._parseBuffer.length < ps && (this._parseBuffer = new Uint32Array(Math.min(e.length, ps))), o || this._dirtyRowTracker.clearRange(), e.length > ps) for (let t = a; t < e.length; t += ps) {
			let a = t + ps < e.length ? t + ps : e.length, o = typeof e == "string" ? this._stringDecoder.decode(e.substring(t, a), this._parseBuffer) : this._utf8Decoder.decode(e.subarray(t, a), this._parseBuffer);
			if (n = this._parser.parse(this._parseBuffer, o)) return this._preserveStack(r, i, o, t), this._logSlowResolvingAsync(n), n;
		}
		else if (!o) {
			let t = typeof e == "string" ? this._stringDecoder.decode(e, this._parseBuffer) : this._utf8Decoder.decode(e, this._parseBuffer);
			if (n = this._parser.parse(this._parseBuffer, t)) return this._preserveStack(r, i, t, 0), this._logSlowResolvingAsync(n), n;
		}
		(this._activeBuffer.x !== r || this._activeBuffer.y !== i) && this._onCursorMove.fire();
		let s = this._dirtyRowTracker.end + (this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp), c = this._dirtyRowTracker.start + (this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
		c < this._bufferService.rows && this._onRequestRefreshRows.fire({
			start: Math.min(c, this._bufferService.rows - 1),
			end: Math.min(s, this._bufferService.rows - 1)
		});
	}
	print(e, t, n) {
		let r, i, a = this._charsetService.charset, o = this._optionsService.rawOptions.screenReaderMode, s = this._bufferService.cols, c = this._coreService.decPrivateModes.wraparound, l = this._coreService.modes.insertMode, u = this._curAttrData, d = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
		this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._activeBuffer.x && n - t > 0 && d.getWidth(this._activeBuffer.x - 1) === 2 && d.setCellFromCodepoint(this._activeBuffer.x - 1, 0, 1, u);
		let f = this._parser.precedingJoinState;
		for (let p = t; p < n; ++p) {
			if (r = e[p], r < 127 && a) {
				let e = a[String.fromCharCode(r)];
				e && (r = e.charCodeAt(0));
			}
			let t = this._unicodeService.charProperties(r, f);
			i = Wo.extractWidth(t);
			let n = Wo.extractShouldJoin(t), m = n ? Wo.extractWidth(f) : 0;
			if (f = t, o && this._onA11yChar.fire(Ne(r)), this._getCurrentLinkId() && this._oscLinkService.addLineToLink(this._getCurrentLinkId(), this._activeBuffer.ybase + this._activeBuffer.y), this._activeBuffer.x + i - m > s) {
				if (c) {
					let e = d, t = this._activeBuffer.x - m;
					for (this._activeBuffer.x = m, this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData(), !0)) : (this._activeBuffer.y >= this._bufferService.rows && (this._activeBuffer.y = this._bufferService.rows - 1), this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = !0), d = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y), m > 0 && d instanceof fo && d.copyCellsFrom(e, t, 0, m, !1); t < s;) e.setCellFromCodepoint(t++, 0, 1, u);
				} else if (this._activeBuffer.x = s - 1, i === 2) continue;
			}
			if (n && this._activeBuffer.x) {
				let e = d.getWidth(this._activeBuffer.x - 1) ? 1 : 2;
				d.addCodepointToCell(this._activeBuffer.x - e, r, i);
				for (let e = i - m; --e >= 0;) d.setCellFromCodepoint(this._activeBuffer.x++, 0, 0, u);
			} else if (l && (d.insertCells(this._activeBuffer.x, i - m, this._activeBuffer.getNullCell(u)), d.getWidth(s - 1) === 2 && d.setCellFromCodepoint(s - 1, 0, 1, u)), d.setCellFromCodepoint(this._activeBuffer.x++, r, i, u), i > 0) for (; --i;) d.setCellFromCodepoint(this._activeBuffer.x++, 0, 0, u);
		}
		this._parser.precedingJoinState = f, this._activeBuffer.x < s && n - t > 0 && d.getWidth(this._activeBuffer.x) === 0 && !d.hasContent(this._activeBuffer.x) && d.setCellFromCodepoint(this._activeBuffer.x, 0, 1, u), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
	}
	registerCsiHandler(e, t) {
		return e.final === "t" && !e.prefix && !e.intermediates ? this._parser.registerCsiHandler(e, (e) => !hs(e.params[0], this._optionsService.rawOptions.windowOptions) || t(e)) : this._parser.registerCsiHandler(e, t);
	}
	registerDcsHandler(e, t) {
		return this._parser.registerDcsHandler(e, new ns(t));
	}
	registerEscHandler(e, t) {
		return this._parser.registerEscHandler(e, t);
	}
	registerOscHandler(e, t) {
		return this._parser.registerOscHandler(e, new Qo(t));
	}
	bell() {
		return this._onRequestBell.fire(), !0;
	}
	lineFeed() {
		return this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._optionsService.rawOptions.convertEol && (this._activeBuffer.x = 0), this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData())) : this._activeBuffer.y >= this._bufferService.rows ? this._activeBuffer.y = this._bufferService.rows - 1 : this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = !1, this._activeBuffer.x >= this._bufferService.cols && this._activeBuffer.x--, this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._onLineFeed.fire(), !0;
	}
	carriageReturn() {
		return this._activeBuffer.x = 0, !0;
	}
	backspace() {
		if (!this._coreService.decPrivateModes.reverseWraparound) return this._restrictCursor(), this._activeBuffer.x > 0 && this._activeBuffer.x--, !0;
		if (this._restrictCursor(this._bufferService.cols), this._activeBuffer.x > 0) this._activeBuffer.x--;
		else if (this._activeBuffer.x === 0 && this._activeBuffer.y > this._activeBuffer.scrollTop && this._activeBuffer.y <= this._activeBuffer.scrollBottom && this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y)?.isWrapped) {
			this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).isWrapped = !1, this._activeBuffer.y--, this._activeBuffer.x = this._bufferService.cols - 1;
			let e = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
			e.hasWidth(this._activeBuffer.x) && !e.hasContent(this._activeBuffer.x) && this._activeBuffer.x--;
		}
		return this._restrictCursor(), !0;
	}
	tab() {
		if (this._activeBuffer.x >= this._bufferService.cols) return !0;
		let e = this._activeBuffer.x;
		return this._activeBuffer.x = this._activeBuffer.nextStop(), this._optionsService.rawOptions.screenReaderMode && this._onA11yTab.fire(this._activeBuffer.x - e), !0;
	}
	shiftOut() {
		return this._charsetService.setgLevel(1), !0;
	}
	shiftIn() {
		return this._charsetService.setgLevel(0), !0;
	}
	_restrictCursor(e = this._bufferService.cols - 1) {
		this._activeBuffer.x = Math.min(e, Math.max(0, this._activeBuffer.x)), this._activeBuffer.y = this._coreService.decPrivateModes.origin ? Math.min(this._activeBuffer.scrollBottom, Math.max(this._activeBuffer.scrollTop, this._activeBuffer.y)) : Math.min(this._bufferService.rows - 1, Math.max(0, this._activeBuffer.y)), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
	}
	_setCursor(e, t) {
		this._dirtyRowTracker.markDirty(this._activeBuffer.y), this._coreService.decPrivateModes.origin ? (this._activeBuffer.x = e, this._activeBuffer.y = this._activeBuffer.scrollTop + t) : (this._activeBuffer.x = e, this._activeBuffer.y = t), this._restrictCursor(), this._dirtyRowTracker.markDirty(this._activeBuffer.y);
	}
	_moveCursor(e, t) {
		this._restrictCursor(), this._setCursor(this._activeBuffer.x + e, this._activeBuffer.y + t);
	}
	cursorUp(e) {
		let t = this._activeBuffer.y - this._activeBuffer.scrollTop;
		return t >= 0 ? this._moveCursor(0, -Math.min(t, e.params[0] || 1)) : this._moveCursor(0, -(e.params[0] || 1)), !0;
	}
	cursorDown(e) {
		let t = this._activeBuffer.scrollBottom - this._activeBuffer.y;
		return t >= 0 ? this._moveCursor(0, Math.min(t, e.params[0] || 1)) : this._moveCursor(0, e.params[0] || 1), !0;
	}
	cursorForward(e) {
		return this._moveCursor(e.params[0] || 1, 0), !0;
	}
	cursorBackward(e) {
		return this._moveCursor(-(e.params[0] || 1), 0), !0;
	}
	cursorNextLine(e) {
		return this.cursorDown(e), this._activeBuffer.x = 0, !0;
	}
	cursorPrecedingLine(e) {
		return this.cursorUp(e), this._activeBuffer.x = 0, !0;
	}
	cursorCharAbsolute(e) {
		return this._setCursor((e.params[0] || 1) - 1, this._activeBuffer.y), !0;
	}
	cursorPosition(e) {
		return this._setCursor(e.length >= 2 ? (e.params[1] || 1) - 1 : 0, (e.params[0] || 1) - 1), !0;
	}
	charPosAbsolute(e) {
		return this._setCursor((e.params[0] || 1) - 1, this._activeBuffer.y), !0;
	}
	hPositionRelative(e) {
		return this._moveCursor(e.params[0] || 1, 0), !0;
	}
	linePosAbsolute(e) {
		return this._setCursor(this._activeBuffer.x, (e.params[0] || 1) - 1), !0;
	}
	vPositionRelative(e) {
		return this._moveCursor(0, e.params[0] || 1), !0;
	}
	hVPosition(e) {
		return this.cursorPosition(e), !0;
	}
	tabClear(e) {
		let t = e.params[0];
		return t === 0 ? delete this._activeBuffer.tabs[this._activeBuffer.x] : t === 3 && (this._activeBuffer.tabs = {}), !0;
	}
	cursorForwardTab(e) {
		if (this._activeBuffer.x >= this._bufferService.cols) return !0;
		let t = e.params[0] || 1;
		for (; t--;) this._activeBuffer.x = this._activeBuffer.nextStop();
		return !0;
	}
	cursorBackwardTab(e) {
		if (this._activeBuffer.x >= this._bufferService.cols) return !0;
		let t = e.params[0] || 1;
		for (; t--;) this._activeBuffer.x = this._activeBuffer.prevStop();
		return !0;
	}
	selectProtected(e) {
		let t = e.params[0];
		return t === 1 && (this._curAttrData.bg |= 536870912), (t === 2 || t === 0) && (this._curAttrData.bg &= -536870913), !0;
	}
	_eraseInBufferLine(e, t, n, r = !1, i = !1) {
		let a = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
		a.replaceCells(t, n, this._activeBuffer.getNullCell(this._eraseAttrData()), i), r && (a.isWrapped = !1);
	}
	_resetBufferLine(e, t = !1) {
		let n = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
		n && (n.fill(this._activeBuffer.getNullCell(this._eraseAttrData()), t), this._bufferService.buffer.clearMarkers(this._activeBuffer.ybase + e), n.isWrapped = !1);
	}
	eraseInDisplay(e, t = !1) {
		this._restrictCursor(this._bufferService.cols);
		let n;
		switch (e.params[0]) {
			case 0:
				for (n = this._activeBuffer.y, this._dirtyRowTracker.markDirty(n), this._eraseInBufferLine(n++, this._activeBuffer.x, this._bufferService.cols, this._activeBuffer.x === 0, t); n < this._bufferService.rows; n++) this._resetBufferLine(n, t);
				this._dirtyRowTracker.markDirty(n);
				break;
			case 1:
				for (n = this._activeBuffer.y, this._dirtyRowTracker.markDirty(n), this._eraseInBufferLine(n, 0, this._activeBuffer.x + 1, !0, t), this._activeBuffer.x + 1 >= this._bufferService.cols && (this._activeBuffer.lines.get(n + 1).isWrapped = !1); n--;) this._resetBufferLine(n, t);
				this._dirtyRowTracker.markDirty(0);
				break;
			case 2:
				if (this._optionsService.rawOptions.scrollOnEraseInDisplay) {
					for (n = this._bufferService.rows, this._dirtyRowTracker.markRangeDirty(0, n - 1); n-- && !this._activeBuffer.lines.get(this._activeBuffer.ybase + n)?.getTrimmedLength(););
					for (; n >= 0; n--) this._bufferService.scroll(this._eraseAttrData());
				} else {
					for (n = this._bufferService.rows, this._dirtyRowTracker.markDirty(n - 1); n--;) this._resetBufferLine(n, t);
					this._dirtyRowTracker.markDirty(0);
				}
				break;
			case 3:
				let e = this._activeBuffer.lines.length - this._bufferService.rows;
				e > 0 && (this._activeBuffer.lines.trimStart(e), this._activeBuffer.ybase = Math.max(this._activeBuffer.ybase - e, 0), this._activeBuffer.ydisp = Math.max(this._activeBuffer.ydisp - e, 0), this._onScroll.fire(0));
		}
		return !0;
	}
	eraseInLine(e, t = !1) {
		switch (this._restrictCursor(this._bufferService.cols), e.params[0]) {
			case 0:
				this._eraseInBufferLine(this._activeBuffer.y, this._activeBuffer.x, this._bufferService.cols, this._activeBuffer.x === 0, t);
				break;
			case 1:
				this._eraseInBufferLine(this._activeBuffer.y, 0, this._activeBuffer.x + 1, !1, t);
				break;
			case 2: this._eraseInBufferLine(this._activeBuffer.y, 0, this._bufferService.cols, !0, t);
		}
		return this._dirtyRowTracker.markDirty(this._activeBuffer.y), !0;
	}
	insertLines(e) {
		this._restrictCursor();
		let t = e.params[0] || 1;
		if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
		let n = this._activeBuffer.ybase + this._activeBuffer.y, r = this._bufferService.rows - 1 - this._activeBuffer.scrollBottom, i = this._bufferService.rows - 1 + this._activeBuffer.ybase - r + 1;
		for (; t--;) this._activeBuffer.lines.splice(i - 1, 1), this._activeBuffer.lines.splice(n, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
		return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.y, this._activeBuffer.scrollBottom), this._activeBuffer.x = 0, !0;
	}
	deleteLines(e) {
		this._restrictCursor();
		let t = e.params[0] || 1;
		if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
		let n = this._activeBuffer.ybase + this._activeBuffer.y, r;
		for (r = this._bufferService.rows - 1 - this._activeBuffer.scrollBottom, r = this._bufferService.rows - 1 + this._activeBuffer.ybase - r; t--;) this._activeBuffer.lines.splice(n, 1), this._activeBuffer.lines.splice(r, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
		return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.y, this._activeBuffer.scrollBottom), this._activeBuffer.x = 0, !0;
	}
	insertChars(e) {
		this._restrictCursor();
		let t = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
		return t && (t.insertCells(this._activeBuffer.x, e.params[0] || 1, this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), !0;
	}
	deleteChars(e) {
		this._restrictCursor();
		let t = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
		return t && (t.deleteCells(this._activeBuffer.x, e.params[0] || 1, this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), !0;
	}
	scrollUp(e) {
		let t = e.params[0] || 1;
		for (; t--;) this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollTop, 1), this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollBottom, 0, this._activeBuffer.getBlankLine(this._eraseAttrData()));
		return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
	}
	scrollDown(e) {
		let t = e.params[0] || 1;
		for (; t--;) this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollBottom, 1), this._activeBuffer.lines.splice(this._activeBuffer.ybase + this._activeBuffer.scrollTop, 0, this._activeBuffer.getBlankLine(U));
		return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
	}
	scrollLeft(e) {
		if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
		let t = e.params[0] || 1;
		for (let e = this._activeBuffer.scrollTop; e <= this._activeBuffer.scrollBottom; ++e) {
			let n = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
			n.deleteCells(0, t, this._activeBuffer.getNullCell(this._eraseAttrData())), n.isWrapped = !1;
		}
		return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
	}
	scrollRight(e) {
		if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
		let t = e.params[0] || 1;
		for (let e = this._activeBuffer.scrollTop; e <= this._activeBuffer.scrollBottom; ++e) {
			let n = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
			n.insertCells(0, t, this._activeBuffer.getNullCell(this._eraseAttrData())), n.isWrapped = !1;
		}
		return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
	}
	insertColumns(e) {
		if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
		let t = e.params[0] || 1;
		for (let e = this._activeBuffer.scrollTop; e <= this._activeBuffer.scrollBottom; ++e) {
			let n = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
			n.insertCells(this._activeBuffer.x, t, this._activeBuffer.getNullCell(this._eraseAttrData())), n.isWrapped = !1;
		}
		return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
	}
	deleteColumns(e) {
		if (this._activeBuffer.y > this._activeBuffer.scrollBottom || this._activeBuffer.y < this._activeBuffer.scrollTop) return !0;
		let t = e.params[0] || 1;
		for (let e = this._activeBuffer.scrollTop; e <= this._activeBuffer.scrollBottom; ++e) {
			let n = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
			n.deleteCells(this._activeBuffer.x, t, this._activeBuffer.getNullCell(this._eraseAttrData())), n.isWrapped = !1;
		}
		return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom), !0;
	}
	eraseChars(e) {
		this._restrictCursor();
		let t = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y);
		return t && (t.replaceCells(this._activeBuffer.x, this._activeBuffer.x + (e.params[0] || 1), this._activeBuffer.getNullCell(this._eraseAttrData())), this._dirtyRowTracker.markDirty(this._activeBuffer.y)), !0;
	}
	repeatPrecedingCharacter(e) {
		let t = this._parser.precedingJoinState;
		if (!t) return !0;
		let n = e.params[0] || 1, r = Wo.extractWidth(t), i = this._activeBuffer.x - r, a = this._activeBuffer.lines.get(this._activeBuffer.ybase + this._activeBuffer.y).getString(i), o = new Uint32Array(a.length * n), s = 0;
		for (let e = 0; e < a.length;) {
			let t = a.codePointAt(e) || 0;
			o[s++] = t, e += t > 65535 ? 2 : 1;
		}
		let c = s;
		for (let e = 1; e < n; ++e) o.copyWithin(c, 0, s), c += s;
		return this.print(o, 0, c), !0;
	}
	sendDeviceAttributesPrimary(e) {
		return e.params[0] > 0 || (this._is("xterm") || this._is("rxvt-unicode") || this._is("screen") ? this._coreService.triggerDataEvent(N.ESC + "[?1;2c") : this._is("linux") && this._coreService.triggerDataEvent(N.ESC + "[?6c")), !0;
	}
	sendDeviceAttributesSecondary(e) {
		return e.params[0] > 0 || (this._is("xterm") ? this._coreService.triggerDataEvent(N.ESC + "[>0;276;0c") : this._is("rxvt-unicode") ? this._coreService.triggerDataEvent(N.ESC + "[>85;95;0c") : this._is("linux") ? this._coreService.triggerDataEvent(e.params[0] + "c") : this._is("screen") && this._coreService.triggerDataEvent(N.ESC + "[>83;40003;0c")), !0;
	}
	_is(e) {
		return (this._optionsService.rawOptions.termName + "").indexOf(e) === 0;
	}
	setMode(e) {
		for (let t = 0; t < e.length; t++) switch (e.params[t]) {
			case 4:
				this._coreService.modes.insertMode = !0;
				break;
			case 20: this._optionsService.options.convertEol = !0;
		}
		return !0;
	}
	setModePrivate(e) {
		for (let t = 0; t < e.length; t++) switch (e.params[t]) {
			case 1:
				this._coreService.decPrivateModes.applicationCursorKeys = !0;
				break;
			case 2:
				this._charsetService.setgCharset(0, bo), this._charsetService.setgCharset(1, bo), this._charsetService.setgCharset(2, bo), this._charsetService.setgCharset(3, bo);
				break;
			case 3:
				this._optionsService.rawOptions.windowOptions.setWinLines && (this._bufferService.resize(132, this._bufferService.rows), this._onRequestReset.fire());
				break;
			case 6:
				this._coreService.decPrivateModes.origin = !0, this._setCursor(0, 0);
				break;
			case 7:
				this._coreService.decPrivateModes.wraparound = !0;
				break;
			case 12:
				this._optionsService.options.cursorBlink = !0;
				break;
			case 45:
				this._coreService.decPrivateModes.reverseWraparound = !0;
				break;
			case 66:
				this._logService.debug("Serial port requested application keypad."), this._coreService.decPrivateModes.applicationKeypad = !0, this._onRequestSyncScrollBar.fire();
				break;
			case 9:
				this._coreMouseService.activeProtocol = "X10";
				break;
			case 1e3:
				this._coreMouseService.activeProtocol = "VT200";
				break;
			case 1002:
				this._coreMouseService.activeProtocol = "DRAG";
				break;
			case 1003:
				this._coreMouseService.activeProtocol = "ANY";
				break;
			case 1004:
				this._coreService.decPrivateModes.sendFocus = !0, this._onRequestSendFocus.fire();
				break;
			case 1005:
				this._logService.debug("DECSET 1005 not supported (see #2507)");
				break;
			case 1006:
				this._coreMouseService.activeEncoding = "SGR";
				break;
			case 1015:
				this._logService.debug("DECSET 1015 not supported (see #2507)");
				break;
			case 1016:
				this._coreMouseService.activeEncoding = "SGR_PIXELS";
				break;
			case 25:
				this._coreService.isCursorHidden = !1;
				break;
			case 1048:
				this.saveCursor();
				break;
			case 1049: this.saveCursor();
			case 47:
			case 1047:
				this._bufferService.buffers.activateAltBuffer(this._eraseAttrData()), this._coreService.isCursorInitialized = !0, this._onRequestRefreshRows.fire(void 0), this._onRequestSyncScrollBar.fire();
				break;
			case 2004:
				this._coreService.decPrivateModes.bracketedPasteMode = !0;
				break;
			case 2026: this._coreService.decPrivateModes.synchronizedOutput = !0;
		}
		return !0;
	}
	resetMode(e) {
		for (let t = 0; t < e.length; t++) switch (e.params[t]) {
			case 4:
				this._coreService.modes.insertMode = !1;
				break;
			case 20: this._optionsService.options.convertEol = !1;
		}
		return !0;
	}
	resetModePrivate(e) {
		for (let t = 0; t < e.length; t++) switch (e.params[t]) {
			case 1:
				this._coreService.decPrivateModes.applicationCursorKeys = !1;
				break;
			case 3:
				this._optionsService.rawOptions.windowOptions.setWinLines && (this._bufferService.resize(80, this._bufferService.rows), this._onRequestReset.fire());
				break;
			case 6:
				this._coreService.decPrivateModes.origin = !1, this._setCursor(0, 0);
				break;
			case 7:
				this._coreService.decPrivateModes.wraparound = !1;
				break;
			case 12:
				this._optionsService.options.cursorBlink = !1;
				break;
			case 45:
				this._coreService.decPrivateModes.reverseWraparound = !1;
				break;
			case 66:
				this._logService.debug("Switching back to normal keypad."), this._coreService.decPrivateModes.applicationKeypad = !1, this._onRequestSyncScrollBar.fire();
				break;
			case 9:
			case 1e3:
			case 1002:
			case 1003:
				this._coreMouseService.activeProtocol = "NONE";
				break;
			case 1004:
				this._coreService.decPrivateModes.sendFocus = !1;
				break;
			case 1005:
				this._logService.debug("DECRST 1005 not supported (see #2507)");
				break;
			case 1006:
				this._coreMouseService.activeEncoding = "DEFAULT";
				break;
			case 1015:
				this._logService.debug("DECRST 1015 not supported (see #2507)");
				break;
			case 1016:
				this._coreMouseService.activeEncoding = "DEFAULT";
				break;
			case 25:
				this._coreService.isCursorHidden = !0;
				break;
			case 1048:
				this.restoreCursor();
				break;
			case 1049:
			case 47:
			case 1047:
				this._bufferService.buffers.activateNormalBuffer(), e.params[t] === 1049 && this.restoreCursor(), this._coreService.isCursorInitialized = !0, this._onRequestRefreshRows.fire(void 0), this._onRequestSyncScrollBar.fire();
				break;
			case 2004:
				this._coreService.decPrivateModes.bracketedPasteMode = !1;
				break;
			case 2026: this._coreService.decPrivateModes.synchronizedOutput = !1, this._onRequestRefreshRows.fire(void 0);
		}
		return !0;
	}
	requestMode(e, t) {
		let n;
		((e) => (e[e.NOT_RECOGNIZED = 0] = "NOT_RECOGNIZED", e[e.SET = 1] = "SET", e[e.RESET = 2] = "RESET", e[e.PERMANENTLY_SET = 3] = "PERMANENTLY_SET", e[e.PERMANENTLY_RESET = 4] = "PERMANENTLY_RESET"))(n ||= {});
		let r = this._coreService.decPrivateModes, { activeProtocol: i, activeEncoding: a } = this._coreMouseService, o = this._coreService, { buffers: s, cols: c } = this._bufferService, { active: l, alt: u } = s, d = this._optionsService.rawOptions, f = (e, n) => (o.triggerDataEvent(`${N.ESC}[${t ? "" : "?"}${e};${n}$y`), !0), p = (e) => e ? 1 : 2, m = e.params[0];
		return t ? m === 2 ? f(m, 4) : m === 4 ? f(m, p(o.modes.insertMode)) : m === 12 ? f(m, 3) : m === 20 ? f(m, p(d.convertEol)) : f(m, 0) : m === 1 ? f(m, p(r.applicationCursorKeys)) : m === 3 ? f(m, d.windowOptions.setWinLines ? c === 80 ? 2 : +(c === 132) : 0) : m === 6 ? f(m, p(r.origin)) : m === 7 ? f(m, p(r.wraparound)) : m === 8 ? f(m, 3) : m === 9 ? f(m, p(i === "X10")) : m === 12 ? f(m, p(d.cursorBlink)) : m === 25 ? f(m, p(!o.isCursorHidden)) : m === 45 ? f(m, p(r.reverseWraparound)) : m === 66 ? f(m, p(r.applicationKeypad)) : m === 67 ? f(m, 4) : m === 1e3 ? f(m, p(i === "VT200")) : m === 1002 ? f(m, p(i === "DRAG")) : m === 1003 ? f(m, p(i === "ANY")) : m === 1004 ? f(m, p(r.sendFocus)) : m === 1005 ? f(m, 4) : m === 1006 ? f(m, p(a === "SGR")) : m === 1015 ? f(m, 4) : m === 1016 ? f(m, p(a === "SGR_PIXELS")) : m === 1048 ? f(m, 1) : m === 47 || m === 1047 || m === 1049 ? f(m, p(l === u)) : m === 2004 ? f(m, p(r.bracketedPasteMode)) : m === 2026 ? f(m, p(r.synchronizedOutput)) : f(m, 0);
	}
	_updateAttrColor(e, t, n, r, i) {
		return t === 2 ? (e |= 50331648, e &= -16777216, e |= ze.fromColorRGB([
			n,
			r,
			i
		])) : t === 5 && (e &= -50331904, e |= 33554432 | n & 255), e;
	}
	_extractColor(e, t, n) {
		let r = [
			0,
			0,
			-1,
			0,
			0,
			0
		], i = 0, a = 0;
		do {
			if (r[a + i] = e.params[t + a], e.hasSubParams(t + a)) {
				let n = e.getSubParams(t + a), o = 0;
				do
					r[1] === 5 && (i = 1), r[a + o + 1 + i] = n[o];
				while (++o < n.length && o + a + 1 + i < r.length);
				break;
			}
			if (r[1] === 5 && a + i >= 2 || r[1] === 2 && a + i >= 5) break;
			r[1] && (i = 1);
		} while (++a + t < e.length && a + i < r.length);
		for (let e = 2; e < r.length; ++e) r[e] === -1 && (r[e] = 0);
		switch (r[0]) {
			case 38:
				n.fg = this._updateAttrColor(n.fg, r[1], r[3], r[4], r[5]);
				break;
			case 48:
				n.bg = this._updateAttrColor(n.bg, r[1], r[3], r[4], r[5]);
				break;
			case 58: n.extended = n.extended.clone(), n.extended.underlineColor = this._updateAttrColor(n.extended.underlineColor, r[1], r[3], r[4], r[5]);
		}
		return a;
	}
	_processUnderline(e, t) {
		t.extended = t.extended.clone(), (!~e || e > 5) && (e = 1), t.extended.underlineStyle = e, t.fg |= 268435456, e === 0 && (t.fg &= -268435457), t.updateExtended();
	}
	_processSGR0(e) {
		e.fg = U.fg, e.bg = U.bg, e.extended = e.extended.clone(), e.extended.underlineStyle = 0, e.extended.underlineColor &= -67108864, e.updateExtended();
	}
	charAttributes(e) {
		if (e.length === 1 && e.params[0] === 0) return this._processSGR0(this._curAttrData), !0;
		let t = e.length, n, r = this._curAttrData;
		for (let i = 0; i < t; i++) n = e.params[i], n >= 30 && n <= 37 ? (r.fg &= -50331904, r.fg |= 16777216 | n - 30) : n >= 40 && n <= 47 ? (r.bg &= -50331904, r.bg |= 16777216 | n - 40) : n >= 90 && n <= 97 ? (r.fg &= -50331904, r.fg |= n - 90 | 16777224) : n >= 100 && n <= 107 ? (r.bg &= -50331904, r.bg |= n - 100 | 16777224) : n === 0 ? this._processSGR0(r) : n === 1 ? r.fg |= 134217728 : n === 3 ? r.bg |= 67108864 : n === 4 ? (r.fg |= 268435456, this._processUnderline(e.hasSubParams(i) ? e.getSubParams(i)[0] : 1, r)) : n === 5 ? r.fg |= 536870912 : n === 7 ? r.fg |= 67108864 : n === 8 ? r.fg |= 1073741824 : n === 9 ? r.fg |= 2147483648 : n === 2 ? r.bg |= 134217728 : n === 21 ? this._processUnderline(2, r) : n === 22 ? (r.fg &= -134217729, r.bg &= -134217729) : n === 23 ? r.bg &= -67108865 : n === 24 ? (r.fg &= -268435457, this._processUnderline(0, r)) : n === 25 ? r.fg &= -536870913 : n === 27 ? r.fg &= -67108865 : n === 28 ? r.fg &= -1073741825 : n === 29 ? r.fg &= 2147483647 : n === 39 ? (r.fg &= -67108864, r.fg |= U.fg & 16777215) : n === 49 ? (r.bg &= -67108864, r.bg |= U.bg & 16777215) : n === 38 || n === 48 || n === 58 ? i += this._extractColor(e, i, r) : n === 53 ? r.bg |= 1073741824 : n === 55 ? r.bg &= -1073741825 : n === 59 ? (r.extended = r.extended.clone(), r.extended.underlineColor = -1, r.updateExtended()) : n === 100 ? (r.fg &= -67108864, r.fg |= U.fg & 16777215, r.bg &= -67108864, r.bg |= U.bg & 16777215) : this._logService.debug("Unknown SGR attribute: %d.", n);
		return !0;
	}
	deviceStatus(e) {
		switch (e.params[0]) {
			case 5:
				this._coreService.triggerDataEvent(`${N.ESC}[0n`);
				break;
			case 6:
				let e = this._activeBuffer.y + 1, t = this._activeBuffer.x + 1;
				this._coreService.triggerDataEvent(`${N.ESC}[${e};${t}R`);
		}
		return !0;
	}
	deviceStatusPrivate(e) {
		if (e.params[0] === 6) {
			let e = this._activeBuffer.y + 1, t = this._activeBuffer.x + 1;
			this._coreService.triggerDataEvent(`${N.ESC}[?${e};${t}R`);
		}
		return !0;
	}
	softReset(e) {
		return this._coreService.isCursorHidden = !1, this._onRequestSyncScrollBar.fire(), this._activeBuffer.scrollTop = 0, this._activeBuffer.scrollBottom = this._bufferService.rows - 1, this._curAttrData = U.clone(), this._coreService.reset(), this._charsetService.reset(), this._activeBuffer.savedX = 0, this._activeBuffer.savedY = this._activeBuffer.ybase, this._activeBuffer.savedCurAttrData.fg = this._curAttrData.fg, this._activeBuffer.savedCurAttrData.bg = this._curAttrData.bg, this._activeBuffer.savedCharset = this._charsetService.charset, this._coreService.decPrivateModes.origin = !1, !0;
	}
	setCursorStyle(e) {
		let t = e.length === 0 ? 1 : e.params[0];
		if (t === 0) this._coreService.decPrivateModes.cursorStyle = void 0, this._coreService.decPrivateModes.cursorBlink = void 0;
		else {
			switch (t) {
				case 1:
				case 2:
					this._coreService.decPrivateModes.cursorStyle = "block";
					break;
				case 3:
				case 4:
					this._coreService.decPrivateModes.cursorStyle = "underline";
					break;
				case 5:
				case 6: this._coreService.decPrivateModes.cursorStyle = "bar";
			}
			let e = t % 2 == 1;
			this._coreService.decPrivateModes.cursorBlink = e;
		}
		return !0;
	}
	setScrollRegion(e) {
		let t = e.params[0] || 1, n;
		return (e.length < 2 || (n = e.params[1]) > this._bufferService.rows || n === 0) && (n = this._bufferService.rows), n > t && (this._activeBuffer.scrollTop = t - 1, this._activeBuffer.scrollBottom = n - 1, this._setCursor(0, 0)), !0;
	}
	windowOptions(e) {
		if (!hs(e.params[0], this._optionsService.rawOptions.windowOptions)) return !0;
		let t = e.length > 1 ? e.params[1] : 0;
		switch (e.params[0]) {
			case 14:
				t !== 2 && this._onRequestWindowsOptionsReport.fire(0);
				break;
			case 16:
				this._onRequestWindowsOptionsReport.fire(1);
				break;
			case 18:
				this._bufferService && this._coreService.triggerDataEvent(`${N.ESC}[8;${this._bufferService.rows};${this._bufferService.cols}t`);
				break;
			case 22:
				(t === 0 || t === 2) && (this._windowTitleStack.push(this._windowTitle), this._windowTitleStack.length > ms && this._windowTitleStack.shift()), (t === 0 || t === 1) && (this._iconNameStack.push(this._iconName), this._iconNameStack.length > ms && this._iconNameStack.shift());
				break;
			case 23: (t === 0 || t === 2) && this._windowTitleStack.length && this.setTitle(this._windowTitleStack.pop()), (t === 0 || t === 1) && this._iconNameStack.length && this.setIconName(this._iconNameStack.pop());
		}
		return !0;
	}
	saveCursor(e) {
		return this._activeBuffer.savedX = this._activeBuffer.x, this._activeBuffer.savedY = this._activeBuffer.ybase + this._activeBuffer.y, this._activeBuffer.savedCurAttrData.fg = this._curAttrData.fg, this._activeBuffer.savedCurAttrData.bg = this._curAttrData.bg, this._activeBuffer.savedCharset = this._charsetService.charset, !0;
	}
	restoreCursor(e) {
		return this._activeBuffer.x = this._activeBuffer.savedX || 0, this._activeBuffer.y = Math.max(this._activeBuffer.savedY - this._activeBuffer.ybase, 0), this._curAttrData.fg = this._activeBuffer.savedCurAttrData.fg, this._curAttrData.bg = this._activeBuffer.savedCurAttrData.bg, this._charsetService.charset = this._savedCharset, this._activeBuffer.savedCharset && (this._charsetService.charset = this._activeBuffer.savedCharset), this._restrictCursor(), !0;
	}
	setTitle(e) {
		return this._windowTitle = e, this._onTitleChange.fire(e), !0;
	}
	setIconName(e) {
		return this._iconName = e, !0;
	}
	setOrReportIndexedColor(e) {
		let t = [], n = e.split(";");
		for (; n.length > 1;) {
			let e = n.shift(), r = n.shift();
			if (/^\d+$/.exec(e)) {
				let n = parseInt(e);
				if (bs(n)) {
					if (r === "?") t.push({
						type: 0,
						index: n
					});
					else {
						let e = ls(r);
						e && t.push({
							type: 1,
							index: n,
							color: e
						});
					}
				}
			}
		}
		return t.length && this._onColor.fire(t), !0;
	}
	setHyperlink(e) {
		let t = e.indexOf(";");
		if (t === -1) return !0;
		let n = e.slice(0, t).trim(), r = e.slice(t + 1);
		return r ? this._createHyperlink(n, r) : !n.trim() && this._finishHyperlink();
	}
	_createHyperlink(e, t) {
		this._getCurrentLinkId() && this._finishHyperlink();
		let n = e.split(":"), r, i = n.findIndex((e) => e.startsWith("id="));
		return i !== -1 && (r = n[i].slice(3) || void 0), this._curAttrData.extended = this._curAttrData.extended.clone(), this._curAttrData.extended.urlId = this._oscLinkService.registerLink({
			id: r,
			uri: t
		}), this._curAttrData.updateExtended(), !0;
	}
	_finishHyperlink() {
		return this._curAttrData.extended = this._curAttrData.extended.clone(), this._curAttrData.extended.urlId = 0, this._curAttrData.updateExtended(), !0;
	}
	_setOrReportSpecialColor(e, t) {
		let n = e.split(";");
		for (let e = 0; e < n.length && !(t >= this._specialColors.length); ++e, ++t) if (n[e] === "?") this._onColor.fire([{
			type: 0,
			index: this._specialColors[t]
		}]);
		else {
			let r = ls(n[e]);
			r && this._onColor.fire([{
				type: 1,
				index: this._specialColors[t],
				color: r
			}]);
		}
		return !0;
	}
	setOrReportFgColor(e) {
		return this._setOrReportSpecialColor(e, 0);
	}
	setOrReportBgColor(e) {
		return this._setOrReportSpecialColor(e, 1);
	}
	setOrReportCursorColor(e) {
		return this._setOrReportSpecialColor(e, 2);
	}
	restoreIndexedColor(e) {
		if (!e) return this._onColor.fire([{ type: 2 }]), !0;
		let t = [], n = e.split(";");
		for (let e = 0; e < n.length; ++e) if (/^\d+$/.exec(n[e])) {
			let r = parseInt(n[e]);
			bs(r) && t.push({
				type: 2,
				index: r
			});
		}
		return t.length && this._onColor.fire(t), !0;
	}
	restoreFgColor(e) {
		return this._onColor.fire([{
			type: 2,
			index: 256
		}]), !0;
	}
	restoreBgColor(e) {
		return this._onColor.fire([{
			type: 2,
			index: 257
		}]), !0;
	}
	restoreCursorColor(e) {
		return this._onColor.fire([{
			type: 2,
			index: 258
		}]), !0;
	}
	nextLine() {
		return this._activeBuffer.x = 0, this.index(), !0;
	}
	keypadApplicationMode() {
		return this._logService.debug("Serial port requested application keypad."), this._coreService.decPrivateModes.applicationKeypad = !0, this._onRequestSyncScrollBar.fire(), !0;
	}
	keypadNumericMode() {
		return this._logService.debug("Switching back to normal keypad."), this._coreService.decPrivateModes.applicationKeypad = !1, this._onRequestSyncScrollBar.fire(), !0;
	}
	selectDefaultCharset() {
		return this._charsetService.setgLevel(0), this._charsetService.setgCharset(0, bo), !0;
	}
	selectCharset(e) {
		return e.length === 2 ? (e[0] === "/" || this._charsetService.setgCharset(fs[e[0]], W[e[1]] || bo), !0) : (this.selectDefaultCharset(), !0);
	}
	index() {
		return this._restrictCursor(), this._activeBuffer.y++, this._activeBuffer.y === this._activeBuffer.scrollBottom + 1 ? (this._activeBuffer.y--, this._bufferService.scroll(this._eraseAttrData())) : this._activeBuffer.y >= this._bufferService.rows && (this._activeBuffer.y = this._bufferService.rows - 1), this._restrictCursor(), !0;
	}
	tabSet() {
		return this._activeBuffer.tabs[this._activeBuffer.x] = !0, !0;
	}
	reverseIndex() {
		if (this._restrictCursor(), this._activeBuffer.y === this._activeBuffer.scrollTop) {
			let e = this._activeBuffer.scrollBottom - this._activeBuffer.scrollTop;
			this._activeBuffer.lines.shiftElements(this._activeBuffer.ybase + this._activeBuffer.y, e, 1), this._activeBuffer.lines.set(this._activeBuffer.ybase + this._activeBuffer.y, this._activeBuffer.getBlankLine(this._eraseAttrData())), this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop, this._activeBuffer.scrollBottom);
		} else this._activeBuffer.y--, this._restrictCursor();
		return !0;
	}
	fullReset() {
		return this._parser.reset(), this._onRequestReset.fire(), !0;
	}
	reset() {
		this._curAttrData = U.clone(), this._eraseAttrDataInternal = U.clone();
	}
	_eraseAttrData() {
		return this._eraseAttrDataInternal.bg &= -67108864, this._eraseAttrDataInternal.bg |= this._curAttrData.bg & 67108863, this._eraseAttrDataInternal;
	}
	setgLevel(e) {
		return this._charsetService.setgLevel(e), !0;
	}
	screenAlignmentPattern() {
		let e = new Ve();
		e.content = 4194373, e.fg = this._curAttrData.fg, e.bg = this._curAttrData.bg, this._setCursor(0, 0);
		for (let t = 0; t < this._bufferService.rows; ++t) {
			let n = this._activeBuffer.ybase + this._activeBuffer.y + t, r = this._activeBuffer.lines.get(n);
			r && (r.fill(e), r.isWrapped = !1);
		}
		return this._dirtyRowTracker.markAllDirty(), this._setCursor(0, 0), !0;
	}
	requestStatusString(e, t) {
		let n = (e) => (this._coreService.triggerDataEvent(`${N.ESC}${e}${N.ESC}\\`), !0), r = this._bufferService.buffer, i = this._optionsService.rawOptions;
		return n(e === "\"q" ? `P1$r${+!!this._curAttrData.isProtected()}"q` : e === "\"p" ? "P1$r61;1\"p" : e === "r" ? `P1$r${r.scrollTop + 1};${r.scrollBottom + 1}r` : e === "m" ? "P1$r0m" : e === " q" ? `P1$r${{
			block: 2,
			underline: 4,
			bar: 6
		}[i.cursorStyle] - +!!i.cursorBlink} q` : "P0$r");
	}
	markRangeDirty(e, t) {
		this._dirtyRowTracker.markRangeDirty(e, t);
	}
}, ys = class {
	constructor(e) {
		this._bufferService = e, this.clearRange();
	}
	clearRange() {
		this.start = this._bufferService.buffer.y, this.end = this._bufferService.buffer.y;
	}
	markDirty(e) {
		e < this.start ? this.start = e : e > this.end && (this.end = e);
	}
	markRangeDirty(e, t) {
		e > t && (_s = e, e = t, t = _s), e < this.start && (this.start = e), t > this.end && (this.end = t);
	}
	markAllDirty() {
		this.markRangeDirty(0, this._bufferService.rows - 1);
	}
};
ys = w([T(0, qe)], ys);
function bs(e) {
	return 0 <= e && e < 256;
}
var xs = 5e7, Ss = 12, Cs = 50, ws = class extends O {
	constructor(e) {
		super(), this._action = e, this._writeBuffer = [], this._callbacks = [], this._pendingData = 0, this._bufferOffset = 0, this._isSyncWriting = !1, this._syncCalls = 0, this._didUserInput = !1, this._onWriteParsed = this._register(new A()), this.onWriteParsed = this._onWriteParsed.event;
	}
	handleUserInput() {
		this._didUserInput = !0;
	}
	writeSync(e, t) {
		if (t !== void 0 && this._syncCalls > t) {
			this._syncCalls = 0;
			return;
		}
		if (this._pendingData += e.length, this._writeBuffer.push(e), this._callbacks.push(void 0), this._syncCalls++, this._isSyncWriting) return;
		this._isSyncWriting = !0;
		let n;
		for (; n = this._writeBuffer.shift();) {
			this._action(n);
			let e = this._callbacks.shift();
			e && e();
		}
		this._pendingData = 0, this._bufferOffset = 2147483647, this._isSyncWriting = !1, this._syncCalls = 0;
	}
	write(e, t) {
		if (this._pendingData > xs) throw Error("write data discarded, use flow control to avoid losing data");
		if (!this._writeBuffer.length) {
			if (this._bufferOffset = 0, this._didUserInput) {
				this._didUserInput = !1, this._pendingData += e.length, this._writeBuffer.push(e), this._callbacks.push(t), this._innerWrite();
				return;
			}
			setTimeout(() => this._innerWrite());
		}
		this._pendingData += e.length, this._writeBuffer.push(e), this._callbacks.push(t);
	}
	_innerWrite(e = 0, t = !0) {
		let n = e || performance.now();
		for (; this._writeBuffer.length > this._bufferOffset;) {
			let e = this._writeBuffer[this._bufferOffset], r = this._action(e, t);
			if (r) {
				r.catch((e) => (queueMicrotask(() => {
					throw e;
				}), Promise.resolve(!1))).then((e) => performance.now() - n >= Ss ? setTimeout(() => this._innerWrite(0, e)) : this._innerWrite(n, e));
				return;
			}
			let i = this._callbacks[this._bufferOffset];
			if (i && i(), this._bufferOffset++, this._pendingData -= e.length, performance.now() - n >= Ss) break;
		}
		this._writeBuffer.length > this._bufferOffset ? (this._bufferOffset > Cs && (this._writeBuffer = this._writeBuffer.slice(this._bufferOffset), this._callbacks = this._callbacks.slice(this._bufferOffset), this._bufferOffset = 0), setTimeout(() => this._innerWrite())) : (this._writeBuffer.length = 0, this._callbacks.length = 0, this._pendingData = 0, this._bufferOffset = 0), this._onWriteParsed.fire();
	}
}, Ts = class {
	constructor(e) {
		this._bufferService = e, this._nextId = 1, this._entriesWithId = /* @__PURE__ */ new Map(), this._dataByLinkId = /* @__PURE__ */ new Map();
	}
	registerLink(e) {
		let t = this._bufferService.buffer;
		if (e.id === void 0) {
			let n = t.addMarker(t.ybase + t.y), r = {
				data: e,
				id: this._nextId++,
				lines: [n]
			};
			return n.onDispose(() => this._removeMarkerFromLink(r, n)), this._dataByLinkId.set(r.id, r), r.id;
		}
		let n = e, r = this._getEntryIdKey(n), i = this._entriesWithId.get(r);
		if (i) return this.addLineToLink(i.id, t.ybase + t.y), i.id;
		let a = t.addMarker(t.ybase + t.y), o = {
			id: this._nextId++,
			key: this._getEntryIdKey(n),
			data: n,
			lines: [a]
		};
		return a.onDispose(() => this._removeMarkerFromLink(o, a)), this._entriesWithId.set(o.key, o), this._dataByLinkId.set(o.id, o), o.id;
	}
	addLineToLink(e, t) {
		let n = this._dataByLinkId.get(e);
		if (n && n.lines.every((e) => e.line !== t)) {
			let e = this._bufferService.buffer.addMarker(t);
			n.lines.push(e), e.onDispose(() => this._removeMarkerFromLink(n, e));
		}
	}
	getLinkData(e) {
		return this._dataByLinkId.get(e)?.data;
	}
	_getEntryIdKey(e) {
		return `${e.id};;${e.uri}`;
	}
	_removeMarkerFromLink(e, t) {
		let n = e.lines.indexOf(t);
		n !== -1 && (e.lines.splice(n, 1), e.lines.length === 0 && (e.data.id !== void 0 && this._entriesWithId.delete(e.key), this._dataByLinkId.delete(e.id)));
	}
};
Ts = w([T(0, qe)], Ts);
var Es = !1, Ds = class extends O {
	constructor(e) {
		super(), this._windowsWrappingHeuristics = this._register(new Ft()), this._onBinary = this._register(new A()), this.onBinary = this._onBinary.event, this._onData = this._register(new A()), this.onData = this._onData.event, this._onLineFeed = this._register(new A()), this.onLineFeed = this._onLineFeed.event, this._onResize = this._register(new A()), this.onResize = this._onResize.event, this._onWriteParsed = this._register(new A()), this.onWriteParsed = this._onWriteParsed.event, this._onScroll = this._register(new A()), this._instantiationService = new ro(), this.optionsService = this._register(new ko(e)), this._instantiationService.setService($e, this.optionsService), this._bufferService = this._register(this._instantiationService.createInstance(Eo)), this._instantiationService.setService(qe, this._bufferService), this._logService = this._register(this._instantiationService.createInstance(oo)), this._instantiationService.setService(Qe, this._logService), this.coreService = this._register(this._instantiationService.createInstance(Po)), this._instantiationService.setService(Ye, this.coreService), this.coreMouseService = this._register(this._instantiationService.createInstance(zo)), this._instantiationService.setService(Je, this.coreMouseService), this.unicodeService = this._register(this._instantiationService.createInstance(Wo)), this._instantiationService.setService(tt, this.unicodeService), this._charsetService = this._instantiationService.createInstance(Go), this._instantiationService.setService(Xe, this._charsetService), this._oscLinkService = this._instantiationService.createInstance(Ts), this._instantiationService.setService(et, this._oscLinkService), this._inputHandler = this._register(new vs(this._bufferService, this._charsetService, this.coreService, this._logService, this.optionsService, this._oscLinkService, this.coreMouseService, this.unicodeService)), this._register(Vt.forward(this._inputHandler.onLineFeed, this._onLineFeed)), this._register(this._inputHandler), this._register(Vt.forward(this._bufferService.onResize, this._onResize)), this._register(Vt.forward(this.coreService.onData, this._onData)), this._register(Vt.forward(this.coreService.onBinary, this._onBinary)), this._register(this.coreService.onRequestScrollToBottom(() => this.scrollToBottom(!0))), this._register(this.coreService.onUserInput(() => this._writeBuffer.handleUserInput())), this._register(this.optionsService.onMultipleOptionChange(["windowsMode", "windowsPty"], () => this._handleWindowsPtyOptionChange())), this._register(this._bufferService.onScroll(() => {
			this._onScroll.fire({ position: this._bufferService.buffer.ydisp }), this._inputHandler.markRangeDirty(this._bufferService.buffer.scrollTop, this._bufferService.buffer.scrollBottom);
		})), this._writeBuffer = this._register(new ws((e, t) => this._inputHandler.parse(e, t))), this._register(Vt.forward(this._writeBuffer.onWriteParsed, this._onWriteParsed));
	}
	get onScroll() {
		return this._onScrollApi || (this._onScrollApi = this._register(new A()), this._onScroll.event((e) => {
			this._onScrollApi?.fire(e.position);
		})), this._onScrollApi.event;
	}
	get cols() {
		return this._bufferService.cols;
	}
	get rows() {
		return this._bufferService.rows;
	}
	get buffers() {
		return this._bufferService.buffers;
	}
	get options() {
		return this.optionsService.options;
	}
	set options(e) {
		for (let t in e) this.optionsService.options[t] = e[t];
	}
	write(e, t) {
		this._writeBuffer.write(e, t);
	}
	writeSync(e, t) {
		this._logService.logLevel <= 3 && !Es && (this._logService.warn("writeSync is unreliable and will be removed soon."), Es = !0), this._writeBuffer.writeSync(e, t);
	}
	input(e, t = !0) {
		this.coreService.triggerDataEvent(e, t);
	}
	resize(e, t) {
		isNaN(e) || isNaN(t) || (e = Math.max(e, wo), t = Math.max(t, To), this._bufferService.resize(e, t));
	}
	scroll(e, t = !1) {
		this._bufferService.scroll(e, t);
	}
	scrollLines(e, t) {
		this._bufferService.scrollLines(e, t);
	}
	scrollPages(e) {
		this.scrollLines(e * (this.rows - 1));
	}
	scrollToTop() {
		this.scrollLines(-this._bufferService.buffer.ydisp);
	}
	scrollToBottom(e) {
		this.scrollLines(this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
	}
	scrollToLine(e) {
		let t = e - this._bufferService.buffer.ydisp;
		t !== 0 && this.scrollLines(t);
	}
	registerEscHandler(e, t) {
		return this._inputHandler.registerEscHandler(e, t);
	}
	registerDcsHandler(e, t) {
		return this._inputHandler.registerDcsHandler(e, t);
	}
	registerCsiHandler(e, t) {
		return this._inputHandler.registerCsiHandler(e, t);
	}
	registerOscHandler(e, t) {
		return this._inputHandler.registerOscHandler(e, t);
	}
	_setup() {
		this._handleWindowsPtyOptionChange();
	}
	reset() {
		this._inputHandler.reset(), this._bufferService.reset(), this._charsetService.reset(), this.coreService.reset(), this.coreMouseService.reset();
	}
	_handleWindowsPtyOptionChange() {
		let e = !1, t = this.optionsService.rawOptions.windowsPty;
		t && t.buildNumber !== void 0 && t.buildNumber !== void 0 ? e = t.backend === "conpty" && t.buildNumber < 21376 : this.optionsService.rawOptions.windowsMode && (e = !0), e ? this._enableWindowsWrappingHeuristics() : this._windowsWrappingHeuristics.clear();
	}
	_enableWindowsWrappingHeuristics() {
		if (!this._windowsWrappingHeuristics.value) {
			let e = [];
			e.push(this.onLineFeed(Ko.bind(null, this._bufferService))), e.push(this.registerCsiHandler({ final: "H" }, () => (Ko(this._bufferService), !1))), this._windowsWrappingHeuristics.value = D(() => {
				for (let t of e) t.dispose();
			});
		}
	}
}, Os = {
	48: ["0", ")"],
	49: ["1", "!"],
	50: ["2", "@"],
	51: ["3", "#"],
	52: ["4", "$"],
	53: ["5", "%"],
	54: ["6", "^"],
	55: ["7", "&"],
	56: ["8", "*"],
	57: ["9", "("],
	186: [";", ":"],
	187: ["=", "+"],
	188: [",", "<"],
	189: ["-", "_"],
	190: [".", ">"],
	191: ["/", "?"],
	192: ["`", "~"],
	219: ["[", "{"],
	220: ["\\", "|"],
	221: ["]", "}"],
	222: ["'", "\""]
};
function ks(e, t, n, r) {
	let i = {
		type: 0,
		cancel: !1,
		key: void 0
	}, a = +!!e.shiftKey | (e.altKey ? 2 : 0) | (e.ctrlKey ? 4 : 0) | (e.metaKey ? 8 : 0);
	switch (e.keyCode) {
		case 0:
			e.key === "UIKeyInputUpArrow" ? i.key = t ? N.ESC + "OA" : N.ESC + "[A" : e.key === "UIKeyInputLeftArrow" ? i.key = t ? N.ESC + "OD" : N.ESC + "[D" : e.key === "UIKeyInputRightArrow" ? i.key = t ? N.ESC + "OC" : N.ESC + "[C" : e.key === "UIKeyInputDownArrow" && (i.key = t ? N.ESC + "OB" : N.ESC + "[B");
			break;
		case 8:
			i.key = e.ctrlKey ? "\b" : N.DEL, e.altKey && (i.key = N.ESC + i.key);
			break;
		case 9:
			if (e.shiftKey) {
				i.key = N.ESC + "[Z";
				break;
			}
			i.key = N.HT, i.cancel = !0;
			break;
		case 13:
			i.key = e.altKey ? N.ESC + N.CR : N.CR, i.cancel = !0;
			break;
		case 27:
			i.key = N.ESC, e.altKey && (i.key = N.ESC + N.ESC), i.cancel = !0;
			break;
		case 37:
			if (e.metaKey) break;
			i.key = a ? N.ESC + "[1;" + (a + 1) + "D" : t ? N.ESC + "OD" : N.ESC + "[D";
			break;
		case 39:
			if (e.metaKey) break;
			i.key = a ? N.ESC + "[1;" + (a + 1) + "C" : t ? N.ESC + "OC" : N.ESC + "[C";
			break;
		case 38:
			if (e.metaKey) break;
			i.key = a ? N.ESC + "[1;" + (a + 1) + "A" : t ? N.ESC + "OA" : N.ESC + "[A";
			break;
		case 40:
			if (e.metaKey) break;
			i.key = a ? N.ESC + "[1;" + (a + 1) + "B" : t ? N.ESC + "OB" : N.ESC + "[B";
			break;
		case 45:
			!e.shiftKey && !e.ctrlKey && (i.key = N.ESC + "[2~");
			break;
		case 46:
			i.key = a ? N.ESC + "[3;" + (a + 1) + "~" : N.ESC + "[3~";
			break;
		case 36:
			i.key = a ? N.ESC + "[1;" + (a + 1) + "H" : t ? N.ESC + "OH" : N.ESC + "[H";
			break;
		case 35:
			i.key = a ? N.ESC + "[1;" + (a + 1) + "F" : t ? N.ESC + "OF" : N.ESC + "[F";
			break;
		case 33:
			e.shiftKey ? i.type = 2 : i.key = e.ctrlKey ? N.ESC + "[5;" + (a + 1) + "~" : N.ESC + "[5~";
			break;
		case 34:
			e.shiftKey ? i.type = 3 : i.key = e.ctrlKey ? N.ESC + "[6;" + (a + 1) + "~" : N.ESC + "[6~";
			break;
		case 112:
			i.key = a ? N.ESC + "[1;" + (a + 1) + "P" : N.ESC + "OP";
			break;
		case 113:
			i.key = a ? N.ESC + "[1;" + (a + 1) + "Q" : N.ESC + "OQ";
			break;
		case 114:
			i.key = a ? N.ESC + "[1;" + (a + 1) + "R" : N.ESC + "OR";
			break;
		case 115:
			i.key = a ? N.ESC + "[1;" + (a + 1) + "S" : N.ESC + "OS";
			break;
		case 116:
			i.key = a ? N.ESC + "[15;" + (a + 1) + "~" : N.ESC + "[15~";
			break;
		case 117:
			i.key = a ? N.ESC + "[17;" + (a + 1) + "~" : N.ESC + "[17~";
			break;
		case 118:
			i.key = a ? N.ESC + "[18;" + (a + 1) + "~" : N.ESC + "[18~";
			break;
		case 119:
			i.key = a ? N.ESC + "[19;" + (a + 1) + "~" : N.ESC + "[19~";
			break;
		case 120:
			i.key = a ? N.ESC + "[20;" + (a + 1) + "~" : N.ESC + "[20~";
			break;
		case 121:
			i.key = a ? N.ESC + "[21;" + (a + 1) + "~" : N.ESC + "[21~";
			break;
		case 122:
			i.key = a ? N.ESC + "[23;" + (a + 1) + "~" : N.ESC + "[23~";
			break;
		case 123:
			i.key = a ? N.ESC + "[24;" + (a + 1) + "~" : N.ESC + "[24~";
			break;
		default: if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) e.keyCode >= 65 && e.keyCode <= 90 ? i.key = String.fromCharCode(e.keyCode - 64) : e.keyCode === 32 ? i.key = N.NUL : e.keyCode >= 51 && e.keyCode <= 55 ? i.key = String.fromCharCode(e.keyCode - 51 + 27) : e.keyCode === 56 ? i.key = N.DEL : e.keyCode === 219 ? i.key = N.ESC : e.keyCode === 220 ? i.key = N.FS : e.keyCode === 221 && (i.key = N.GS);
		else if ((!n || r) && e.altKey && !e.metaKey) {
			let t = Os[e.keyCode]?.[+!!e.shiftKey];
			if (t) i.key = N.ESC + t;
			else if (e.keyCode >= 65 && e.keyCode <= 90) {
				let t = e.ctrlKey ? e.keyCode - 64 : e.keyCode + 32, n = String.fromCharCode(t);
				e.shiftKey && (n = n.toUpperCase()), i.key = N.ESC + n;
			} else if (e.keyCode === 32) i.key = N.ESC + (e.ctrlKey ? N.NUL : " ");
			else if (e.key === "Dead" && e.code.startsWith("Key")) {
				let t = e.code.slice(3, 4);
				e.shiftKey || (t = t.toLowerCase()), i.key = N.ESC + t, i.cancel = !0;
			}
		} else n && !e.altKey && !e.ctrlKey && !e.shiftKey && e.metaKey ? e.keyCode === 65 && (i.type = 1) : e.key && !e.ctrlKey && !e.altKey && !e.metaKey && e.keyCode >= 48 && e.key.length === 1 ? i.key = e.key : e.key && e.ctrlKey && (e.key === "_" && (i.key = N.US), e.key === "@" && (i.key = N.NUL));
	}
	return i;
}
var K = 0, As = class {
	constructor(e) {
		this._getKey = e, this._array = [], this._insertedValues = [], this._flushInsertedTask = new Sa(), this._isFlushingInserted = !1, this._deletedIndices = [], this._flushDeletedTask = new Sa(), this._isFlushingDeleted = !1;
	}
	clear() {
		this._array.length = 0, this._insertedValues.length = 0, this._flushInsertedTask.clear(), this._isFlushingInserted = !1, this._deletedIndices.length = 0, this._flushDeletedTask.clear(), this._isFlushingDeleted = !1;
	}
	insert(e) {
		this._flushCleanupDeleted(), this._insertedValues.length === 0 && this._flushInsertedTask.enqueue(() => this._flushInserted()), this._insertedValues.push(e);
	}
	_flushInserted() {
		let e = this._insertedValues.sort((e, t) => this._getKey(e) - this._getKey(t)), t = 0, n = 0, r = Array(this._array.length + this._insertedValues.length);
		for (let i = 0; i < r.length; i++) n >= this._array.length || this._getKey(e[t]) <= this._getKey(this._array[n]) ? (r[i] = e[t], t++) : r[i] = this._array[n++];
		this._array = r, this._insertedValues.length = 0;
	}
	_flushCleanupInserted() {
		!this._isFlushingInserted && this._insertedValues.length > 0 && this._flushInsertedTask.flush();
	}
	delete(e) {
		if (this._flushCleanupInserted(), this._array.length === 0) return !1;
		let t = this._getKey(e);
		if (t === void 0 || (K = this._search(t), K === -1) || this._getKey(this._array[K]) !== t) return !1;
		do
			if (this._array[K] === e) return this._deletedIndices.length === 0 && this._flushDeletedTask.enqueue(() => this._flushDeleted()), this._deletedIndices.push(K), !0;
		while (++K < this._array.length && this._getKey(this._array[K]) === t);
		return !1;
	}
	_flushDeleted() {
		this._isFlushingDeleted = !0;
		let e = this._deletedIndices.sort((e, t) => e - t), t = 0, n = Array(this._array.length - e.length), r = 0;
		for (let i = 0; i < this._array.length; i++) e[t] === i ? t++ : n[r++] = this._array[i];
		this._array = n, this._deletedIndices.length = 0, this._isFlushingDeleted = !1;
	}
	_flushCleanupDeleted() {
		!this._isFlushingDeleted && this._deletedIndices.length > 0 && this._flushDeletedTask.flush();
	}
	*getKeyIterator(e) {
		if (this._flushCleanupInserted(), this._flushCleanupDeleted(), this._array.length !== 0 && (K = this._search(e), !(K < 0 || K >= this._array.length) && this._getKey(this._array[K]) === e)) do
			yield this._array[K];
		while (++K < this._array.length && this._getKey(this._array[K]) === e);
	}
	forEachByKey(e, t) {
		if (this._flushCleanupInserted(), this._flushCleanupDeleted(), this._array.length !== 0 && (K = this._search(e), !(K < 0 || K >= this._array.length) && this._getKey(this._array[K]) === e)) do
			t(this._array[K]);
		while (++K < this._array.length && this._getKey(this._array[K]) === e);
	}
	values() {
		return this._flushCleanupInserted(), this._flushCleanupDeleted(), [...this._array].values();
	}
	_search(e) {
		let t = 0, n = this._array.length - 1;
		for (; n >= t;) {
			let r = t + n >> 1, i = this._getKey(this._array[r]);
			if (i > e) n = r - 1;
			else if (i < e) t = r + 1;
			else {
				for (; r > 0 && this._getKey(this._array[r - 1]) === e;) r--;
				return r;
			}
		}
		return t;
	}
}, js = 0, Ms = 0, Ns = class extends O {
	constructor() {
		super(), this._decorations = new As((e) => e?.marker.line), this._onDecorationRegistered = this._register(new A()), this.onDecorationRegistered = this._onDecorationRegistered.event, this._onDecorationRemoved = this._register(new A()), this.onDecorationRemoved = this._onDecorationRemoved.event, this._register(D(() => this.reset()));
	}
	get decorations() {
		return this._decorations.values();
	}
	registerDecoration(e) {
		if (e.marker.isDisposed) return;
		let t = new Ps(e);
		if (t) {
			let e = t.marker.onDispose(() => t.dispose()), n = t.onDispose(() => {
				n.dispose(), t && (this._decorations.delete(t) && this._onDecorationRemoved.fire(t), e.dispose());
			});
			this._decorations.insert(t), this._onDecorationRegistered.fire(t);
		}
		return t;
	}
	reset() {
		for (let e of this._decorations.values()) e.dispose();
		this._decorations.clear();
	}
	*getDecorationsAtCell(e, t, n) {
		let r = 0, i = 0;
		for (let a of this._decorations.getKeyIterator(t)) r = a.options.x ?? 0, i = r + (a.options.width ?? 1), e >= r && e < i && (!n || (a.options.layer ?? "bottom") === n) && (yield a);
	}
	forEachDecorationAtCell(e, t, n, r) {
		this._decorations.forEachByKey(t, (t) => {
			js = t.options.x ?? 0, Ms = js + (t.options.width ?? 1), e >= js && e < Ms && (!n || (t.options.layer ?? "bottom") === n) && r(t);
		});
	}
}, Ps = class extends Pt {
	constructor(e) {
		super(), this.options = e, this.onRenderEmitter = this.add(new A()), this.onRender = this.onRenderEmitter.event, this._onDispose = this.add(new A()), this.onDispose = this._onDispose.event, this._cachedBg = null, this._cachedFg = null, this.marker = e.marker, this.options.overviewRulerOptions && !this.options.overviewRulerOptions.position && (this.options.overviewRulerOptions.position = "full");
	}
	get backgroundColorRGB() {
		return this._cachedBg === null && (this._cachedBg = this.options.backgroundColor ? z.toColor(this.options.backgroundColor) : void 0), this._cachedBg;
	}
	get foregroundColorRGB() {
		return this._cachedFg === null && (this._cachedFg = this.options.foregroundColor ? z.toColor(this.options.foregroundColor) : void 0), this._cachedFg;
	}
	dispose() {
		this._onDispose.fire(), super.dispose();
	}
}, Fs = 1e3, Is = class {
	constructor(e, t = Fs) {
		this._renderCallback = e, this._debounceThresholdMS = t, this._lastRefreshMs = 0, this._additionalRefreshRequested = !1;
	}
	dispose() {
		this._refreshTimeoutID && clearTimeout(this._refreshTimeoutID);
	}
	refresh(e, t, n) {
		this._rowCount = n, e = e === void 0 ? 0 : e, t = t === void 0 ? this._rowCount - 1 : t, this._rowStart = this._rowStart === void 0 ? e : Math.min(this._rowStart, e), this._rowEnd = this._rowEnd === void 0 ? t : Math.max(this._rowEnd, t);
		let r = performance.now();
		if (r - this._lastRefreshMs >= this._debounceThresholdMS) this._lastRefreshMs = r, this._innerRefresh();
		else if (!this._additionalRefreshRequested) {
			let e = r - this._lastRefreshMs, t = this._debounceThresholdMS - e;
			this._additionalRefreshRequested = !0, this._refreshTimeoutID = window.setTimeout(() => {
				this._lastRefreshMs = performance.now(), this._innerRefresh(), this._additionalRefreshRequested = !1, this._refreshTimeoutID = void 0;
			}, t);
		}
	}
	_innerRefresh() {
		if (this._rowStart === void 0 || this._rowEnd === void 0 || this._rowCount === void 0) return;
		let e = Math.max(this._rowStart, 0), t = Math.min(this._rowEnd, this._rowCount - 1);
		this._rowStart = void 0, this._rowEnd = void 0, this._renderCallback(e, t);
	}
}, Ls = 20, Rs = class extends O {
	constructor(e, t, n, r) {
		super(), this._terminal = e, this._coreBrowserService = n, this._renderService = r, this._rowColumns = /* @__PURE__ */ new WeakMap(), this._liveRegionLineCount = 0, this._charsToConsume = [], this._charsToAnnounce = "";
		let i = this._coreBrowserService.mainDocument;
		this._accessibilityContainer = i.createElement("div"), this._accessibilityContainer.classList.add("xterm-accessibility"), this._rowContainer = i.createElement("div"), this._rowContainer.setAttribute("role", "list"), this._rowContainer.classList.add("xterm-accessibility-tree"), this._rowElements = [];
		for (let e = 0; e < this._terminal.rows; e++) this._rowElements[e] = this._createAccessibilityTreeNode(), this._rowContainer.appendChild(this._rowElements[e]);
		if (this._topBoundaryFocusListener = (e) => this._handleBoundaryFocus(e, 0), this._bottomBoundaryFocusListener = (e) => this._handleBoundaryFocus(e, 1), this._rowElements[0].addEventListener("focus", this._topBoundaryFocusListener), this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._accessibilityContainer.appendChild(this._rowContainer), this._liveRegion = i.createElement("div"), this._liveRegion.classList.add("live-region"), this._liveRegion.setAttribute("aria-live", "assertive"), this._accessibilityContainer.appendChild(this._liveRegion), this._liveRegionDebouncer = this._register(new Is(this._renderRows.bind(this))), !this._terminal.element) throw Error("Cannot enable accessibility before Terminal.open");
		this._terminal.element.insertAdjacentElement("afterbegin", this._accessibilityContainer), this._register(this._terminal.onResize((e) => this._handleResize(e.rows))), this._register(this._terminal.onRender((e) => this._refreshRows(e.start, e.end))), this._register(this._terminal.onScroll(() => this._refreshRows())), this._register(this._terminal.onA11yChar((e) => this._handleChar(e))), this._register(this._terminal.onLineFeed(() => this._handleChar("\n"))), this._register(this._terminal.onA11yTab((e) => this._handleTab(e))), this._register(this._terminal.onKey((e) => this._handleKey(e.key))), this._register(this._terminal.onBlur(() => this._clearLiveRegion())), this._register(this._renderService.onDimensionsChange(() => this._refreshRowsDimensions())), this._register(j(i, "selectionchange", () => this._handleSelectionChange())), this._register(this._coreBrowserService.onDprChange(() => this._refreshRowsDimensions())), this._refreshRowsDimensions(), this._refreshRows(), this._register(D(() => {
			this._accessibilityContainer.remove(), this._rowElements.length = 0;
		}));
	}
	_handleTab(e) {
		for (let t = 0; t < e; t++) this._handleChar(" ");
	}
	_handleChar(e) {
		this._liveRegionLineCount < Ls + 1 && (this._charsToConsume.length > 0 ? this._charsToConsume.shift() !== e && (this._charsToAnnounce += e) : this._charsToAnnounce += e, e === "\n" && (this._liveRegionLineCount++, this._liveRegionLineCount === Ls + 1 && (this._liveRegion.textContent += Te.get())));
	}
	_clearLiveRegion() {
		this._liveRegion.textContent = "", this._liveRegionLineCount = 0;
	}
	_handleKey(e) {
		this._clearLiveRegion(), /\p{Control}/u.test(e) || this._charsToConsume.push(e);
	}
	_refreshRows(e, t) {
		this._liveRegionDebouncer.refresh(e, t, this._terminal.rows);
	}
	_renderRows(e, t) {
		let n = this._terminal.buffer, r = n.lines.length.toString();
		for (let i = e; i <= t; i++) {
			let e = n.lines.get(n.ydisp + i), t = [], a = e?.translateToString(!0, void 0, void 0, t) || "", o = (n.ydisp + i + 1).toString(), s = this._rowElements[i];
			s && (a.length === 0 ? (s.textContent = "\xA0", this._rowColumns.set(s, [0, 1])) : (s.textContent = a, this._rowColumns.set(s, t)), s.setAttribute("aria-posinset", o), s.setAttribute("aria-setsize", r), this._alignRowWidth(s));
		}
		this._announceCharacters();
	}
	_announceCharacters() {
		this._charsToAnnounce.length !== 0 && (this._liveRegion.textContent += this._charsToAnnounce, this._charsToAnnounce = "");
	}
	_handleBoundaryFocus(e, t) {
		let n = e.target, r = this._rowElements[t === 0 ? 1 : this._rowElements.length - 2];
		if (n.getAttribute("aria-posinset") === (t === 0 ? "1" : `${this._terminal.buffer.lines.length}`) || e.relatedTarget !== r) return;
		let i, a;
		if (t === 0 ? (i = n, a = this._rowElements.pop(), this._rowContainer.removeChild(a)) : (i = this._rowElements.shift(), a = n, this._rowContainer.removeChild(i)), i.removeEventListener("focus", this._topBoundaryFocusListener), a.removeEventListener("focus", this._bottomBoundaryFocusListener), t === 0) {
			let e = this._createAccessibilityTreeNode();
			this._rowElements.unshift(e), this._rowContainer.insertAdjacentElement("afterbegin", e);
		} else {
			let e = this._createAccessibilityTreeNode();
			this._rowElements.push(e), this._rowContainer.appendChild(e);
		}
		this._rowElements[0].addEventListener("focus", this._topBoundaryFocusListener), this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._terminal.scrollLines(t === 0 ? -1 : 1), this._rowElements[t === 0 ? 1 : this._rowElements.length - 2].focus(), e.preventDefault(), e.stopImmediatePropagation();
	}
	_handleSelectionChange() {
		if (this._rowElements.length === 0) return;
		let e = this._coreBrowserService.mainDocument.getSelection();
		if (!e) return;
		if (e.isCollapsed) {
			this._rowContainer.contains(e.anchorNode) && this._terminal.clearSelection();
			return;
		}
		if (!e.anchorNode || !e.focusNode) {
			console.error("anchorNode and/or focusNode are null");
			return;
		}
		let t = {
			node: e.anchorNode,
			offset: e.anchorOffset
		}, n = {
			node: e.focusNode,
			offset: e.focusOffset
		};
		if ((t.node.compareDocumentPosition(n.node) & Node.DOCUMENT_POSITION_PRECEDING || t.node === n.node && t.offset > n.offset) && ([t, n] = [n, t]), t.node.compareDocumentPosition(this._rowElements[0]) & (Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING) && (t = {
			node: this._rowElements[0].childNodes[0],
			offset: 0
		}), !this._rowContainer.contains(t.node)) return;
		let r = this._rowElements.slice(-1)[0];
		if (n.node.compareDocumentPosition(r) & (Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_PRECEDING) && (n = {
			node: r,
			offset: r.textContent?.length ?? 0
		}), !this._rowContainer.contains(n.node)) return;
		let i = ({ node: e, offset: t }) => {
			let n = e instanceof Text ? e.parentNode : e, r = parseInt(n?.getAttribute("aria-posinset"), 10) - 1;
			if (isNaN(r)) return console.warn("row is invalid. Race condition?"), null;
			let i = this._rowColumns.get(n);
			if (!i) return console.warn("columns is null. Race condition?"), null;
			let a = t < i.length ? i[t] : i.slice(-1)[0] + 1;
			return a >= this._terminal.cols && (++r, a = 0), {
				row: r,
				column: a
			};
		}, a = i(t), o = i(n);
		if (a && o) {
			if (a.row > o.row || a.row === o.row && a.column >= o.column) throw Error("invalid range");
			this._terminal.select(a.column, a.row, (o.row - a.row) * this._terminal.cols - a.column + o.column);
		}
	}
	_handleResize(e) {
		this._rowElements[this._rowElements.length - 1].removeEventListener("focus", this._bottomBoundaryFocusListener);
		for (let e = this._rowContainer.children.length; e < this._terminal.rows; e++) this._rowElements[e] = this._createAccessibilityTreeNode(), this._rowContainer.appendChild(this._rowElements[e]);
		for (; this._rowElements.length > e;) this._rowContainer.removeChild(this._rowElements.pop());
		this._rowElements[this._rowElements.length - 1].addEventListener("focus", this._bottomBoundaryFocusListener), this._refreshRowsDimensions();
	}
	_createAccessibilityTreeNode() {
		let e = this._coreBrowserService.mainDocument.createElement("div");
		return e.setAttribute("role", "listitem"), e.tabIndex = -1, this._refreshRowDimensions(e), e;
	}
	_refreshRowsDimensions() {
		if (this._renderService.dimensions.css.cell.height) {
			Object.assign(this._accessibilityContainer.style, {
				width: `${this._renderService.dimensions.css.canvas.width}px`,
				fontSize: `${this._terminal.options.fontSize}px`
			}), this._rowElements.length !== this._terminal.rows && this._handleResize(this._terminal.rows);
			for (let e = 0; e < this._terminal.rows; e++) this._refreshRowDimensions(this._rowElements[e]), this._alignRowWidth(this._rowElements[e]);
		}
	}
	_refreshRowDimensions(e) {
		e.style.height = `${this._renderService.dimensions.css.cell.height}px`;
	}
	_alignRowWidth(e) {
		e.style.transform = "";
		let t = e.getBoundingClientRect().width, n = this._rowColumns.get(e)?.slice(-1)?.[0];
		if (!n) return;
		let r = n * this._renderService.dimensions.css.cell.width;
		e.style.transform = `scaleX(${r / t})`;
	}
};
Rs = w([
	T(1, Ze),
	T(2, ot),
	T(3, ct)
], Rs);
var zs = class extends O {
	constructor(e, t, n, r, i) {
		super(), this._element = e, this._mouseService = t, this._renderService = n, this._bufferService = r, this._linkProviderService = i, this._linkCacheDisposables = [], this._isMouseOut = !0, this._wasResized = !1, this._activeLine = -1, this._onShowLinkUnderline = this._register(new A()), this.onShowLinkUnderline = this._onShowLinkUnderline.event, this._onHideLinkUnderline = this._register(new A()), this.onHideLinkUnderline = this._onHideLinkUnderline.event, this._register(D(() => {
			jt(this._linkCacheDisposables), this._linkCacheDisposables.length = 0, this._lastMouseEvent = void 0, this._activeProviderReplies?.clear();
		})), this._register(this._bufferService.onResize(() => {
			this._clearCurrentLink(), this._wasResized = !0;
		})), this._register(j(this._element, "mouseleave", () => {
			this._isMouseOut = !0, this._clearCurrentLink();
		})), this._register(j(this._element, "mousemove", this._handleMouseMove.bind(this))), this._register(j(this._element, "mousedown", this._handleMouseDown.bind(this))), this._register(j(this._element, "mouseup", this._handleMouseUp.bind(this)));
	}
	get currentLink() {
		return this._currentLink;
	}
	_handleMouseMove(e) {
		this._lastMouseEvent = e;
		let t = this._positionFromMouseEvent(e, this._element, this._mouseService);
		if (!t) return;
		this._isMouseOut = !1;
		let n = e.composedPath();
		for (let e = 0; e < n.length; e++) {
			let t = n[e];
			if (t.classList.contains("xterm")) break;
			if (t.classList.contains("xterm-hover")) return;
		}
		this._lastBufferCell && t.x === this._lastBufferCell.x && t.y === this._lastBufferCell.y || (this._handleHover(t), this._lastBufferCell = t);
	}
	_handleHover(e) {
		this._activeLine !== e.y || this._wasResized ? (this._clearCurrentLink(), this._askForLink(e, !1), this._wasResized = !1) : this._currentLink && this._linkAtPosition(this._currentLink.link, e) || (this._clearCurrentLink(), this._askForLink(e, !0));
	}
	_askForLink(e, t) {
		this._activeProviderReplies && t || (this._activeProviderReplies?.forEach((e) => {
			e?.forEach((e) => {
				e.link.dispose && e.link.dispose();
			});
		}), this._activeProviderReplies = /* @__PURE__ */ new Map(), this._activeLine = e.y);
		let n = !1;
		for (let [r, i] of this._linkProviderService.linkProviders.entries()) t ? this._activeProviderReplies?.get(r) && (n = this._checkLinkProviderResult(r, e, n)) : i.provideLinks(e.y, (t) => {
			if (this._isMouseOut) return;
			let i = t?.map((e) => ({ link: e }));
			this._activeProviderReplies?.set(r, i), n = this._checkLinkProviderResult(r, e, n), this._activeProviderReplies?.size === this._linkProviderService.linkProviders.length && this._removeIntersectingLinks(e.y, this._activeProviderReplies);
		});
	}
	_removeIntersectingLinks(e, t) {
		let n = /* @__PURE__ */ new Set();
		for (let r = 0; r < t.size; r++) {
			let i = t.get(r);
			if (i) for (let t = 0; t < i.length; t++) {
				let r = i[t], a = r.link.range.start.y < e ? 0 : r.link.range.start.x, o = r.link.range.end.y > e ? this._bufferService.cols : r.link.range.end.x;
				for (let e = a; e <= o; e++) {
					if (n.has(e)) {
						i.splice(t--, 1);
						break;
					}
					n.add(e);
				}
			}
		}
	}
	_checkLinkProviderResult(e, t, n) {
		if (!this._activeProviderReplies) return n;
		let r = this._activeProviderReplies.get(e), i = !1;
		for (let t = 0; t < e; t++) (!this._activeProviderReplies.has(t) || this._activeProviderReplies.get(t)) && (i = !0);
		if (!i && r) {
			let e = r.find((e) => this._linkAtPosition(e.link, t));
			e && (n = !0, this._handleNewLink(e));
		}
		if (this._activeProviderReplies.size === this._linkProviderService.linkProviders.length && !n) for (let e = 0; e < this._activeProviderReplies.size; e++) {
			let r = this._activeProviderReplies.get(e)?.find((e) => this._linkAtPosition(e.link, t));
			if (r) {
				n = !0, this._handleNewLink(r);
				break;
			}
		}
		return n;
	}
	_handleMouseDown() {
		this._mouseDownLink = this._currentLink;
	}
	_handleMouseUp(e) {
		if (!this._currentLink) return;
		let t = this._positionFromMouseEvent(e, this._element, this._mouseService);
		t && this._mouseDownLink && Bs(this._mouseDownLink.link, this._currentLink.link) && this._linkAtPosition(this._currentLink.link, t) && this._currentLink.link.activate(e, this._currentLink.link.text);
	}
	_clearCurrentLink(e, t) {
		!this._currentLink || !this._lastMouseEvent || (!e || !t || this._currentLink.link.range.start.y >= e && this._currentLink.link.range.end.y <= t) && (this._linkLeave(this._element, this._currentLink.link, this._lastMouseEvent), this._currentLink = void 0, jt(this._linkCacheDisposables), this._linkCacheDisposables.length = 0);
	}
	_handleNewLink(e) {
		if (!this._lastMouseEvent) return;
		let t = this._positionFromMouseEvent(this._lastMouseEvent, this._element, this._mouseService);
		t && this._linkAtPosition(e.link, t) && (this._currentLink = e, this._currentLink.state = {
			decorations: {
				underline: e.link.decorations === void 0 || e.link.decorations.underline,
				pointerCursor: e.link.decorations === void 0 || e.link.decorations.pointerCursor
			},
			isHovered: !0
		}, this._linkHover(this._element, e.link, this._lastMouseEvent), e.link.decorations = {}, Object.defineProperties(e.link.decorations, {
			pointerCursor: {
				get: () => this._currentLink?.state?.decorations.pointerCursor,
				set: (e) => {
					this._currentLink?.state && this._currentLink.state.decorations.pointerCursor !== e && (this._currentLink.state.decorations.pointerCursor = e, this._currentLink.state.isHovered && this._element.classList.toggle("xterm-cursor-pointer", e));
				}
			},
			underline: {
				get: () => this._currentLink?.state?.decorations.underline,
				set: (t) => {
					this._currentLink?.state && this._currentLink?.state?.decorations.underline !== t && (this._currentLink.state.decorations.underline = t, this._currentLink.state.isHovered && this._fireUnderlineEvent(e.link, t));
				}
			}
		}), this._linkCacheDisposables.push(this._renderService.onRenderedViewportChange((e) => {
			if (!this._currentLink) return;
			let t = e.start === 0 ? 0 : e.start + 1 + this._bufferService.buffer.ydisp, n = this._bufferService.buffer.ydisp + 1 + e.end;
			if (this._currentLink.link.range.start.y >= t && this._currentLink.link.range.end.y <= n && (this._clearCurrentLink(t, n), this._lastMouseEvent)) {
				let e = this._positionFromMouseEvent(this._lastMouseEvent, this._element, this._mouseService);
				e && this._askForLink(e, !1);
			}
		})));
	}
	_linkHover(e, t, n) {
		this._currentLink?.state && (this._currentLink.state.isHovered = !0, this._currentLink.state.decorations.underline && this._fireUnderlineEvent(t, !0), this._currentLink.state.decorations.pointerCursor && e.classList.add("xterm-cursor-pointer")), t.hover && t.hover(n, t.text);
	}
	_fireUnderlineEvent(e, t) {
		let n = e.range, r = this._bufferService.buffer.ydisp, i = this._createLinkUnderlineEvent(n.start.x - 1, n.start.y - r - 1, n.end.x, n.end.y - r - 1, void 0);
		(t ? this._onShowLinkUnderline : this._onHideLinkUnderline).fire(i);
	}
	_linkLeave(e, t, n) {
		this._currentLink?.state && (this._currentLink.state.isHovered = !1, this._currentLink.state.decorations.underline && this._fireUnderlineEvent(t, !1), this._currentLink.state.decorations.pointerCursor && e.classList.remove("xterm-cursor-pointer")), t.leave && t.leave(n, t.text);
	}
	_linkAtPosition(e, t) {
		let n = e.range.start.y * this._bufferService.cols + e.range.start.x, r = e.range.end.y * this._bufferService.cols + e.range.end.x, i = t.y * this._bufferService.cols + t.x;
		return n <= i && i <= r;
	}
	_positionFromMouseEvent(e, t, n) {
		let r = n.getCoords(e, t, this._bufferService.cols, this._bufferService.rows);
		if (r) return {
			x: r[0],
			y: r[1] + this._bufferService.buffer.ydisp
		};
	}
	_createLinkUnderlineEvent(e, t, n, r, i) {
		return {
			x1: e,
			y1: t,
			x2: n,
			y2: r,
			cols: this._bufferService.cols,
			fg: i
		};
	}
};
zs = w([
	T(1, st),
	T(2, ct),
	T(3, qe),
	T(4, ft)
], zs);
function Bs(e, t) {
	return e.text === t.text && e.range.start.x === t.range.start.x && e.range.start.y === t.range.start.y && e.range.end.x === t.range.end.x && e.range.end.y === t.range.end.y;
}
var Vs = class extends Ds {
	constructor(e = {}) {
		super(e), this._linkifier = this._register(new Ft()), this.browser = aa, this._keyDownHandled = !1, this._keyDownSeen = !1, this._keyPressHandled = !1, this._unprocessedDeadKey = !1, this._accessibilityManager = this._register(new Ft()), this._onCursorMove = this._register(new A()), this.onCursorMove = this._onCursorMove.event, this._onKey = this._register(new A()), this.onKey = this._onKey.event, this._onRender = this._register(new A()), this.onRender = this._onRender.event, this._onSelectionChange = this._register(new A()), this.onSelectionChange = this._onSelectionChange.event, this._onTitleChange = this._register(new A()), this.onTitleChange = this._onTitleChange.event, this._onBell = this._register(new A()), this.onBell = this._onBell.event, this._onFocus = this._register(new A()), this._onBlur = this._register(new A()), this._onA11yCharEmitter = this._register(new A()), this._onA11yTabEmitter = this._register(new A()), this._onWillOpen = this._register(new A()), this._setup(), this._decorationService = this._instantiationService.createInstance(Ns), this._instantiationService.setService(nt, this._decorationService), this._linkProviderService = this._instantiationService.createInstance(ea), this._instantiationService.setService(ft, this._linkProviderService), this._linkProviderService.registerLinkProvider(this._instantiationService.createInstance(rt)), this._register(this._inputHandler.onRequestBell(() => this._onBell.fire())), this._register(this._inputHandler.onRequestRefreshRows((e) => this.refresh(e?.start ?? 0, e?.end ?? this.rows - 1))), this._register(this._inputHandler.onRequestSendFocus(() => this._reportFocus())), this._register(this._inputHandler.onRequestReset(() => this.reset())), this._register(this._inputHandler.onRequestWindowsOptionsReport((e) => this._reportWindowsOptions(e))), this._register(this._inputHandler.onColor((e) => this._handleColorEvent(e))), this._register(Vt.forward(this._inputHandler.onCursorMove, this._onCursorMove)), this._register(Vt.forward(this._inputHandler.onTitleChange, this._onTitleChange)), this._register(Vt.forward(this._inputHandler.onA11yChar, this._onA11yCharEmitter)), this._register(Vt.forward(this._inputHandler.onA11yTab, this._onA11yTabEmitter)), this._register(this._bufferService.onResize((e) => this._afterResize(e.cols, e.rows))), this._register(D(() => {
			this._customKeyEventHandler = void 0, this.element?.parentNode?.removeChild(this.element);
		}));
	}
	get linkifier() {
		return this._linkifier.value;
	}
	get onFocus() {
		return this._onFocus.event;
	}
	get onBlur() {
		return this._onBlur.event;
	}
	get onA11yChar() {
		return this._onA11yCharEmitter.event;
	}
	get onA11yTab() {
		return this._onA11yTabEmitter.event;
	}
	get onWillOpen() {
		return this._onWillOpen.event;
	}
	_handleColorEvent(e) {
		if (this._themeService) for (let t of e) {
			let e, n = "";
			switch (t.index) {
				case 256:
					e = "foreground", n = "10";
					break;
				case 257:
					e = "background", n = "11";
					break;
				case 258:
					e = "cursor", n = "12";
					break;
				default: e = "ansi", n = "4;" + t.index;
			}
			switch (t.type) {
				case 0:
					let r = R.toColorRGB(e === "ansi" ? this._themeService.colors.ansi[t.index] : this._themeService.colors[e]);
					this.coreService.triggerDataEvent(`${N.ESC}]${n};${ds(r)}${bi.ST}`);
					break;
				case 1:
					if (e === "ansi") this._themeService.modifyColors((e) => e.ansi[t.index] = L.toColor(...t.color));
					else {
						let n = e;
						this._themeService.modifyColors((e) => e[n] = L.toColor(...t.color));
					}
					break;
				case 2: this._themeService.restoreColor(t.index);
			}
		}
	}
	_setup() {
		super._setup(), this._customKeyEventHandler = void 0;
	}
	get buffer() {
		return this.buffers.active;
	}
	focus() {
		this.textarea && this.textarea.focus({ preventScroll: !0 });
	}
	_handleScreenReaderModeOptionChange(e) {
		e ? !this._accessibilityManager.value && this._renderService && (this._accessibilityManager.value = this._instantiationService.createInstance(Rs, this)) : this._accessibilityManager.clear();
	}
	_handleTextAreaFocus(e) {
		this.coreService.decPrivateModes.sendFocus && this.coreService.triggerDataEvent(N.ESC + "[I"), this.element.classList.add("focus"), this._showCursor(), this._onFocus.fire();
	}
	blur() {
		return this.textarea?.blur();
	}
	_handleTextAreaBlur() {
		this.textarea.value = "", this.refresh(this.buffer.y, this.buffer.y), this.coreService.decPrivateModes.sendFocus && this.coreService.triggerDataEvent(N.ESC + "[O"), this.element.classList.remove("focus"), this._onBlur.fire();
	}
	_syncTextArea() {
		if (!this.textarea || !this.buffer.isCursorInViewport || this._compositionHelper.isComposing || !this._renderService) return;
		let e = this.buffer.ybase + this.buffer.y, t = this.buffer.lines.get(e);
		if (!t) return;
		let n = Math.min(this.buffer.x, this.cols - 1), r = this._renderService.dimensions.css.cell.height, i = t.getWidth(n), a = this._renderService.dimensions.css.cell.width * i, o = this.buffer.y * this._renderService.dimensions.css.cell.height, s = n * this._renderService.dimensions.css.cell.width;
		this.textarea.style.left = s + "px", this.textarea.style.top = o + "px", this.textarea.style.width = a + "px", this.textarea.style.height = r + "px", this.textarea.style.lineHeight = r + "px", this.textarea.style.zIndex = "-5";
	}
	_initGlobal() {
		this._bindKeys(), this._register(j(this.element, "copy", (e) => {
			this.hasSelection() && Oe(e, this._selectionService);
		}));
		let e = (e) => ke(e, this.textarea, this.coreService, this.optionsService);
		this._register(j(this.textarea, "paste", e)), this._register(j(this.element, "paste", e)), la ? this._register(j(this.element, "mousedown", (e) => {
			e.button === 2 && Me(e, this.textarea, this.screenElement, this._selectionService, this.options.rightClickSelectsWord);
		})) : this._register(j(this.element, "contextmenu", (e) => {
			Me(e, this.textarea, this.screenElement, this._selectionService, this.options.rightClickSelectsWord);
		})), _a && this._register(j(this.element, "auxclick", (e) => {
			e.button === 1 && je(e, this.textarea, this.screenElement);
		}));
	}
	_bindKeys() {
		this._register(j(this.textarea, "keyup", (e) => this._keyUp(e), !0)), this._register(j(this.textarea, "keydown", (e) => this._keyDown(e), !0)), this._register(j(this.textarea, "keypress", (e) => this._keyPress(e), !0)), this._register(j(this.textarea, "compositionstart", () => this._compositionHelper.compositionstart())), this._register(j(this.textarea, "compositionupdate", (e) => this._compositionHelper.compositionupdate(e))), this._register(j(this.textarea, "compositionend", () => this._compositionHelper.compositionend())), this._register(j(this.textarea, "input", (e) => this._inputEvent(e), !0)), this._register(this.onRender(() => this._compositionHelper.updateCompositionElements()));
	}
	open(e) {
		if (!e) throw Error("Terminal requires a parent element.");
		if (e.isConnected || this._logService.debug("Terminal.open was called on an element that was not attached to the DOM"), this.element?.ownerDocument.defaultView && this._coreBrowserService) {
			this.element.ownerDocument.defaultView !== this._coreBrowserService.window && (this._coreBrowserService.window = this.element.ownerDocument.defaultView);
			return;
		}
		this._document = e.ownerDocument, this.options.documentOverride && this.options.documentOverride instanceof Document && (this._document = this.optionsService.rawOptions.documentOverride), this.element = this._document.createElement("div"), this.element.dir = "ltr", this.element.classList.add("terminal"), this.element.classList.add("xterm"), e.appendChild(this.element);
		let t = this._document.createDocumentFragment();
		this._viewportElement = this._document.createElement("div"), this._viewportElement.classList.add("xterm-viewport"), t.appendChild(this._viewportElement), this.screenElement = this._document.createElement("div"), this.screenElement.classList.add("xterm-screen"), this._register(j(this.screenElement, "mousemove", (e) => this.updateCursorStyle(e))), this._helperContainer = this._document.createElement("div"), this._helperContainer.classList.add("xterm-helpers"), this.screenElement.appendChild(this._helperContainer), t.appendChild(this.screenElement);
		let n = this.textarea = this._document.createElement("textarea");
		this.textarea.classList.add("xterm-helper-textarea"), this.textarea.setAttribute("aria-label", Ce.get()), va || this.textarea.setAttribute("aria-multiline", "false"), this.textarea.setAttribute("autocorrect", "off"), this.textarea.setAttribute("autocapitalize", "off"), this.textarea.setAttribute("spellcheck", "false"), this.textarea.tabIndex = 0, this._register(this.optionsService.onSpecificOptionChange("disableStdin", () => n.readOnly = this.optionsService.rawOptions.disableStdin)), this.textarea.readOnly = this.optionsService.rawOptions.disableStdin, this._coreBrowserService = this._register(this._instantiationService.createInstance(Qi, this.textarea, e.ownerDocument.defaultView ?? window, this._document ?? typeof window < "u" ? window.document : null)), this._instantiationService.setService(ot, this._coreBrowserService), this._register(j(this.textarea, "focus", (e) => this._handleTextAreaFocus(e))), this._register(j(this.textarea, "blur", () => this._handleTextAreaBlur())), this._helperContainer.appendChild(this.textarea), this._charSizeService = this._instantiationService.createInstance(Ji, this._document, this._helperContainer), this._instantiationService.setService(at, this._charSizeService), this._themeService = this._instantiationService.createInstance(to), this._instantiationService.setService(dt, this._themeService), this._characterJoinerService = this._instantiationService.createInstance(ki), this._instantiationService.setService(ut, this._characterJoinerService), this._renderService = this._register(this._instantiationService.createInstance(wa, this.rows, this.screenElement)), this._instantiationService.setService(ct, this._renderService), this._register(this._renderService.onRenderedViewportChange((e) => this._onRender.fire(e))), this.onResize((e) => this._renderService.resize(e.cols, e.rows)), this._compositionView = this._document.createElement("div"), this._compositionView.classList.add("composition-view"), this._compositionHelper = this._instantiationService.createInstance(xi, this.textarea, this._compositionView), this._helperContainer.appendChild(this._compositionView), this._mouseService = this._instantiationService.createInstance(ra), this._instantiationService.setService(st, this._mouseService);
		let r = this._linkifier.value = this._register(this._instantiationService.createInstance(zs, this.screenElement));
		this.element.appendChild(t);
		try {
			this._onWillOpen.fire(this.element);
		} catch {}
		this._renderService.hasRenderer() || this._renderService.setRenderer(this._createRenderer()), this._register(this.onCursorMove(() => {
			this._renderService.handleCursorMove(), this._syncTextArea();
		})), this._register(this.onResize(() => this._renderService.handleResize(this.cols, this.rows))), this._register(this.onBlur(() => this._renderService.handleBlur())), this._register(this.onFocus(() => this._renderService.handleFocus())), this._viewport = this._register(this._instantiationService.createInstance(fi, this.element, this.screenElement)), this._register(this._viewport.onRequestScrollLines((e) => {
			super.scrollLines(e, !1), this.refresh(0, this.rows - 1);
		})), this._selectionService = this._register(this._instantiationService.createInstance(Ka, this.element, this.screenElement, r)), this._instantiationService.setService(lt, this._selectionService), this._register(this._selectionService.onRequestScrollLines((e) => this.scrollLines(e.amount, e.suppressScrollEvent))), this._register(this._selectionService.onSelectionChange(() => this._onSelectionChange.fire())), this._register(this._selectionService.onRequestRedraw((e) => this._renderService.handleSelectionChanged(e.start, e.end, e.columnSelectMode))), this._register(this._selectionService.onLinuxMouseSelection((e) => {
			this.textarea.value = e, this.textarea.focus(), this.textarea.select();
		})), this._register(Vt.any(this._onScroll.event, this._inputHandler.onScroll)(() => {
			this._selectionService.refresh(), this._viewport?.queueSync();
		})), this._register(this._instantiationService.createInstance(pi, this.screenElement)), this._register(j(this.element, "mousedown", (e) => this._selectionService.handleMouseDown(e))), this.coreMouseService.areMouseEventsActive ? (this._selectionService.disable(), this.element.classList.add("enable-mouse-events")) : this._selectionService.enable(), this.options.screenReaderMode && (this._accessibilityManager.value = this._instantiationService.createInstance(Rs, this)), this._register(this.optionsService.onSpecificOptionChange("screenReaderMode", (e) => this._handleScreenReaderModeOptionChange(e))), this.options.overviewRuler.width && (this._overviewRulerRenderer = this._register(this._instantiationService.createInstance(vi, this._viewportElement, this.screenElement))), this.optionsService.onSpecificOptionChange("overviewRuler", (e) => {
			!this._overviewRulerRenderer && e && this._viewportElement && this.screenElement && (this._overviewRulerRenderer = this._register(this._instantiationService.createInstance(vi, this._viewportElement, this.screenElement)));
		}), this._charSizeService.measure(), this.refresh(0, this.rows - 1), this._initGlobal(), this.bindMouse();
	}
	_createRenderer() {
		return this._instantiationService.createInstance(qi, this, this._document, this.element, this.screenElement, this._viewportElement, this._helperContainer, this.linkifier);
	}
	bindMouse() {
		let e = this, t = this.element;
		function n(t) {
			let n = e._mouseService.getMouseReportCoords(t, e.screenElement);
			if (!n) return !1;
			let r, i;
			switch (t.overrideType || t.type) {
				case "mousemove":
					i = 32, t.buttons === void 0 ? (r = 3, t.button !== void 0 && (r = t.button < 3 ? t.button : 3)) : r = t.buttons & 1 ? 0 : t.buttons & 4 ? 1 : t.buttons & 2 ? 2 : 3;
					break;
				case "mouseup":
					i = 0, r = t.button < 3 ? t.button : 3;
					break;
				case "mousedown":
					i = 1, r = t.button < 3 ? t.button : 3;
					break;
				case "wheel":
					if (e._customWheelEventHandler && e._customWheelEventHandler(t) === !1) return !1;
					let n = t.deltaY;
					if (n === 0 || e.coreMouseService.consumeWheelEvent(t, e._renderService?.dimensions?.device?.cell?.height, e._coreBrowserService?.dpr) === 0) return !1;
					i = n < 0 ? 0 : 1, r = 4;
					break;
				default: return !1;
			}
			return i === void 0 || r === void 0 || r > 4 ? !1 : e.coreMouseService.triggerMouseEvent({
				col: n.col,
				row: n.row,
				x: n.x,
				y: n.y,
				button: r,
				action: i,
				ctrl: t.ctrlKey,
				alt: t.altKey,
				shift: t.shiftKey
			});
		}
		let r = {
			mouseup: null,
			wheel: null,
			mousedrag: null,
			mousemove: null
		}, i = {
			mouseup: (e) => (n(e), e.buttons || (this._document.removeEventListener("mouseup", r.mouseup), r.mousedrag && this._document.removeEventListener("mousemove", r.mousedrag)), this.cancel(e)),
			wheel: (e) => (n(e), this.cancel(e, !0)),
			mousedrag: (e) => {
				e.buttons && n(e);
			},
			mousemove: (e) => {
				e.buttons || n(e);
			}
		};
		this._register(this.coreMouseService.onProtocolChange((e) => {
			e ? (this.optionsService.rawOptions.logLevel === "debug" && this._logService.debug("Binding to mouse events:", this.coreMouseService.explainEvents(e)), this.element.classList.add("enable-mouse-events"), this._selectionService.disable()) : (this._logService.debug("Unbinding from mouse events."), this.element.classList.remove("enable-mouse-events"), this._selectionService.enable()), e & 8 ? r.mousemove ||= (t.addEventListener("mousemove", i.mousemove), i.mousemove) : (t.removeEventListener("mousemove", r.mousemove), r.mousemove = null), e & 16 ? r.wheel ||= (t.addEventListener("wheel", i.wheel, { passive: !1 }), i.wheel) : (t.removeEventListener("wheel", r.wheel), r.wheel = null), e & 2 ? r.mouseup ||= i.mouseup : (this._document.removeEventListener("mouseup", r.mouseup), r.mouseup = null), e & 4 ? r.mousedrag ||= i.mousedrag : (this._document.removeEventListener("mousemove", r.mousedrag), r.mousedrag = null);
		})), this.coreMouseService.activeProtocol = this.coreMouseService.activeProtocol, this._register(j(t, "mousedown", (e) => {
			if (e.preventDefault(), this.focus(), this.coreMouseService.areMouseEventsActive && !this._selectionService.shouldForceSelection(e)) return n(e), r.mouseup && this._document.addEventListener("mouseup", r.mouseup), r.mousedrag && this._document.addEventListener("mousemove", r.mousedrag), this.cancel(e);
		})), this._register(j(t, "wheel", (t) => {
			if (!r.wheel) {
				if (this._customWheelEventHandler && this._customWheelEventHandler(t) === !1) return !1;
				if (!this.buffer.hasScrollback) {
					if (t.deltaY === 0) return !1;
					if (e.coreMouseService.consumeWheelEvent(t, e._renderService?.dimensions?.device?.cell?.height, e._coreBrowserService?.dpr) === 0) return this.cancel(t, !0);
					let n = N.ESC + (this.coreService.decPrivateModes.applicationCursorKeys ? "O" : "[") + (t.deltaY < 0 ? "A" : "B");
					return this.coreService.triggerDataEvent(n, !0), this.cancel(t, !0);
				}
			}
		}, { passive: !1 }));
	}
	refresh(e, t) {
		this._renderService?.refreshRows(e, t);
	}
	updateCursorStyle(e) {
		this._selectionService?.shouldColumnSelect(e) ? this.element.classList.add("column-select") : this.element.classList.remove("column-select");
	}
	_showCursor() {
		this.coreService.isCursorInitialized || (this.coreService.isCursorInitialized = !0, this.refresh(this.buffer.y, this.buffer.y));
	}
	scrollLines(e, t) {
		this._viewport ? this._viewport.scrollLines(e) : super.scrollLines(e, t), this.refresh(0, this.rows - 1);
	}
	scrollPages(e) {
		this.scrollLines(e * (this.rows - 1));
	}
	scrollToTop() {
		this.scrollLines(-this._bufferService.buffer.ydisp);
	}
	scrollToBottom(e) {
		e && this._viewport ? this._viewport.scrollToLine(this.buffer.ybase, !0) : this.scrollLines(this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
	}
	scrollToLine(e) {
		let t = e - this._bufferService.buffer.ydisp;
		t !== 0 && this.scrollLines(t);
	}
	paste(e) {
		Ae(e, this.textarea, this.coreService, this.optionsService);
	}
	attachCustomKeyEventHandler(e) {
		this._customKeyEventHandler = e;
	}
	attachCustomWheelEventHandler(e) {
		this._customWheelEventHandler = e;
	}
	registerLinkProvider(e) {
		return this._linkProviderService.registerLinkProvider(e);
	}
	registerCharacterJoiner(e) {
		if (!this._characterJoinerService) throw Error("Terminal must be opened first");
		let t = this._characterJoinerService.register(e);
		return this.refresh(0, this.rows - 1), t;
	}
	deregisterCharacterJoiner(e) {
		if (!this._characterJoinerService) throw Error("Terminal must be opened first");
		this._characterJoinerService.deregister(e) && this.refresh(0, this.rows - 1);
	}
	get markers() {
		return this.buffer.markers;
	}
	registerMarker(e) {
		return this.buffer.addMarker(this.buffer.ybase + this.buffer.y + e);
	}
	registerDecoration(e) {
		return this._decorationService.registerDecoration(e);
	}
	hasSelection() {
		return this._selectionService ? this._selectionService.hasSelection : !1;
	}
	select(e, t, n) {
		this._selectionService.setSelection(e, t, n);
	}
	getSelection() {
		return this._selectionService ? this._selectionService.selectionText : "";
	}
	getSelectionPosition() {
		if (this._selectionService && this._selectionService.hasSelection) return {
			start: {
				x: this._selectionService.selectionStart[0],
				y: this._selectionService.selectionStart[1]
			},
			end: {
				x: this._selectionService.selectionEnd[0],
				y: this._selectionService.selectionEnd[1]
			}
		};
	}
	clearSelection() {
		this._selectionService?.clearSelection();
	}
	selectAll() {
		this._selectionService?.selectAll();
	}
	selectLines(e, t) {
		this._selectionService?.selectLines(e, t);
	}
	_keyDown(e) {
		if (this._keyDownHandled = !1, this._keyDownSeen = !0, this._customKeyEventHandler && this._customKeyEventHandler(e) === !1) return !1;
		let t = this.browser.isMac && this.options.macOptionIsMeta && e.altKey;
		if (!t && !this._compositionHelper.keydown(e)) return this.options.scrollOnUserInput && this.buffer.ybase !== this.buffer.ydisp && this.scrollToBottom(!0), !1;
		t || e.key !== "Dead" && e.key !== "AltGraph" || (this._unprocessedDeadKey = !0);
		let n = ks(e, this.coreService.decPrivateModes.applicationCursorKeys, this.browser.isMac, this.options.macOptionIsMeta);
		if (this.updateCursorStyle(e), n.type === 3 || n.type === 2) {
			let t = this.rows - 1;
			return this.scrollLines(n.type === 2 ? -t : t), this.cancel(e, !0);
		}
		if (n.type === 1 && this.selectAll(), this._isThirdLevelShift(this.browser, e) || (n.cancel && this.cancel(e, !0), !n.key) || e.key && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && e.key.charCodeAt(0) >= 65 && e.key.charCodeAt(0) <= 90) return !0;
		if (this._unprocessedDeadKey) return this._unprocessedDeadKey = !1, !0;
		if ((n.key === N.ETX || n.key === N.CR) && (this.textarea.value = ""), this._onKey.fire({
			key: n.key,
			domEvent: e
		}), this._showCursor(), this.coreService.triggerDataEvent(n.key, !0), !this.optionsService.rawOptions.screenReaderMode || e.altKey || e.ctrlKey) return this.cancel(e, !0);
		this._keyDownHandled = !0;
	}
	_isThirdLevelShift(e, t) {
		let n = e.isMac && !this.options.macOptionIsMeta && t.altKey && !t.ctrlKey && !t.metaKey || e.isWindows && t.altKey && t.ctrlKey && !t.metaKey || e.isWindows && t.getModifierState("AltGraph");
		return t.type === "keypress" ? n : n && (!t.keyCode || t.keyCode > 47);
	}
	_keyUp(e) {
		this._keyDownSeen = !1, !(this._customKeyEventHandler && this._customKeyEventHandler(e) === !1) && (Hs(e) || this.focus(), this.updateCursorStyle(e), this._keyPressHandled = !1);
	}
	_keyPress(e) {
		let t;
		if (this._keyPressHandled = !1, this._keyDownHandled || this._customKeyEventHandler && this._customKeyEventHandler(e) === !1) return !1;
		if (this.cancel(e), e.charCode) t = e.charCode;
		else if (e.which === null || e.which === void 0) t = e.keyCode;
		else if (e.which !== 0 && e.charCode !== 0) t = e.which;
		else return !1;
		return !t || (e.altKey || e.ctrlKey || e.metaKey) && !this._isThirdLevelShift(this.browser, e) ? !1 : (t = String.fromCharCode(t), this._onKey.fire({
			key: t,
			domEvent: e
		}), this._showCursor(), this.coreService.triggerDataEvent(t, !0), this._keyPressHandled = !0, this._unprocessedDeadKey = !1, !0);
	}
	_inputEvent(e) {
		if (e.data && e.inputType === "insertText" && (!e.composed || !this._keyDownSeen) && !this.optionsService.rawOptions.screenReaderMode) {
			if (this._keyPressHandled) return !1;
			this._unprocessedDeadKey = !1;
			let t = e.data;
			return this.coreService.triggerDataEvent(t, !0), this.cancel(e), !0;
		}
		return !1;
	}
	resize(e, t) {
		e === this.cols && t === this.rows ? this._charSizeService && !this._charSizeService.hasValidSize && this._charSizeService.measure() : super.resize(e, t);
	}
	_afterResize(e, t) {
		this._charSizeService?.measure();
	}
	clear() {
		if (this.buffer.ybase !== 0 || this.buffer.y !== 0) {
			this.buffer.clearAllMarkers(), this.buffer.lines.set(0, this.buffer.lines.get(this.buffer.ybase + this.buffer.y)), this.buffer.lines.length = 1, this.buffer.ydisp = 0, this.buffer.ybase = 0, this.buffer.y = 0;
			for (let e = 1; e < this.rows; e++) this.buffer.lines.push(this.buffer.getBlankLine(U));
			this._onScroll.fire({ position: this.buffer.ydisp }), this.refresh(0, this.rows - 1);
		}
	}
	reset() {
		this.options.rows = this.rows, this.options.cols = this.cols;
		let e = this._customKeyEventHandler;
		this._setup(), super.reset(), this._selectionService?.reset(), this._decorationService.reset(), this._customKeyEventHandler = e, this.refresh(0, this.rows - 1);
	}
	clearTextureAtlas() {
		this._renderService?.clearTextureAtlas();
	}
	_reportFocus() {
		this.element?.classList.contains("focus") ? this.coreService.triggerDataEvent(N.ESC + "[I") : this.coreService.triggerDataEvent(N.ESC + "[O");
	}
	_reportWindowsOptions(e) {
		if (this._renderService) switch (e) {
			case 0:
				let e = this._renderService.dimensions.css.canvas.width.toFixed(0), t = this._renderService.dimensions.css.canvas.height.toFixed(0);
				this.coreService.triggerDataEvent(`${N.ESC}[4;${t};${e}t`);
				break;
			case 1:
				let n = this._renderService.dimensions.css.cell.width.toFixed(0), r = this._renderService.dimensions.css.cell.height.toFixed(0);
				this.coreService.triggerDataEvent(`${N.ESC}[6;${r};${n}t`);
		}
	}
	cancel(e, t) {
		if (this.options.cancelEvents || t) return e.preventDefault(), e.stopPropagation(), !1;
	}
};
function Hs(e) {
	return e.keyCode === 16 || e.keyCode === 17 || e.keyCode === 18;
}
var Us = class {
	constructor() {
		this._addons = [];
	}
	dispose() {
		for (let e = this._addons.length - 1; e >= 0; e--) this._addons[e].instance.dispose();
	}
	loadAddon(e, t) {
		let n = {
			instance: t,
			dispose: t.dispose,
			isDisposed: !1
		};
		this._addons.push(n), t.dispose = () => this._wrappedAddonDispose(n), t.activate(e);
	}
	_wrappedAddonDispose(e) {
		if (e.isDisposed) return;
		let t = -1;
		for (let n = 0; n < this._addons.length; n++) if (this._addons[n] === e) {
			t = n;
			break;
		}
		if (t === -1) throw Error("Could not dispose an addon that has not been loaded");
		e.isDisposed = !0, e.dispose.apply(e.instance), this._addons.splice(t, 1);
	}
}, Ws = class {
	constructor(e) {
		this._line = e;
	}
	get isWrapped() {
		return this._line.isWrapped;
	}
	get length() {
		return this._line.length;
	}
	getCell(e, t) {
		if (!(e < 0 || e >= this._line.length)) return t ? (this._line.loadCell(e, t), t) : this._line.loadCell(e, new Ve());
	}
	translateToString(e, t, n) {
		return this._line.translateToString(e, t, n);
	}
}, Gs = class {
	constructor(e, t) {
		this._buffer = e, this.type = t;
	}
	init(e) {
		return this._buffer = e, this;
	}
	get cursorY() {
		return this._buffer.y;
	}
	get cursorX() {
		return this._buffer.x;
	}
	get viewportY() {
		return this._buffer.ydisp;
	}
	get baseY() {
		return this._buffer.ybase;
	}
	get length() {
		return this._buffer.lines.length;
	}
	getLine(e) {
		let t = this._buffer.lines.get(e);
		if (t) return new Ws(t);
	}
	getNullCell() {
		return new Ve();
	}
}, Ks = class extends O {
	constructor(e) {
		super(), this._core = e, this._onBufferChange = this._register(new A()), this.onBufferChange = this._onBufferChange.event, this._normal = new Gs(this._core.buffers.normal, "normal"), this._alternate = new Gs(this._core.buffers.alt, "alternate"), this._core.buffers.onBufferActivate(() => this._onBufferChange.fire(this.active));
	}
	get active() {
		if (this._core.buffers.active === this._core.buffers.normal) return this.normal;
		if (this._core.buffers.active === this._core.buffers.alt) return this.alternate;
		throw Error("Active buffer is neither normal nor alternate");
	}
	get normal() {
		return this._normal.init(this._core.buffers.normal);
	}
	get alternate() {
		return this._alternate.init(this._core.buffers.alt);
	}
}, qs = class {
	constructor(e) {
		this._core = e;
	}
	registerCsiHandler(e, t) {
		return this._core.registerCsiHandler(e, (e) => t(e.toArray()));
	}
	addCsiHandler(e, t) {
		return this.registerCsiHandler(e, t);
	}
	registerDcsHandler(e, t) {
		return this._core.registerDcsHandler(e, (e, n) => t(e, n.toArray()));
	}
	addDcsHandler(e, t) {
		return this.registerDcsHandler(e, t);
	}
	registerEscHandler(e, t) {
		return this._core.registerEscHandler(e, t);
	}
	addEscHandler(e, t) {
		return this.registerEscHandler(e, t);
	}
	registerOscHandler(e, t) {
		return this._core.registerOscHandler(e, t);
	}
	addOscHandler(e, t) {
		return this.registerOscHandler(e, t);
	}
}, Js = class {
	constructor(e) {
		this._core = e;
	}
	register(e) {
		this._core.unicodeService.register(e);
	}
	get versions() {
		return this._core.unicodeService.versions;
	}
	get activeVersion() {
		return this._core.unicodeService.activeVersion;
	}
	set activeVersion(e) {
		this._core.unicodeService.activeVersion = e;
	}
}, Ys = ["cols", "rows"], Xs = 0, Zs = class extends O {
	constructor(e) {
		super(), this._core = this._register(new Vs(e)), this._addonManager = this._register(new Us()), this._publicOptions = { ...this._core.options };
		let t = (e) => this._core.options[e], n = (e, t) => {
			this._checkReadonlyOptions(e), this._core.options[e] = t;
		};
		for (let e in this._core.options) {
			let r = {
				get: t.bind(this, e),
				set: n.bind(this, e)
			};
			Object.defineProperty(this._publicOptions, e, r);
		}
	}
	_checkReadonlyOptions(e) {
		if (Ys.includes(e)) throw Error(`Option "${e}" can only be set in the constructor`);
	}
	_checkProposedApi() {
		if (!this._core.optionsService.rawOptions.allowProposedApi) throw Error("You must set the allowProposedApi option to true to use proposed API");
	}
	get onBell() {
		return this._core.onBell;
	}
	get onBinary() {
		return this._core.onBinary;
	}
	get onCursorMove() {
		return this._core.onCursorMove;
	}
	get onData() {
		return this._core.onData;
	}
	get onKey() {
		return this._core.onKey;
	}
	get onLineFeed() {
		return this._core.onLineFeed;
	}
	get onRender() {
		return this._core.onRender;
	}
	get onResize() {
		return this._core.onResize;
	}
	get onScroll() {
		return this._core.onScroll;
	}
	get onSelectionChange() {
		return this._core.onSelectionChange;
	}
	get onTitleChange() {
		return this._core.onTitleChange;
	}
	get onWriteParsed() {
		return this._core.onWriteParsed;
	}
	get element() {
		return this._core.element;
	}
	get parser() {
		return this._parser ||= new qs(this._core), this._parser;
	}
	get unicode() {
		return this._checkProposedApi(), new Js(this._core);
	}
	get textarea() {
		return this._core.textarea;
	}
	get rows() {
		return this._core.rows;
	}
	get cols() {
		return this._core.cols;
	}
	get buffer() {
		return this._buffer ||= this._register(new Ks(this._core)), this._buffer;
	}
	get markers() {
		return this._checkProposedApi(), this._core.markers;
	}
	get modes() {
		let e = this._core.coreService.decPrivateModes, t = "none";
		switch (this._core.coreMouseService.activeProtocol) {
			case "X10":
				t = "x10";
				break;
			case "VT200":
				t = "vt200";
				break;
			case "DRAG":
				t = "drag";
				break;
			case "ANY": t = "any";
		}
		return {
			applicationCursorKeysMode: e.applicationCursorKeys,
			applicationKeypadMode: e.applicationKeypad,
			bracketedPasteMode: e.bracketedPasteMode,
			insertMode: this._core.coreService.modes.insertMode,
			mouseTrackingMode: t,
			originMode: e.origin,
			reverseWraparoundMode: e.reverseWraparound,
			sendFocusMode: e.sendFocus,
			synchronizedOutputMode: e.synchronizedOutput,
			wraparoundMode: e.wraparound
		};
	}
	get options() {
		return this._publicOptions;
	}
	set options(e) {
		for (let t in e) this._publicOptions[t] = e[t];
	}
	blur() {
		this._core.blur();
	}
	focus() {
		this._core.focus();
	}
	input(e, t = !0) {
		this._core.input(e, t);
	}
	resize(e, t) {
		this._verifyIntegers(e, t), this._core.resize(e, t);
	}
	open(e) {
		this._core.open(e);
	}
	attachCustomKeyEventHandler(e) {
		this._core.attachCustomKeyEventHandler(e);
	}
	attachCustomWheelEventHandler(e) {
		this._core.attachCustomWheelEventHandler(e);
	}
	registerLinkProvider(e) {
		return this._core.registerLinkProvider(e);
	}
	registerCharacterJoiner(e) {
		return this._checkProposedApi(), this._core.registerCharacterJoiner(e);
	}
	deregisterCharacterJoiner(e) {
		this._checkProposedApi(), this._core.deregisterCharacterJoiner(e);
	}
	registerMarker(e = 0) {
		return this._verifyIntegers(e), this._core.registerMarker(e);
	}
	registerDecoration(e) {
		return this._checkProposedApi(), this._verifyPositiveIntegers(e.x ?? 0, e.width ?? 0, e.height ?? 0), this._core.registerDecoration(e);
	}
	hasSelection() {
		return this._core.hasSelection();
	}
	select(e, t, n) {
		this._verifyIntegers(e, t, n), this._core.select(e, t, n);
	}
	getSelection() {
		return this._core.getSelection();
	}
	getSelectionPosition() {
		return this._core.getSelectionPosition();
	}
	clearSelection() {
		this._core.clearSelection();
	}
	selectAll() {
		this._core.selectAll();
	}
	selectLines(e, t) {
		this._verifyIntegers(e, t), this._core.selectLines(e, t);
	}
	dispose() {
		super.dispose();
	}
	scrollLines(e) {
		this._verifyIntegers(e), this._core.scrollLines(e);
	}
	scrollPages(e) {
		this._verifyIntegers(e), this._core.scrollPages(e);
	}
	scrollToTop() {
		this._core.scrollToTop();
	}
	scrollToBottom() {
		this._core.scrollToBottom();
	}
	scrollToLine(e) {
		this._verifyIntegers(e), this._core.scrollToLine(e);
	}
	clear() {
		this._core.clear();
	}
	write(e, t) {
		this._core.write(e, t);
	}
	writeln(e, t) {
		this._core.write(e), this._core.write("\r\n", t);
	}
	paste(e) {
		this._core.paste(e);
	}
	refresh(e, t) {
		this._verifyIntegers(e, t), this._core.refresh(e, t);
	}
	reset() {
		this._core.reset();
	}
	clearTextureAtlas() {
		this._core.clearTextureAtlas();
	}
	loadAddon(e) {
		this._addonManager.loadAddon(this, e);
	}
	static get strings() {
		return {
			get promptLabel() {
				return Ce.get();
			},
			set promptLabel(e) {
				Ce.set(e);
			},
			get tooMuchOutput() {
				return Te.get();
			},
			set tooMuchOutput(e) {
				Te.set(e);
			}
		};
	}
	_verifyIntegers(...e) {
		for (Xs of e) if (Xs === 1 / 0 || isNaN(Xs) || Xs % 1 != 0) throw Error("This API only accepts integers");
	}
	_verifyPositiveIntegers(...e) {
		for (Xs of e) if (Xs && (Xs === 1 / 0 || isNaN(Xs) || Xs % 1 != 0 || Xs < 0)) throw Error("This API only accepts positive integers");
	}
};
// node_modules/zod/v4/core/util.js
function Qs(e) {
	let t = Object.values(e).filter((e) => typeof e == "number");
	return Object.entries(e).filter(([e, n]) => t.indexOf(+e) === -1).map(([e, t]) => t);
}
function $s(e, t = "|") {
	return e.map((e) => wc(e)).join(t);
}
function ec(e, t) {
	return typeof t == "bigint" ? t.toString() : t;
}
var tc = class {
	constructor(e) {
		this._getter = e, this._value = void 0;
	}
	get value() {
		let e = this._getter;
		return e !== void 0 && (this._value = e(), this._getter = void 0), this._value;
	}
};
function nc(e) {
	return new tc(e);
}
function rc(e) {
	return e == null;
}
function ic(e) {
	let t = +!!e.startsWith("^"), n = e.endsWith("$") ? e.length - 1 : e.length;
	return e.slice(t, n);
}
function ac(e, t) {
	let n = e / t, r = Math.round(n), i = 4 * 2 ** -52 * Math.max(Math.abs(n), 1);
	return Math.abs(n - r) < i ? 0 : n - r;
}
function oc(e, t, n) {
	Object.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
}
function sc(e) {
	let t = Object.getOwnPropertyDescriptor(e, "shape");
	return t?.get ? t.get.raw : t?.value;
}
function cc(e) {
	return sc(e._zod.def) ?? e._zod.def.shape;
}
function lc(e, t, n) {
	Object.defineProperty(e, t, {
		get() {
			let e = n();
			return oc(this, t, e), e;
		},
		enumerable: !0,
		configurable: !0
	});
}
function uc(e, t, n) {
	t in e ? oc(e, t, n) : e[t] = n;
}
function dc(e, t, n, r) {
	let i = cc(t);
	for (let a of n) {
		let n = Object.getOwnPropertyDescriptor(i, a);
		n.enumerable && (n.get ? lc(e, a, () => {
			let e = t._zod.def.shape[a];
			return r ? r(e, a) : e;
		}) : uc(e, a, r ? r(n.value, a) : n.value));
	}
}
function fc(e, t) {
	for (let n of Reflect.ownKeys(t)) {
		let r = Object.getOwnPropertyDescriptor(t, n);
		r.enumerable && (r.get ? lc(e, n, () => t[n]) : uc(e, n, r.value));
	}
}
function pc(...e) {
	let t = {};
	for (let n of e) {
		let e = Object.getOwnPropertyDescriptors(n);
		Object.assign(t, e);
	}
	return Object.defineProperties({}, t);
}
function mc(e) {
	return JSON.stringify(e);
}
function hc(e) {
	return e.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var gc = "captureStackTrace" in Error ? Error.captureStackTrace : (...e) => {};
function _c(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var vc = /* @__PURE__*/ nc(() => {
	if (pl.jitless || typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare")) return !1;
	try {
		return Function(""), !0;
	} catch {
		return !1;
	}
});
function yc(e) {
	if (_c(e) === !1) return !1;
	let t = e.constructor;
	if (t === void 0 || typeof t != "function") return !0;
	let n = t.prototype;
	return _c(n) !== !1 && Object.prototype.hasOwnProperty.call(n, "isPrototypeOf") !== !1;
}
function bc(e) {
	return yc(e) ? { ...e } : Array.isArray(e) ? [...e] : e instanceof Map ? new Map(e) : e instanceof Set ? new Set(e) : e;
}
var xc = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function Sc(e) {
	return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Cc(e, t, n) {
	let r = new e._zod.constr(t ?? e._zod.def);
	return (!t || n?.parent) && (r._zod.parent = e), r;
}
function q(e) {
	let t = e;
	if (!t) return {};
	if (typeof t == "string") return { error: () => t };
	if (t?.message !== void 0) {
		if (t?.error !== void 0) throw Error("Cannot specify both `message` and `error` params");
		t.error = t.message;
	}
	return delete t.message, typeof t.error == "string" ? {
		...t,
		error: () => t.error
	} : t;
}
function wc(e) {
	return typeof e == "bigint" ? e.toString() + "n" : typeof e == "string" ? `"${e}"` : `${e}`;
}
function Tc(e) {
	return Object.keys(e).filter((t) => e[t]._zod.optin !== void 0 && e[t]._zod.optout === "optional");
}
var Ec = {
	safeint: [-(2 ** 53 - 1), 2 ** 53 - 1],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}, Dc = {
	int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")]
};
function Oc(e, t) {
	let n = e._zod.def, r = n.checks;
	if (r && r.length > 0) throw Error(".pick() cannot be used on object schemas containing refinements");
	let i = {};
	return dc(i, e, kc(e, t)), Cc(e, pc(n, {
		shape: i,
		checks: []
	}));
}
function kc(e, t) {
	let n = cc(e), r = [];
	for (let e of Reflect.ownKeys(t)) {
		if (!Object.getOwnPropertyDescriptor(n, e)?.enumerable) throw Error(`Unrecognized key: "${String(e)}"`);
		t[e] && r.push(e);
	}
	return r;
}
function Ac(e, t) {
	let n = e._zod.def, r = n.checks;
	if (r && r.length > 0) throw Error(".omit() cannot be used on object schemas containing refinements");
	let i = new Set(kc(e, t)), a = {};
	return dc(a, e, Reflect.ownKeys(cc(e)).filter((e) => !i.has(e))), Cc(e, pc(n, {
		shape: a,
		checks: []
	}));
}
function jc(e, t) {
	if (!yc(t)) throw Error("Invalid input to extend: expected a plain object");
	let n = e._zod.def.checks;
	if (n && n.length > 0) {
		let n = cc(e);
		for (let e of Reflect.ownKeys(t)) if (Object.getOwnPropertyDescriptor(n, e) !== void 0) throw Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return Cc(e, pc(e._zod.def, { shape: Mc(e, t) }));
}
function Mc(e, t) {
	let n = {};
	return dc(n, e, Reflect.ownKeys(cc(e))), fc(n, t), n;
}
function Nc(e, t) {
	if (!yc(t)) throw Error("Invalid input to safeExtend: expected a plain object");
	return Cc(e, pc(e._zod.def, { shape: Mc(e, t) }));
}
function Pc(e, t) {
	if (!t?._zod?.def) throw Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
	if (e._zod.def.checks?.length) throw Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	let n = {};
	return dc(n, e, Reflect.ownKeys(cc(e))), dc(n, t, Reflect.ownKeys(cc(t))), Cc(e, pc(e._zod.def, {
		shape: n,
		get catchall() {
			return t._zod.def.catchall;
		},
		checks: t._zod.def.checks ?? []
	}));
}
function Fc(e, t, n, r = "partial") {
	let i = t._zod.def.checks;
	if (i && i.length > 0) throw Error(`.${r}() cannot be used on object schemas containing refinements`);
	let a = n ? new Set(kc(t, n)) : void 0, o = {};
	return dc(o, t, Reflect.ownKeys(cc(t)), e && ((t, n) => a && !a.has(n) ? t : new e({
		type: "optional",
		innerType: t
	}))), Cc(t, pc(t._zod.def, {
		shape: o,
		checks: []
	}));
}
function Ic(e, t, n) {
	let r = n ? new Set(kc(t, n)) : void 0, i = {};
	return dc(i, t, Reflect.ownKeys(cc(t)), (t, n) => r && !r.has(n) ? t : new e({
		type: "nonoptional",
		innerType: t
	})), Cc(t, pc(t._zod.def, { shape: i }));
}
function Lc(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue !== !0) return !0;
	return !1;
}
function Rc(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue === !1) return !0;
	return !1;
}
function zc(e, t) {
	return t.map((t) => {
		var n;
		return (n = t).path ?? (n.path = []), t.path.unshift(e), t;
	});
}
function Bc(e) {
	return typeof e == "string" ? e : e?.message;
}
function Vc(e) {
	let t = [];
	for (let n of e ?? []) {
		let e = n._zod.def;
		if (!/_(length|size)$|_equals$/.test(e.check)) break;
		let r = e.maximum ?? e.length ?? e.size;
		r >= 0 && t.push([r, n]);
	}
	return t;
}
function Hc(e, t, n) {
	var r;
	for (let i = t; i < e.length; i++) (r = e[i]).schema ?? (r.schema = n);
}
function Uc(e, t, n) {
	var r;
	let i = e.inst?._zod?.traits;
	i?.has("$ZodType") && (i.has("$ZodCheck") ? (r = e).schema ?? (r.schema = e.inst) : e.schema = e.inst);
	let a = e.schema === e.inst ? void 0 : e.schema?._zod.def?.error, o = e.message ? e.message : Bc(e.inst?._zod.def?.error?.(e)) ?? Bc(a?.(e)) ?? Bc(t?.error?.(e)) ?? Bc(n.customError?.(e)) ?? Bc(n.localeError?.(e)) ?? "Invalid input", s = {};
	for (let t of Object.keys(e)) t !== "inst" && t !== "schema" && t !== "continue" && t !== "input" && t !== "__proto__" && (s[t] = e[t]);
	return s.path ??= [], s.message = o, t?.reportInput && (s.input = e.input), s;
}
var Wc = /[\uD800-\uDBFF]/;
function Gc(e) {
	let t = e.length;
	if (!Wc.test(e)) return t;
	let n = t;
	for (let r = 0; r < t - 1; r++) (e.charCodeAt(r) & 64512) == 55296 && (e.charCodeAt(r + 1) & 64512) == 56320 && (n--, r++);
	return n;
}
function Kc(e) {
	return Array.isArray(e) ? "array" : typeof e == "string" ? "string" : "unknown";
}
function qc(e) {
	let t = typeof e;
	switch (t) {
		case "number": return Number.isNaN(e) ? "nan" : "number";
		case "object": {
			if (e === null) return "null";
			if (Array.isArray(e)) return "array";
			let t = e;
			if (t && Object.getPrototypeOf(t) !== Object.prototype && "constructor" in t && t.constructor) return t.constructor.name;
		}
	}
	return t;
}
function Jc(...e) {
	let [t, n, r] = e;
	return typeof t == "string" ? {
		message: t,
		code: "custom",
		input: n,
		inst: r
	} : { ...t };
}
function Yc(e, t) {
	for (let n in t) {
		let r = Object.getOwnPropertyDescriptor(t, n);
		r.get ? Object.defineProperty(e, n, {
			...r,
			enumerable: !1
		}) : $c(e, n, r.value);
	}
}
function Xc(e, t, n, r = !0) {
	return Object.defineProperty(e, t, {
		configurable: !0,
		writable: !0,
		enumerable: r,
		value: n
	}), n;
}
function Zc(e, t, n) {
	return Xc(e, t, n, !1);
}
/* @__NO_SIDE_EFFECTS__ */
function Qc(e, t) {
	for (let n in e) {
		let r = e[n];
		Object.defineProperty(t, n, {
			configurable: !0,
			enumerable: !0,
			get() {
				return Xc(this, n, r(this));
			},
			set(e) {
				Xc(this, n, e);
			}
		});
	}
	return t;
}
function $c(e, t, n) {
	Object.defineProperty(e, t, {
		configurable: !0,
		get() {
			return this == null ? n : Xc(this, t, n.bind(this));
		},
		set(e) {
			Xc(this, t, e);
		}
	});
}
function el(e, t) {
	let n = Object.getPrototypeOf(e);
	return t in n ? void 0 : n;
}
var tl, nl = !1, rl = {
	configurable: !0,
	get() {
		nl = !0;
	}
};
function J(e, t, n) {
	let r = Object.getPrototypeOf(e._zod);
	t in r && tl !== e._zod ? tl = void 0 : (tl = e._zod, Object.defineProperty(r, t, {
		configurable: !0,
		get() {
			Object.defineProperty(this, t, rl);
			let e = nl;
			nl = !1;
			try {
				let r = n(this);
				return nl ? delete this[t] : Object.defineProperty(this, t, {
					configurable: !0,
					writable: !0,
					value: r
				}), nl ||= e, r;
			} catch (n) {
				throw delete this[t], nl ||= e, n;
			}
		},
		set(e) {
			Object.defineProperty(this, t, {
				configurable: !0,
				writable: !0,
				value: e
			});
		}
	}));
}
function il(e, t, n, r) {
	let i = el(e, t);
	i && Object.defineProperty(i, t, {
		configurable: !0,
		get() {
			let e = {
				configurable: !0,
				writable: !0,
				enumerable: r,
				value: void 0
			};
			return Object.defineProperty(this, t, e), e.value = n(this), Object.defineProperty(this, t, e), e.value;
		},
		set(e) {
			Object.defineProperty(this, t, {
				configurable: !0,
				writable: !0,
				enumerable: r,
				value: e
			});
		}
	});
}
var al = "~constantCatch";
function ol(e) {
	let t = () => e;
	return t[al] = !0, t;
}
// node_modules/zod/v4/core/core.js
var sl, cl = {
	value: void 0,
	enumerable: !1
}, ll = "captureStackTrace" in Error ? Error : null;
function ul(e) {
	let t = ll;
	if (t) {
		let n = t.stackTraceLimit;
		if (typeof n == "number") {
			try {
				t.stackTraceLimit = 0;
			} catch {
				return ll = null, new e();
			}
			try {
				return new e();
			} finally {
				t.stackTraceLimit = n;
			}
		}
	}
	return new e();
}
/* @__NO_SIDE_EFFECTS__ */
function Y(e, t, n, r) {
	let i = {};
	function a(e) {
		this.def = e, this.constr = d, this.traits = /* @__PURE__ */ new Set();
	}
	a.prototype = i;
	let o = n, s = o && /* @__PURE__ */ new WeakSet();
	function c(n, r) {
		if (!n._zod) {
			cl.value = new a(r);
			try {
				Object.defineProperty(n, "_zod", cl);
			} finally {
				cl.value = void 0;
			}
		} else if (n._zod.traits.has(e)) return;
		if (n._zod.traits.add(e), t(n, r), s) {
			let e = Object.getPrototypeOf(n), t = n._zod.constr.prototype, r = e;
			for (; r && r !== t;) r = Object.getPrototypeOf(r);
			let i = r ?? e;
			s.has(i) || (s.add(i), Yc(i, o));
		}
		let i = d.prototype;
		for (let e in i) Object.prototype.hasOwnProperty.call(i, e) && (e in n || (n[e] = i[e].bind(n)));
	}
	let l = r?.Parent ?? Object;
	class u extends l {}
	Object.defineProperty(u, "name", { value: e });
	function d(e) {
		let t = r?.Parent ? ul(u) : this;
		c(t, e);
		let n = t._zod.deferred;
		if (n) {
			for (let e of n) e();
			t._zod.deferred = void 0;
		}
		let i = globalThis.__zod_globalConfig?.postProcessor;
		return i && i(t), t;
	}
	return Object.defineProperty(d, "init", { value: c }), Object.defineProperty(d, Symbol.hasInstance, { value: (t) => r?.Parent && t instanceof r.Parent ? !0 : t?._zod?.traits?.has(e) }), Object.defineProperty(d, "name", { value: e }), d;
}
var dl = class extends Error {
	constructor() {
		super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
	}
}, fl = class extends Error {
	constructor(e) {
		super(`Encountered unidirectional transform during encode: ${e}`), this.name = "ZodEncodeError";
	}
};
(sl = globalThis).__zod_globalConfig ?? (sl.__zod_globalConfig = {});
var pl = globalThis.__zod_globalConfig;
function ml(e) {
	return e && Object.assign(pl, e), pl;
}
// node_modules/zod/v4/core/errors.js
function hl() {
	let e = this._zod;
	return e.message ??= JSON.stringify(e.def, ec, 2), e.message;
}
function gl(e) {
	this._zod.message = e;
}
var _l = {
	get: hl,
	set: gl,
	enumerable: !0,
	configurable: !0
}, vl = {
	value: void 0,
	enumerable: !1
}, yl = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]), bl = /* @__PURE__ */ Y("$ZodError", (e, t) => {
	e.name = "$ZodError", vl.value = t, Object.defineProperty(e, "issues", vl), vl.value = void 0, Object.defineProperty(e, "message", _l);
	let n = Object.getPrototypeOf(e);
	yl.has(n) || (yl.add(n), Object.defineProperty(n, "toString", {
		configurable: !0,
		enumerable: !1,
		get() {
			let e = () => this.message;
			return Object.defineProperty(this, "toString", {
				value: e,
				configurable: !0,
				writable: !0
			}), e;
		},
		set(e) {
			Object.defineProperty(this, "toString", {
				value: e,
				configurable: !0,
				writable: !0
			});
		}
	}));
});
function xl(e, t, n) {
	return Object.prototype.hasOwnProperty.call(e, t) || (t === "__proto__" ? Object.defineProperty(e, t, {
		value: n(),
		writable: !0,
		enumerable: !0,
		configurable: !0
	}) : e[t] = n()), e[t];
}
function Sl(e, t = (e) => e.message) {
	let n = {}, r = [];
	for (let i of e.issues) i.path.length > 0 ? xl(n, i.path[0], () => []).push(t(i)) : r.push(t(i));
	return {
		formErrors: r,
		fieldErrors: n
	};
}
function Cl(e, t = (e) => e.message) {
	let n = { _errors: [] }, r = (e, i = []) => {
		for (let a of e.issues) if (a.code === "invalid_union" && a.errors.length) a.errors.map((e) => r({ issues: e }, [...i, ...a.path]));
		else if (a.code === "invalid_key") r({ issues: a.issues }, [...i, ...a.path]);
		else if (a.code === "invalid_element") r({ issues: a.issues }, [...i, ...a.path]);
		else {
			let e = [...i, ...a.path];
			if (e.length === 0) n._errors.push(t(a));
			else {
				let r = n, i = 0;
				for (; i < e.length;) {
					let n = e[i], o = i === e.length - 1;
					if (n === "_errors") {
						o && r._errors.push(t(a)), i++;
						continue;
					}
					Object.prototype.hasOwnProperty.call(r, n) || Object.defineProperty(r, n, {
						value: { _errors: [] },
						enumerable: !0,
						writable: !0,
						configurable: !0
					});
					let s = r[n];
					o && s._errors.push(t(a)), r = s, i++;
				}
			}
		}
	};
	return r(e), n;
}
// node_modules/zod/v4/core/parse.js
function wl(e, t) {
	return {
		callee: t?.callee ?? e,
		Err: t?.Err
	};
}
var Tl = (e) => {
	let t = (n, r, i, a) => {
		let o = i ? {
			...i,
			async: !1
		} : { async: !1 }, s = n._zod.run({
			value: r,
			issues: []
		}, o);
		if (s instanceof Promise) throw new dl();
		if (s.issues.length) {
			let n = new ((a?.Err) ?? e)(s.issues.map((e) => Uc(e, o, ml())));
			throw gc(n, a?.callee ?? t), n;
		}
		return s.value;
	};
	return t;
}, El = (e) => {
	let t = async (n, r, i, a) => {
		let o = i ? {
			...i,
			async: !0
		} : { async: !0 }, s = n._zod.run({
			value: r,
			issues: []
		}, o);
		if (s instanceof Promise && (s = await s), s.issues.length) {
			let n = new ((a?.Err) ?? e)(s.issues.map((e) => Uc(e, o, ml())));
			throw gc(n, a?.callee ?? t), n;
		}
		return s.value;
	};
	return t;
}, Dl = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		async: !1
	} : { async: !1 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	if (a instanceof Promise) throw new dl();
	return a.issues.length ? Ol(e, a.issues, i) : {
		success: !0,
		data: a.value
	};
};
function Ol(e, t, n) {
	let r;
	return {
		success: !1,
		get error() {
			return r || (r = new e(t.map((e) => Uc(e, n, ml()))), t = void 0, n = void 0), r;
		},
		set error(e) {
			r = e, t = void 0, n = void 0;
		}
	};
}
var kl = (e) => async (t, n, r) => {
	let i = r ? {
		...r,
		async: !0
	} : { async: !0 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	return a instanceof Promise && (a = await a), a.issues.length ? Ol(e, a.issues, i) : {
		success: !0,
		data: a.value
	};
}, Al = /* @__PURE__ */ Symbol.for("zod.compile.invalid"), jl = /* @__PURE__ */ Symbol.for("zod.compile.fallback"), Ml = ((e, t, n) => {
	let r = e._zod.bag.validator;
	if (r !== void 0) {
		if (r(t) !== Al) return !0;
		if (r.definite === !0 && n === void 0) return !1;
	}
	return Nl(e, t, n);
});
function Nl(e, t, n) {
	let r = n ? {
		...n,
		async: !1,
		abortEarly: !0
	} : {
		async: !1,
		abortEarly: !0
	}, i = e._zod.bag.fallbackRun, a;
	if (i ? (r[jl] = !0, a = i({
		value: t,
		issues: []
	}, r)) : a = e._zod.run({
		value: t,
		issues: []
	}, r), a instanceof Promise) throw new dl();
	return a.issues.length === 0;
}
var Pl = async (e, t, n) => {
	let r = n ? {
		...n,
		async: !0,
		abortEarly: !0
	} : {
		async: !0,
		abortEarly: !0
	}, i = e._zod.run({
		value: t,
		issues: []
	}, r);
	return i instanceof Promise && (i = await i), i.issues.length === 0;
}, Fl = (e) => {
	let t = Tl(e), n = (e, r, i, a) => {
		let o = i ? {
			...i,
			direction: "backward"
		} : { direction: "backward" };
		return t(e, r, o, wl(n, a));
	};
	return n;
}, Il = (e) => {
	let t = Tl(e), n = (e, r, i, a) => t(e, r, i, wl(n, a));
	return n;
}, Ll = (e) => {
	let t = El(e), n = async (e, r, i, a) => {
		let o = i ? {
			...i,
			direction: "backward"
		} : { direction: "backward" };
		return await t(e, r, o, wl(n, a));
	};
	return n;
}, Rl = (e) => {
	let t = El(e), n = async (e, r, i, a) => await t(e, r, i, wl(n, a));
	return n;
}, zl = (e) => (t, n, r) => {
	let i = r ? {
		...r,
		direction: "backward"
	} : { direction: "backward" };
	return Dl(e)(t, n, i);
}, Bl = (e) => (t, n, r) => Dl(e)(t, n, r), Vl = (e) => async (t, n, r) => {
	let i = r ? {
		...r,
		direction: "backward"
	} : { direction: "backward" };
	return kl(e)(t, n, i);
}, Hl = (e) => async (t, n, r) => kl(e)(t, n, r), Ul = /^[cC][0-9a-z]{6,}$/, Wl = /^[0-9a-z]+$/, Gl = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/, Kl = /^[0-9a-vA-V]{20}$/, ql = /^[A-Za-z0-9]{27}$/, Jl = /^[a-zA-Z0-9_-]{21}$/;
function Yl(e) {
	return RegExp(`^[a-zA-Z0-9_-]{${e}}$`);
}
var Xl = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/, Zl = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/, Ql = (e) => e ? RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/, $l = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/, eu = "^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$";
function tu() {
	return new RegExp(eu, "u");
}
var nu = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, ru = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/, iu = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/, au = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, ou = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/, su = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/, cu = /^https?$/, lu = /^\+[1-9]\d{6,14}$/, uu = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";
function du(e) {
	return RegExp(`^${e}$`);
}
var fu = /*@__PURE__*/ du(uu);
function pu(e) {
	let t = "(?:[01]\\d|2[0-3]):[0-5]\\d";
	return typeof e.precision == "number" ? e.precision === -1 ? `${t}` : e.precision === 0 ? `${t}:[0-5]\\d` : `${t}:[0-5]\\d\\.\\d{${e.precision}}` : e.seconds ? `${t}:[0-5]\\d(?:\\.\\d+)?` : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function mu(e) {
	return RegExp(`^${pu(e)}$`);
}
function hu(e) {
	let t = ["Z"];
	e.offset && t.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
	let n = `${pu({
		precision: e.precision,
		seconds: !0
	})}(?:${t.join("|")})`, r = e.local ? `${n}|${pu({ precision: e.precision })}` : n;
	return RegExp(`^${uu}T(?:${r})$`);
}
var gu = /^[\s\S]{0,}$/, _u = /^-?\d+(?:\.\d+)?$/, vu = /^[^A-Z]*$/, yu = /^[^a-z]*$/, bu = /*@__PURE__*/ Y("$ZodCheck", (e, t) => {
	var n;
	e._zod ??= {}, e._zod.def = t, (n = e._zod).onattach ?? (n.onattach = []);
}), xu = (e) => {
	let t = e.value;
	return !rc(t) && t.length !== void 0;
}, Su = {
	number: "number",
	bigint: "bigint",
	object: "date"
}, Cu = /*@__PURE__*/ Y("$ZodCheckLessThan", (e, t) => {
	bu.init(e, t);
	let n = Su[typeof t.value];
	e._zod.check = (r) => {
		(t.inclusive ? r.value <= t.value : r.value < t.value) || r.issues.push({
			origin: Su[typeof r.value] ?? n,
			code: "too_big",
			maximum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), wu = /*@__PURE__*/ Y("$ZodCheckGreaterThan", (e, t) => {
	bu.init(e, t);
	let n = Su[typeof t.value];
	e._zod.check = (r) => {
		(t.inclusive ? r.value >= t.value : r.value > t.value) || r.issues.push({
			origin: Su[typeof r.value] ?? n,
			code: "too_small",
			minimum: typeof t.value == "object" ? t.value.getTime() : t.value,
			input: r.value,
			inclusive: t.inclusive,
			inst: e,
			continue: !t.abort
		});
	};
}), Tu = /*@__PURE__*/ Y("$ZodCheckMultipleOf", (e, t) => {
	bu.init(e, t), e._zod.check = (n) => {
		if (typeof n.value != typeof t.value) throw Error("Cannot mix number and bigint in multiple_of check.");
		(typeof n.value == "bigint" ? t.value !== BigInt(0) && n.value % t.value === BigInt(0) : ac(n.value, t.value) === 0) || n.issues.push({
			origin: typeof n.value,
			code: "not_multiple_of",
			divisor: t.value,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Eu = /*@__PURE__*/ Y("$ZodCheckNumberFormat", (e, t) => {
	bu.init(e, t), t.format = t.format || "float64";
	let n = t.format?.includes("int"), r = n ? "int" : "number", [i, a] = Ec[t.format];
	e._zod.check = (o) => {
		let s = o.value;
		if (n) {
			if (!Number.isInteger(s)) {
				o.issues.push({
					expected: r,
					format: t.format,
					code: "invalid_type",
					continue: !1,
					input: s,
					inst: e
				});
				return;
			}
			if (!Number.isSafeInteger(s)) {
				s > 0 ? o.issues.push({
					input: s,
					code: "too_big",
					maximum: 2 ** 53 - 1,
					note: "Integers must be within the safe integer range.",
					inst: e,
					origin: r,
					inclusive: !0,
					continue: !t.abort
				}) : o.issues.push({
					input: s,
					code: "too_small",
					minimum: -(2 ** 53 - 1),
					note: "Integers must be within the safe integer range.",
					inst: e,
					origin: r,
					inclusive: !0,
					continue: !t.abort
				});
				return;
			}
		}
		s < i && o.issues.push({
			origin: "number",
			input: s,
			code: "too_small",
			minimum: i,
			inclusive: !0,
			inst: e,
			continue: !t.abort
		}), s > a && o.issues.push({
			origin: "number",
			input: s,
			code: "too_big",
			maximum: a,
			inclusive: !0,
			inst: e,
			continue: !t.abort
		});
	};
}), Du = /*@__PURE__*/ Y("$ZodCheckMaxLength", (e, t) => {
	var n;
	bu.init(e, t), (n = e._zod.def).when ?? (n.when = xu), e._zod.check = (n) => {
		let r = n.value, i = r.length;
		if ((typeof r == "string" && i > t.maximum ? Gc(r) : i) <= t.maximum) return;
		let a = Kc(r);
		n.issues.push({
			origin: a,
			code: "too_big",
			maximum: t.maximum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), Ou = /*@__PURE__*/ Y("$ZodCheckMinLength", (e, t) => {
	var n;
	bu.init(e, t), (n = e._zod.def).when ?? (n.when = xu), e._zod.check = (n) => {
		let r = n.value, i = r.length;
		if ((typeof r == "string" && i >= t.minimum && i < t.minimum * 2 ? Gc(r) : i) >= t.minimum) return;
		let a = Kc(r);
		n.issues.push({
			origin: a,
			code: "too_small",
			minimum: t.minimum,
			inclusive: !0,
			input: r,
			inst: e,
			continue: !t.abort
		});
	};
}), ku = /*@__PURE__*/ Y("$ZodCheckLengthEquals", (e, t) => {
	var n;
	bu.init(e, t), (n = e._zod.def).when ?? (n.when = xu), e._zod.check = (n) => {
		let r = n.value, i = r.length, a = typeof r == "string" && i >= t.length && i <= t.length * 2 ? Gc(r) : i;
		if (a === t.length) return;
		let o = Kc(r), s = a > t.length;
		n.issues.push({
			origin: o,
			...s ? {
				code: "too_big",
				maximum: t.length
			} : {
				code: "too_small",
				minimum: t.length
			},
			inclusive: !0,
			exact: !0,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Au = /*@__PURE__*/ Y("$ZodCheckStringFormat", (e, t) => {
	var n, r;
	bu.init(e, t), t.pattern ? (n = e._zod).check ?? (n.check = (n) => {
		t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: t.format,
			input: n.value,
			...t.pattern ? { pattern: t.pattern.toString() } : {},
			inst: e,
			continue: !t.abort
		});
	}) : (r = e._zod).check ?? (r.check = () => {});
}), ju = /*@__PURE__*/ Y("$ZodCheckRegex", (e, t) => {
	Au.init(e, t), e._zod.check = (n) => {
		t.pattern.lastIndex = 0, !t.pattern.test(n.value) && n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: n.value,
			pattern: t.pattern.toString(),
			inst: e,
			continue: !t.abort
		});
	};
}), Mu = /*@__PURE__*/ Y("$ZodCheckLowerCase", (e, t) => {
	t.pattern ??= vu, Au.init(e, t);
}), Nu = /*@__PURE__*/ Y("$ZodCheckUpperCase", (e, t) => {
	t.pattern ??= yu, Au.init(e, t);
}), Pu = /*@__PURE__*/ Y("$ZodCheckIncludes", (e, t) => {
	bu.init(e, t);
	let n = Sc(t.includes);
	t.pattern = new RegExp(typeof t.position == "number" ? `^.{${t.position},}${n}` : n), e._zod.check = (n) => {
		n.value.includes(t.includes, t.position) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: t.includes,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Fu = /*@__PURE__*/ Y("$ZodCheckStartsWith", (e, t) => {
	bu.init(e, t);
	let n = RegExp(`^${Sc(t.prefix)}.*`);
	t.pattern ??= n, e._zod.check = (n) => {
		n.value.startsWith(t.prefix) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: t.prefix,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Iu = /*@__PURE__*/ Y("$ZodCheckEndsWith", (e, t) => {
	bu.init(e, t);
	let n = RegExp(`.*${Sc(t.suffix)}$`);
	t.pattern ??= n, e._zod.check = (n) => {
		n.value.endsWith(t.suffix) || n.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: t.suffix,
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Lu = /*@__PURE__*/ Y("$ZodCheckOverwrite", (e, t) => {
	bu.init(e, t), e._zod.check = (e) => {
		e.value = t.tx(e.value);
	};
}), Ru = class {
	constructor(e = [], t = {}) {
		this.content = [], this.indent = 0, this.args = e, this.closed = t;
	}
	indented(e) {
		this.indent += 1;
		try {
			e(this);
		} finally {
			--this.indent;
		}
	}
	write(e) {
		if (typeof e == "function") {
			e(this, { execution: "sync" }), e(this, { execution: "async" });
			return;
		}
		let t = e.split("\n").filter((e) => e), n = Math.min(...t.map((e) => e.length - e.trimStart().length)), r = t.map((e) => e.slice(n)).map((e) => " ".repeat(this.indent * 2) + e);
		for (let e of r) this.content.push(e);
	}
	compile() {
		let e = Function, t = this?.content ?? [""];
		return new e(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${t.join("\n")}\n};`)(...Object.values(this.closed));
	}
}, zu = {
	major: 4,
	minor: 6,
	patch: 7
}, X = /*@__PURE__*/ Y("$ZodType", (e, t) => {
	var n;
	e ??= {}, e._zod.def = t, e._zod.bag = e._zod.bag || {}, e._zod.version = zu;
	let r = e._zod.def.checks, i = e._zod.traits.has("$ZodCheck") ? [e, ...r ?? []] : r?.length ? [...r] : [];
	for (let t of i) for (let n of t._zod.onattach) n(e);
	if (i.length === 0) (n = e._zod).deferred ?? (n.deferred = []), e._zod.deferred?.push(() => {
		e._zod.run = e._zod.parse;
	});
	else {
		let t = (t, n, r) => {
			if (t.memo) return t;
			let i = Lc(t), a;
			for (let o of n) {
				if (o._zod.def.when) {
					if (Rc(t) || !o._zod.def.when(t)) continue;
				} else if (i) continue;
				let n = t.issues.length, s = o._zod.check(t);
				if (s instanceof Promise && r?.async === !1) throw new dl();
				if (a || s instanceof Promise) a = (a ?? Promise.resolve()).then(async () => {
					await s, t.issues.length !== n && (Hc(t.issues, n, e), i ||= Lc(t, n));
				});
				else {
					if (t.issues.length === n) continue;
					Hc(t.issues, n, e), i ||= Lc(t, n);
				}
			}
			return a ? a.then(() => t) : t;
		}, n = (n, r, a) => {
			if (Lc(n)) return n.aborted = !0, n;
			let o = t(r, i, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new dl();
				return o.then((t) => e._zod.parse(t, a));
			}
			return e._zod.parse(o, a);
		};
		e._zod.run = (r, a) => {
			if (a.skipChecks) return e._zod.parse(r, a);
			if (a.direction === "backward") {
				let t = e._zod.parse({
					value: r.value,
					issues: []
				}, {
					...a,
					skipChecks: !0
				});
				return t instanceof Promise ? t.then((e) => n(e, r, a)) : n(t, r, a);
			}
			let o = e._zod.parse(r, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new dl();
				return o.then((e) => t(e, i, a));
			}
			return t(o, i, a);
		};
	}
}, {
	get "~standard"() {
		return Zc(this, "~standard", Hu(this));
	},
	set "~standard"(e) {
		Xc(this, "~standard", e);
	}
}), Bu = (e, t) => e.issues.length ? { issues: e.issues.map((e) => Uc(e, t, ml())) } : { value: e.value };
async function Vu(e, t) {
	let n = { async: !0 };
	return Bu(await e._zod.run({
		value: t,
		issues: []
	}, n), n);
}
function Hu(e) {
	return {
		validate: (t) => {
			let n = { async: !1 };
			try {
				let r = e._zod.run({
					value: t,
					issues: []
				}, n);
				if (!(r instanceof Promise)) return Bu(r, n);
			} catch {}
			return Vu(e, t);
		},
		vendor: "zod",
		version: 1
	};
}
var Uu = /*@__PURE__*/ Y("$ZodString", (e, t) => {
	X.init(e, t), e._zod.pattern = t.pattern ?? gu, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = String(n.value);
		} catch {}
		return typeof n.value == "string" || n.issues.push({
			expected: "string",
			code: "invalid_type",
			input: n.value,
			inst: e
		}), n;
	};
}), Z = /*@__PURE__*/ Y("$ZodStringFormat", (e, t) => {
	Au.init(e, t), Uu.init(e, t);
}), Wu = /*@__PURE__*/ Y("$ZodGUID", (e, t) => {
	t.pattern ??= Zl, Z.init(e, t);
}), Gu = /*@__PURE__*/ Y("$ZodUUID", (e, t) => {
	if (t.version) {
		let e = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[t.version];
		if (e === void 0) throw Error(`Invalid UUID version: "${t.version}"`);
		t.pattern ??= Ql(e);
	} else t.pattern ??= Ql();
	Z.init(e, t);
}), Ku = /*@__PURE__*/ Y("$ZodEmail", (e, t) => {
	t.pattern ??= $l, Z.init(e, t);
});
function qu(e) {
	try {
		return typeof URL < "u" && typeof URL.canParse == "function" ? URL.canParse(e) : (new URL(e), !0);
	} catch {
		return !1;
	}
}
function Ju(e, t) {
	return !("normalize" in t) && !("hostname" in t) && !("protocol" in t) ? qu(e) || 2 : Yu(e, t);
}
function Yu(e, t) {
	if (!t.normalize && t.protocol?.source === cu.source && !/^https?:\/\//i.test(e)) return 1;
	try {
		if (typeof URL < "u") {
			let t = URL;
			if (typeof t.parse == "function") return t.parse(e) ?? 2;
		}
		return new URL(e);
	} catch {
		return 2;
	}
}
var Xu = /[\t\n\r]/g;
function Zu(e) {
	return e.replace(Xu, "");
}
function Qu(e, t) {
	return t.lastIndex = 0, t.test(e.hostname);
}
function $u(e, t) {
	return t.lastIndex = 0, t.test(e.protocol.endsWith(":") ? e.protocol.slice(0, -1) : e.protocol);
}
var ed = /*@__PURE__*/ Y("$ZodURL", (e, t) => {
	Z.init(e, t), e._zod.check = (n) => {
		try {
			let r = n.value.trim(), i = Ju(r, t);
			if (i === 1) {
				n.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: n.value,
					inst: e,
					continue: !t.abort
				});
				return;
			}
			if (i === 2) {
				n.issues.push({
					code: "invalid_format",
					format: "url",
					input: n.value,
					inst: e,
					continue: !t.abort
				});
				return;
			}
			if (i === !0) {
				n.value = Zu(r);
				return;
			}
			t.hostname && !Qu(i, t.hostname) && n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: t.hostname.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			}), t.protocol && !$u(i, t.protocol) && n.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: t.protocol.source,
				input: n.value,
				inst: e,
				continue: !t.abort
			}), n.value = t.normalize ? i.href : Zu(r);
			return;
		} catch {
			n.issues.push({
				code: "invalid_format",
				format: "url",
				input: n.value,
				inst: e,
				continue: !t.abort
			});
		}
	};
}), td = /*@__PURE__*/ Y("$ZodEmoji", (e, t) => {
	t.pattern ??= tu(), Z.init(e, t);
}), nd = /*@__PURE__*/ Y("$ZodNanoID", (e, t) => {
	if (t.length !== void 0 && (!Number.isInteger(t.length) || t.length < 1)) throw Error(`Invalid nanoid length: ${t.length}`);
	t.pattern ??= t.length === void 0 ? Jl : Yl(t.length), Z.init(e, t);
}), rd = /*@__PURE__*/ Y("$ZodCUID", (e, t) => {
	t.pattern ??= Ul, Z.init(e, t);
}), id = /*@__PURE__*/ Y("$ZodCUID2", (e, t) => {
	t.pattern ??= Wl, Z.init(e, t);
}), ad = /*@__PURE__*/ Y("$ZodULID", (e, t) => {
	t.pattern ??= Gl, Z.init(e, t);
}), od = /*@__PURE__*/ Y("$ZodXID", (e, t) => {
	t.pattern ??= Kl, Z.init(e, t);
}), sd = /*@__PURE__*/ Y("$ZodKSUID", (e, t) => {
	t.pattern ??= ql, Z.init(e, t);
}), cd = /*@__PURE__*/ Y("$ZodISODateTime", (e, t) => {
	t.pattern ??= hu(t), Z.init(e, t);
}), ld = /*@__PURE__*/ Y("$ZodISODate", (e, t) => {
	t.pattern ??= fu, Z.init(e, t);
}), ud = /*@__PURE__*/ Y("$ZodISOTime", (e, t) => {
	t.pattern ??= mu(t), Z.init(e, t);
}), dd = /*@__PURE__*/ Y("$ZodISODuration", (e, t) => {
	t.pattern ??= Xl, Z.init(e, t);
}), fd = /*@__PURE__*/ Y("$ZodIPv4", (e, t) => {
	t.pattern ??= nu, Z.init(e, t);
}), pd = /^[0-9a-fA-F:.]+$/;
function md(e) {
	return pd.test(e) ? qu(`http://[${e}]`) : !1;
}
var hd = /*@__PURE__*/ Y("$ZodIPv6", (e, t) => {
	t.pattern ??= ru, Z.init(e, t), e._zod.check = (n) => {
		md(n.value) || n.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), gd = /*@__PURE__*/ Y("$ZodCIDRv4", (e, t) => {
	t.pattern ??= iu, Z.init(e, t);
});
function _d(e) {
	let t = e.split("/");
	if (t.length !== 2) return !1;
	let [n, r] = t;
	if (!r) return !1;
	let i = Number(r);
	return `${i}` !== r || i < 0 || i > 128 ? !1 : md(n);
}
var vd = /*@__PURE__*/ Y("$ZodCIDRv6", (e, t) => {
	t.pattern ??= au, Z.init(e, t), e._zod.check = (n) => {
		_d(n.value) || n.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
});
function yd(e) {
	if (e === "") return !0;
	if (/\s/.test(e) || e.length % 4 != 0) return !1;
	try {
		return atob(e), !0;
	} catch {
		return !1;
	}
}
var bd = /^[0-9a-zA-Z+/]*={0,2}$/, xd = /*@__PURE__*/ Y("$ZodBase64", (e, t) => {
	t.pattern ??= bd, Z.init(e, t), e._zod.check = (n) => {
		yd(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Sd = /^[A-Za-z0-9_-]*$/;
function Cd(e) {
	if (!Sd.test(e)) return !1;
	let t = e.replace(/[-_]/g, (e) => e === "-" ? "+" : "/");
	return yd(t.padEnd(Math.ceil(t.length / 4) * 4, "="));
}
var wd = /*@__PURE__*/ Y("$ZodBase64URL", (e, t) => {
	t.pattern ??= Sd, Z.init(e, t), e._zod.check = (n) => {
		Cd(n.value) || n.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Td = /*@__PURE__*/ Y("$ZodE164", (e, t) => {
	t.pattern ??= lu, Z.init(e, t);
});
function Ed(e, t = null) {
	try {
		let n = e.split(".");
		if (n.length !== 3) return !1;
		let [r] = n;
		if (!r) return !1;
		let i = JSON.parse(atob(r));
		return !("typ" in i && i?.typ !== "JWT" || !i.alg || t && (!("alg" in i) || i.alg !== t));
	} catch {
		return !1;
	}
}
var Dd = /*@__PURE__*/ Y("$ZodJWT", (e, t) => {
	Z.init(e, t), e._zod.check = (n) => {
		Ed(n.value, t.alg) || n.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: n.value,
			inst: e,
			continue: !t.abort
		});
	};
}), Od = /*@__PURE__*/ Y("$ZodNumber", (e, t) => {
	X.init(e, t), e._zod.pattern = _u, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = Number(n.value);
		} catch {}
		let i = n.value;
		if (typeof i == "number" && !Number.isNaN(i) && Number.isFinite(i)) return n;
		let a = typeof i == "number" ? Number.isNaN(i) ? "NaN" : Number.isFinite(i) ? void 0 : String(i) : void 0;
		return n.issues.push({
			expected: "number",
			code: "invalid_type",
			input: i,
			inst: e,
			...a ? { received: a } : {}
		}), n;
	};
}), kd = /*@__PURE__*/ Y("$ZodNumberFormat", (e, t) => {
	Eu.init(e, t), Od.init(e, t);
}), Ad = /*@__PURE__*/ Y("$ZodUnknown", (e, t) => {
	X.init(e, t), e._zod.parse = (e) => e;
}), jd = /*@__PURE__*/ Y("$ZodNever", (e, t) => {
	X.init(e, t), e._zod.parse = (t, n) => (t.issues.push({
		expected: "never",
		code: "invalid_type",
		input: t.value,
		inst: e
	}), t);
});
function Md(e, t) {
	let n = Vc(e._zod.def.checks);
	if (!n.length) return;
	let r = Math.min(...n.map((e) => e[0])), i = e._zod.parse;
	e._zod.parse = (n, a) => {
		let o = t(n.value);
		if (o > r && !a?.skipChecks && a?.direction !== "backward") {
			for (let [t, r] of Vc(e._zod.def.checks)) if (o > t && r._zod.def.when(n)) {
				let t = n.issues.length;
				return r._zod.check(n), n.issues[t].continue = !1, Hc(n.issues, t, e), n;
			}
		}
		return i(n, a);
	};
}
var Nd = (e) => Array.isArray(e) ? e.length : -1;
function Pd(e, t, n) {
	e.issues.length && t.issues.push(...zc(n, e.issues)), t.value[n] = e.value;
}
var Fd = /*@__PURE__*/ Y("$ZodArray", (e, t) => {
	X.init(e, t);
	let n = pl.memoizer;
	n?.attach(e), e._zod.parse = (r, i) => {
		let a = r.value;
		if (!Array.isArray(a)) return r.issues.push({
			expected: "array",
			code: "invalid_type",
			input: a,
			inst: e
		}), r;
		r.value = n ? n.alloc(e, r, Array(a.length), i) : Array(a.length);
		let o = [], s = i?.abortEarly;
		for (let e = 0; e < a.length; e++) {
			let n = a[e], c = t.element._zod.run({
				value: n,
				issues: []
			}, i);
			if (c instanceof Promise) o.push(c.then((t) => Pd(t, r, e)));
			else if (Pd(c, r, e), s && c.issues.length !== 0 && Lc(c)) break;
		}
		return o.length ? Promise.all(o).then(() => r) : r;
	}, Md(e, Nd);
});
function Id(e, t, n, r, i, a) {
	let o = n in r, s = a === "optional";
	if (o || !s || i !== "optional") {
		if (e.issues.length) {
			if (i !== void 0 && s && !o) return;
			t.issues.push(...zc(n, e.issues));
		}
		!o && i === void 0 ? e.issues.length || t.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [n]
		}) : e.value === void 0 ? (o || i === "defaulted" && !s) && (t.value[n] = void 0) : t.value[n] = e.value;
	}
}
var Ld = [];
function Rd(e) {
	let t = Object.keys(e.shape), n = Object.getOwnPropertySymbols(e.shape), r = n.length ? n : Ld, i = r.length ? [...t, ...r] : t;
	for (let t of i) if (!e.shape?.[t]?._zod?.traits?.has("$ZodType")) throw Error(`Invalid element at key "${String(t)}": expected a Zod schema`);
	let a = Tc(e.shape);
	return {
		...e,
		allKeys: i,
		symbolKeys: r,
		keySet: new Set(t),
		numKeys: t.length,
		optionalKeys: new Set(a)
	};
}
function zd(e, t, n, r, i, a, o) {
	let s = [], c = i.keySet, l = i.catchall._zod, u = l.def.type, d = l.optin, f = l.optout, p = 0;
	for (let i in t) {
		if (o && n.issues.length !== p) {
			if (Lc(n, p)) break;
			p = n.issues.length;
		}
		if (c.has(i)) continue;
		if (i === "__proto__") {
			u === "never" && s.push(i);
			continue;
		}
		if (u === "never") {
			s.push(i);
			continue;
		}
		let a = l.run({
			value: t[i],
			issues: []
		}, r);
		a instanceof Promise ? e.push(a.then((e) => Id(e, n, i, t, d, f))) : Id(a, n, i, t, d, f);
	}
	return s.length && n.issues.push({
		code: "unrecognized_keys",
		keys: s,
		input: t,
		inst: a,
		continue: !0
	}), e.length ? Promise.all(e).then(() => n) : n;
}
var Bd = /*@__PURE__*/ Y("$ZodObject", (e, t) => {
	X.init(e, t);
	let n = Object.getOwnPropertyDescriptor(t, "shape"), r = n?.get ? n.get.raw : t.shape ?? {};
	if (r) {
		let e = () => {
			let n = { ...r };
			return Object.defineProperty(t, "shape", { value: n }), e.raw = n, n;
		};
		e.raw = r, Object.defineProperty(t, "shape", { get: e });
	}
	let i = nc(() => Rd(t));
	J(e, "propValues", (e) => {
		let t = e.def.shape, n = {};
		for (let e in t) {
			let r = t[e]._zod;
			if (r.values) {
				Object.prototype.hasOwnProperty.call(n, e) || oc(n, e, /* @__PURE__ */ new Set());
				for (let t of r.values) n[e].add(t);
				r.optin !== void 0 && n[e].add(void 0);
			}
		}
		return n;
	});
	let a = _c, o = t.catchall, s, c = pl.memoizer;
	c?.attach(e), e._zod.parse = (t, n) => {
		s ??= i.value;
		let r = t.value;
		if (!a(r)) return t.issues.push({
			expected: "object",
			code: "invalid_type",
			input: r,
			inst: e
		}), t;
		t.value = c ? c.alloc(e, t, {}, n) : {};
		let l = [], u = s.shape, d = n?.abortEarly, f = t.issues.length;
		for (let e of s.allKeys) {
			if (d && t.issues.length !== f) {
				if (Lc(t, f)) break;
				f = t.issues.length;
			}
			if (e === "__proto__") continue;
			let i = u[e], a = i._zod.optin, o = i._zod.optout, s = i._zod.run({
				value: r[e],
				issues: []
			}, n);
			s instanceof Promise ? l.push(s.then((n) => Id(n, t, e, r, a, o))) : Id(s, t, e, r, a, o);
		}
		return o ? zd(l, r, t, n, i.value, e, d === !0) : l.length ? Promise.all(l).then(() => t) : t;
	};
}), Vd = /*@__PURE__*/ Y("$ZodObjectJIT", (e, t) => {
	Bd.init(e, t);
	let n = e._zod.parse, r = nc(() => Rd(t)), i = pl.memoizer, a = (t) => {
		let n = r.value, a = n.symbolKeys, o = new Ru(["payload", "ctx"], {
			shape: t,
			inst: e,
			memo: i,
			syms: a
		}), s = (e) => `shape[${e}]._zod.run({ value: input[${e}], issues: [] }, ctx)`, c = (e, t) => `
          let ${e}_ab = false;
          for (let i = 0; i < ${e}.issues.length; i++) {
            const iss = ${e}.issues[i];
            iss.path = iss.path ? [${t}, ...iss.path] : [${t}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${e}_ab = true;
          }
          if (${e}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
		o.write("const input = payload.value;");
		let l = Object.create(null), u = 0;
		for (let e of n.allKeys) l[e] = `key_${u++}`;
		o.write(i ? "const newResult = memo.alloc(inst, payload, {}, ctx);" : "const newResult = {};");
		for (let e of n.allKeys) {
			if (e === "__proto__") continue;
			let n = l[e], r = typeof e == "symbol" ? `syms[${a.indexOf(e)}]` : mc(e), i = `${r} in input`, u = t[e], d = u?._zod?.optin, f = d !== void 0, p = u?._zod?.optout === "optional";
			if (o.write(`const ${n} = ${s(r)};`), f && p) {
				let e = d === "optional" ? `${n}_present` : `${n}.value !== undefined || ${n}_present`;
				o.write(`
        const ${n}_present = ${i};
        if (!${n}.issues.length || ${n}_present) {
          if (${n}.issues.length) {${c(n, r)}
          }

          if (${e}) {
            newResult[${r}] = ${n}.value;
          }
        }

      `);
			} else f ? (o.write(`
        if (${n}.issues.length) {${c(n, r)}
        }
      `), d === "defaulted" ? o.write(`newResult[${r}] = ${n}.value;`) : o.write(`
        if (${n}.value !== undefined || ${i}) {
          newResult[${r}] = ${n}.value;
        }
      `)) : o.write(`
        const ${n}_present = ${i};
        if (${n}.issues.length) {${c(n, r)}
        }
        if (!${n}_present && !${n}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${r}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${n}_present) {
          newResult[${r}] = ${n}.value;
        }

      `);
		}
		return o.write("payload.value = newResult;"), o.write("return payload;"), o.compile();
	}, o, s = _c, c = !pl.jitless, l = c && vc.value, u = t.catchall, d;
	e._zod.parse = (i, f) => {
		d ??= r.value;
		let p = i.value;
		return s(p) ? c && l && f?.async === !1 && f.jitless !== !0 ? (o ||= a(t.shape), i = o(i, f), u ? zd([], p, i, f, d, e, f?.abortEarly === !0) : i) : n(i, f) : (i.issues.push({
			expected: "object",
			code: "invalid_type",
			input: p,
			inst: e
		}), i);
	};
});
function Hd(e, t, n, r) {
	for (let n of e) if (n.issues.length === 0) return t.value = n.value, t;
	let i = e.filter((e) => !Lc(e));
	return i.length === 1 ? (t.value = i[0].value, i[0]) : (t.issues.push({
		code: "invalid_union",
		input: t.value,
		inst: n,
		errors: e.map((e) => e.issues.map((e) => Uc(e, r, ml())))
	}), t);
}
var Ud = /*@__PURE__*/ Y("$ZodUnion", (e, t) => {
	X.init(e, t), J(e, "optin", (e) => e.def.options.some((e) => e._zod.optin === "defaulted") ? "defaulted" : e.def.options.some((e) => e._zod.optin !== void 0) ? "optional" : void 0), J(e, "optout", (e) => e.def.options.some((e) => e._zod.optout === "optional") ? "optional" : void 0), J(e, "values", (e) => {
		if (e.def.options.every((e) => e._zod.values)) return new Set(e.def.options.flatMap((e) => Array.from(e._zod.values)));
	}), J(e, "pattern", (e) => {
		if (e.def.options.every((e) => e._zod.pattern)) {
			let t = e.def.options.map((e) => e._zod.pattern);
			return RegExp(`^(${t.map((e) => ic(e.source)).join("|")})$`);
		}
	});
	let n = t.options.length === 1 ? t.options[0]._zod.run : null;
	e._zod.parse = (r, i) => {
		if (n) return n(r, i);
		let a = !1, o = [];
		for (let e of t.options) {
			let t = e._zod.run({
				value: r.value,
				issues: []
			}, i);
			if (t instanceof Promise) o.push(t), a = !0;
			else {
				if (t.issues.length === 0) return t;
				o.push(t);
			}
		}
		return a ? Promise.all(o).then((t) => Hd(t, r, e, i)) : Hd(o, r, e, i);
	};
});
function Wd(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.options) {
		let r = n._zod.propValues?.[e.discriminator];
		if (!r || r.size === 0) throw Error(`Invalid discriminated union option at index "${e.options.indexOf(n)}"`);
		for (let e of r) if (t.has(e)) {
			if (e !== void 0) throw Error(`Duplicate discriminator value "${String(e)}"`);
			t.set(e, null);
		} else t.set(e, n);
	}
	return t;
}
var Gd = /*@__PURE__*/ Y("$ZodDiscriminatedUnion", (e, t) => {
	t.inclusive = !1, Ud.init(e, t);
	let n = e._zod.parse;
	J(e, "propValues", (e) => {
		let t = {}, n = 0;
		for (let r of e.def.options) {
			let i = r._zod.propValues;
			if (!i || Object.keys(i).length === 0) throw Error(`Invalid discriminated union option at index "${e.def.options.indexOf(r)}"`);
			i[e.def.discriminator]?.has(void 0) && n++;
			for (let [e, n] of Object.entries(i)) {
				Object.prototype.hasOwnProperty.call(t, e) || oc(t, e, /* @__PURE__ */ new Set());
				for (let r of n) t[e].add(r);
			}
		}
		return !e.def.unionFallback && n > 1 && t[e.def.discriminator]?.delete(void 0), t;
	}), t.options.forEach((e, n) => {
		let r = sc(e._zod.def);
		if (r && !Object.prototype.hasOwnProperty.call(r, t.discriminator)) throw Error(`Invalid discriminated union option at index "${n}"`);
	});
	let r = nc(() => Wd(t));
	e._zod.parse = (i, a) => {
		let o = i.value;
		if (!_c(o)) return i.issues.push({
			code: "invalid_type",
			expected: "object",
			input: o,
			inst: e
		}), i;
		let s = o?.[t.discriminator], c = r.value.get(s);
		return c && (s !== void 0 || a.direction !== "backward") ? c._zod.run(i, a) : t.unionFallback || a.direction === "backward" ? n(i, a) : (i.issues.push({
			code: "invalid_union",
			errors: [],
			note: "No matching discriminator",
			discriminator: t.discriminator,
			options: Array.from(r.value.keys()).filter((e) => r.value.get(e) !== null),
			input: o,
			path: [t.discriminator],
			inst: e
		}), i);
	};
}), Kd = /*@__PURE__*/ Y("$ZodIntersection", (e, t) => {
	X.init(e, t), e._zod.parse = (e, n) => {
		let r = e.value, i = t.left._zod.run({
			value: r,
			issues: []
		}, n), a = t.right._zod.run({
			value: r,
			issues: []
		}, n);
		return i instanceof Promise || a instanceof Promise ? Promise.all([i, a]).then(([t, n]) => Jd(e, t, n)) : Jd(e, i, a);
	};
});
function qd(e, t) {
	if (e === t || e instanceof Date && t instanceof Date && +e == +t) return {
		valid: !0,
		data: e
	};
	if (yc(e) && yc(t)) {
		let n = Object.keys(t), r = Object.keys(e).filter((e) => n.indexOf(e) !== -1), i = {
			...e,
			...t
		};
		Object.prototype.hasOwnProperty.call(i, "__proto__") && delete i.__proto__;
		for (let n of r) {
			if (n === "__proto__") continue;
			let r = qd(e[n], t[n]);
			if (!r.valid) return {
				valid: !1,
				mergeErrorPath: [n, ...r.mergeErrorPath]
			};
			i[n] = r.data;
		}
		return {
			valid: !0,
			data: i
		};
	}
	if (Array.isArray(e) && Array.isArray(t)) {
		if (e.length !== t.length) return {
			valid: !1,
			mergeErrorPath: []
		};
		let n = [];
		for (let r = 0; r < e.length; r++) {
			let i = e[r], a = t[r], o = qd(i, a);
			if (!o.valid) return {
				valid: !1,
				mergeErrorPath: [r, ...o.mergeErrorPath]
			};
			n.push(o.data);
		}
		return {
			valid: !0,
			data: n
		};
	}
	return {
		valid: !1,
		mergeErrorPath: []
	};
}
function Jd(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i, a = /* @__PURE__ */ new Map(), o = (e, t) => {
		let n;
		if (e.code === "unrecognized_keys" && !e.path?.length) i ??= e, n = e.keys;
		else if (e.code === "invalid_key" && e.origin === "record" && e.path?.length === 1) {
			let t = String(e.path[0]);
			a.has(t) || a.set(t, e), n = [t];
		} else return !1;
		for (let e of n) r.has(e) || r.set(e, {}), r.get(e)[t] = !0;
		return !0;
	};
	for (let n of t.issues) o(n, "l") || e.issues.push(n);
	for (let t of n.issues) o(t, "r") || e.issues.push(t);
	let s = [...r].filter(([, e]) => e.l && e.r).map(([e]) => e);
	if (s.length) {
		let t = i ? s.filter((e) => i.keys.includes(e)) : [];
		t.length && e.issues.push({
			...i,
			keys: t
		});
		for (let n of s) !t.includes(n) && a.has(n) && e.issues.push(a.get(n));
	}
	let c = qd(t.value, n.value);
	if (!c.valid) {
		if (Lc(e)) return e;
		throw Error(`Unmergable intersection. Error path: ${JSON.stringify(c.mergeErrorPath)}`);
	}
	return e.value = c.data, e;
}
var Yd = /*@__PURE__*/ Y("$ZodEnum", (e, t) => {
	X.init(e, t);
	let n = Qs(t.entries), r = new Set(n);
	e._zod.values = r, J(e, "pattern", (e) => {
		let t = Qs(e.def.entries).filter((e) => xc.has(typeof e));
		return RegExp(t.length ? `^(${t.map((e) => Sc(e.toString())).join("|")})$` : "^[^\\s\\S]$");
	}), e._zod.parse = (t, i) => {
		let a = t.value;
		return r.has(a) || t.issues.push({
			code: "invalid_value",
			values: n,
			input: a,
			inst: e
		}), t;
	};
}), Xd = /*@__PURE__*/ Y("$ZodLiteral", (e, t) => {
	X.init(e, t);
	let n = new Set(t.values);
	e._zod.values = n, J(e, "pattern", (e) => {
		let t = e.def.values;
		return RegExp(t.length ? `^(${t.map((e) => typeof e == "string" ? Sc(e) : e ? Sc(e.toString()) : String(e)).join("|")})$` : "^[^\\s\\S]$");
	}), e._zod.parse = (r, i) => {
		let a = r.value;
		return n.has(a) || r.issues.push({
			code: "invalid_value",
			values: t.values,
			input: a,
			inst: e
		}), r;
	};
}), Zd = /*@__PURE__*/ Y("$ZodTransform", (e, t) => {
	X.init(e, t), e._zod.optin = "optional", pl.memoizer?.guard(e), e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new fl(e.constructor.name);
		let i = t.transform(n.value, n);
		if (r.async) return (i instanceof Promise ? i : Promise.resolve(i)).then((e) => (n.value = e, n));
		if (i instanceof Promise) throw new dl();
		return n.value = i, n;
	};
});
function Qd(e, t) {
	return e.value = t.issues.length ? void 0 : t.value, e;
}
var $d = /*@__PURE__*/ Y("$ZodOptional", (e, t) => {
	X.init(e, t), J(e, "optin", (e) => e.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), e._zod.optout = "optional", J(e, "values", (e) => {
		let t = e.def.innerType._zod.values;
		return t ? /* @__PURE__ */ new Set([...t, void 0]) : void 0;
	}), J(e, "pattern", (e) => {
		let t = e.def.innerType._zod.pattern;
		return t ? RegExp(`^(${ic(t.source)})?$`) : void 0;
	}), e._zod.parse = (e, n) => {
		if (e.value === void 0) {
			if (t.innerType._zod.optin !== "defaulted") return e;
			let r = t.innerType._zod.run({
				value: e.value,
				issues: []
			}, n);
			return r instanceof Promise ? r.then((t) => Qd(e, t)) : Qd(e, r);
		}
		return t.innerType._zod.run(e, n);
	};
}), ef = /*@__PURE__*/ Y("$ZodExactOptional", (e, t) => {
	$d.init(e, t), J(e, "values", (e) => e.def.innerType._zod.values), J(e, "pattern", (e) => e.def.innerType._zod.pattern), e._zod.parse = (e, n) => t.innerType._zod.run(e, n);
}), tf = /*@__PURE__*/ Y("$ZodNullable", (e, t) => {
	X.init(e, t), J(e, "optin", (e) => e.def.innerType._zod.optin), J(e, "optout", (e) => e.def.innerType._zod.optout), J(e, "pattern", (e) => {
		let t = e.def.innerType._zod.pattern;
		return t ? RegExp(`^(${ic(t.source)}|null)$`) : void 0;
	}), J(e, "values", (e) => e.def.innerType._zod.values ? /* @__PURE__ */ new Set([...e.def.innerType._zod.values, null]) : void 0), e._zod.parse = (e, n) => e.value === null ? e : t.innerType._zod.run(e, n);
}), nf = /*@__PURE__*/ Y("$ZodDefault", (e, t) => {
	X.init(e, t), e._zod.optin = "defaulted", J(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		if (e.value === void 0) return e.value = t.defaultValue, e;
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => rf(e, t)) : rf(r, t);
	};
});
function rf(e, t) {
	return e.value === void 0 && (e.value = t.defaultValue), e;
}
var af = /*@__PURE__*/ Y("$ZodPrefault", (e, t) => {
	X.init(e, t), e._zod.optin = "defaulted", J(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => (n.direction === "backward" || e.value === void 0 && (e.value = t.defaultValue), t.innerType._zod.run(e, n));
}), of = /*@__PURE__*/ Y("$ZodNonOptional", (e, t) => {
	X.init(e, t), J(e, "values", (e) => {
		let t = e.def.innerType._zod.values;
		return t ? new Set([...t].filter((e) => e !== void 0)) : void 0;
	}), e._zod.parse = (n, r) => {
		let i = t.innerType._zod.run(n, r);
		return i instanceof Promise ? i.then((t) => sf(t, e)) : sf(i, e);
	};
});
function sf(e, t) {
	return !e.issues.length && e.value === void 0 && e.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: e.value,
		inst: t
	}), e;
}
function cf(e, t, n, r) {
	return t.issues.length ? (e.value = n.catchValue({
		...t,
		value: e.value,
		error: { issues: t.issues.map((e) => Uc(e, r, ml())) },
		input: e.value
	}), e) : (e.value = t.value, t.memo && (e.memo = !0), e);
}
var lf = /*@__PURE__*/ Y("$ZodCatch", (e, t) => {
	X.init(e, t), J(e, "optin", (e) => e.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), J(e, "optout", (e) => e.def.innerType._zod.optout), J(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run({
			value: e.value,
			issues: []
		}, n);
		return r instanceof Promise ? r.then((r) => cf(e, r, t, n)) : cf(e, r, t, n);
	};
}), uf = /*@__PURE__*/ Y("$ZodPipe", (e, t) => {
	X.init(e, t), J(e, "values", (e) => e.def.in._zod.values), J(e, "optin", (e) => e.def.in._zod.optin), J(e, "optout", (e) => e.def.out._zod.optout), J(e, "propValues", (e) => e.def.in._zod.propValues), e._zod.parse = (e, n) => {
		if (n.direction === "backward") {
			let r = t.out._zod.run(e, n);
			return r instanceof Promise ? r.then((e) => df(e, t.in, n)) : df(r, t.in, n);
		}
		let r = t.in._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => df(e, t.out, n)) : df(r, t.out, n);
	};
});
function df(e, t, n) {
	return e.issues.some((e) => e.code !== "unrecognized_keys") ? (e.aborted = !0, e) : t._zod.run({
		value: e.value,
		issues: e.issues
	}, n);
}
var ff = /*@__PURE__*/ Y("$ZodReadonly", (e, t) => {
	X.init(e, t), J(e, "propValues", (e) => e.def.innerType._zod.propValues), J(e, "values", (e) => e.def.innerType._zod.values), J(e, "optin", (e) => e.def.innerType?._zod?.optin), J(e, "optout", (e) => e.def.innerType?._zod?.optout), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then(pf) : pf(r);
	};
});
function pf(e) {
	return e.memo || (e.value = Object.freeze(e.value)), e;
}
var mf = /*@__PURE__*/ Y("$ZodCustom", (e, t) => {
	bu.init(e, t), X.init(e, t), e._zod.parse = (e, t) => e, e._zod.check = (n) => {
		let r = n.value, i = t.fn(r);
		if (i instanceof Promise) return i.then((t) => hf(t, n, r, e));
		hf(i, n, r, e);
	};
});
function hf(e, t, n, r) {
	if (!e) {
		let e = {
			code: "custom",
			input: n,
			inst: r,
			path: [...r._zod.def.path ?? []],
			continue: !r._zod.def.abort
		};
		r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(Jc(e));
	}
}
// node_modules/zod/v4/core/memoizer.js
var gf = class extends Error {
	constructor() {
		super("Cannot parse a reference cycle that closes through a transform"), this.name = "ZodCyclicError";
	}
}, _f = "~memo", vf = [];
function yf(e) {
	return typeof e == "object" && !!e;
}
function bf(e) {
	return e.map((e) => e.path ? {
		...e,
		path: e.path.slice()
	} : { ...e });
}
var xf = /*@__PURE__*/ new WeakMap(), Sf = 0, Cf = 1, wf = 2;
function Tf(e, t, n) {
	let r = xf.get(e);
	if (r !== void 0) return r ? wf : Sf;
	if (t.has(e)) return wf;
	t.add(e);
	let i = Sf, a = (e) => {
		if (i !== wf && e?._zod) {
			let r = Tf(e, t, n);
			r > i && (i = r);
		}
	}, o = (e, r) => {
		let i = Sf;
		for (let a of Reflect.ownKeys(e)) {
			let o = Object.getOwnPropertyDescriptor(e, a);
			if (r && !o.enumerable) continue;
			let s = o.get ? Cf : o.value?._zod ? Tf(o.value, t, n) : Sf;
			s > i && (i = s);
		}
		return i;
	}, s = (e) => {
		e > i && (i = e);
	}, c = e._zod.def;
	switch (c.type) {
		case "object": {
			let e = sc(c);
			s(e ? o(e, !0) : Cf), a(c.catchall);
			break;
		}
		case "array":
			a(c.element);
			break;
		case "tuple":
			for (let e of c.items) a(e);
			a(c.rest);
			break;
		case "record":
		case "map":
			a(c.keyType), a(c.valueType);
			break;
		case "set":
			a(c.valueType);
			break;
		case "union":
			for (let e of c.options) a(e);
			break;
		case "intersection":
			a(c.left), a(c.right);
			break;
		case "optional":
		case "nullable":
		case "default":
		case "prefault":
		case "catch":
		case "readonly":
		case "nonoptional":
		case "promise":
		case "success":
			a(c.innerType);
			break;
		case "pipe":
			a(c.in), a(c.out);
			break;
		case "function":
			a(c.input), a(c.output);
			break;
		case "lazy": {
			let r = c._cachedInner ?? (n ? e._zod.innerType : void 0);
			s(r ? Tf(r, t, !1) : Cf);
			break;
		}
		case "template_literal":
		case "string":
		case "number":
		case "int":
		case "boolean":
		case "bigint":
		case "symbol":
		case "undefined":
		case "null":
		case "void":
		case "never":
		case "any":
		case "unknown":
		case "date":
		case "nan":
		case "enum":
		case "literal":
		case "file":
		case "transform":
		case "custom": break;
		default: for (let e in c) {
			let t = Object.getOwnPropertyDescriptor(c, e);
			if (!t || t.get) continue;
			let n = t.value;
			if (n && typeof n == "object") {
				if (n._zod) a(n);
				else if (Array.isArray(n)) for (let e of n) a(e);
			}
		}
	}
	return t.delete(e), Ef(e, i);
}
function Ef(e, t) {
	return t !== Cf && xf.set(e, t === wf), t;
}
function Df(e, t) {
	let n = e.buckets.get(t);
	return n || (n = /* @__PURE__ */ new WeakMap(), e.buckets.set(t, n)), n;
}
var Of, kf = [], Af = {
	alloc(e, t, n) {
		let r = Of;
		if (!r) return n;
		Of = void 0;
		let i = {
			value: n,
			issues: null
		};
		return r.set(t.value, i), kf.push(i), n;
	},
	guard(e) {
		var t;
		(t = e._zod).deferred ?? (t.deferred = []), e._zod.deferred.push(() => {
			let t = e._zod.parse, n = (e, n) => {
				if (n.direction !== "backward" && Mf(n, e.value)) throw new gf();
				return t(e, n);
			};
			e._zod.parse = n, e._zod.run === t && (e._zod.run = n);
		});
	},
	attach(e) {
		var t;
		let n, r = !1, i, a;
		(t = e._zod).deferred ?? (t.deferred = []), e._zod.deferred.push(() => {
			let t = e._zod.parse, o = (s, c) => {
				if (n === void 0) {
					let i = Tf(e, /* @__PURE__ */ new Set(), !1);
					if (i === Sf) return e._zod.parse = t, e._zod.run === o && (e._zod.run = t), t(s, c);
					i === wf || r ? n = !0 : r = !0;
				}
				let l = s.value;
				if (!yf(l)) return t(s, c);
				let u = c[_f];
				u || (u = {
					buckets: /* @__PURE__ */ new WeakMap(),
					backEdges: void 0
				}, c[_f] = u);
				let d;
				i === c ? d = a : (d = Df(u, e), i = c, a = d);
				let f = d.get(l);
				if (f) return s.value = f.value, f.issues ? f.issues.length && s.issues.push(...bf(f.issues)) : (s.memo = !0, u.backEdges ?? (u.backEdges = /* @__PURE__ */ new WeakSet()), u.backEdges.add(f.value)), s;
				Of = d;
				let p = kf.length, m = t(s, c);
				Of = void 0;
				let h = kf.length > p ? kf.pop() : void 0;
				return m instanceof Promise ? m.then((e) => (h && (h.issues = e.issues.length ? bf(e.issues) : vf), e)) : (h && (h.issues = m.issues.length ? bf(m.issues) : vf), m);
			};
			e._zod.parse = o, e._zod.run === t && (e._zod.run = o);
		});
	}
};
function jf() {
	return Af;
}
function Mf(e, t) {
	let n = e[_f]?.backEdges;
	return n !== void 0 && yf(t) && n.has(t);
}
// node_modules/zod/v4/locales/en.js
var Nf = () => {
	let e = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function t(t) {
		return e[t] ?? null;
	}
	let n = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		currency_code: "currency code",
		credit_card: "credit card number",
		iban: "IBAN",
		jwt: "JWT",
		template_literal: "input"
	}, r = { nan: "NaN" };
	function i(e, t) {
		return e === "number" && typeof t == "number" && !Number.isFinite(t) ? String(t) : r[e] ?? e;
	}
	return (e) => {
		switch (e.code) {
			case "invalid_type": return `Invalid input: expected ${i(e.expected)}, received ${i(qc(e.input), e.input)}`;
			case "invalid_value": return e.values.length === 1 ? `Invalid input: expected ${wc(e.values[0])}` : `Invalid option: expected one of ${$s(e.values, "|")}`;
			case "too_big": {
				let n = e.exact ? "exactly " : e.inclusive ? "<=" : "<", r = t(e.origin);
				return r ? `Too big: expected ${e.origin ?? "value"} to have ${n}${e.maximum.toString()} ${r.unit ?? "elements"}` : `Too big: expected ${e.origin ?? "value"} to be ${n}${e.maximum.toString()}`;
			}
			case "too_small": {
				let n = e.exact ? "exactly " : e.inclusive ? ">=" : ">", r = t(e.origin);
				return r ? `Too small: expected ${e.origin} to have ${n}${e.minimum.toString()} ${r.unit}` : `Too small: expected ${e.origin} to be ${n}${e.minimum.toString()}`;
			}
			case "invalid_format": {
				let t = e;
				return t.format === "starts_with" ? `Invalid string: must start with "${t.prefix}"` : t.format === "ends_with" ? `Invalid string: must end with "${t.suffix}"` : t.format === "includes" ? `Invalid string: must include "${t.includes}"` : t.format === "regex" ? `Invalid string: must match pattern ${t.pattern}` : `Invalid ${n[t.format] ?? e.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${e.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${e.keys.length > 1 ? "s" : ""}: ${$s(e.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${e.origin}`;
			case "invalid_union": return e.options && Array.isArray(e.options) && e.options.length > 0 ? `Invalid discriminator value. Expected ${e.options.map((e) => `'${e}'`).join(" | ")}` : e.inclusive === !1 ? "Invalid input: more than one option matched" : "Invalid input";
			case "invalid_element": return `Invalid value in ${e.origin}`;
			default: return "Invalid input";
		}
	};
};
function Pf() {
	return { localeError: Nf() };
}
// node_modules/zod/v4/core/registries.js
var Ff, If = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map();
	}
	add(e, ...t) {
		let n = t[0];
		return this._map.set(e, n), n && typeof n == "object" && "id" in n && this._idmap.set(n.id, e), this;
	}
	clear() {
		return this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map(), this;
	}
	remove(e) {
		let t = this._map.get(e);
		return t && typeof t == "object" && "id" in t && this._idmap.delete(t.id), this._map.delete(e), this;
	}
	get(e) {
		let t = e._zod.parent;
		if (t) {
			let n = { ...this.get(t) ?? {} };
			delete n.id;
			let r = {
				...n,
				...this._map.get(e)
			};
			return Object.keys(r).length ? r : void 0;
		}
		return this._map.get(e);
	}
	has(e) {
		return this._map.has(e);
	}
};
function Lf() {
	return new If();
}
(Ff = globalThis).__zod_globalRegistry ?? (Ff.__zod_globalRegistry = Lf());
var Rf = globalThis.__zod_globalRegistry;
// node_modules/zod/v4/core/api.js
function zf(e) {
	return e.checks &&= [...e.checks], e;
}
// @__NO_SIDE_EFFECTS__
function Bf(e, t) {
	return new e(zf({
		type: "string",
		...q(t)
	}));
}
// @__NO_SIDE_EFFECTS__
function Vf(e, t) {
	return new e({
		type: "string",
		format: "email",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Hf(e, t) {
	return new e({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Uf(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Wf(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v4",
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Gf(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v6",
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Kf(e, t) {
	return new e({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: !1,
		version: "v7",
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function qf(e, t) {
	return new e({
		type: "string",
		format: "url",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Jf(e, t) {
	return new e({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Yf(e, t) {
	return new e({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Xf(e, t) {
	return new e({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Zf(e, t) {
	return new e({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function Qf(e, t) {
	return new e({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function $f(e, t) {
	return new e({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ep(e, t) {
	return new e({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function tp(e, t) {
	return new e({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function np(e, t) {
	return new e({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function rp(e, t) {
	return new e({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ip(e, t) {
	return new e({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function ap(e, t) {
	return new e({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function op(e, t) {
	return new e({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function sp(e, t) {
	return new e({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function cp(e, t) {
	return new e({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: !1,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function lp(e, t) {
	return new e({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: !1,
		local: !1,
		precision: null,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function up(e, t) {
	return new e({
		type: "string",
		format: "date",
		check: "string_format",
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function dp(e, t) {
	return new e({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function fp(e, t) {
	return new e({
		type: "string",
		format: "duration",
		check: "string_format",
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function pp(e, t) {
	return new e(zf({
		type: "number",
		checks: [],
		...q(t)
	}));
}
// @__NO_SIDE_EFFECTS__
function mp(e, t) {
	return new e({
		type: "number",
		check: "number_format",
		abort: !1,
		format: "safeint",
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function hp(e) {
	return new e({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function gp(e, t) {
	return new e({
		type: "never",
		...q(t)
	});
}
// @__NO_SIDE_EFFECTS__
function _p(e, t) {
	return new Cu({
		check: "less_than",
		...q(t),
		value: e,
		inclusive: !1
	});
}
// @__NO_SIDE_EFFECTS__
function vp(e, t) {
	return new Cu({
		check: "less_than",
		...q(t),
		value: e,
		inclusive: !0
	});
}
// @__NO_SIDE_EFFECTS__
function yp(e, t) {
	return new wu({
		check: "greater_than",
		...q(t),
		value: e,
		inclusive: !1
	});
}
// @__NO_SIDE_EFFECTS__
function bp(e, t) {
	return new wu({
		check: "greater_than",
		...q(t),
		value: e,
		inclusive: !0
	});
}
// @__NO_SIDE_EFFECTS__
function xp(e, t) {
	return new Tu({
		check: "multiple_of",
		...q(t),
		value: e
	});
}
// @__NO_SIDE_EFFECTS__
function Sp(e, t) {
	return new Du({
		check: "max_length",
		...q(t),
		maximum: e
	});
}
// @__NO_SIDE_EFFECTS__
function Cp(e, t) {
	return new Ou({
		check: "min_length",
		...q(t),
		minimum: e
	});
}
// @__NO_SIDE_EFFECTS__
function wp(e, t) {
	return new ku({
		check: "length_equals",
		...q(t),
		length: e
	});
}
// @__NO_SIDE_EFFECTS__
function Tp(e, t) {
	return new ju({
		check: "string_format",
		format: "regex",
		...q(t),
		pattern: e
	});
}
// @__NO_SIDE_EFFECTS__
function Ep(e) {
	return new Mu({
		check: "string_format",
		format: "lowercase",
		...q(e)
	});
}
// @__NO_SIDE_EFFECTS__
function Dp(e) {
	return new Nu({
		check: "string_format",
		format: "uppercase",
		...q(e)
	});
}
// @__NO_SIDE_EFFECTS__
function Op(e, t) {
	return new Pu({
		check: "string_format",
		format: "includes",
		...q(t),
		includes: e
	});
}
// @__NO_SIDE_EFFECTS__
function kp(e, t) {
	return new Fu({
		check: "string_format",
		format: "starts_with",
		...q(t),
		prefix: e
	});
}
// @__NO_SIDE_EFFECTS__
function Ap(e, t) {
	return new Iu({
		check: "string_format",
		format: "ends_with",
		...q(t),
		suffix: e
	});
}
// @__NO_SIDE_EFFECTS__
function jp(e) {
	return new Lu({
		check: "overwrite",
		tx: e
	});
}
// @__NO_SIDE_EFFECTS__
function Mp(e) {
	return /* @__PURE__ */ jp((t) => t.normalize(e));
}
// @__NO_SIDE_EFFECTS__
function Np() {
	return /* @__PURE__ */ jp((e) => e.trim());
}
// @__NO_SIDE_EFFECTS__
function Pp() {
	return /* @__PURE__ */ jp((e) => e.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function Fp() {
	return /* @__PURE__ */ jp((e) => e.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function Ip() {
	return /* @__PURE__ */ jp((e) => hc(e));
}
// @__NO_SIDE_EFFECTS__
function Lp(e, t, n) {
	return new e({
		type: "array",
		element: t,
		...q(n)
	});
}
// @__NO_SIDE_EFFECTS__
function Rp(e, t, n) {
	return new e({
		type: "custom",
		check: "custom",
		fn: t,
		...q(n)
	});
}
// @__NO_SIDE_EFFECTS__
function zp(e, t) {
	let n = /* @__PURE__ */ Bp((t) => (t.addIssue = (e) => {
		if (typeof e == "string") t.issues.push(Jc(e, t.value, n._zod.def));
		else {
			let r = e;
			r.fatal && (r.continue = !1), r.code ??= "custom", "input" in r || (r.input = t.value), r.inst ??= n, r.continue ??= !n._zod.def.abort, t.issues.push(Jc(r));
		}
	}, e(t.value, t)), t);
	return n;
}
// @__NO_SIDE_EFFECTS__
function Bp(e, t) {
	let n = new bu({
		check: "custom",
		...q(t)
	});
	return n._zod.check = e, n;
}
// node_modules/zod/v4/core/to-json-schema.js
function Vp(e, ...t) {
	for (let n of t) for (let t of Reflect.ownKeys(n)) Object.prototype.propertyIsEnumerable.call(n, t) && oc(e, t, n[t]);
	return e;
}
function Hp(e) {
	let t = e?.target ?? "draft-2020-12";
	return t === "draft-4" && (t = "draft-04"), t === "draft-7" && (t = "draft-07"), {
		processors: e.processors ?? {},
		metadataRegistry: e?.metadata ?? Rf,
		target: t,
		unrepresentable: e?.unrepresentable ?? "throw",
		override: e?.override ?? (() => {}),
		io: e?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		sharedDefsExtractedFor: void 0,
		sharedEmitDoneFor: void 0,
		cycles: e?.cycles ?? "ref",
		reused: e?.reused ?? "inline",
		intersections: [],
		deferred: [],
		external: e?.external ?? void 0
	};
}
function Up(e, t, n, r, i) {
	let a = typeof t.unrepresentable == "function" ? t.unrepresentable({
		zodSchema: e,
		path: r.path,
		message: i
	}) : t.unrepresentable;
	if (a === "any") return !1;
	if (a === void 0 || a === "throw") throw Error(i);
	return Object.assign(n, a), !0;
}
function Wp(e, t, n = {
	path: [],
	schemaPath: []
}) {
	var r;
	let i = e._zod.def, a = t.seen.get(e);
	if (a) return a.count++, n.schemaPath.includes(e) && (a.cycle = n.path), a.schema;
	let o = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: n.path
	};
	t.seen.set(e, o), t.sharedDefsExtractedFor = void 0, t.sharedEmitDoneFor = void 0;
	let s = e._zod.toJSONSchema?.();
	if (s) o.schema = s;
	else {
		let r = {
			...n,
			schemaPath: [...n.schemaPath, e],
			path: n.path
		};
		if (e._zod.processJSONSchema) e._zod.processJSONSchema(t, o.schema, r);
		else {
			let n = o.schema, a = t.processors[i.type];
			if (!a) throw Error(`[toJSONSchema]: Non-representable type encountered: ${i.type}`);
			a(e, t, n, r);
		}
		let a = e._zod.parent;
		a && (o.ref ||= a, Wp(a, t, r), t.seen.get(a).isParent = !0);
	}
	let c = t.metadataRegistry.get(e);
	return c && Vp(o.schema, c), t.io === "input" && em(e) && (delete o.schema.examples, delete o.schema.default), t.io === "input" && "_prefault" in o.schema && ((r = o.schema).default ?? (r.default = o.schema._prefault)), delete o.schema._prefault, t.seen.get(e).schema;
}
function Gp(e) {
	return e.replace(/~/g, "~0").replace(/\//g, "~1");
}
function Kp(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	if (e.external && e.sharedDefsExtractedFor === e.external) return;
	let r = /* @__PURE__ */ new Map();
	for (let t of e.seen.entries()) {
		let n = e.metadataRegistry.get(t[0])?.id;
		if (n) {
			let e = r.get(n);
			if (e && e !== t[0]) throw Error(`Duplicate schema id "${n}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			r.set(n, t[0]);
		}
	}
	let i = (t) => {
		let r = e.target === "draft-2020-12" ? "$defs" : "definitions";
		if (e.external) {
			let n = e.external.registry.get(t[0])?.id, i = e.external.uri ?? ((e) => e);
			if (n) return { ref: i(n) };
			let a = t[1].defId ?? t[1].schema.id ?? `schema${e.counter++}`;
			return t[1].defId = a, {
				defId: a,
				ref: `${i("__shared")}#/${r}/${Gp(a)}`
			};
		}
		let i = `#/${r}/`;
		if (t[1] === n && !t[1].schema.id) return { ref: "#" };
		let a = t[1].schema.id ?? `__schema${e.counter++}`;
		return {
			defId: a,
			ref: i + Gp(a)
		};
	}, a = (e) => {
		if (e[1].schema.$ref) return;
		let t = e[1], { ref: n, defId: r } = i(e);
		t.def = { ...t.schema }, r && (t.defId = r);
		let a = t.schema;
		for (let e in a) delete a[e];
		a.$ref = n;
	};
	if (e.cycles === "throw") for (let t of e.seen.entries()) {
		let e = t[1];
		if (e.cycle) throw Error(`Cycle detected: #/${e.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (let n of e.seen.entries()) {
		let r = n[1];
		if (t === n[0]) a(n);
		else {
			if (e.external) {
				let r = e.external.registry.get(n[0])?.id;
				if (t !== n[0] && r) {
					a(n);
					continue;
				}
			}
			(e.metadataRegistry.get(n[0])?.id || r.cycle || r.count > 1 && e.reused === "ref") && a(n);
		}
	}
	e.external && (e.sharedDefsExtractedFor = e.external);
}
function qp(e) {
	let t = e.anyOf;
	if (!Array.isArray(t) || t.length === 0 || e.type !== void 0) return;
	let n = [];
	for (let e of t) {
		if (!e || typeof e != "object") return;
		qp(e);
		let t = Object.keys(e);
		if (t.length !== 1 || t[0] !== "type") return;
		let r = e.type;
		for (let e of Array.isArray(r) ? r : [r]) {
			if (typeof e != "string") return;
			n.includes(e) || n.push(e);
		}
	}
	delete e.anyOf, e.type = n.length === 1 ? n[0] : n;
}
var Jp = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]), Yp = ["oneOf", "anyOf"];
function Xp(e) {
	let t = e.additionalProperties;
	return t === void 0 || t === !1 || typeof t != "object" || !t ? null : Object.keys(t).length ? t : null;
}
function Zp(e) {
	let t = [];
	for (let n of e) {
		if (typeof n != "object" || n.type !== "object") return null;
		for (let e in n) if (!Jp.has(e)) return null;
		t.push(n);
	}
	let n = {}, r = /* @__PURE__ */ new Set();
	for (let e of t) {
		for (let r in e.properties) {
			if (Object.prototype.hasOwnProperty.call(n, r)) continue;
			let e = [];
			for (let n of t) {
				let t = n.properties?.[r] ?? Xp(n);
				t != null && (e.some((e) => JSON.stringify(e) === JSON.stringify(t)) || e.push(t));
			}
			oc(n, r, e.length === 1 ? e[0] : Zp(e) ?? { allOf: e });
		}
		for (let t of e.required ?? []) r.add(t);
	}
	let i = {
		type: "object",
		properties: n
	};
	if (r.size && (i.required = [...r]), t.every((e) => e.additionalProperties === !1)) i.additionalProperties = !1;
	else {
		let e = [];
		for (let n of t) {
			let t = Xp(n);
			t && !e.some((e) => JSON.stringify(e) === JSON.stringify(t)) && e.push(t);
		}
		e.length === 1 ? i.additionalProperties = e[0] : e.length > 1 && (i.additionalProperties = { allOf: e });
	}
	return i;
}
function Qp(e) {
	let t = e.allOf;
	if (!Array.isArray(t) || t.length < 2) return;
	for (let t of Jp) if (t in e) return;
	let n = t.filter((e) => Yp.some((t) => Array.isArray(e[t]))), r = null;
	if (!n.length) r = Zp(t);
	else {
		let e = n[0], i = Yp.find((t) => Array.isArray(e[t]));
		if (Object.keys(e).length !== 1) return;
		let a = t.filter((t) => t !== e), o = e[i].map((e) => Zp([...a, e]));
		if (o.some((e) => !e)) return;
		r = { [i]: o };
	}
	r && (delete e.allOf, Vp(e, r));
}
function $p(e, t) {
	let n = e.seen.get(t);
	if (!n) throw Error("Unprocessed schema. This is a bug in Zod.");
	let r = (t) => {
		let n = e.seen.get(t);
		if (n.ref === null) return;
		let i = n.def ?? n.schema, a = { ...i }, o = n.ref;
		if (n.ref = null, o) {
			r(o);
			let n = e.seen.get(o), s = n.schema;
			if (s.$ref && (e.target === "draft-07" || e.target === "draft-04" || e.target === "openapi-3.0") ? (i.allOf = i.allOf ?? [], i.allOf.push(s)) : Vp(i, s), Vp(i, a), t._zod.parent === o) for (let e in i) e !== "$ref" && e !== "allOf" && (e in a || delete i[e]);
			if (s.$ref && n.def) for (let e in i) e !== "$ref" && e !== "allOf" && e in n.def && JSON.stringify(i[e]) === JSON.stringify(n.def[e]) && delete i[e];
		}
		let s = t._zod.parent;
		if (s && s !== o) {
			r(s);
			let t = e.seen.get(s);
			if (t?.schema.$ref && (i.$ref = t.schema.$ref, t.def)) for (let e in i) e !== "$ref" && e !== "allOf" && e in t.def && JSON.stringify(i[e]) === JSON.stringify(t.def[e]) && delete i[e];
		}
		e.override({
			zodSchema: t,
			jsonSchema: i,
			path: n.path ?? []
		});
	};
	if (!e.external || e.sharedEmitDoneFor !== e.external) {
		for (let t of [...e.seen.entries()].reverse()) r(t[0]);
		if (e.target !== "openapi-3.0") for (let t of e.seen.entries()) qp(t[1].def ?? t[1].schema);
		for (let t of e.deferred) t();
		if (e.intersections.length) {
			let t = /* @__PURE__ */ new Map();
			for (let n of e.seen.values()) for (let e of [n.schema, n.def]) {
				let n = e?.allOf;
				if (!Array.isArray(n)) continue;
				let r = t.get(n);
				r ? r.push(e) : t.set(n, [e]);
			}
			for (let n of e.intersections) for (let e of t.get(n) ?? []) Qp(e);
		}
	}
	let i = {};
	if (e.target === "draft-2020-12" ? i.$schema = "https://json-schema.org/draft/2020-12/schema" : e.target === "draft-07" ? i.$schema = "http://json-schema.org/draft-07/schema#" : e.target === "draft-04" ? i.$schema = "http://json-schema.org/draft-04/schema#" : e.target, e.external?.uri) {
		let n = e.external.registry.get(t)?.id;
		if (!n) throw Error("Schema is missing an `id` property");
		i.$id = e.external.uri(n);
	}
	Vp(i, n.defId ? n.schema : n.def ?? n.schema);
	let a = e.metadataRegistry.get(t)?.id;
	a !== void 0 && i.id === a && delete i.id;
	let o = e.external?.defs ?? {};
	if (!e.external || e.sharedEmitDoneFor !== e.external) for (let t of e.seen.entries()) {
		let e = t[1];
		e.def && e.defId && (e.def.id === e.defId && delete e.def.id, oc(o, e.defId, e.def));
	}
	e.external && (e.sharedEmitDoneFor = e.external), e.external || Object.keys(o).length > 0 && (e.target === "draft-2020-12" ? i.$defs = o : i.definitions = o);
	try {
		let n = JSON.parse(JSON.stringify(i));
		return Object.defineProperty(n, "~standard", {
			value: {
				...t["~standard"],
				jsonSchema: {
					input: nm(t, "input", e.processors),
					output: nm(t, "output", e.processors)
				}
			},
			enumerable: !1,
			writable: !1
		}), n;
	} catch {
		throw Error("Error converting schema to JSON.");
	}
}
function em(e, t) {
	let n = t ?? { seen: /* @__PURE__ */ new Set() };
	if (n.seen.has(e)) return !1;
	n.seen.add(e);
	let r = e._zod.def;
	if (r.type === "transform") return !0;
	if (r.type === "array") return em(r.element, n);
	if (r.type === "set") return em(r.valueType, n);
	if (r.type === "lazy") return em(r.getter(), n);
	if (r.type === "promise" || r.type === "optional" || r.type === "nonoptional" || r.type === "nullable" || r.type === "readonly" || r.type === "default" || r.type === "prefault" || r.type === "catch") return em(r.innerType, n);
	if (r.type === "intersection") return em(r.left, n) || em(r.right, n);
	if (r.type === "record" || r.type === "map") return em(r.keyType, n) || em(r.valueType, n);
	if (r.type === "pipe") return e._zod.traits.has("$ZodCodec") ? !0 : em(r.in, n) || em(r.out, n);
	if (r.type === "object") {
		for (let e in r.shape) if (em(r.shape[e], n)) return !0;
		return !1;
	}
	if (r.type === "union") {
		for (let e of r.options) if (em(e, n)) return !0;
		return !1;
	}
	if (r.type === "tuple") {
		for (let e of r.items) if (em(e, n)) return !0;
		return !!(r.rest && em(r.rest, n));
	}
	return !1;
}
var tm = (e, t = {}) => (n) => {
	let r = Hp({
		...n,
		processors: t
	});
	return Wp(e, r), Kp(r, e), $p(r, e);
}, nm = (e, t, n = {}) => (r) => {
	let { libraryOptions: i, target: a } = r ?? {}, o = Hp({
		...i ?? {},
		target: a,
		io: t,
		processors: n
	});
	return Wp(e, o), Kp(o, e), $p(o, e);
}, rm = (e, t, n) => {
	(e[t] === void 0 || n > e[t]) && (e[t] = n);
}, im = (e, t, n) => {
	(e[t] === void 0 || n < e[t]) && (e[t] = n);
}, am = (e, t) => {
	rm(e, "minimum", t), im(e, "maximum", t);
}, om = (e, t) => {
	e.multipleOf ??= [], e.multipleOf.includes(t) || e.multipleOf.push(t);
}, sm = (e, t) => {
	e.patterns ??= /* @__PURE__ */ new Set(), e.patterns.add(t);
}, cm = (e, t) => {
	e.mime = e.mime ? e.mime.filter((e) => t.includes(e)) : [...t];
}, lm = (e, t) => {
	e.format = t, t.includes("int") && (e.isInt = !0);
}, um = (e, t) => rm(e, "minimum", t.minimum), dm = (e, t) => im(e, "maximum", t.maximum), fm = (e) => (t, n) => {
	lm(t, n.format);
	let [r, i] = e[n.format];
	rm(t, "minimum", r), im(t, "maximum", i);
}, pm = {
	greater_than: (e, t) => rm(e, t.inclusive ? "minimum" : "exclusiveMinimum", t.value),
	less_than: (e, t) => im(e, t.inclusive ? "maximum" : "exclusiveMaximum", t.value),
	multiple_of: (e, t) => om(e, t.value),
	number_format: fm(Ec),
	bigint_format: fm(Dc),
	min_length: um,
	max_length: dm,
	length_equals: (e, t) => am(e, t.length),
	min_size: um,
	max_size: dm,
	size_equals: (e, t) => am(e, t.size),
	string_format: (e, t) => {
		lm(e, t.format), t.pattern && sm(e, t.pattern), (t.format === "base64" || t.format === "base64url") && (e.contentEncoding = t.format), (t.local || t.precision === -1) && (e.laxFormat = !0);
	},
	mime_type: (e, t) => cm(e, t.mime)
};
function mm(e) {
	let t = {}, n = e._zod.def, r = e._zod.traits.has("$ZodCheck") ? [e, ...n.checks ?? []] : n.checks ?? [];
	for (let e of r) pm[e._zod.def.check]?.(t, e._zod.def);
	let i = e._zod.bag;
	i.minimum !== void 0 && rm(t, "minimum", i.minimum), i.exclusiveMinimum !== void 0 && rm(t, "exclusiveMinimum", i.exclusiveMinimum), i.maximum !== void 0 && im(t, "maximum", i.maximum), i.exclusiveMaximum !== void 0 && im(t, "exclusiveMaximum", i.exclusiveMaximum), i.multipleOf !== void 0 && om(t, i.multipleOf), i.format !== void 0 && (t.format ??= i.format, i.format.includes("int") && (t.isInt = !0)), i.mime && cm(t, i.mime);
	for (let e of i.patterns ?? []) sm(t, e);
	return t;
}
var hm = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
}, gm = /* @__PURE__ */ new Map([[bd, ou], [Sd, su]]), _m = (e) => gm.get(e) ?? e, vm = (e, t, n, r) => {
	let i = n;
	i.type = "string";
	let { minimum: a, maximum: o, format: s, patterns: c, contentEncoding: l, laxFormat: u } = mm(e);
	if (typeof a == "number" && (i.minLength = a), typeof o == "number" && (i.maxLength = o), s && (i.format = hm[s] ?? s, i.format === "" && delete i.format, (s === "time" || u) && delete i.format), l && (i.contentEncoding = l), c && c.size > 0) {
		let e = [...c].map(_m);
		e.length === 1 ? i.pattern = e[0].source : e.length > 1 && (i.allOf = [...e.map((e) => ({
			...t.target === "draft-07" || t.target === "draft-04" || t.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: e.source
		}))]);
	}
}, ym = (e, t, n, r) => {
	let i = n, { minimum: a, maximum: o, multipleOf: s, exclusiveMaximum: c, exclusiveMinimum: l, isInt: u } = mm(e);
	i.type = u ? "integer" : "number";
	let d = typeof l == "number" && l >= (a ?? -Infinity), f = typeof c == "number" && c <= (o ?? Infinity), p = t.target === "draft-04" || t.target === "openapi-3.0";
	if (d ? p ? (i.minimum = l, i.exclusiveMinimum = !0) : i.exclusiveMinimum = l : typeof a == "number" && (i.minimum = a), f ? p ? (i.maximum = c, i.exclusiveMaximum = !0) : i.exclusiveMaximum = c : typeof o == "number" && (i.maximum = o), s) {
		let n = /* @__PURE__ */ new Set();
		for (let a of s) Number.isFinite(a) && a !== 0 ? n.add(Math.abs(a)) : Up(e, t, i, r, `A multipleOf divisor of ${a} cannot be represented in JSON Schema`);
		let [a, ...o] = n;
		a !== void 0 && (i.multipleOf = a), o.length && (i.allOf = [...i.allOf ?? [], ...o.map((e) => ({ multipleOf: e }))]);
	}
}, bm = (e, t, n, r) => {
	n.not = {};
}, xm = (e, t, n, r) => {
	let i = e._zod.def, a = Qs(i.entries);
	a.length === 0 ? n.not = {} : (a.every((e) => typeof e == "number") && (n.type = "number"), a.every((e) => typeof e == "string") && (n.type = "string"), n.enum = a);
}, Sm = (e, t, n, r) => {
	let i = e._zod.def;
	if (i.values.length === 0) {
		n.not = {};
		return;
	}
	let a = [];
	for (let o of i.values) if (o === void 0) {
		if (Up(e, t, n, r, "Literal `undefined` cannot be represented in JSON Schema")) return;
	} else if (typeof o == "bigint") {
		if (Up(e, t, n, r, "BigInt literals cannot be represented in JSON Schema")) return;
		a.push(Number(o));
	} else a.push(o);
	if (a.length !== 0) {
		if (a.length === 1) {
			let e = a[0];
			n.type = e === null ? "null" : typeof e, t.target === "draft-04" || t.target === "openapi-3.0" ? n.enum = [e] : n.const = e;
		} else a.every((e) => typeof e == "number") && (n.type = "number"), a.every((e) => typeof e == "string") && (n.type = "string"), a.every((e) => typeof e == "boolean") && (n.type = "boolean"), a.every((e) => e === null) && (n.type = "null"), n.enum = a;
	}
}, Cm = (e, t, n, r) => {
	Up(e, t, n, r, "Custom types cannot be represented in JSON Schema");
}, wm = (e, t, n, r) => {
	Up(e, t, n, r, "Transforms cannot be represented in JSON Schema");
}, Tm = (e, t, n, r) => {
	let i = n, a = e._zod.def, { minimum: o, maximum: s } = mm(e);
	typeof o == "number" && (i.minItems = o), typeof s == "number" && (i.maxItems = s), i.type = "array", i.items = Wp(a.element, t, {
		...r,
		path: [...r.path, "items"]
	});
};
function Em(e) {
	let t = e._zod.def;
	return t.type === "pipe" && t.in._zod.traits.has("$ZodTransform") ? Em(t.out) : t.type === "catch" ? Em(t.innerType) : e._zod.optin;
}
var Dm = (e, t, n, r) => {
	let i = n, a = e._zod.def, o = a.shape;
	if (Object.getOwnPropertySymbols(o).length && Up(e, t, i, r, "Symbol keys cannot be represented in JSON Schema")) return;
	i.type = "object", i.properties = {};
	for (let e in o) oc(i.properties, e, Wp(o[e], t, {
		...r,
		path: [
			...r.path,
			"properties",
			e
		]
	}));
	let s = [];
	for (let e of Object.keys(o)) {
		let n = a.shape[e];
		(t.io === "input" ? Em(n) === void 0 : n._zod.optout === void 0) && s.push(e);
	}
	s.length > 0 && (i.required = s), a.catchall?._zod.def.type === "never" ? i.additionalProperties = !1 : a.catchall ? a.catchall && (i.additionalProperties = Wp(a.catchall, t, {
		...r,
		path: [...r.path, "additionalProperties"]
	})) : t.io === "output" && (i.additionalProperties = !1);
}, Om = (e, t, n, r) => {
	let i = e._zod.def, a = i.inclusive === !1, o = i.options.map((e, n) => Wp(e, t, {
		...r,
		path: [
			...r.path,
			a ? "oneOf" : "anyOf",
			n
		]
	}));
	a ? n.oneOf = o : n.anyOf = o;
}, km = (e, t, n, r) => {
	let i = e._zod.def, a = Wp(i.left, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			0
		]
	}), o = Wp(i.right, t, {
		...r,
		path: [
			...r.path,
			"allOf",
			1
		]
	}), s = (e) => "allOf" in e && Object.keys(e).length === 1, c = [...s(a) ? a.allOf : [a], ...s(o) ? o.allOf : [o]];
	n.allOf = c, t.intersections.push(c);
}, Am = (e, t, n, r) => {
	let i = e._zod.def, a = Wp(i.innerType, t, r), o = t.seen.get(e);
	t.target === "openapi-3.0" ? (o.ref = i.innerType, n.nullable = !0) : n.anyOf = [a, { type: "null" }];
}, jm = (e, t, n, r) => {
	let i = e._zod.def;
	Wp(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, Mm = Symbol();
function Nm(e, t, n, r, i) {
	let a = !1, o = JSON.stringify(e, (e, t) => typeof t == "bigint" ? (a = !0, null) : t);
	return a ? (Up(t, n, r, i, "BigInt defaults cannot be represented in JSON Schema"), Mm) : JSON.parse(o);
}
var Pm = (e, t, n, r) => {
	let i = e._zod.def;
	Wp(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
	let o = Nm(i.defaultValue, e, t, n, r);
	o !== Mm && (n.default = o);
}, Fm = (e, t, n, r) => {
	let i = e._zod.def;
	Wp(i.innerType, t, r);
	let a = t.seen.get(e);
	if (a.ref = i.innerType, t.io !== "input") return;
	let o = Nm(i.defaultValue, e, t, n, r);
	o !== Mm && (n._prefault = o);
}, Im = (e, t, n, r) => {
	let i = e._zod.def;
	Wp(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
	let o;
	try {
		o = i.catchValue(void 0);
	} catch {
		Up(e, t, n, r, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	n.default = o;
}, Lm = (e, t, n, r) => {
	let i = e._zod.def, a = i.in._zod.traits.has("$ZodTransform"), o = t.io === "input" ? a ? i.out : i.in : i.out;
	Wp(o, t, r);
	let s = t.seen.get(e);
	s.ref = o;
}, Rm = (e, t, n, r) => {
	let i = e._zod.def;
	Wp(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType, n.readOnly = !0;
}, zm = (e, t, n, r) => {
	let i = e._zod.def;
	Wp(i.innerType, t, r);
	let a = t.seen.get(e);
	a.ref = i.innerType;
}, Bm = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function Vm(e, t, n) {
	Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !1,
		get() {
			let e = n(this);
			return Object.defineProperty(this, t, {
				value: e,
				configurable: !0,
				writable: !0
			}), e;
		},
		set(e) {
			Object.defineProperty(this, t, {
				value: e,
				configurable: !0,
				writable: !0
			});
		}
	});
}
var Hm = /*@__PURE__*/ Y("ZodError", (e, t) => {
	bl.init(e, t), e.name = "ZodError";
	let n = Object.getPrototypeOf(e);
	Bm.has(n) || (Bm.add(n), Vm(n, "format", (e) => (t) => Cl(e, t)), Vm(n, "flatten", (e) => (t) => Sl(e, t)), Vm(n, "addIssue", (e) => (t) => {
		e.issues.push(t), e.message = JSON.stringify(e.issues, ec, 2);
	}), Vm(n, "addIssues", (e) => (t) => {
		e.issues.push(...t), e.message = JSON.stringify(e.issues, ec, 2);
	}), Object.defineProperty(n, "isEmpty", {
		configurable: !0,
		enumerable: !1,
		get() {
			return this.issues.length === 0;
		}
	}));
}, void 0, { Parent: Error }), Um = /* @__PURE__ */ Tl(Hm), Wm = /* @__PURE__ */ El(Hm), Gm = /* @__PURE__ */ Dl(Hm), Km = /* @__PURE__ */ kl(Hm), qm = /* @__PURE__ */ Fl(Hm), Jm = /* @__PURE__ */ Il(Hm), Ym = /* @__PURE__ */ Ll(Hm), Xm = /* @__PURE__ */ Rl(Hm), Zm = /* @__PURE__ */ zl(Hm), Qm = /* @__PURE__ */ Bl(Hm), $m = /* @__PURE__ */ Vl(Hm), eh = /* @__PURE__ */ Hl(Hm);
// node_modules/zod/v4/classic/schemas.js
function th() {
	pl.localeError || ml(Pf());
}
function nh() {
	pl.memoizer || ml({ memoizer: jf() });
}
var Q = /*@__PURE__*/ Y("ZodType", (e, t) => (th(), X.init(e, t), e.def = t, e.type = t.type, e), {
	check(...e) {
		let t = this.def;
		return this.clone(pc(t, { checks: [...t.checks ?? [], ...e.map((e) => typeof e == "function" ? { _zod: {
			check: e,
			def: { check: "custom" },
			onattach: []
		} } : e)] }), { parent: !0 });
	},
	with(...e) {
		return this.check(...e);
	},
	clone(e, t) {
		return Cc(this, e, t);
	},
	brand() {
		return this;
	},
	register(e, t) {
		return e.add(this, t), this;
	},
	refine(e, t) {
		return this.check(vg(e, t));
	},
	superRefine(e, t) {
		return this.check(yg(e, t));
	},
	overwrite(e) {
		return this.check(/* @__PURE__ */ jp(e));
	},
	optional() {
		return eg(this);
	},
	exactOptional() {
		return ng(this);
	},
	nullable() {
		return ig(this);
	},
	nullish() {
		return eg(ig(this));
	},
	nonoptional(e) {
		return ug(this, e);
	},
	array() {
		return Rh(this);
	},
	or(e) {
		return Hh([this, e]);
	},
	and(e) {
		return Kh(this, e);
	},
	transform(e) {
		return mg(this, Qh(e));
	},
	default(e) {
		return og(this, e);
	},
	prefault(e) {
		return cg(this, e);
	},
	catch(e) {
		return fg(this, e);
	},
	pipe(e) {
		return mg(this, e);
	},
	readonly() {
		return gg(this);
	},
	describe(e) {
		let t = this.clone();
		return Rf.add(t, { description: e }), t;
	},
	meta(...e) {
		if (e.length === 0) return Rf.get(this);
		let t = this.clone();
		return Rf.add(t, e[0]), t;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(e, ...t) {
		return t.length === 0 ? e(this) : e(this, ...t);
	},
	get "~standard"() {
		return Zc(this, "~standard", {
			...Hu(this),
			jsonSchema: {
				input: nm(this, "input"),
				output: nm(this, "output")
			}
		});
	},
	set "~standard"(e) {
		Xc(this, "~standard", e);
	},
	parse: function e(t, n) {
		return Um(this, t, n, { callee: e });
	},
	parseAsync: async function e(t, n) {
		return await Wm(this, t, n, { callee: e });
	},
	safeParse(e, t) {
		return Gm(this, e, t);
	},
	async safeParseAsync(e, t) {
		return Km(this, e, t);
	},
	get spa() {
		return this?.safeParseAsync;
	},
	set spa(e) {
		Xc(this, "spa", e);
	},
	validate(e, t) {
		return Ml(this, e, t);
	},
	validateAsync(e, t) {
		return Pl(this, e, t);
	},
	encode: function e(t, n) {
		return qm(this, t, n, { callee: e });
	},
	decode: function e(t, n) {
		return Jm(this, t, n, { callee: e });
	},
	encodeAsync: async function e(t, n) {
		return await Ym(this, t, n, { callee: e });
	},
	decodeAsync: async function e(t, n) {
		return await Xm(this, t, n, { callee: e });
	},
	safeEncode(e, t) {
		return Zm(this, e, t);
	},
	safeDecode(e, t) {
		return Qm(this, e, t);
	},
	async safeEncodeAsync(e, t) {
		return $m(this, e, t);
	},
	async safeDecodeAsync(e, t) {
		return eh(this, e, t);
	},
	toJSONSchema(e) {
		return tm(this, {})(e);
	},
	get description() {
		return Rf.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
}), rh = /*@__PURE__*/ Y("_ZodString", (e, t) => {
	Uu.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => vm(e, t, n, r);
}, /*@__PURE__*/ Qc({
	format: (e) => mm(e).format ?? null,
	minLength: (e) => mm(e).minimum ?? null,
	maxLength: (e) => mm(e).maximum ?? null
}, {
	regex(...e) {
		return this.check(/* @__PURE__ */ Tp(...e));
	},
	includes(...e) {
		return this.check(/* @__PURE__ */ Op(...e));
	},
	startsWith(...e) {
		return this.check(/* @__PURE__ */ kp(...e));
	},
	endsWith(...e) {
		return this.check(/* @__PURE__ */ Ap(...e));
	},
	min(...e) {
		return this.check(/* @__PURE__ */ Cp(...e));
	},
	max(...e) {
		return this.check(/* @__PURE__ */ Sp(...e));
	},
	length(...e) {
		return this.check(/* @__PURE__ */ wp(...e));
	},
	nonempty(...e) {
		return this.check(/* @__PURE__ */ Cp(1, ...e));
	},
	lowercase(e) {
		return this.check(/* @__PURE__ */ Ep(e));
	},
	uppercase(e) {
		return this.check(/* @__PURE__ */ Dp(e));
	},
	trim() {
		return this.check(/* @__PURE__ */ Np());
	},
	normalize(...e) {
		return this.check(/* @__PURE__ */ Mp(...e));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ Pp());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ Fp());
	},
	slugify() {
		return this.check(/* @__PURE__ */ Ip());
	}
})), ih = /*@__PURE__*/ Y("ZodString", (e, t) => {
	Uu.init(e, t), rh.init(e, t);
}, {
	email(e) {
		return this.check(/* @__PURE__ */ Vf(uh, e));
	},
	url(e) {
		return this.check(/* @__PURE__ */ qf(ph, e));
	},
	jwt(e) {
		return this.check(/* @__PURE__ */ cp(Oh, e));
	},
	emoji(e) {
		return this.check(/* @__PURE__ */ Jf(mh, e));
	},
	guid(e) {
		return this.check(/* @__PURE__ */ Hf(dh, e));
	},
	uuid(e) {
		return this.check(/* @__PURE__ */ Uf(fh, e));
	},
	uuidv4(e) {
		return this.check(/* @__PURE__ */ Wf(fh, e));
	},
	uuidv6(e) {
		return this.check(/* @__PURE__ */ Gf(fh, e));
	},
	uuidv7(e) {
		return this.check(/* @__PURE__ */ Kf(fh, e));
	},
	nanoid(e) {
		return this.check(/* @__PURE__ */ Yf(hh, e));
	},
	cuid(e) {
		return this.check(/* @__PURE__ */ Xf(gh, e));
	},
	cuid2(e) {
		return this.check(/* @__PURE__ */ Zf(_h, e));
	},
	ulid(e) {
		return this.check(/* @__PURE__ */ Qf(vh, e));
	},
	base64(e) {
		return this.check(/* @__PURE__ */ ap(Th, e));
	},
	base64url(e) {
		return this.check(/* @__PURE__ */ op(Eh, e));
	},
	xid(e) {
		return this.check(/* @__PURE__ */ $f(yh, e));
	},
	ksuid(e) {
		return this.check(/* @__PURE__ */ ep(bh, e));
	},
	ipv4(e) {
		return this.check(/* @__PURE__ */ tp(xh, e));
	},
	ipv6(e) {
		return this.check(/* @__PURE__ */ np(Sh, e));
	},
	cidrv4(e) {
		return this.check(/* @__PURE__ */ rp(Ch, e));
	},
	cidrv6(e) {
		return this.check(/* @__PURE__ */ ip(wh, e));
	},
	e164(e) {
		return this.check(/* @__PURE__ */ sp(Dh, e));
	},
	datetime(e) {
		return this.check(/* @__PURE__ */ lp(oh, e));
	},
	date(e) {
		return this.check(/* @__PURE__ */ up(sh, e));
	},
	time(e) {
		return this.check(/* @__PURE__ */ dp(ch, e));
	},
	duration(e) {
		return this.check(/* @__PURE__ */ fp(lh, e));
	}
});
function ah(e) {
	return /* @__PURE__ */ Bf(ih, e);
}
var $ = /*@__PURE__*/ Y("ZodStringFormat", (e, t) => {
	Z.init(e, t), rh.init(e, t);
}), oh = /*@__PURE__*/ Y("ZodISODateTime", (e, t) => {
	cd.init(e, t), $.init(e, t);
}), sh = /*@__PURE__*/ Y("ZodISODate", (e, t) => {
	ld.init(e, t), $.init(e, t);
}), ch = /*@__PURE__*/ Y("ZodISOTime", (e, t) => {
	ud.init(e, t), $.init(e, t);
}), lh = /*@__PURE__*/ Y("ZodISODuration", (e, t) => {
	dd.init(e, t), $.init(e, t);
}), uh = /*@__PURE__*/ Y("ZodEmail", (e, t) => {
	Ku.init(e, t), $.init(e, t);
}), dh = /*@__PURE__*/ Y("ZodGUID", (e, t) => {
	Wu.init(e, t), $.init(e, t);
}), fh = /*@__PURE__*/ Y("ZodUUID", (e, t) => {
	Gu.init(e, t), $.init(e, t);
}), ph = /*@__PURE__*/ Y("ZodURL", (e, t) => {
	ed.init(e, t), $.init(e, t);
}), mh = /*@__PURE__*/ Y("ZodEmoji", (e, t) => {
	td.init(e, t), $.init(e, t);
}), hh = /*@__PURE__*/ Y("ZodNanoID", (e, t) => {
	nd.init(e, t), $.init(e, t);
}), gh = /*@__PURE__*/ Y("ZodCUID", (e, t) => {
	rd.init(e, t), $.init(e, t);
}), _h = /*@__PURE__*/ Y("ZodCUID2", (e, t) => {
	id.init(e, t), $.init(e, t);
}), vh = /*@__PURE__*/ Y("ZodULID", (e, t) => {
	ad.init(e, t), $.init(e, t);
}), yh = /*@__PURE__*/ Y("ZodXID", (e, t) => {
	od.init(e, t), $.init(e, t);
}), bh = /*@__PURE__*/ Y("ZodKSUID", (e, t) => {
	sd.init(e, t), $.init(e, t);
}), xh = /*@__PURE__*/ Y("ZodIPv4", (e, t) => {
	fd.init(e, t), $.init(e, t);
}), Sh = /*@__PURE__*/ Y("ZodIPv6", (e, t) => {
	hd.init(e, t), $.init(e, t);
}), Ch = /*@__PURE__*/ Y("ZodCIDRv4", (e, t) => {
	gd.init(e, t), $.init(e, t);
}), wh = /*@__PURE__*/ Y("ZodCIDRv6", (e, t) => {
	vd.init(e, t), $.init(e, t);
}), Th = /*@__PURE__*/ Y("ZodBase64", (e, t) => {
	xd.init(e, t), $.init(e, t);
}), Eh = /*@__PURE__*/ Y("ZodBase64URL", (e, t) => {
	wd.init(e, t), $.init(e, t);
}), Dh = /*@__PURE__*/ Y("ZodE164", (e, t) => {
	Td.init(e, t), $.init(e, t);
}), Oh = /*@__PURE__*/ Y("ZodJWT", (e, t) => {
	Dd.init(e, t), $.init(e, t);
}), kh = /*@__PURE__*/ Y("ZodNumber", (e, t) => {
	Od.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => ym(e, t, n, r), e.isFinite = !0;
}, /*@__PURE__*/ Qc({
	minValue: (e) => {
		let { minimum: t, exclusiveMinimum: n } = mm(e);
		return Math.max(t ?? -Infinity, n ?? -Infinity);
	},
	maxValue: (e) => {
		let { maximum: t, exclusiveMaximum: n } = mm(e);
		return Math.min(t ?? Infinity, n ?? Infinity);
	},
	isInt: (e) => {
		let { isInt: t, multipleOf: n } = mm(e);
		return !!t || !!n?.some(Number.isSafeInteger);
	},
	format: (e) => mm(e).format ?? null
}, {
	gt(e, t) {
		return this.check(/* @__PURE__ */ yp(e, t));
	},
	gte(e, t) {
		return this.check(/* @__PURE__ */ bp(e, t));
	},
	min(e, t) {
		return this.check(/* @__PURE__ */ bp(e, t));
	},
	lt(e, t) {
		return this.check(/* @__PURE__ */ _p(e, t));
	},
	lte(e, t) {
		return this.check(/* @__PURE__ */ vp(e, t));
	},
	max(e, t) {
		return this.check(/* @__PURE__ */ vp(e, t));
	},
	int(e) {
		return this.check(Mh(e));
	},
	safe(e) {
		return this.check(Mh(e));
	},
	positive(e) {
		return this.check(/* @__PURE__ */ yp(0, e));
	},
	nonnegative(e) {
		return this.check(/* @__PURE__ */ bp(0, e));
	},
	negative(e) {
		return this.check(/* @__PURE__ */ _p(0, e));
	},
	nonpositive(e) {
		return this.check(/* @__PURE__ */ vp(0, e));
	},
	multipleOf(e, t) {
		return this.check(/* @__PURE__ */ xp(e, t));
	},
	step(e, t) {
		return this.check(/* @__PURE__ */ xp(e, t));
	},
	finite() {
		return this;
	}
}));
function Ah(e) {
	return /* @__PURE__ */ pp(kh, e);
}
var jh = /*@__PURE__*/ Y("ZodNumberFormat", (e, t) => {
	kd.init(e, t), kh.init(e, t);
});
function Mh(e) {
	return /* @__PURE__ */ mp(jh, e);
}
var Nh = /*@__PURE__*/ Y("ZodUnknown", (e, t) => {
	Ad.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (e, t, n) => void 0;
});
function Ph() {
	return /* @__PURE__ */ hp(Nh);
}
var Fh = /*@__PURE__*/ Y("ZodNever", (e, t) => {
	jd.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => bm(e, t, n, r);
});
function Ih(e) {
	return /* @__PURE__ */ gp(Fh, e);
}
var Lh = /*@__PURE__*/ Y("ZodArray", (e, t) => {
	nh(), Fd.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Tm(e, t, n, r), e.element = t.element;
}, {
	min(e, t) {
		return this.check(/* @__PURE__ */ Cp(e, t));
	},
	nonempty(e) {
		return this.check(/* @__PURE__ */ Cp(1, e));
	},
	max(e, t) {
		return this.check(/* @__PURE__ */ Sp(e, t));
	},
	length(e, t) {
		return this.check(/* @__PURE__ */ wp(e, t));
	},
	unwrap() {
		return this.element;
	}
});
function Rh(e, t) {
	return /* @__PURE__ */ Lp(Lh, e, t);
}
var zh = /*@__PURE__*/ Y("ZodObject", (e, t) => {
	nh(), Vd.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Dm(e, t, n, r), il(e, "shape", (e) => e._zod.def.shape, !1);
}, {
	keyof() {
		return Jh(Object.keys(this._zod.def.shape));
	},
	catchall(e) {
		return this.clone(pc(this._zod.def, { catchall: e }));
	},
	passthrough() {
		return this.clone(pc(this._zod.def, { catchall: Ph() }));
	},
	loose() {
		return this.clone(pc(this._zod.def, { catchall: Ph() }));
	},
	strict() {
		return this.clone(pc(this._zod.def, { catchall: Ih() }));
	},
	strip() {
		return this.clone(pc(this._zod.def, { catchall: void 0 }));
	},
	extend(e) {
		return jc(this, e);
	},
	safeExtend(e) {
		return Nc(this, e);
	},
	merge(e) {
		return Pc(this, e);
	},
	pick(e) {
		return Oc(this, e);
	},
	omit(e) {
		return Ac(this, e);
	},
	partial(...e) {
		return Fc($h, this, e[0]);
	},
	exactPartial(...e) {
		return Fc(tg, this, e[0], "exactPartial");
	},
	required(...e) {
		return Ic(lg, this, e[0]);
	}
});
function Bh(e, t) {
	return new zh({
		type: "object",
		shape: e ?? {},
		...q(t)
	});
}
var Vh = /*@__PURE__*/ Y("ZodUnion", (e, t) => {
	Ud.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Om(e, t, n, r), e.options = t.options;
});
function Hh(e, t) {
	return new Vh({
		type: "union",
		options: e,
		...q(t)
	});
}
var Uh = /*@__PURE__*/ Y("ZodDiscriminatedUnion", (e, t) => {
	Vh.init(e, t), Gd.init(e, t);
});
function Wh(e, t, n) {
	return new Uh({
		type: "union",
		options: t,
		discriminator: e,
		...q(n)
	});
}
var Gh = /*@__PURE__*/ Y("ZodIntersection", (e, t) => {
	Kd.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => km(e, t, n, r);
});
function Kh(e, t) {
	return new Gh({
		type: "intersection",
		left: e,
		right: t
	});
}
var qh = /*@__PURE__*/ Y("ZodEnum", (e, t) => {
	Yd.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => xm(e, t, n, r), e.enum = t.entries, e.options = [...e._zod.values];
	let n = new Set(Object.keys(t.entries));
	e.extract = (e, r) => {
		let i = {};
		for (let r of e) if (n.has(r)) i[r] = t.entries[r];
		else throw Error(`Key ${r} not found in enum`);
		return new qh({
			...t,
			checks: [],
			...q(r),
			entries: i
		});
	}, e.exclude = (e, r) => {
		let i = { ...t.entries };
		for (let t of e) if (n.has(t)) delete i[t];
		else throw Error(`Key ${t} not found in enum`);
		return new qh({
			...t,
			checks: [],
			...q(r),
			entries: i
		});
	};
});
function Jh(e, t) {
	return new qh({
		type: "enum",
		entries: Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e,
		...q(t)
	});
}
var Yh = /*@__PURE__*/ Y("ZodLiteral", (e, t) => {
	Xd.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Sm(e, t, n, r), e.values = new Set(t.values), Object.defineProperty(e, "value", { get() {
		if (t.values.length > 1) throw Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return t.values[0];
	} });
});
function Xh(e, t) {
	return new Yh({
		type: "literal",
		values: Array.isArray(e) ? e : [e],
		...q(t)
	});
}
var Zh = /*@__PURE__*/ Y("ZodTransform", (e, t) => {
	nh(), Zd.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => wm(e, t, n, r), e._zod.parse = (n, r) => {
		if (r.direction === "backward") throw new fl(e.constructor.name);
		n.addIssue = (r) => {
			if (typeof r == "string") n.issues.push(Jc(r, n.value, t));
			else {
				let t = r;
				t.fatal && (t.continue = !1), t.code ??= "custom", "input" in t || (t.input = n.value), t.inst ??= e, n.issues.push(Jc(t));
			}
		};
		let i = t.transform(n.value, n);
		return i instanceof Promise ? i.then((e) => (n.value = e, n)) : (n.value = i, n);
	};
});
function Qh(e) {
	return new Zh({
		type: "transform",
		transform: e
	});
}
var $h = /*@__PURE__*/ Y("ZodOptional", (e, t) => {
	$d.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => zm(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function eg(e) {
	return new $h({
		type: "optional",
		innerType: e
	});
}
var tg = /*@__PURE__*/ Y("ZodExactOptional", (e, t) => {
	ef.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => zm(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function ng(e) {
	return new tg({
		type: "optional",
		innerType: e
	});
}
var rg = /*@__PURE__*/ Y("ZodNullable", (e, t) => {
	tf.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Am(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function ig(e) {
	return new rg({
		type: "nullable",
		innerType: e
	});
}
var ag = /*@__PURE__*/ Y("ZodDefault", (e, t) => {
	nf.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Pm(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeDefault = e.unwrap;
});
function og(e, t) {
	return new ag({
		type: "default",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : bc(t);
		}
	});
}
var sg = /*@__PURE__*/ Y("ZodPrefault", (e, t) => {
	af.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Fm(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function cg(e, t) {
	return new sg({
		type: "prefault",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : bc(t);
		}
	});
}
var lg = /*@__PURE__*/ Y("ZodNonOptional", (e, t) => {
	of.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => jm(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function ug(e, t) {
	return new lg({
		type: "nonoptional",
		innerType: e,
		...q(t)
	});
}
var dg = /*@__PURE__*/ Y("ZodCatch", (e, t) => {
	lf.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Im(e, t, n, r), e.unwrap = () => e._zod.def.innerType, e.removeCatch = e.unwrap;
});
function fg(e, t) {
	return new dg({
		type: "catch",
		innerType: e,
		catchValue: typeof t == "function" ? t : ol(t)
	});
}
var pg = /*@__PURE__*/ Y("ZodPipe", (e, t) => {
	uf.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Lm(e, t, n, r), e.in = t.in, e.out = t.out;
});
function mg(e, t) {
	return new pg({
		type: "pipe",
		in: e,
		out: t
	});
}
var hg = /*@__PURE__*/ Y("ZodReadonly", (e, t) => {
	ff.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Rm(e, t, n, r), e.unwrap = () => e._zod.def.innerType;
});
function gg(e) {
	return new hg({
		type: "readonly",
		innerType: e
	});
}
var _g = /*@__PURE__*/ Y("ZodCustom", (e, t) => {
	mf.init(e, t), Q.init(e, t), e._zod.processJSONSchema = (t, n, r) => Cm(e, t, n, r);
});
function vg(e, t = {}) {
	return /* @__PURE__ */ Rp(_g, e, t);
}
function yg(e, t) {
	return /* @__PURE__ */ zp(e, t);
}
// terminal/protocol.ts
var bg = {
	cols: Ah().int().min(20).max(500),
	rows: Ah().int().min(5).max(200)
};
Wh("type", [
	Bh({
		type: Xh("open"),
		bridgeUrl: ah().max(2048),
		username: ah().max(64),
		password: ah().max(1024).refine((e) => !/[\r\n]/.test(e), "SSH password cannot contain newlines"),
		...bg
	}),
	Bh({
		type: Xh("input"),
		data: ah().max(65536)
	}),
	Bh({
		type: Xh("resize"),
		...bg
	}),
	Bh({ type: Xh("close") })
]);
var xg = Wh("type", [
	Bh({
		type: Xh("ready"),
		host: ah(),
		username: ah()
	}),
	Bh({
		type: Xh("output"),
		data: ah()
	}),
	Bh({
		type: Xh("exit"),
		exitCode: Ah().int(),
		signal: Ah().int()
	}),
	Bh({
		type: Xh("error"),
		code: ah(),
		message: ah()
	})
]);
function Sg(e) {
	let t;
	try {
		t = new URL(e);
	} catch {
		throw Error("Invalid Foxglove WebSocket URL");
	}
	if (t.protocol !== "ws:" && t.protocol !== "wss:" || !t.hostname) throw Error("Invalid Foxglove WebSocket URL");
	return t.hostname;
}
function Cg(e) {
	let t = e.trim();
	if (!/^[A-Za-z_][A-Za-z0-9._-]{0,63}$/.test(t)) throw Error("Invalid SSH username");
	return t;
}
function wg(e) {
	if (/[\r\n]/.test(e)) throw Error("Invalid SSH password");
	return e;
}
// terminal/TerminalPanel.tsx
var Tg = "ws://127.0.0.1:8767", Eg = "robviz.terminal.username", Dg = "robviz.terminal.password";
function Og({ ctx: e, bridgeUrl: t, gatewayUrl: n, theme: i, visible: u = !0, height: m, fontScale: _, onHeightChange: v, onHide: ee, onClose: te }) {
	let { t: y } = f(), ne = t ?? e?.bridge?.url ?? "ws://localhost:8765", re = n ?? e?.getServiceUrl("terminal") ?? Tg, ie = i ?? e?.theme ?? "dark", ae = _ ?? 1, oe = ee ?? te ?? (() => {}), b = s(null), se = s(null), x = s(null), ce = s(void 0), le = s(void 0), ue = s(void 0), C = s(!1), fe = s(void 0), pe = s(ie), me = s(ae), ge = s(u);
	ge.current = u;
	let [_e, ye] = c(() => localStorage.getItem(Eg) ?? ""), [be, xe] = c(() => localStorage.getItem(Dg) ?? ""), [w, T] = c("idle"), [Se, Ce] = c(), [we, Te] = c(), Ee = o(() => {
		try {
			return Sg(ne);
		} catch {
			return "?";
		}
	}, [ne]), De = w === "open" ? y("terminalConnected") : w === "connecting" ? y("terminalConnecting") : w === "exited" ? y("terminalExited", { code: we ?? 0 }) : y(w === "error" ? "terminalError" : "terminalIdle"), Oe = r(() => {
		let e = ue.current;
		ue.current = void 0, C.current = !1, fe.current = void 0, e?.close();
	}, []), ke = r(() => {
		if (!p(x.current)) return;
		let e;
		try {
			if (e = Cg(_e), wg(be), Ee === "?") throw Error(y("terminalInvalidBridge"));
		} catch (e) {
			let t = e instanceof Error ? e.message : String(e);
			Ce(t === "Invalid SSH password" ? y("terminalPasswordInvalid") : t), T("error");
			return;
		}
		localStorage.setItem(Eg, e), localStorage.setItem(Dg, be), Oe(), ce.current?.reset(), Ce(void 0), Te(void 0), T("connecting"), fe.current = Ee;
		let t = new WebSocket(re ?? Tg);
		ue.current = t, t.onopen = () => {
			if (ue.current !== t) return;
			le.current?.fit();
			let n = ce.current;
			t.send(JSON.stringify({
				type: "open",
				bridgeUrl: ne,
				username: e,
				password: be,
				cols: n?.cols ?? 80,
				rows: n?.rows ?? 24
			}));
		}, t.onmessage = (e) => {
			if (ue.current !== t) return;
			let n;
			try {
				n = JSON.parse(String(e.data));
			} catch {
				Ce(y("terminalInvalidResponse")), T("error");
				return;
			}
			let r = xg.safeParse(n);
			if (!r.success) {
				Ce(y("terminalInvalidResponse")), T("error");
				return;
			}
			let i = r.data;
			i.type === "ready" ? (C.current = !0, fe.current = i.host, T("open"), ce.current?.focus()) : i.type === "output" ? ce.current?.write(i.data) : i.type === "exit" ? (C.current = !1, fe.current = void 0, Te(i.exitCode), T("exited")) : (C.current = !1, Ce(i.message), T("error"));
		}, t.onerror = () => {
			ue.current === t && (C.current = !1, Ce(y("terminalGatewayUnavailable")), T("error"));
		}, t.onclose = () => {
			if (ue.current !== t) return;
			ue.current = void 0;
			let e = C.current;
			C.current = !1, fe.current = void 0, e && (Ce(y("terminalGatewayDisconnected")), T("error"));
		};
	}, [
		ne,
		Oe,
		re,
		be,
		y,
		Ee,
		_e
	]), Ae = r(() => {
		let e = ue.current;
		e?.readyState === WebSocket.OPEN && C.current ? e.send(JSON.stringify({ type: "close" })) : (Oe(), T("exited"), Te(0));
	}, [Oe]);
	a(() => {
		let e = new Zs({
			cursorBlink: !0,
			fontFamily: "ui-monospace, \"SF Mono\", \"Cascadia Mono\", Menlo, Consolas, monospace",
			fontSize: Math.max(9, Math.round(12 * me.current)),
			lineHeight: 1.2,
			scrollback: 5e3,
			theme: pe.current === "dark" ? {
				background: "#000000",
				foreground: "#f5f5f5",
				cursor: "#f5f5f5"
			} : {
				background: "#ffffff",
				foreground: "#0a0a0a",
				cursor: "#0a0a0a"
			}
		}), t = new ve();
		e.loadAddon(t), e.open(b.current), ce.current = e, le.current = t;
		let n = e.onData((e) => {
			let t = ue.current;
			t?.readyState === WebSocket.OPEN && C.current && t.send(JSON.stringify({
				type: "input",
				data: e
			}));
		}), r = new ResizeObserver(() => {
			if (!ge.current) return;
			t.fit();
			let n = ue.current;
			n?.readyState === WebSocket.OPEN && C.current && n.send(JSON.stringify({
				type: "resize",
				cols: e.cols,
				rows: e.rows
			}));
		});
		return r.observe(b.current), () => {
			r.disconnect(), n.dispose(), Oe(), e.dispose(), ce.current = void 0, le.current = void 0;
		};
	}, [Oe]), a(() => {
		let e = ce.current;
		if (!e) return;
		let t = Math.max(9, Math.round(12 * ae));
		if (e.options.fontSize !== t && (e.options.fontSize = t, ge.current)) {
			le.current?.fit();
			let t = ue.current;
			t?.readyState === WebSocket.OPEN && C.current && t.send(JSON.stringify({
				type: "resize",
				cols: e.cols,
				rows: e.rows
			}));
		}
	}, [ae]), a(() => {
		let e = ce.current;
		e && (e.options.theme = ie === "dark" ? {
			background: "#000000",
			foreground: "#f5f5f5",
			cursor: "#f5f5f5"
		} : {
			background: "#ffffff",
			foreground: "#0a0a0a",
			cursor: "#0a0a0a"
		});
	}, [ie]), a(() => {
		if (!u) return;
		let e = requestAnimationFrame(() => {
			le.current?.fit(), w === "open" ? ce.current?.focus() : se.current?.focus();
		});
		return () => cancelAnimationFrame(e);
	}, [w, u]), a(() => {
		let e = fe.current;
		e && e !== Ee && (Oe(), ce.current?.reset(), Ce(void 0), Te(void 0), T("idle"));
	}, [Oe, Ee]);
	let je = r((e) => {
		if (!v || m == null) return;
		e.preventDefault();
		let t = e.clientY, n = m, r = (e) => {
			let r = Math.max(160, Math.floor(window.innerHeight * .6));
			v(Math.min(r, Math.max(160, n + t - e.clientY)));
		}, i = () => {
			window.removeEventListener("pointermove", r), window.removeEventListener("pointerup", i);
		};
		window.addEventListener("pointermove", r), window.addEventListener("pointerup", i, { once: !0 });
	}, [m, v]), Me = r((e) => {
		if (!v || m == null) return;
		let t = Math.max(160, Math.floor(window.innerHeight * .6)), n = m;
		if (e.key === "ArrowUp") n += 16;
		else if (e.key === "ArrowDown") n -= 16;
		else if (e.key === "Home") n = 160;
		else if (e.key === "End") n = t;
		else return;
		e.preventDefault(), v(Math.min(t, Math.max(160, n)));
	}, [m, v]), Ne = w !== "open" && w !== "connecting";
	return /* @__PURE__ */ g("section", {
		className: `terminal-drawer ${u ? "visible" : "hidden"}`,
		style: u && m ? { height: m } : void 0,
		"aria-label": y("terminal"),
		children: [
			v && m != null && /* @__PURE__ */ h("div", {
				className: "terminal-resize-handle",
				role: "separator",
				"aria-label": y("terminalResize"),
				"aria-orientation": "horizontal",
				"aria-valuemin": 160,
				"aria-valuemax": Math.max(160, Math.floor(window.innerHeight * .6)),
				"aria-valuenow": Math.min(m, Math.max(160, Math.floor(window.innerHeight * .6))),
				tabIndex: 0,
				onKeyDown: Me,
				onPointerDown: je
			}),
			/* @__PURE__ */ g("div", {
				className: "terminal-header",
				children: [
					/* @__PURE__ */ h("span", {
						className: "terminal-title",
						children: y("terminal")
					}),
					/* @__PURE__ */ h("span", {
						className: `terminal-status ${w}`,
						"aria-live": "polite",
						children: De
					}),
					/* @__PURE__ */ g("span", {
						className: "terminal-target",
						children: [_e ? `${_e}@` : "", Ee]
					}),
					/* @__PURE__ */ h("span", { className: "spacer" }),
					/* @__PURE__ */ h(l, {
						className: "terminal-icon-btn",
						onClick: ke,
						title: y("terminalReconnect"),
						"aria-label": y("terminalReconnect"),
						children: /* @__PURE__ */ h(de, {})
					}),
					/* @__PURE__ */ h(l, {
						className: "terminal-icon-btn",
						onClick: Ae,
						disabled: !C.current,
						title: y("terminalEnd"),
						"aria-label": y("terminalEnd"),
						children: /* @__PURE__ */ h(he, {})
					}),
					/* @__PURE__ */ h(l, {
						className: "terminal-icon-btn",
						onClick: oe,
						title: y("terminalHide"),
						"aria-label": y("terminalHide"),
						children: /* @__PURE__ */ h(S, {})
					})
				]
			}),
			Ne && /* @__PURE__ */ g("form", {
				ref: x,
				noValidate: !0,
				className: "terminal-connect-bar",
				onSubmit: (e) => {
					e.preventDefault(), ke();
				},
				children: [
					/* @__PURE__ */ h("span", {
						className: "terminal-readonly-target",
						children: Ee
					}),
					/* @__PURE__ */ h(d, {
						ref: se,
						value: _e,
						onChange: (e) => ye(e.target.value),
						placeholder: y("terminalUsername"),
						"aria-label": y("terminalUsername"),
						spellCheck: !1,
						autoComplete: "username",
						required: !0
					}),
					/* @__PURE__ */ h("input", {
						type: "password",
						value: be,
						onChange: (e) => xe(e.target.value),
						placeholder: y("terminalPassword"),
						"aria-label": y("terminalPassword"),
						autoComplete: "current-password",
						maxLength: 1024
					}),
					/* @__PURE__ */ h(l, {
						type: "submit",
						variant: "primary",
						children: y("terminalConnect")
					}),
					Se && /* @__PURE__ */ h("span", {
						className: "terminal-error",
						title: Se,
						children: Se
					})
				]
			}),
			/* @__PURE__ */ h("div", {
				className: "terminal-xterm",
				ref: b
			})
		]
	});
}
// terminal/ToolbarTool.tsx
function kg({ ctx: e, bridgeUrl: t, fontScale: n, outlet: i }) {
	let [o, s] = c(!1), [l, d] = c(!1), [f, p] = c(() => {
		let e = Number(localStorage.getItem("robviz.terminal.height"));
		return Math.min(Math.max(160, Math.floor(window.innerHeight * .6)), Number.isFinite(e) && e >= 160 ? e : 280);
	}), v = r(() => {
		s(!0), d((e) => !e);
	}, []);
	a(() => {
		if (!e.active) {
			d(!1), s(!1);
			return;
		}
		let t = (e) => {
			e.ctrlKey && !e.metaKey && !e.altKey && e.code === "Backquote" && (e.preventDefault(), v());
		};
		return window.addEventListener("keydown", t, { capture: !0 }), () => window.removeEventListener("keydown", t, { capture: !0 });
	}, [e.active, v]), a(() => {
		localStorage.setItem("robviz.terminal.height", String(f));
	}, [f]);
	let ee = e.locale === "en" ? "Terminal" : "终端";
	return /* @__PURE__ */ g(m, { children: [/* @__PURE__ */ h(u, {
		label: ee,
		"aria-pressed": l,
		onClick: v,
		children: /* @__PURE__ */ h(pe, {})
	}), o && i && _(/* @__PURE__ */ h(Og, {
		ctx: e,
		bridgeUrl: t,
		visible: l,
		fontScale: n,
		height: f,
		onHeightChange: p,
		onHide: () => d(!1)
	}), i)] });
}
// terminal/index.tsx
var Ag = {
	id: "terminal",
	name: "终端 (Terminal)",
	toolbarTools: [{
		id: "terminal",
		component: kg
	}],
	panels: [{
		kind: "terminal",
		title: (e) => e.locale === "en" ? "Terminal" : "终端",
		component: Og
	}],
	services: [{
		id: "terminal",
		label: "Web 终端服务",
		defaultPort: 8767,
		protocol: "ws",
		description: "浏览器在线远程 Shell 终端"
	}]
};
export { Og as TerminalPanel, Ag as default };
