const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const normalizeUtf8Text = (value: string): string => {
  // Keep text normalization deterministic across environments.
  return textDecoder.decode(textEncoder.encode(value));
};

export const utf8ByteLength = (value: string): number => textEncoder.encode(value).length;
