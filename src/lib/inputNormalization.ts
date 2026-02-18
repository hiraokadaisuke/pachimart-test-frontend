const FULLWIDTH_ASCII_START = 0xff01;
const FULLWIDTH_ASCII_END = 0xff5e;
const ASCII_OFFSET = 0xfee0;

const SEPARATOR_PATTERN = /[\s\u3000,，]/g;
const DASH_PATTERN = /[－ー―‐‑‒–—ｰ]/g;
const SEARCH_SEPARATOR_PATTERN = /[\s\u3000\-－ー―‐‑‒–—ｰ_/]/g;

export const toHalfWidth = (value: string): string =>
  value
    .replace(/[！-～]/g, (char) => {
      const code = char.charCodeAt(0);
      if (code < FULLWIDTH_ASCII_START || code > FULLWIDTH_ASCII_END) return char;
      return String.fromCharCode(code - ASCII_OFFSET);
    })
    .replace(/　/g, " ");

export const normalizeNumericInput = (value: string): string =>
  toHalfWidth(value).replace(SEPARATOR_PATTERN, "").replace(DASH_PATTERN, "-").trim();

export const normalizeSearchToken = (value: string): string =>
  toHalfWidth(value)
    .toLowerCase()
    .replace(SEARCH_SEPARATOR_PATTERN, "")
    .trim();
