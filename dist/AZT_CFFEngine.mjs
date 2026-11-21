// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Compiled & Lightly Obfuscated ESM Runtime
const AZT_0xAZU = 0x100A; void AZT_0xAZU;
// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — 36-Variant Polymorphic CFF + CFG + Lifeblood Genesis Engine
// Generates 1,500+ lines of multi-line CFF/CFG strictly coupled to VM Bytecode & Opcode Unmasking.

import { AZT_PRNG } from "./AZT_PRNG.mjs";

export const AZT_CFF_VARIANT_COUNT = 36;



export class AZT_CFFEngine {

  variantsUsed = new Set();

  constructor(rng) {
    this.rng = rng;
  }

  /** Computes the exact 32-bit Lifeblood Vital Digest of the 32-stage CFF Genesis cascade */
  static computeGenesisVital(initSeed, keys) {
    let cv = initSeed >>> 0;
    for (let s = 0; s < keys.length; s++) {
      const k = keys[s] >>> 0;
      if (s % 3 === 0) {
        cv = (cv ^ k) >>> 0;
      } else if (s % 3 === 1) {
        cv = (cv + k) >>> 0;
      } else {
        const rot = (s % 7) + 1;
        const x = (cv ^ k) >>> 0;
        cv = ((x << rot) | (x >>> (32 - rot))) >>> 0;
      }
    }
    return cv >>> 0;
  }

  /** Variants 1..12: Polymorphic State Comparison Predicates */
  emitCompareLE(stateVar, mid) {
    const variant = this.rng.int(1, 12);
    this.variantsUsed.add(variant);

    switch (variant) {
      case 1: return { cond: `${stateVar}<=${mid}`, inverted: false };
      case 2: return { cond: `${stateVar}<${mid + 1}`, inverted: false };
      case 3: return { cond: `${stateVar}>${mid}`, inverted: true };
      case 4: return { cond: `${stateVar}>=${mid + 1}`, inverted: true };
      case 5: return { cond: `(${stateVar}-${mid})<=0`, inverted: false };
      case 6: return { cond: `(${mid}-${stateVar})>=0`, inverted: false };
      case 7: return { cond: `not(${stateVar}>${mid})`, inverted: false };
      case 8: return { cond: `not(${stateVar}>=${mid + 1})`, inverted: false };
      case 9: {
        const off = this.rng.int(7, 97);
        return { cond: `(${stateVar}+${off})<=${mid + off}`, inverted: false };
      }
      case 10: {
        const k = this.rng.int(3, 13) | 1;
        return { cond: `(${stateVar}*${k})<=${mid * k}`, inverted: false };
      }
      case 11: {
        const k = this.rng.int(3, 11) | 1;
        const r = this.rng.int(1, k - 1);
        return { cond: `((${stateVar}*${k}+${r})//${k})<=${mid}`, inverted: false };
      }
      default: {
        const k = this.rng.int(2, 8);
        return { cond: `((${stateVar}*${k})/${k})<=${mid}`, inverted: false };
      }
    }
  }

  /** Variants 13..24: Polymorphic State Transition Mutations */
  emitTransition(stateVar, fromId, toId, bit32Var, stepFnName) {
    const variant = this.rng.int(13, stepFnName ? 24 : 22);
    this.variantsUsed.add(variant);
    const delta = toId - fromId;

    switch (variant) {
      case 13: return delta >= 0 ? `${stateVar}+=${delta};` : `${stateVar}-=${-delta};`;
      case 14: return delta <= 0 ? `${stateVar}-=${-delta};` : `${stateVar}+=${delta};`;
      case 15: return `${stateVar}=${bit32Var}.bxor(${stateVar},${(fromId ^ toId) >>> 0});`;
      case 16: {
        const a = this.rng.int(11, 89);
        return `${stateVar}=(${stateVar}+${a})-${a}+(${delta});`;
      }
      case 17: {
        const m = this.rng.int(3, 15) | 1;
        const r = this.rng.int(1, m - 1);
        return `${stateVar}=(${toId * m + r})//${m};`;
      }
      case 18: {
        const m = this.rng.int(2, 12);
        return `${stateVar}=(${toId * m})/${m};`;
      }
      case 19: {
        const decoy = this.rng.int(500, 900);
        return `${stateVar}=(${stateVar}==${fromId}) and ${toId} or ${decoy};`;
      }
      case 20: {
        const decoy = this.rng.int(500, 900);
        return `${stateVar}=(${stateVar}~=${decoy}) and ${toId} or ${fromId};`;
      }
      case 21: {
        const x = this.rng.int(1, Math.max(1, toId));
        const y = toId - x;
        return y >= 0
          ? `${stateVar}=${bit32Var}.bxor(${x},${y})+2*${bit32Var}.band(${x},${y});`
          : `${stateVar}=${toId};`;
      }
      case 22: {
        const bump = this.rng.int(5, 45);
        return `${stateVar}+=${delta + bump};${stateVar}-=${bump};`;
      }
      case 23: return `${stateVar}=${stepFnName}(${stateVar},${fromId},${toId});`;
      default: return `${stateVar}=${stepFnName}(${stateVar},${fromId},${toId});`;
    }
  }

  /** Builds a polymorphic Binary-Search-Tree CFG dispatcher (single-line or multi-line CFF) */
  buildDispatchTree(varName, cases, multiline = false) {
    const sorted = cases.slice().sort((a, b) => a.id - b.id);
    const nl = multiline ? "\n" : " ";

    const build = (lo, hi) => {
      if (lo === hi) return sorted[lo].body;

      if (hi - lo === 1) {
        const leafMode = this.rng.int(25, 28);
        this.variantsUsed.add(leafMode);
        const A = sorted[lo];
        const B = sorted[hi];
        if (leafMode === 25) {
          return `if ${varName}==${A.id} then${nl}${A.body}${nl}else${nl}${B.body}${nl}end`;
        }
        if (leafMode === 26) {
          return `if ${varName}~=${A.id} then${nl}${B.body}${nl}else${nl}${A.body}${nl}end`;
        }
        if (leafMode === 27) {
          return `if ${varName}>${A.id} then${nl}${B.body}${nl}else${nl}${A.body}${nl}end`;
        }
        const cmp = this.emitCompareLE(varName, A.id);
        return cmp.inverted
          ? `if ${cmp.cond} then${nl}${B.body}${nl}else${nl}${A.body}${nl}end`
          : `if ${cmp.cond} then${nl}${A.body}${nl}else${nl}${B.body}${nl}end`;
      }

      const mid = (lo + hi) >> 1;
      const cmp = this.emitCompareLE(varName, sorted[mid].id);
      const leftCode = build(lo, mid);
      const rightCode = build(mid + 1, hi);
      return cmp.inverted
        ? `if ${cmp.cond} then${nl}${rightCode}${nl}else${nl}${leftCode}${nl}end`
        : `if ${cmp.cond} then${nl}${leftCode}${nl}else${nl}${rightCode}${nl}end`;
    };

    return build(0, sorted.length - 1);
  }

  /** Variants 29..36: Structural CFF Loop & Function-CFF Wrappers */
  buildStateMachine(cases, opts) {
    const structVariant = this.rng.int(29, 36);
    this.variantsUsed.add(structVariant);

    const st = opts.stateVar;
    const bit = opts.bit32Var;
    const nl = opts.multiline ? "\n" : "";
    const stepFn = opts.fnName ? `${opts.fnName}_s` : "_cffS";
    const stepHelper = `local function ${stepFn}(_c,_f,_t)${nl}if _c==_f then return _t;else return ${bit}.bxor(_c,${bit}.bxor(_f,_t));end;${nl}end;${nl}`;

    const tree = this.buildDispatchTree(st, cases, opts.multiline);

    switch (structVariant) {
      case 29:
        return `${stepHelper}local function _cffF()${nl}while true do${nl}${tree}${nl}end;${nl}end;${nl}return _cffF();`;
      case 30:
        return `${stepHelper}while true do${nl}${tree}${nl}end;`;
      case 31:
        return `${stepHelper}repeat${nl}${tree}${nl}until false;`;
      case 32:
        return `${stepHelper}for _tk=1,999999 do${nl}${tree}${nl}end;`;
      case 33:
        return `${stepHelper}local function _cffD()${nl}repeat${nl}${tree}${nl}until ${st}<0;${nl}end;${nl}return _cffD();`;
      case 34:
        return `${stepHelper}local function _cffW()${nl}while ${st}>=0 do${nl}${tree}${nl}end;${nl}end;${nl}return _cffW();`;
      case 35: {
        const rv = opts.riceVar || st;
        return `${stepHelper}while ((${rv}*(${rv}+1))%2)==0 do${nl}${tree}${nl}end;`;
      }
      default:
        return `${stepHelper}local function _cffX()${nl}for _tk=1,999999 do${nl}${tree}${nl}end;${nl}end;${nl}return _cffX();`;
    }
  }

  /**
   * Builds a 32-Stage Lifeblood-Coupled CFF Genesis State Machine (~250+ lines of CFF).
   * Every single state MUST execute in order to produce the exact 32-bit `_cv` digest needed
   * to unmask ALL 256 VM opcodes. Skipping or altering ANY 1 state scrambles every VM opcode!
   */
  buildGenesisCFF(
    initSeed,
    keys,
    bit32Var
  ) {
    const n = keys.length; // 32 live stages
    const totalStates = n + 17; // 32 live + 1 done + 8 decoy states = 41 states
    const stateIds = this.rng.shuffle(Array.from({ length: totalStates }, (_, i) => i + 10));
    const liveIds = stateIds.slice(0, n);
    const doneId = stateIds[n];
    const decoyIds = stateIds.slice(n + 1);

    const cases = [];
    for (let s = 0; s < n; s++) {
      const curId = liveIds[s];
      const nextId = s + 1 < n ? liveIds[s + 1] : doneId;
      const k = keys[s] >>> 0;
      let mixStmt;
      if (s % 3 === 0) {
        mixStmt = `_cv=${bit32Var}.bxor(_cv,${k});`;
      } else if (s % 3 === 1) {
        mixStmt = `_cv=(_cv+${k})%4294967296;`;
      } else {
        const rot = (s % 7) + 1;
        mixStmt = `_cv=${bit32Var}.lrotate(${bit32Var}.bxor(_cv,${k}),${rot});`;
      }
      const tr = this.emitTransition("_gs", curId, nextId, bit32Var, "_gStep_s");
      const rk = this.rng.int(3, 89);
      const decoyTarget = decoyIds[s % decoyIds.length];
      cases.push({
        id: curId,
        body: `${mixStmt}\n_gr=(_gr+${rk})%65521;\nif (((_gr+1)*_gr)%2)==0 then\n${tr}\nelse\n_gs=${decoyTarget};\nend`,
      });
    }

    cases.push({
      id: doneId,
      body: `return _cv;`,
    });

    for (let d = 0; d < decoyIds.length; d++) {
      const did = decoyIds[d];
      const jumpBack = liveIds[d % liveIds.length];
      cases.push({
        id: did,
        body: `_cv=${bit32Var}.bxor(_cv,${this.rng.int(1000, 99999)});\n_gr+=5;\n_gs=${jumpBack};`,
      });
    }

    const machine = this.buildStateMachine(cases, {
      stateVar: "_gs",
      bit32Var,
      fnName: "_gStep",
      initState: liveIds[0],
      riceVar: "_gr",
      multiline: true,
    });

    return `(function()\nlocal _cv,_gs,_gr=${initSeed >>> 0},${liveIds[0]},${this.rng.int(17, 997)};\n${machine}\nend)()`;
  }
}
