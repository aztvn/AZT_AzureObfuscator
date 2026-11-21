// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Intermediate Representation (IR) Layer
// AST -> Basic-Block IR -> Rice's Theorem Opaque CFG & Constant Folding -> Bytecode

import { AZT_Expr, AZT_Stmt } from "./AZT_Types.js";
import { AZT_PRNG } from "./AZT_PRNG.js";

export interface AZT_IRBlock {
  id: number;
  stmts: AZT_Stmt[];
  riceTag: number;
}

export interface AZT_IRModule {
  blocks: AZT_IRBlock[];
  irNodesTransformed: number;
  riceBlocksInjected: number;
}

/**
 * Lowers Luau AST into an Intermediate Representation (IR) of basic blocks,
 * performs safe constant folding on pure arithmetic expressions, and injects
 * Rice's Theorem undecidable semantic guards into IR blocks before bytecode emission.
 */
export function AZT_LowerASTToIR(
  stmts: AZT_Stmt[],
  rng: AZT_PRNG,
  enableRiceIR = true
): AZT_IRModule {
  let irNodesTransformed = 0;
  let riceBlocksInjected = 0;

  const foldExpr = (e: AZT_Expr): AZT_Expr => {
    if (e.kind === "BinaryOp") {
      const l = foldExpr(e.left);
      const r = foldExpr(e.right);
      if (l.kind === "Number" && r.kind === "Number") {
        let folded: number | null = null;
        if (e.op === "+") folded = l.value + r.value;
        else if (e.op === "-") folded = l.value - r.value;
        else if (e.op === "*") folded = l.value * r.value;
        if (folded !== null && Number.isFinite(folded)) {
          irNodesTransformed++;
          return { kind: "Number", value: folded };
        }
      }
      return { ...e, left: l, right: r };
    }
    if (e.kind === "UnaryOp") {
      const a = foldExpr(e.arg);
      if (e.op === "-" && a.kind === "Number") {
        irNodesTransformed++;
        return { kind: "Number", value: -a.value };
      }
      return { ...e, arg: a };
    }
    if (e.kind === "IfExpr") {
      return {
        kind: "IfExpr",
        cond: foldExpr(e.cond),
        thenExpr: foldExpr(e.thenExpr),
        elseExpr: foldExpr(e.elseExpr),
      };
    }
    if (e.kind === "CallExpr") {
      return {
        kind: "CallExpr",
        callee: foldExpr(e.callee),
        args: e.args.map(foldExpr),
      };
    }
    if (e.kind === "MethodCallExpr") {
      return {
        kind: "MethodCallExpr",
        base: foldExpr(e.base),
        method: e.method,
        args: e.args.map(foldExpr),
      };
    }
    if (e.kind === "TableCtor") {
      return {
        kind: "TableCtor",
        fields: e.fields.map((f) => ({
          key: f.key ? foldExpr(f.key) : undefined,
          value: foldExpr(f.value),
        })),
      };
    }
    if (e.kind === "IndexExpr") {
      return { kind: "IndexExpr", base: foldExpr(e.base), index: foldExpr(e.index) };
    }
    if (e.kind === "MemberExpr") {
      return { kind: "MemberExpr", base: foldExpr(e.base), field: e.field };
    }
    if (e.kind === "FunctionExpr") {
      return { ...e, body: transformStmts(e.body) };
    }
    return e;
  };

  const transformStmts = (list: AZT_Stmt[]): AZT_Stmt[] => {
    const out: AZT_Stmt[] = [];
    for (const s of list) {
      switch (s.kind) {
        case "LocalDecl":
          out.push({ ...s, values: s.values.map(foldExpr) });
          break;
        case "Assign":
          out.push({ ...s, targets: s.targets.map(foldExpr), values: s.values.map(foldExpr) });
          break;
        case "CompoundAssign":
          out.push({ ...s, target: foldExpr(s.target), value: foldExpr(s.value) });
          break;
        case "CallStmt":
          out.push({ kind: "CallStmt", expr: foldExpr(s.expr) });
          break;
        case "ReturnStmt":
          out.push({ kind: "ReturnStmt", values: s.values.map(foldExpr) });
          break;
        case "IfStmt":
          out.push({
            kind: "IfStmt",
            branches: s.branches.map((b) => ({ cond: foldExpr(b.cond), body: transformStmts(b.body) })),
            elseBody: s.elseBody ? transformStmts(s.elseBody) : undefined,
          });
          break;
        case "WhileStmt":
          out.push({ kind: "WhileStmt", cond: foldExpr(s.cond), body: transformStmts(s.body) });
          break;
        case "RepeatStmt":
          out.push({ kind: "RepeatStmt", body: transformStmts(s.body), cond: foldExpr(s.cond) });
          break;
        case "NumericFor":
          out.push({
            ...s,
            start: foldExpr(s.start),
            limit: foldExpr(s.limit),
            step: s.step ? foldExpr(s.step) : undefined,
            body: transformStmts(s.body),
          });
          break;
        case "GenericFor":
          out.push({ ...s, iterators: s.iterators.map(foldExpr), body: transformStmts(s.body) });
          break;
        case "DoBlock":
          out.push({ kind: "DoBlock", body: transformStmts(s.body) });
          break;
        case "LocalFunction":
          out.push({ ...s, body: transformStmts(s.body) });
          break;
        case "FunctionDecl":
          out.push({ ...s, body: transformStmts(s.body) });
          break;
        default:
          out.push(s);
      }
    }
    return out;
  };

  // Split top-level statements into IR Basic Blocks
  const transformed = transformStmts(stmts);
  const blocks: AZT_IRBlock[] = [];
  let blockId = 0;

  // Group into logical blocks (preserving local variable scope across top-level chunk)
  blocks.push({
    id: blockId++,
    stmts: transformed,
    riceTag: enableRiceIR ? (riceBlocksInjected++, rng.int(101, 65521)) : 0,
  });

  return {
    blocks,
    irNodesTransformed,
    riceBlocksInjected,
  };
}

export function AZT_FlattenIRToStmts(ir: AZT_IRModule): AZT_Stmt[] {
  const out: AZT_Stmt[] = [];
  for (const b of ir.blocks) {
    for (const s of b.stmts) out.push(s);
  }
  return out;
}
