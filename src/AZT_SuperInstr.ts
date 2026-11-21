// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Super Instructions Peephole Optimizer & Rice Guard Injector

import { AZT_Instr, AZT_OpCode, AZT_Proto } from "./AZT_Types.js";
import { AZT_PRNG } from "./AZT_PRNG.js";

export interface AZT_SuperStats {
  baseInstructionCount: number;
  finalInstructionCount: number;
  superInstructionsFused: number;
  riceGuardsInjected: number;
}

const AZT_JUMP_OPS = new Set<AZT_OpCode>([
  AZT_OpCode.JMP,
  AZT_OpCode.FORPREP,
  AZT_OpCode.FORLOOP,
]);

/**
 * Optimizes a VM Proto tree by fusing frequent multi-instruction sequences into
 * AZT Azure Super Instructions and injecting Rice's Theorem runtime invariant guards.
 * Safely preserves all jump targets and basic-block boundaries.
 */
export function AZT_OptimizeSuperInstructions(
  root: AZT_Proto,
  rng: AZT_PRNG,
  enableSuper: boolean,
  enableRiceGuards: boolean
): AZT_SuperStats {
  const stats: AZT_SuperStats = {
    baseInstructionCount: 0,
    finalInstructionCount: 0,
    superInstructionsFused: 0,
    riceGuardsInjected: 0,
  };

  const processProto = (proto: AZT_Proto): void => {
    stats.baseInstructionCount += proto.instructions.length;

    const oldIns = proto.instructions;
    const n = oldIns.length;

    // 1. Mark all jump target PCs (cannot fuse across a jump target!)
    const jumpTargets = new Set<number>();
    for (let i = 0; i < n; i++) {
      const ins = oldIns[i];
      if (AZT_JUMP_OPS.has(ins.op)) {
        jumpTargets.add(i + 1 + ins.b);
      }
      // TEST and TFORCALL always precede a JMP; keep them atomic with next instruction
      if (ins.op === AZT_OpCode.TEST || ins.op === AZT_OpCode.TFORCALL) {
        jumpTargets.add(i + 1);
      }
    }

    // 2. Peephole fusion pass with exact oldPC -> newPC mapping
    const newIns: AZT_Instr[] = [];
    const oldToNew = new Array<number>(n + 1).fill(0);

    // Optional Rice Guard at proto entry
    if (enableRiceGuards && n > 1) {
      newIns.push({
        op: AZT_OpCode.SUPER_RICE_GUARD,
        a: rng.int(3, 250),
        b: rng.int(11, 250),
        c: 0,
      });
      stats.riceGuardsInjected++;
    }

    let i = 0;
    while (i < n) {
      oldToNew[i] = newIns.length;
      const cur = oldIns[i];
      const next = i + 1 < n ? oldIns[i + 1] : null;
      const canFuseNext = enableSuper && next !== null && !jumpTargets.has(i + 1);

      // Pattern 1: GETGLOBAL r, k1 + GETFIELD dest, r, k2 (when r == dest or temp)
      if (
        canFuseNext &&
        cur.op === AZT_OpCode.GETGLOBAL &&
        next!.op === AZT_OpCode.GETFIELD &&
        next!.b === cur.a
      ) {
        newIns.push({
          op: AZT_OpCode.SUPER_GETG_GETF,
          a: next!.a,
          b: cur.b,
          c: next!.c,
        });
        oldToNew[i + 1] = newIns.length - 1;
        stats.superInstructionsFused++;
        i += 2;
        continue;
      }

      // Pattern 2: LOADK tmp, k + ADD/SUB/MUL dest, lhs, tmp
      if (
        canFuseNext &&
        cur.op === AZT_OpCode.LOADK &&
        (next!.op === AZT_OpCode.ADD || next!.op === AZT_OpCode.SUB || next!.op === AZT_OpCode.MUL) &&
        next!.c === cur.a &&
        next!.b !== cur.a
      ) {
        const superOp =
          next!.op === AZT_OpCode.ADD
            ? AZT_OpCode.SUPER_LOADK_ADD
            : next!.op === AZT_OpCode.SUB
              ? AZT_OpCode.SUPER_LOADK_SUB
              : AZT_OpCode.SUPER_LOADK_MUL;
        newIns.push({
          op: superOp,
          a: next!.a,
          b: next!.b,
          c: cur.b,
        });
        oldToNew[i + 1] = newIns.length - 1;
        stats.superInstructionsFused++;
        i += 2;
        continue;
      }

      // Pattern 3: LOADK base+1, k + CALL base, 1, numRes -> SUPER_LOADK_CALL1
      if (
        canFuseNext &&
        cur.op === AZT_OpCode.LOADK &&
        next!.op === AZT_OpCode.CALL &&
        next!.b === 1 &&
        cur.a === next!.a + 1
      ) {
        newIns.push({
          op: AZT_OpCode.SUPER_LOADK_CALL1,
          a: next!.a,
          b: cur.b,
          c: next!.c,
        });
        oldToNew[i + 1] = newIns.length - 1;
        stats.superInstructionsFused++;
        i += 2;
        continue;
      }

      // Pattern 4: SELF callBase, obj, k + CALL callBase, 1, numRes (zero-arg method call obj:Method())
      if (
        canFuseNext &&
        cur.op === AZT_OpCode.SELF &&
        next!.op === AZT_OpCode.CALL &&
        next!.a === cur.a &&
        next!.b === 1
      ) {
        newIns.push({
          op: AZT_OpCode.SUPER_SELF_CALL,
          a: cur.a,
          b: cur.b,
          c: cur.c,
          d: next!.c, // numResults
        });
        oldToNew[i + 1] = newIns.length - 1;
        stats.superInstructionsFused++;
        i += 2;
        continue;
      }

      // Pattern 5: LOADK reg, k + RETURN reg, 1 -> SUPER_LOADK_RET
      if (
        canFuseNext &&
        cur.op === AZT_OpCode.LOADK &&
        next!.op === AZT_OpCode.RETURN &&
        next!.a === cur.a &&
        next!.b === 1
      ) {
        newIns.push({
          op: AZT_OpCode.SUPER_LOADK_RET,
          a: cur.a,
          b: cur.b,
          c: 0,
        });
        oldToNew[i + 1] = newIns.length - 1;
        stats.superInstructionsFused++;
        i += 2;
        continue;
      }

      // Default: keep instruction as-is
      newIns.push({ ...cur });
      i++;
    }
    oldToNew[n] = newIns.length;

    // 3. Re-map all jump relative offsets to new PCs
    // Walk original jump instructions and update corresponding newIns entries
    for (let oldPC = 0; oldPC < n; oldPC++) {
      const orig = oldIns[oldPC];
      if (!AZT_JUMP_OPS.has(orig.op)) continue;
      const newPC = oldToNew[oldPC];
      const origTarget = oldPC + 1 + orig.b;
      const clampedTarget = Math.max(0, Math.min(n, origTarget));
      const newTarget = oldToNew[clampedTarget];
      newIns[newPC].b = newTarget - (newPC + 1);
    }

    proto.instructions = newIns;
    stats.finalInstructionCount += newIns.length;

    for (const child of proto.protos) {
      processProto(child);
    }
  };

  processProto(root);
  return stats;
}
