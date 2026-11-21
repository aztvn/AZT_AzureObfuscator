// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Compiled & Lightly Obfuscated ESM Runtime
const AZT_0xAZU = 0x100A; void AZT_0xAZU;
// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Fast Polymorphic PRNG Engine

export class AZT_PRNG {





  constructor(seed) {
    const raw = seed !== undefined ? (seed >>> 0) : ((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
    this.seed = raw || 0x9e3779b9;
    let z = this.seed;
    const splitmix = () => {
      z = (z + 0x9e3779b9) >>> 0;
      let t = z;
      t = Math.imul(t ^ (t >>> 16), 0x85ebca6b) >>> 0;
      t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35) >>> 0;
      return (t ^ (t >>> 16)) >>> 0;
    };
    this.s0 = splitmix();
    this.s1 = splitmix();
    this.s2 = splitmix();
    this.s3 = splitmix();
  }

  /** Returns unsigned 32-bit integer */
  nextU32() {
    const result = Math.imul(this.rotl(Math.imul(this.s1, 5) >>> 0, 7), 9) >>> 0;
    const t = (this.s1 << 9) >>> 0;
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = this.rotl(this.s3, 11);
    return result;
  }

  rotl(x, k) {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
  }

  /** Returns integer in [min, max] inclusive */
  int(min, max) {
    if (max <= min) return min;
    const span = (max - min + 1) >>> 0;
    return min + (this.nextU32() % span);
  }

  /** Fisher-Yates in-place shuffle */
  shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  /**
   * Generate unique short Luau identifiers (zero readable variable names).
   * Never starts with '_' so internal '_'-prefixed scratch temps can NEVER shadow pool variables.
   */
  createNamePool(count, prefix = "") {
    const firstChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const restChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const reserved = new Set([
      "and", "break", "do", "else", "elseif", "end", "false", "for",
      "function", "if", "in", "local", "nil", "not", "or", "repeat",
      "return", "then", "true", "until", "while", "continue",
    ]);
    const used = new Set();
    const names = [];

    if (!prefix) {
      const singles = this.shuffle(firstChars.split(""));
      for (const ch of singles) {
        if (names.length >= count) break;
        if (!used.has(ch)) {
          used.add(ch);
          names.push(ch);
        }
      }
    }

    while (names.length < count) {
      const len = prefix ? 4 : 2;
      let id = prefix;
      for (let i = 0; i < len; i++) {
        const pool = i === 0 && !prefix ? firstChars : restChars;
        id += pool[this.int(0, pool.length - 1)];
      }
      if (!reserved.has(id) && !used.has(id)) {
        used.add(id);
        names.push(id);
      }
    }
    return names;
  }
}
