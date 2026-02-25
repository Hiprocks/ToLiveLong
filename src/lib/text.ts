import { decodeUtf8, encodeUtf8 } from "bkit";

export const normalizeUtf8Text = (value: string): string => {
  // Keep text normalization deterministic across environments.
  return decodeUtf8(encodeUtf8(value));
};

export const utf8ByteLength = (value: string): number => encodeUtf8(value).length;
