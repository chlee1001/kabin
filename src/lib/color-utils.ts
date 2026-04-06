export function hexToOklch(hex: string): { l: number; c: number; h: number } {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return { l: 0.5, c: 0, h: 0 }
  }
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const toLinear = (v: number) =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b)

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const bOk = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

  const C = Math.sqrt(a * a + bOk * bOk)
  const H = (Math.atan2(bOk, a) * 180) / Math.PI

  return { l: L, c: C, h: H < 0 ? H + 360 : H }
}

/** @param alpha Opacity as CSS percentage (0–100), e.g. 10 → "/ 10%" */
export function oklchToCss(l: number, c: number, h: number, alpha?: number): string {
  const base = `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)}`
  return alpha != null ? `${base} / ${alpha}%)` : `${base})`
}

export function getContrastForeground(l: number): string {
  return l > 0.6 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)"
}
