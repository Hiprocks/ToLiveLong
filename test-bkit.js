/* eslint-disable @typescript-eslint/no-require-imports */
const bkit = require("bkit");

const message = "ToLiveLong";
const encoded = bkit.encodeUtf8(message);
const decoded = bkit.decodeUtf8(encoded);

const bytes = new Uint8Array(4);
bkit.writeUintBE(bytes, 0, 4, 20260225);
const restored = bkit.readUintBE(bytes, 0, 4);

console.log("encoded_length:", encoded.length);
console.log("decoded_text:", decoded);
console.log("uint_be_roundtrip:", restored);
