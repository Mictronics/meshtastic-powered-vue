import { createSharedComposable } from "@vueuse/core";

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export const useColor = createSharedComposable(() => {

  const hexToRgb = (hex: number): RGBColor => ({
    r: (hex & 0xff0000) >> 16,
    g: (hex & 0x00ff00) >> 8,
    b: hex & 0x0000ff,
  });

  const rgbToHex = (c: RGBColor): number =>
    (Math.round(c.r) << 16) | (Math.round(c.g) << 8) | Math.round(c.b);

  const isLightColor = (c: RGBColor): boolean =>
    (c.r * 299 + c.g * 587 + c.b * 114) / 1000 > 127.5;

  const getColorFromNodeNum = (nodeNum: number): RGBColor => {
    // Extract RGB values directly from nodeNum (treated as hex color)
    const r = (nodeNum & 0xff0000) >> 16;
    const g = (nodeNum & 0x00ff00) >> 8;
    const b = nodeNum & 0x0000ff;

    return { r, g, b };
  };

  return {
    hexToRgb,
    rgbToHex,
    isLightColor,
    getColorFromNodeNum,
  }
})