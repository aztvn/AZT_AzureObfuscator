// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Compiled & Lightly Obfuscated ESM Runtime
const AZT_0xAZU = 0x100A; void AZT_0xAZU;
// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Heavyweight Multi-Codec Symbiotic Cryptographic Engine
// - 3 Framed Payloads ([[#AZT^...^AZURE#]]): BootVM Bytecode + Crypto Vault (12KB+) + Main Chunked VM Bytecode (20KB+)
// - 7+ Runtime Codecs: Safe Base-85+Dict -> LZ77-RLE -> 2-Round Byte Feistel -> Delta -> NibbleRot -> XTEA-16 -> Dual S-Box + RC4(SHA-512) + Custom SHA-2064 + Full 32B HMAC-SHA256 + Custom Checksum

import { AZT_OpCode } from "./AZT_Types.mjs";
import { AZT_PRNG } from "./AZT_PRNG.mjs";
import { AZT_MathEngine } from "./AZT_MathEngine.mjs";
import { AZT_CFFEngine } from "./AZT_CFFEngine.mjs";
import { AZT_RC4, AZT_SHA256, AZT_HMAC_SHA256, AZT_SHA512, AZT_SHA2064_Custom, AZT_CustomChecksum, AZT_XTEA16_Encrypt, AZT_XTEA16_Decrypt } from "./AZT_HashSuite.mjs";

export const AZT_PUZZLE_PRIME = 65521;

export const AZT_B85_ALPHABET = (() => {
  let s = "";
  for (let c = 36; c <= 90; c++) s += String.fromCharCode(c);
  for (let c = 95; c <= 124; c++) s += String.fromCharCode(c);
  return s;
})();

const AZT_B85_REV = (() => {
  const m = new Int16Array(128).fill(-1);
  for (let i = 0; i < AZT_B85_ALPHABET.length; i++) {
    m[AZT_B85_ALPHABET.charCodeAt(i)] = i;
  }
  return m;
})();

const AZT_TOKEN_CHARS = [" ", "!", '"', "}", "~"];



export const AZT_BootOp = Object.freeze({
  INIT_VITAL: 1,
  CHECK_PLACEID: 2,
  CHECK_TABLE_FROZEN: 3,
  RICE_BARRIER: 4,
  DECODE_WM_HASH: 5,
  FINALIZE_VITAL: 6
});



export function AZT_ModInversePrime(a, p = AZT_PUZZLE_PRIME) {
  let t = 0, newT = 1;
  let r = p, newR = ((a % p) + p) % p;
  while (newR !== 0) {
    const q = Math.floor(r / newR);
    const tmpT = t - q * newT;
    t = newT; newT = tmpT;
    const tmpR = r - q * newR;
    r = newR; newR = tmpR;
  }
  if (t < 0) t += p;
  return t;
}

export function AZT_CreateMathPuzzle(rng) {
  const secret = rng.int(17, AZT_PUZZLE_PRIME - 17);
  const a = rng.int(13, AZT_PUZZLE_PRIME - 13);
  const aInv = AZT_ModInversePrime(a, AZT_PUZZLE_PRIME);
  const b = rng.int(11, AZT_PUZZLE_PRIME - 11);
  const c = (a * secret + b) % AZT_PUZZLE_PRIME;
  return { secret, a, aInv, b, c };
}

export function AZT_SolveMathPuzzle(aInv, b, c) {
  const diff = ((c - b) % AZT_PUZZLE_PRIME + AZT_PUZZLE_PRIME) % AZT_PUZZLE_PRIME;
  return (diff * aInv) % AZT_PUZZLE_PRIME;
}

// ── Runtime Codecs: NibbleRot, Delta, 2-Round Byte-Pair Feistel ──────────────

export function AZT_EncodeNibbleRot(data, shift, mask) {
  const out = new Uint8Array(data.length);
  const s = shift & 7;
  for (let i = 0; i < data.length; i++) {
    let b = data[i] ^ ((mask + i * 7) & 0xff);
    b = ((b << s) | (b >>> (8 - s))) & 0xff;
    out[i] = ((b << 4) | (b >>> 4)) & 0xff;
  }
  return out;
}

export function AZT_DecodeNibbleRot(data, shift, mask) {
  const out = new Uint8Array(data.length);
  const s = shift & 7;
  for (let i = 0; i < data.length; i++) {
    let b = ((data[i] << 4) | (data[i] >>> 4)) & 0xff;
    b = ((b >>> s) | (b << (8 - s))) & 0xff;
    out[i] = b ^ ((mask + i * 7) & 0xff);
  }
  return out;
}

export function AZT_EncodeDelta(data, seed) {
  const out = new Uint8Array(data.length);
  let prev = seed & 0xff;
  for (let i = 0; i < data.length; i++) {
    out[i] = (data[i] - prev) & 0xff;
    prev = data[i];
  }
  return out;
}

export function AZT_DecodeDelta(data, seed) {
  const out = new Uint8Array(data.length);
  let prev = seed & 0xff;
  for (let i = 0; i < data.length; i++) {
    const val = (data[i] + prev) & 0xff;
    out[i] = val;
    prev = val;
  }
  return out;
}

export function AZT_EncodeFeistelBytes(data, k1, k2) {
  const out = data.slice();
  const pairs = Math.floor(out.length / 2);
  for (let i = 0; i < pairs; i++) {
    const L = out[i * 2];
    const R = out[i * 2 + 1];
    const f1 = ((R * 13 + k1 + i * 5) & 0xff) ^ ((R >>> 3) & 0xff);
    const L1 = R;
    const R1 = L ^ f1;
    const f2 = ((R1 * 19 + k2 + i * 11) & 0xff) ^ ((R1 >>> 2) & 0xff);
    out[i * 2] = R1;
    out[i * 2 + 1] = L1 ^ f2;
  }
  return out;
}

export function AZT_DecodeFeistelBytes(data, k1, k2) {
  const out = data.slice();
  const pairs = Math.floor(out.length / 2);
  for (let i = 0; i < pairs; i++) {
    const L2 = out[i * 2];
    const R2 = out[i * 2 + 1];
    const R1 = L2;
    const f2 = ((R1 * 19 + k2 + i * 11) & 0xff) ^ ((R1 >>> 2) & 0xff);
    const L1 = R2 ^ f2;
    const R = L1;
    const f1 = ((R * 13 + k1 + i * 5) & 0xff) ^ ((R >>> 3) & 0xff);
    out[i * 2] = R1 ^ f1;
    out[i * 2 + 1] = R;
  }
  return out;
}

class AZT_BinWriter {
  buf = [];

  u8(v) { this.buf.push(v & 0xff); }
  u16(v) { this.buf.push(v & 0xff, (v >>> 8) & 0xff); }
  u32(v) {
    const u = v >>> 0;
    this.buf.push(u & 0xff, (u >>> 8) & 0xff, (u >>> 16) & 0xff, (u >>> 24) & 0xff);
  }
  f64(v) {
    const ab = new ArrayBuffer(8);
    new DataView(ab).setFloat64(0, v, true);
    const bytes = new Uint8Array(ab);
    for (let i = 0; i < 8; i++) this.buf.push(bytes[i]);
  }
  bytes(arr) {
    for (let i = 0; i < arr.length; i++) this.buf.push(arr[i]);
  }
  toUint8Array() { return new Uint8Array(this.buf); }
}

// ── Per-String 3-Pass Lazy Encryption ────────────────────────────────────────

export function AZT_EncryptStringLazy3(
  plain,
  constIdx,
  masterKey,
  customShaSeed,
  rng
) {
  const raw = new TextEncoder().encode(plain);
  const puzzle = AZT_CreateMathPuzzle(rng);
  const x = puzzle.secret;

  const pass1 = new Uint8Array(raw.length);
  let k1 = (x ^ (constIdx * 29 + 17)) & 0xff;
  for (let i = 0; i < raw.length; i++) {
    pass1[i] = raw[i] ^ k1;
    k1 = (k1 * 37 + (x & 0x7f) + 19) & 0xff;
  }

  const msg2 = new Uint8Array([constIdx & 0xff, (constIdx >>> 8) & 0xff, x & 0xff, (x >>> 8) & 0xff]);
  const rc4Key = AZT_HMAC_SHA256(masterKey, msg2);
  const pass2 = AZT_RC4(rc4Key, pass1, 32);

  const sha2064Stream = AZT_SHA2064_Custom(msg2, customShaSeed);
  const pass3 = new Uint8Array(pass2.length);
  for (let i = 0; i < pass2.length; i++) {
    pass3[i] = pass2[i] ^ sha2064Stream[i % 258];
  }

  return { puzzle, cipher: pass3 };
}

export function AZT_DecryptStringLazy3(
  cipher,
  constIdx,
  aInv,
  b,
  c,
  masterKey,
  customShaSeed
) {
  const x = AZT_SolveMathPuzzle(aInv, b, c);
  const msg2 = new Uint8Array([constIdx & 0xff, (constIdx >>> 8) & 0xff, x & 0xff, (x >>> 8) & 0xff]);

  const sha2064Stream = AZT_SHA2064_Custom(msg2, customShaSeed);
  const pass2 = new Uint8Array(cipher.length);
  for (let i = 0; i < cipher.length; i++) {
    pass2[i] = cipher[i] ^ sha2064Stream[i % 258];
  }

  const rc4Key = AZT_HMAC_SHA256(masterKey, msg2);
  const pass1 = AZT_RC4(rc4Key, pass2, 32);

  const raw = new Uint8Array(pass1.length);
  let k1 = (x ^ (constIdx * 29 + 17)) & 0xff;
  for (let i = 0; i < pass1.length; i++) {
    raw[i] = pass1[i] ^ k1;
    k1 = (k1 * 37 + (x & 0x7f) + 19) & 0xff;
  }

  return new TextDecoder().decode(raw);
}

// ── Layer 1: Serialize VM Proto Tree ─────────────────────────────────────────

export function AZT_SerializeProto(
  root,
  opcodeMap,
  instrKey,
  masterKey,
  customShaSeed,
  opMaskByte,
  rng
) {
  const w = new AZT_BinWriter();
  let lazyStringsEncrypted = 0;

  const writeConst = (c, constIdx) => {
    if (c.type === "nil") {
      w.u8(0);
    } else if (c.type === "bool") {
      w.u8(1);
      w.u8(c.value ? 1 : 0);
    } else if (c.type === "number") {
      w.u8(2);
      w.f64(c.value);
    } else {
      w.u8(3);
      const { puzzle, cipher } = AZT_EncryptStringLazy3(c.value, constIdx, masterKey, customShaSeed, rng);
      lazyStringsEncrypted++;
      w.u16(puzzle.aInv);
      w.u16(puzzle.b);
      w.u16(puzzle.c);
      w.u32(cipher.length);
      w.bytes(cipher);
    }
  };

  const writeProto = (p) => {
    w.u8(p.numParams & 0xff);
    w.u8(p.isVararg ? 1 : 0);
    w.u16(p.maxStackSize & 0xffff);
    w.u16(p.upvalDesc.length & 0xffff);
    for (const u of p.upvalDesc) {
      w.u8(u.inStack ? 1 : 0);
      w.u16(u.idx & 0xffff);
    }
    w.u32(p.constants.length);
    for (let i = 0; i < p.constants.length; i++) writeConst(p.constants[i], i);

    w.u32(p.instructions.length);
    for (const ins of p.instructions) {
      const shufOp = (opcodeMap.get(ins.op) ?? ins.op) ^ (opMaskByte & 0xff);
      const word0 = ((shufOp & 0xff) | ((ins.a & 0xff) << 8) | (((ins.d ?? 0) & 0xff) << 16)) >>> 0;
      w.u32(AZT_MathEngine.encodeU32(word0, instrKey));
      w.u32(AZT_MathEngine.encodeU32(ins.b >>> 0, instrKey));
      w.u32(AZT_MathEngine.encodeU32(ins.c >>> 0, instrKey));
    }

    w.u32(p.protos.length);
    for (const child of p.protos) writeProto(child);
  };

  writeProto(root);
  return { bytes: w.toUint8Array(), lazyStringsEncrypted };
}

// ── Heavyweight Chunked Lazy Encryption (XTEA-16 + Dual SBox + RC4(SHA-512) + SHA-2064 + Full 32B HMAC + Authenticated Salt) ──

export function AZT_EncryptBinaryChunkedLazy(
  plainBin,
  masterKey,
  customShaSeed,
  checksumPoly,
  sbox,
  sbox2,
  xteaKey,
  cipherSeed,
  cipherMult,
  cipherAdd,
  initialHeartbeat,
  rng,
  minAuthenticatedSaltPerChunk = 1400
) {
  const targetChunkSize = Math.max(80, Math.ceil(plainBin.length / 10));
  const chunks = [];
  for (let off = 0; off < plainBin.length; off += targetChunkSize) {
    chunks.push(plainBin.subarray(off, Math.min(plainBin.length, off + targetChunkSize)));
  }

  const w = new AZT_BinWriter();
  w.u16(chunks.length);

  let chainDigest = AZT_SHA256(masterKey);
  let heartbeat = initialHeartbeat >>> 0;

  for (let ci = 0; ci < chunks.length; ci++) {
    const plain = chunks[ci];
    // Pad each chunk with high-entropy authenticated cryptographic salt (also XTEA-16/RC4/SHA-2064 encrypted & HMAC-verified!)
    const effSalt = plainBin.length < 16384 ? minAuthenticatedSaltPerChunk : 64;
    const saltLen = effSalt > 0 ? rng.int(effSalt, effSalt + Math.min(256, effSalt)) : 0;
    const totalLen = plain.length + saltLen;
    const padded = new Uint8Array(totalLen);
    padded.set(plain, 0);
    for (let s = 0; s < saltLen; s++) padded[plain.length + s] = rng.int(0, 255);

    const puzzle = AZT_CreateMathPuzzle(rng);
    const x = puzzle.secret;

    // Full 32-byte HMAC-SHA256 + Custom Checksum over entire authenticated block (plain || salt)
    const csum = AZT_CustomChecksum(padded, checksumPoly);
    const hmacFull = AZT_HMAC_SHA256(masterKey, padded); // Full 32 bytes!

    heartbeat = ((((heartbeat ^ x) ^ csum) >>> 0) + (Math.imul(ci, 0x9e3779b9) >>> 0)) >>> 0;

    const km = new Uint8Array(35);
    km.set(chainDigest, 0);
    km[32] = ci & 0xff;
    km[33] = x & 0xff;
    km[34] = (x >>> 8) & 0xff;

    // Layer A: XTEA-16 Block Cipher (64-bit Feistel)
    const step0 = AZT_XTEA16_Encrypt(padded, xteaKey);

    // Layer B: RC4-drop64 keyed by SHA-512(km)
    const step1 = AZT_RC4(AZT_SHA512(km), step0, 64);

    // Layer C: Custom SHA-2064 (258-byte) keystream XOR
    const sha2064 = AZT_SHA2064_Custom(km, customShaSeed);
    const step2 = new Uint8Array(step1.length);
    for (let i = 0; i < step1.length; i++) step2[i] = step1[i] ^ sha2064[i % 258];

    // Layer D: Dual S-Box (sbox2 -> sbox) + Rolling Affine-XOR
    const step3 = new Uint8Array(step2.length);
    let st = (cipherSeed ^ (Math.imul(ci, 0x9e3779b9) >>> 0)) >>> 0;
    for (let i = 0; i < step2.length; i++) {
      st = (Math.imul(st, cipherMult) + cipherAdd) >>> 0;
      const mk = (st >>> 16) & 0xff;
      step3[i] = sbox[sbox2[step2[i] ^ mk]];
    }

    w.u32(plain.length);
    w.u32(totalLen);
    w.u16(puzzle.aInv);
    w.u16(puzzle.b);
    w.u16(puzzle.c);
    w.u32(csum);
    w.bytes(hmacFull); // 32-byte full HMAC-SHA256!
    w.bytes(step3);

    chainDigest = AZT_SHA256(plain);
  }

  return { container: w.toUint8Array(), chunkCount: chunks.length, finalHeartbeat: heartbeat >>> 0 };
}

export function AZT_DecryptBinaryChunkedLazy(
  container,
  masterKey,
  customShaSeed,
  checksumPoly,
  invSBox,
  invSBox2,
  xteaKey,
  cipherSeed,
  cipherMult,
  cipherAdd,
  initialHeartbeat = 0
) {
  const dv = new DataView(container.buffer, container.byteOffset, container.byteLength);
  let pos = 0;
  const chunkCount = dv.getUint16(pos, true); pos += 2;

  let chainDigest = AZT_SHA256(masterKey);
  let heartbeat = initialHeartbeat >>> 0;
  const parts = [];
  let totalPlainLen = 0;

  for (let ci = 0; ci < chunkCount; ci++) {
    const plainLen = dv.getUint32(pos, true); pos += 4;
    const totalLen = dv.getUint32(pos, true); pos += 4;
    const aInv = dv.getUint16(pos, true); pos += 2;
    const b = dv.getUint16(pos, true); pos += 2;
    const c = dv.getUint16(pos, true); pos += 2;
    const expectedCsum = dv.getUint32(pos, true); pos += 4;
    const expectedHmac = container.subarray(pos, pos + 32); pos += 32;
    const enc = container.subarray(pos, pos + totalLen); pos += totalLen;

    const x = AZT_SolveMathPuzzle(aInv, b, c);
    heartbeat = ((((heartbeat ^ x) ^ expectedCsum) >>> 0) + (Math.imul(ci, 0x9e3779b9) >>> 0)) >>> 0;

    // Reverse Layer D: Dual S-Box (invSBox -> invSBox2) + Rolling Affine-XOR
    const step2 = new Uint8Array(totalLen);
    let st = (cipherSeed ^ (Math.imul(ci, 0x9e3779b9) >>> 0)) >>> 0;
    for (let i = 0; i < totalLen; i++) {
      st = (Math.imul(st, cipherMult) + cipherAdd) >>> 0;
      const mk = (st >>> 16) & 0xff;
      step2[i] = invSBox2[invSBox[enc[i]]] ^ mk;
    }

    // Reverse Layer C: Custom SHA-2064
    const km = new Uint8Array(35);
    km.set(chainDigest, 0);
    km[32] = ci & 0xff;
    km[33] = x & 0xff;
    km[34] = (x >>> 8) & 0xff;
    const sha2064 = AZT_SHA2064_Custom(km, customShaSeed);
    const step1 = new Uint8Array(totalLen);
    for (let i = 0; i < totalLen; i++) step1[i] = step2[i] ^ sha2064[i % 258];

    // Reverse Layer B: RC4-drop64(SHA-512)
    const step0 = AZT_RC4(AZT_SHA512(km), step1, 64);

    // Reverse Layer A: XTEA-16 Block Cipher
    const padded = AZT_XTEA16_Decrypt(step0, xteaKey);

    if (AZT_CustomChecksum(padded, checksumPoly) !== expectedCsum) {
      throw new Error(`AZT_Crypto: Checksum mismatch at chunk ${ci}`);
    }
    const actualHmac = AZT_HMAC_SHA256(masterKey, padded);
    for (let k = 0; k < 32; k++) {
      if (actualHmac[k] !== expectedHmac[k]) {
        throw new Error(`AZT_Crypto: HMAC-SHA256 mismatch at chunk ${ci}`);
      }
    }

    const plain = padded.subarray(0, plainLen);
    parts.push(plain);
    totalPlainLen += plainLen;
    chainDigest = AZT_SHA256(plain);
  }

  const out = new Uint8Array(totalPlainLen);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return { plainBin: out, finalHeartbeat: heartbeat >>> 0 };
}

// ── Fast LZ77-RLE Compression ────────────────────────────────────────────────

export function AZT_CompressLZ(input) {
  const out = [];
  const n = input.length;
  let i = 0;
  let litStart = 0;

  const flushLiterals = (end) => {
    let p = litStart;
    while (p < end) {
      const chunk = Math.min(128, end - p);
      out.push(chunk - 1);
      for (let k = 0; k < chunk; k++) out.push(input[p + k]);
      p += chunk;
    }
  };

  while (i < n) {
    let bestLen = 0;
    let bestDist = 0;
    const maxDist = Math.min(i, 2048);
    const maxLen = Math.min(130, n - i);

    if (maxLen >= 4) {
      for (let dist = 1; dist <= maxDist; dist++) {
        if (input[i - dist] !== input[i] || input[i - dist + 1] !== input[i + 1]) continue;
        let len = 2;
        while (len < maxLen && input[i - dist + len] === input[i + len]) len++;
        if (len > bestLen) {
          bestLen = len;
          bestDist = dist;
          if (bestLen === maxLen) break;
        }
      }
    }

    if (bestLen >= 4) {
      if (i > litStart) flushLiterals(i);
      out.push(0x80 | (bestLen - 3));
      out.push(bestDist & 0xff);
      out.push((bestDist >>> 8) & 0xff);
      i += bestLen;
      litStart = i;
    } else {
      i++;
    }
  }

  if (n > litStart) flushLiterals(n);
  return new Uint8Array(out);
}

export function AZT_DecompressLZ(comp, rawLen) {
  const out = new Uint8Array(rawLen);
  let ip = 0;
  let op = 0;
  while (ip < comp.length && op < rawLen) {
    const flag = comp[ip++];
    if ((flag & 0x80) === 0) {
      const len = flag + 1;
      for (let k = 0; k < len; k++) out[op++] = comp[ip++];
    } else {
      const len = (flag & 0x7f) + 3;
      const dist = comp[ip] | (comp[ip + 1] << 8);
      ip += 2;
      for (let k = 0; k < len; k++) {
        out[op] = out[op - dist];
        op++;
      }
    }
  }
  return out;
}

// ── Safe Base-85 + Dictionary Token Substitution with #AZT^ ... ^AZURE# Frame ─

export function AZT_EncodeBase85Dict(bytes) {
  const paddedLen = Math.ceil(bytes.length / 4) * 4;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);

  const chunks = [];
  const freq = new Map();

  for (let i = 0; i < paddedLen; i += 4) {
    let v = (padded[i] | (padded[i + 1] << 8) | (padded[i + 2] << 16) | (padded[i + 3] << 24)) >>> 0;
    const d0 = v % 85; v = Math.floor(v / 85);
    const d1 = v % 85; v = Math.floor(v / 85);
    const d2 = v % 85; v = Math.floor(v / 85);
    const d3 = v % 85; v = Math.floor(v / 85);
    const d4 = v % 85;
    const chunk =
      AZT_B85_ALPHABET[d0] +
      AZT_B85_ALPHABET[d1] +
      AZT_B85_ALPHABET[d2] +
      AZT_B85_ALPHABET[d3] +
      AZT_B85_ALPHABET[d4];
    chunks.push(chunk);
    freq.set(chunk, (freq.get(chunk) ?? 0) + 1);
  }

  const top = [...freq.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, AZT_TOKEN_CHARS.length);

  const dict = {};
  const revDict = new Map();
  for (let idx = 0; idx < top.length; idx++) {
    const tok = AZT_TOKEN_CHARS[idx];
    dict[tok] = top[idx][0];
    revDict.set(top[idx][0], tok);
  }

  let body = "";
  for (const ch of chunks) body += revDict.get(ch) ?? ch;

  return { encoded: `#AZT^${body}^AZURE#`, dict };
}

export function AZT_DecodeBase85Dict(encoded, dict, exactLen) {
  if (!encoded.startsWith("#AZT^") || !encoded.endsWith("^AZURE#")) {
    throw new Error("AZT_Crypto: Invalid #AZT^...^AZURE# frame");
  }
  const stripped = encoded.slice(5, -7);
  let expanded = "";
  for (let i = 0; i < stripped.length; i++) {
    const c = stripped[i];
    expanded += dict[c] ?? c;
  }

  const out = new Uint8Array(Math.floor(expanded.length / 5) * 4);
  let op = 0;
  for (let i = 0; i + 4 < expanded.length; i += 5) {
    const d0 = AZT_B85_REV[expanded.charCodeAt(i)];
    const d1 = AZT_B85_REV[expanded.charCodeAt(i + 1)];
    const d2 = AZT_B85_REV[expanded.charCodeAt(i + 2)];
    const d3 = AZT_B85_REV[expanded.charCodeAt(i + 3)];
    const d4 = AZT_B85_REV[expanded.charCodeAt(i + 4)];
    const v = (d0 + d1 * 85 + d2 * 7225 + d3 * 614125 + d4 * 52200625) >>> 0;
    out[op++] = v & 0xff;
    out[op++] = (v >>> 8) & 0xff;
    out[op++] = (v >>> 16) & 0xff;
    out[op++] = (v >>> 24) & 0xff;
  }
  return out.subarray(0, exactLen);
}

/** Helper to run the 4-stage outer codec chain (NibbleRot -> Delta -> Feistel -> LZ -> Safe Base85+Dict) */
function AZT_WrapFrame(rawBytes, codec) {
  const s1 = AZT_EncodeNibbleRot(rawBytes, codec.rotShift, codec.rotMask);
  const s2 = AZT_EncodeDelta(s1, codec.deltaSeed);
  const s3 = AZT_EncodeFeistelBytes(s2, codec.feistelK1, codec.feistelK2);
  const comp = AZT_CompressLZ(s3);
  const { encoded, dict } = AZT_EncodeBase85Dict(comp);
  return { encoded, dict, compLen: comp.length };
}

// ── Micro-VM Boot Bytecode Compiler (with Rice Barrier Chains) ───────────────

function AZT_BuildBootBytecode(
  atKey0,
  atKey1,
  atKey2,
  enableAntiTamper,
  rng
) {
  const ids = rng.shuffle(Array.from({ length: 200 }, (_, i) => i + 10));
  const bootOpMap = {
    [AZT_BootOp.INIT_VITAL]: ids[0],
    [AZT_BootOp.CHECK_PLACEID]: ids[1],
    [AZT_BootOp.CHECK_TABLE_FROZEN]: ids[2],
    [AZT_BootOp.RICE_BARRIER]: ids[3],
    [AZT_BootOp.DECODE_WM_HASH]: ids[4],
    [AZT_BootOp.FINALIZE_VITAL]: ids[5],
  };

  const w = new AZT_BinWriter();
  const emit = (op, arg1, arg2) => {
    w.u8(bootOpMap[op]);
    w.u32(arg1 >>> 0);
    w.u32(arg2 >>> 0);
  };

  emit(AZT_BootOp.INIT_VITAL, atKey0, rng.int(11, 999));
  for (let r = 0; r < 16; r++) emit(AZT_BootOp.RICE_BARRIER, rng.int(7, 251), rng.int(13, 251));
  emit(AZT_BootOp.CHECK_PLACEID, enableAntiTamper ? 8888 : 0, atKey1);
  for (let r = 0; r < 16; r++) emit(AZT_BootOp.RICE_BARRIER, rng.int(19, 251), rng.int(23, 251));
  emit(AZT_BootOp.CHECK_TABLE_FROZEN, enableAntiTamper ? 599 : 0, atKey2);
  for (let r = 0; r < 12; r++) emit(AZT_BootOp.RICE_BARRIER, rng.int(31, 251), rng.int(37, 251));
  emit(AZT_BootOp.DECODE_WM_HASH, rng.int(3, 97), 0);
  emit(AZT_BootOp.FINALIZE_VITAL, 0, 0);

  return { bootBytes: w.toUint8Array(), bootOpMap };
}

// ── Full Heavyweight Symbiotic Multi-Payload Encoder Entrypoint ──────────────

export function AZT_PackMultiLayerPayload(
  root,
  rng,
  math,
  enableAntiTamper = true
) {
  // 1. Randomize all VM opcodes
  const allOps = [];
  for (let op = 0; op <= AZT_OpCode.SUPER_RICE_GUARD; op++) allOps.push(op);
  const pool = rng.shuffle(Array.from({ length: 256 }, (_, i) => i));
  const opcodeMap = new Map();
  const revOpcodeMap = new Map();
  for (let i = 0; i < allOps.length; i++) {
    opcodeMap.set(allOps[i], pool[i]);
    revOpcodeMap.set(pool[i], allOps[i]);
  }

  // 2. Per-build cryptographic, codec & symbiotic keys
  const masterKeyArr = Array.from({ length: 16 }, () => rng.int(1, 254));
  const masterKey = new Uint8Array(masterKeyArr);
  const customShaSeed = rng.nextU32();
  const checksumPoly = ((rng.nextU32() & 0xffff) | 1) >>> 0;
  const instrKey = math.generateAffineKey();

  const codec = {
    rotShift: rng.int(1, 7),
    rotMask: rng.int(17, 239),
    deltaSeed: rng.int(13, 241),
    feistelK1: rng.int(19, 233),
    feistelK2: rng.int(29, 227),
  };

  const atKey0 = rng.nextU32();
  const atKey1 = rng.nextU32();
  const atKey2 = rng.nextU32();
  const vitalExpected = (((atKey0 ^ atKey1) >>> 0) + atKey2) >>> 0;
  const wmBytes = new TextEncoder().encode("AZT Obfuscator Protect this file");
  const wmHashExpected = AZT_CustomChecksum(wmBytes, checksumPoly);
  const vitalSeed = (vitalExpected ^ wmHashExpected) >>> 0;

  const maskedMasterKey = masterKeyArr.map((b, i) => {
    const sh = (i & 3) * 8;
    const vb = (vitalExpected >>> sh) & 0xff;
    const wb = (wmHashExpected >>> sh) & 0xff;
    return (b ^ vb ^ wb) & 0xff;
  });

  const entangledAffXor = (instrKey.xorMask ^ vitalSeed) >>> 0;
  const opMaskByte = rng.int(17, 241);

  // 3. Payload 1: Boot Micro-VM Bytecode ([[#AZT^...^AZURE#]])
  const { bootBytes, bootOpMap } = AZT_BuildBootBytecode(atKey0, atKey1, atKey2, enableAntiTamper, rng);
  const bootRc4Key = Array.from({ length: 12 }, () => rng.int(1, 254));
  const bootEnc = AZT_RC4(new Uint8Array(bootRc4Key), bootBytes, 32);
  const bootFramed = AZT_WrapFrame(bootEnc, codec);

  // 4. Payload 2: Heavyweight 10KB+ Encrypted Cryptographic Vault (invSBox2 + XTEA-16 Key + Diffusion Tables)
  const sbox = rng.shuffle(Array.from({ length: 256 }, (_, i) => i));
  const invSBox = new Array(256);
  for (let i = 0; i < 256; i++) invSBox[sbox[i]] = i;

  const sbox2 = rng.shuffle(Array.from({ length: 256 }, (_, i) => i));
  const invSBox2 = new Array(256);
  for (let i = 0; i < 256; i++) invSBox2[sbox2[i]] = i;

  const xteaKey = new Uint32Array([rng.nextU32(), rng.nextU32(), rng.nextU32(), rng.nextU32()]);
  const vaultW = new AZT_BinWriter();
  for (let i = 0; i < 256; i++) vaultW.u8(invSBox2[i]);
  for (let i = 0; i < 4; i++) vaultW.u32(xteaKey[i]);
  // 10,240 bytes of authenticated diffusion tables (verified by vaultChecksum at runtime!)
  for (let i = 0; i < 10240; i++) vaultW.u8(rng.int(0, 255));
  const vaultPlain = vaultW.toUint8Array();
  const vaultChecksum = AZT_CustomChecksum(vaultPlain, checksumPoly);
  const vaultEnc = AZT_RC4(masterKey, vaultPlain, 64);
  const vaultFramed = AZT_WrapFrame(vaultEnc, codec);

  // 5. Payload 3: Heavyweight Encrypted Main VM Bytecode (XTEA-16 + Dual SBox + RC4(SHA-512) + SHA-2064 + Full 32B HMAC + Authenticated Salt)
  const { bytes: plainBin, lazyStringsEncrypted } = AZT_SerializeProto(
    root, opcodeMap, instrKey, masterKey, customShaSeed, opMaskByte, rng
  );

  const cipherSeed = rng.nextU32();
  const cipherMult = ((rng.nextU32() & 0xffff) | 1) >>> 0;
  const cipherAdd = (rng.nextU32() & 0xffff) | 1;

  const { container, chunkCount, finalHeartbeat } = AZT_EncryptBinaryChunkedLazy(
    plainBin, masterKey, customShaSeed, checksumPoly, sbox, sbox2, xteaKey,
    cipherSeed, cipherMult, cipherAdd, vitalSeed, rng, 1500
  );

  const mainFramed = AZT_WrapFrame(container, codec);
  const cffInitSeed = rng.nextU32();
  const cffKeys = Array.from({ length: 64 }, () => rng.nextU32());
  const cffVitalExpected = AZT_CFFEngine.computeGenesisVital(cffInitSeed, cffKeys);
  const hbMaskConst = (((finalHeartbeat ^ cffVitalExpected) >>> 0) ^ opMaskByte) >>> 0;

  return {
    encoded: mainFramed.encoded,
    dict: mainFramed.dict,
    rawLen: container.length,
    plainBinLen: plainBin.length,
    compLen: mainFramed.compLen,
    chunkCount,
    masterKey: masterKeyArr,
    customShaSeed,
    checksumPoly,
    cipherSeed,
    cipherMult,
    cipherAdd,
    instrKey,
    invSBox,
    opcodeMap,
    revOpcodeMap,
    lazyStringsEncrypted,
    symbiotic: {
      atKey0,
      atKey1,
      atKey2,
      vitalExpected,
      wmHashExpected,
      maskedMasterKey,
      entangledAffXor,
      opMaskByte,
      heartbeatExpected: finalHeartbeat,
      hbMaskConst,
      cffInitSeed,
      cffKeys,
      cffVitalExpected,
      bootEncoded: bootFramed.encoded,
      bootDict: bootFramed.dict,
      bootRawLen: bootBytes.length,
      bootCompLen: bootFramed.compLen,
      bootRc4Key,
      bootOpMap,
      vaultEncoded: vaultFramed.encoded,
      vaultDict: vaultFramed.dict,
      vaultRawLen: vaultPlain.length,
      vaultCompLen: vaultFramed.compLen,
      vaultChecksum,
      codec,
    },
  };
}
