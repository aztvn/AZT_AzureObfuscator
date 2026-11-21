// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Advanced Math Engine (MBA + Rice's Theorem)

import { AZT_PRNG } from "./AZT_PRNG.js";

export interface AZT_AffineKey {
  a: number;       // odd 32-bit multiplier
  aInv: number;    // modular inverse of a mod 2^32
  b: number;       // 32-bit additive offset
  xorMask: number; // 32-bit XOR mask
}

export class AZT_MathEngine {
  private readonly rng: AZT_PRNG;

  constructor(rng: AZT_PRNG) {
    this.rng = rng;
  }

  /**
   * Computes modular multiplicative inverse of odd `a` modulo 2^32
   * using Newton-Raphson lifting: a * x ≡ 1 (mod 2^32).
   */
  public static modInverse32(a: number): number {
    let x = a >>> 0;
    for (let i = 0; i < 5; i++) {
      x = Math.imul(x, (2 - Math.imul(a, x)) >>> 0) >>> 0;
    }
    return x >>> 0;
  }

  /** Generates an invertible 32-bit affine + XOR cipher key */
  public generateAffineKey(): AZT_AffineKey {
    const a = ((this.rng.nextU32() | 1) >>> 0); // must be odd to be invertible mod 2^32
    const aInv = AZT_MathEngine.modInverse32(a);
    const b = this.rng.nextU32();
    const xorMask = this.rng.nextU32();
    return { a, aInv, b, xorMask };
  }

  /** Forward affine-XOR transform in Z / 2^32 Z */
  public static encodeU32(val: number, k: AZT_AffineKey): number {
    const step1 = ((Math.imul(val >>> 0, k.a) + k.b) >>> 0);
    return (step1 ^ k.xorMask) >>> 0;
  }

  /** Inverse affine-XOR transform in Z / 2^32 Z */
  public static decodeU32(enc: number, k: AZT_AffineKey): number {
    const step1 = ((enc ^ k.xorMask) >>> 0);
    const step2 = ((step1 - k.b) >>> 0);
    return Math.imul(step2, k.aInv) >>> 0;
  }

  /**
   * Generates a Mixed Boolean-Arithmetic (MBA) Luau expression that evaluates
   * to `target` at runtime without exposing the raw constant directly.
   * Uses bit32 identities:
   *   x + y = bxor(x, y) + 2 * band(x, y)
   *   x - y = bxor(x, y) - 2 * band(bnot(x), y)
   */
  public generateMBAConstantExpr(target: number, bit32Var: string): string {
    const t = target | 0;
    const mode = this.rng.int(0, 2);
    if (mode === 0) {
      // Split target = x + y via MBA: (bxor(x, y) + 2 * band(x, y))
      const x = this.rng.int(17, 65535);
      const y = (t - x) | 0;
      if (y >= 0 && y <= 0x7fffffff) {
        return `(${bit32Var}.bxor(${x},${y})+2*${bit32Var}.band(${x},${y}))`;
      }
    }
    if (mode === 1) {
      // Affine identity: (m * target + c) - c / m
      const m = this.rng.int(3, 19) | 1;
      const c = this.rng.int(11, 999);
      const enc = t * m + c;
      return `((${enc}-${c})/${m})`;
    }
    // XOR pair: bxor(target ^ mask, mask)
    const mask = this.rng.int(1024, 1048575);
    const enc = (t ^ mask) >>> 0;
    if (t >= 0 && t <= 0x7fffffff) {
      return `${bit32Var}.bxor(${enc},${mask})`;
    }
    return String(t);
  }

  /**
   * Rice's Theorem Undecidable Opaque Predicate Generator
   *
   * Grounded in Rice's Theorem: non-trivial semantic properties of Turing-complete
   * state machines are undecidable statically. By coupling number-theoretic invariants
   * (e.g., n*(n^2 - 1) ≡ 0 mod 6, MBA identities (x|y)+(x&y) == x+y, Fermat's Little
   * Theorem n^3 ≡ n mod 3) with a runtime-mutated VM state variable `stateVar`,
   * static constant-folding and dead-branch elimination cannot prove reachability
   * without solving the full dynamic state evolution.
   */
  public generateRiceOpaqueTrue(stateVar: string, bit32Var: string): string {
    const variant = this.rng.int(0, 3);
    const k1 = this.rng.int(3, 97);
    const k2 = this.rng.int(5, 89);

    switch (variant) {
      case 0:
        // Number-theoretic invariant: for all integers n, (n^3 - n) % 6 == 0
        return `((((${stateVar}+${k1})^3-(${stateVar}+${k1}))%6)==0)`;
      case 1:
        // Bitwise MBA identity: bor(x, y) + band(x, y) == x + y (for non-neg 24-bit ints)
        return `((${bit32Var}.bor(${bit32Var}.band(${stateVar},16777215),${k1})+${bit32Var}.band(${bit32Var}.band(${stateVar},16777215),${k1}))==(${bit32Var}.band(${stateVar},16777215)+${k1}))`;
      case 2:
        // Quadratic non-residue / parity invariant: (x*(x+1)) % 2 == 0
        return `((((${stateVar}+${k2})*(${stateVar}+${k2 + 1}))%2)==0)`;
      default:
        // MBA XOR-AND identity: bxor(x, y) + 2*band(x, y) == x + y
        return `((${bit32Var}.bxor(${bit32Var}.band(${stateVar},65535),${k1})+2*${bit32Var}.band(${bit32Var}.band(${stateVar},65535),${k1}))==(${bit32Var}.band(${stateVar},65535)+${k1}))`;
    }
  }

  /** Always-false Rice-coupled predicate for dead-branch / honey-pot state injection */
  public generateRiceOpaqueFalse(stateVar: string, bit32Var: string): string {
    const k = this.rng.int(7, 131);
    const variant = this.rng.int(0, 1);
    if (variant === 0) {
      // (n*(n+1)) % 2 is NEVER 1
      return `((((${stateVar}+${k})*(${stateVar}+${k + 1}))%2)==1)`;
    }
    // 7*y^2 - 1 is never a perfect square mod 4 (since 7*y^2 - 1 ≡ 3 or 2 mod 4, never 0 or 1)
    return `(((7*(${stateVar}+${k})^2-1)%4)==0)`;
  }
}
