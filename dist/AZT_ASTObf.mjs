// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Compiled & Lightly Obfuscated ESM Runtime
const AZT_0xAZU = 0x100A; void AZT_0xAZU;
// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Pre-VM AST Obfuscator Pass
// Transforms Luau AST BEFORE IR/Bytecode compilation:
// 1. Injects AST-level AZURE_DEC string decoder + encrypts printable string literals
// 2. Renames functions to AZURE_<RAND> with dispatch selector token (e.g. AZURE_SFA("TYA"))
// 3. Wraps function bodies in Rice's Theorem opaque if/elseif/else with fake decoy Decode("Fake-...") branches


import { AZT_PRNG } from "./AZT_PRNG.mjs";
import { AZT_ParseLuau } from "./AZT_AST.mjs";


function AZT_RandUpper(rng, len) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[rng.int(0, chars.length - 1)];
  return out;
}

function AZT_IsPrintableASCII(s) {
  if (s.length === 0) return false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 32 || c > 126) return false;
  }
  return true;
}

/** Bijective printable ASCII (32..126) rolling shift encoder for AST-level Decode() */
export function AZT_EncodeASTString(plain, key) {
  let out = "";
  for (let i = 0; i < plain.length; i++) {
    const c = plain.charCodeAt(i) - 32;
    const shift = (key + (i + 1) * 7) % 95;
    out += String.fromCharCode(32 + ((c + shift) % 95));
  }
  return out;
}

export function AZT_DecodeASTString(enc, key) {
  let out = "";
  for (let i = 0; i < enc.length; i++) {
    const b = enc.charCodeAt(i) - 32;
    const shift = (key + (i + 1) * 7) % 95;
    let d = b - shift;
    if (d < 0) d += 95;
    out += String.fromCharCode(32 + d);
  }
  return out;
}

/**
 * Runs the Pre-VM AST Obfuscator pass over a parsed Luau AST.
 * Produces a transformed AST that is then fed into IR -> Bytecode -> Main Pure Luau VM!
 */
export function AZT_ObfuscateAST(stmts, rng) {
  let functionsWrapped = 0;
  let stringsEncoded = 0;
  let fakeBranchesInjected = 0;

  const decFnName = `AZURE_${AZT_RandUpper(rng, 3)}`;
  const stateVarName = `AZURE_${AZT_RandUpper(rng, 4)}`;
  const stateInit = rng.int(17, 997);

  // 1. Collect candidate top-level functions (local function foo(...) or function foo(...))
  //    that are ONLY ever invoked directly(...) so we can safely inject a selector token!
  const candidateFns = new Map();
  const nonCallRefs = new Set();

  for (const s of stmts) {
    if (s.kind === "LocalFunction") {
      candidateFns.set(s.name, {
        renamed: `AZURE_${AZT_RandUpper(rng, 3)}`,
        token: AZT_RandUpper(rng, 3),
        selParam: `azt_${AZT_RandUpper(rng, 2).toLowerCase()}`,
      });
    } else if (s.kind === "FunctionDecl" && s.nameParts.length === 1 && !s.isMethod) {
      candidateFns.set(s.nameParts[0], {
        renamed: `AZURE_${AZT_RandUpper(rng, 3)}`,
        token: AZT_RandUpper(rng, 3),
        selParam: `azt_${AZT_RandUpper(rng, 2).toLowerCase()}`,
      });
    }
  }

  // Scan AST to check if any candidate function is referenced non-call value
  const scanExpr = (e, isCallee) => {
    switch (e.kind) {
      case "Ident":
        if (!isCallee && candidateFns.has(e.name)) nonCallRefs.add(e.name);
        break;
      case "CallExpr":
        scanExpr(e.callee, true);
        for (const a of e.args) scanExpr(a, false);
        break;
      case "MethodCallExpr":
        scanExpr(e.base, false);
        for (const a of e.args) scanExpr(a, false);
        break;
      case "UnaryOp": scanExpr(e.arg, false); break;
      case "BinaryOp": scanExpr(e.left, false); scanExpr(e.right, false); break;
      case "IfExpr": scanExpr(e.cond, false); scanExpr(e.thenExpr, false); scanExpr(e.elseExpr, false); break;
      case "IndexExpr": scanExpr(e.base, false); scanExpr(e.index, false); break;
      case "MemberExpr": scanExpr(e.base, false); break;
      case "TableCtor":
        for (const f of e.fields) {
          if (f.key) scanExpr(f.key, false);
          scanExpr(f.value, false);
        }
        break;
      case "FunctionExpr": scanStmts(e.body); break;
    }
  };
  const scanStmts = (list) => {
    for (const s of list) {
      switch (s.kind) {
        case "LocalDecl": for (const v of s.values) scanExpr(v, false); break;
        case "Assign":
          for (const t of s.targets) scanExpr(t, false);
          for (const v of s.values) scanExpr(v, false);
          break;
        case "CompoundAssign": scanExpr(s.target, false); scanExpr(s.value, false); break;
        case "CallStmt": scanExpr(s.expr, false); break;
        case "ReturnStmt": for (const v of s.values) scanExpr(v, false); break;
        case "IfStmt":
          for (const b of s.branches) { scanExpr(b.cond, false); scanStmts(b.body); }
          if (s.elseBody) scanStmts(s.elseBody);
          break;
        case "WhileStmt": scanExpr(s.cond, false); scanStmts(s.body); break;
        case "RepeatStmt": scanStmts(s.body); scanExpr(s.cond, false); break;
        case "NumericFor":
          scanExpr(s.start, false); scanExpr(s.limit, false);
          if (s.step) scanExpr(s.step, false);
          scanStmts(s.body);
          break;
        case "GenericFor":
          for (const it of s.iterators) scanExpr(it, false);
          scanStmts(s.body);
          break;
        case "DoBlock": scanStmts(s.body); break;
        case "LocalFunction": scanStmts(s.body); break;
        case "FunctionDecl": scanStmts(s.body); break;
      }
    }
  };
  scanStmts(stmts);
  for (const name of nonCallRefs) candidateFns.delete(name);

  // Helper: build an AST CallExpr `AZURE_DEC(encStr, key)`
  const makeDecCall = (plain) => {
    const key = rng.int(11, 89);
    const enc = AZT_EncodeASTString(plain, key);
    stringsEncoded++;
    return {
      kind: "CallExpr",
      callee: { kind: "Ident", name: decFnName },
      args: [
        { kind: "String", value: enc },
        { kind: "Number", value: key },
      ],
    };
  };

  // Helper: Rice's Theorem opaque true condition in AST: ((stateVar * (stateVar + 1)) % 2) == 0
  const makeRiceTrueAST = () => {
    const k = rng.int(3, 59);
    const sExpr = {
      kind: "BinaryOp",
      op: "+",
      left: { kind: "Ident", name: stateVarName },
      right: { kind: "Number", value: k },
    };
    const sPlus1 = {
      kind: "BinaryOp",
      op: "+",
      left: { kind: "Ident", name: stateVarName },
      right: { kind: "Number", value: k + 1 },
    };
    return {
      kind: "BinaryOp",
      op: "==",
      left: {
        kind: "BinaryOp",
        op: "%",
        left: { kind: "BinaryOp", op: "*", left: sExpr, right: sPlus1 },
        right: { kind: "Number", value: 2 },
      },
      right: { kind: "Number", value: 0 },
    };
  };

  // Helper: wrap a function body in polymorphic if / elseif (fake Decode) / else
  const wrapBodyWithBranches = (body, selParam, token) => {
    functionsWrapped++;
    fakeBranchesInjected += 2;
    const fakeToken1 = AZT_RandUpper(rng, 3);
    const fakeStr1 = `AZT_FAKE_${AZT_RandUpper(rng, 6)}`;
    const fakeStr2 = `AZT_DECOY_${AZT_RandUpper(rng, 6)}`;

    const realCond = selParam && token
      ? {
          kind: "BinaryOp",
          op: "and",
          left: {
            kind: "BinaryOp",
            op: "==",
            left: { kind: "Ident", name: selParam },
            right: makeDecCall(token),
          },
          right: makeRiceTrueAST(),
        }
      : makeRiceTrueAST();

    const fakeCond = selParam
      ? {
          kind: "BinaryOp",
          op: "==",
          left: { kind: "Ident", name: selParam },
          right: makeDecCall(fakeToken1),
        }
      : {
          kind: "BinaryOp",
          op: "==",
          left: {
            kind: "BinaryOp",
            op: "%",
            left: {
              kind: "BinaryOp",
              op: "*",
              left: { kind: "Ident", name: stateVarName },
              right: {
                kind: "BinaryOp",
                op: "+",
                left: { kind: "Ident", name: stateVarName },
                right: { kind: "Number", value: 1 },
              },
            },
            right: { kind: "Number", value: 2 },
          },
          right: { kind: "Number", value: 1 },
        };

    const wrappedIf = {
      kind: "IfStmt",
      branches: [
        { cond: realCond, body },
        { cond: fakeCond, body: [{ kind: "ReturnStmt", values: [makeDecCall(fakeStr1)] }] },
      ],
      elseBody: [{ kind: "ReturnStmt", values: [makeDecCall(fakeStr2)] }],
    };

    return [wrappedIf];
  };

  // 2. Transform expressions & statements recursively
  const xformExpr = (e) => {
    switch (e.kind) {
      case "String":
        if (AZT_IsPrintableASCII(e.value)) {
          return makeDecCall(e.value);
        }
        return e;

      case "CallExpr": {
        if (e.callee.kind === "Ident" && candidateFns.has(e.callee.name)) {
          const info = candidateFns.get(e.callee.name);
          return {
            kind: "CallExpr",
            callee: { kind: "Ident", name: info.renamed },
            args: [makeDecCall(info.token), ...e.args.map(xformExpr)],
          };
        }
        return { kind: "CallExpr", callee: xformExpr(e.callee), args: e.args.map(xformExpr) };
      }

      case "MethodCallExpr":
        return { ...e, base: xformExpr(e.base), args: e.args.map(xformExpr) };

      case "UnaryOp":
        return { ...e, arg: xformExpr(e.arg) };

      case "BinaryOp":
        return { ...e, left: xformExpr(e.left), right: xformExpr(e.right) };

      case "IfExpr":
        return {
          kind: "IfExpr",
          cond: xformExpr(e.cond),
          thenExpr: xformExpr(e.thenExpr),
          elseExpr: xformExpr(e.elseExpr),
        };

      case "IndexExpr":
        return { kind: "IndexExpr", base: xformExpr(e.base), index: xformExpr(e.index) };

      case "MemberExpr":
        return { kind: "MemberExpr", base: xformExpr(e.base), field: e.field };

      case "TableCtor":
        return {
          kind: "TableCtor",
          fields: e.fields.map((f) => ({
            key: f.key ? xformExpr(f.key) : undefined,
            value: xformExpr(f.value),
          })),
        };

      case "FunctionExpr":
        return { ...e, body: wrapBodyWithBranches(xformStmts(e.body)) };

      default:
        return e;
    }
  };

  const xformStmts = (list) => {
    const out = [];
    for (const s of list) {
      switch (s.kind) {
        case "LocalFunction": {
          const info = candidateFns.get(s.name);
          const innerBody = xformStmts(s.body);
          if (info) {
            out.push({
              kind: "LocalFunction",
              name: info.renamed,
              params: [info.selParam, ...s.params],
              isVararg: s.isVararg,
              body: wrapBodyWithBranches(innerBody, info.selParam, info.token),
            });
          } else {
            out.push({ ...s, body: wrapBodyWithBranches(innerBody) });
          }
          break;
        }

        case "FunctionDecl": {
          const innerBody = xformStmts(s.body);
          if (s.nameParts.length === 1 && !s.isMethod && candidateFns.has(s.nameParts[0])) {
            const info = candidateFns.get(s.nameParts[0]);
            out.push({
              kind: "LocalFunction",
              name: info.renamed,
              params: [info.selParam, ...s.params],
              isVararg: s.isVararg,
              body: wrapBodyWithBranches(innerBody, info.selParam, info.token),
            });
          } else {
            out.push({ ...s, body: wrapBodyWithBranches(innerBody) });
          }
          break;
        }

        case "LocalDecl":
          out.push({ ...s, values: s.values.map(xformExpr) });
          break;
        case "Assign":
          out.push({ ...s, targets: s.targets.map(xformExpr), values: s.values.map(xformExpr) });
          break;
        case "CompoundAssign":
          out.push({ ...s, target: xformExpr(s.target), value: xformExpr(s.value) });
          break;
        case "CallStmt":
          out.push({ kind: "CallStmt", expr: xformExpr(s.expr) });
          break;
        case "ReturnStmt":
          out.push({ kind: "ReturnStmt", values: s.values.map(xformExpr) });
          break;
        case "IfStmt":
          out.push({
            kind: "IfStmt",
            branches: s.branches.map((b) => ({ cond: xformExpr(b.cond), body: xformStmts(b.body) })),
            elseBody: s.elseBody ? xformStmts(s.elseBody) : undefined,
          });
          break;
        case "WhileStmt":
          out.push({ kind: "WhileStmt", cond: xformExpr(s.cond), body: xformStmts(s.body) });
          break;
        case "RepeatStmt":
          out.push({ kind: "RepeatStmt", body: xformStmts(s.body), cond: xformExpr(s.cond) });
          break;
        case "NumericFor":
          out.push({
            ...s,
            start: xformExpr(s.start),
            limit: xformExpr(s.limit),
            step: s.step ? xformExpr(s.step) : undefined,
            body: xformStmts(s.body),
          });
          break;
        case "GenericFor":
          out.push({ ...s, iterators: s.iterators.map(xformExpr), body: xformStmts(s.body) });
          break;
        case "DoBlock":
          out.push({ kind: "DoBlock", body: xformStmts(s.body) });
          break;
        default:
          out.push(s);
      }
    }
    return out;
  };

  const transformedBody = xformStmts(stmts);

  // 3. Parse & prepend the AST-level string decoder + Rice state variable
  const preludeSource = `
local ${stateVarName} = ${stateInit}
local function ${decFnName}(_s, _k)
  local _o = ""
  for _i = 1, #_s do
    local _b = string.byte(_s, _i) - 32 - ((_k + _i * 7) % 95)
    if _b < 0 then
      _b = _b + 95
    end
    _o = _o .. string.char(_b + 32)
  end
  return _o
end
`;
  const preludeAST = AZT_ParseLuau(preludeSource);

  return {
    stmts: [...preludeAST, ...transformedBody],
    functionsWrapped,
    stringsEncoded,
    fakeBranchesInjected,
  };
}
