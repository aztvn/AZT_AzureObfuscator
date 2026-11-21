// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Zero-Dependency TS->ESM Builder & Light AZT_ Obfuscator

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const DIST_DIR = path.join(ROOT, "dist");

/**
 * Deterministic TypeScript-to-ESM transpiler for strict AZT TS modules
 * + Light JS obfuscation header/guard injection.
 */
function AZT_StripTS(code) {
  let out = code;

  // 1. Rewrite relative .js imports to .mjs
  out = out.replace(/(from\s+["']\.\/[^"']+)\.js(["'])/g, "$1.mjs$2");

  // 2. Remove `export interface ... { ... }` and `interface ... { ... }`
  out = out.replace(/^(?:export\s+)?interface\s+\w+[^{]*\{[\s\S]*?^\}\n?/gm, "");

  // 3. Remove `export type ... = ...;`
  out = out.replace(/^(?:export\s+)?type\s+\w+\s*=[\s\S]*?;\s*$/gm, "");

  // 4. Transform `export enum Name { ... }` into frozen JS object
  out = out.replace(/export\s+enum\s+(\w+)\s*\{([\s\S]*?)\}/g, (_, enumName, body) => {
    const entries = [];
    let counter = 0;
    for (const rawLine of body.split("\n")) {
      const line = rawLine.replace(/\/\/.*$/, "").trim().replace(/,$/, "");
      if (!line) continue;
      const parts = line.split("=").map((s) => s.trim());
      const key = parts[0];
      const val = parts.length > 1 ? Number(parts[1]) : counter;
      counter = val + 1;
      entries.push(`  ${key}: ${val}`);
    }
    return `export const ${enumName} = Object.freeze({\n${entries.join(",\n")}\n});`;
  });

  // 5. Filter type-only imports from AZT_Types.mjs and AZT_Crypto.mjs / AZT_MathEngine.mjs
  const RUNTIME_EXPORTS = new Set([
    "AZT_OpCode",
    "AZT_B85_ALPHABET", "AZT_BootOp", "AZT_EncodeNibbleRot", "AZT_DecodeNibbleRot",
    "AZT_EncodeDelta", "AZT_DecodeDelta", "AZT_EncodeFeistelBytes", "AZT_DecodeFeistelBytes",
    "AZT_RC4", "AZT_SHA256", "AZT_HMAC_SHA256", "AZT_SHA512", "AZT_SHA2064_Custom", "AZT_CustomChecksum", "AZT_XTEA16_Encrypt", "AZT_XTEA16_Decrypt",
    "AZT_LowerASTToIR", "AZT_FlattenIRToStmts", "AZT_PUZZLE_PRIME", "AZT_ModInversePrime",
    "AZT_CreateMathPuzzle", "AZT_SolveMathPuzzle", "AZT_EncryptStringLazy3", "AZT_DecryptStringLazy3",
    "AZT_EncryptBinaryChunkedLazy", "AZT_DecryptBinaryChunkedLazy", "AZT_PRNG", "AZT_MathEngine", "AZT_CFFEngine", "AZT_CFF_VARIANT_COUNT", "AZT_LexLuau", "AZT_Parser", "AZT_ParseLuau", "AZT_ObfuscateAST", "AZT_EncodeASTString", "AZT_DecodeASTString",
    "AZT_CompileAST", "AZT_OptimizeSuperInstructions", "AZT_SerializeProto", "AZT_EncryptLayer2",
    "AZT_DecryptLayer2", "AZT_CompressLZ", "AZT_DecompressLZ", "AZT_EncodeBase85Dict",
    "AZT_DecodeBase85Dict", "AZT_PackMultiLayerPayload", "AZT_GenerateLuauVM",
    "AZT_NAME", "AZT_VERSION", "AZT_DISCORD", "AZT_Obfuscate", "AZT_RunCLI",
  ]);
  out = out.replace(/import\s+\{([^}]+)\}\s+from\s+["'](\.\/[^"']+\.mjs)["'];?/g, (_, names, mod) => {
    const kept = names
      .split(",")
      .map((s) => s.trim())
      .filter((n) => RUNTIME_EXPORTS.has(n));
    return kept.length > 0 ? `import { ${kept.join(", ")} } from "${mod}";` : "";
  });

  // 6. Remove bare class field declarations with `private`/`public` and NO `=` (e.g. `  private s0: number;`)
  out = out.replace(/^\s+(?:public|private|protected)\s+(?:readonly\s+)?\w+\s*:\s*[^;=\n]+;\s*$/gm, "");

  // 7. Remove `public|private|protected` and `readonly` modifiers
  out = out.replace(/\b(public|private|protected)\s+(static\s+)?(readonly\s+)?/g, (_, _m, st) => st || "");
  out = out.replace(/\breadonly\s+/g, "");

  // 8. Strip generic type args on constructors & methods (`new Map<...>(`, `shuffle<T>(`)
  out = out.replace(/\b(new\s+(?:Array|Map|Set))<[^>\n]+>\(/g, "$1(");
  out = out.replace(/\b(shuffle)<[^>\n]+>\(/g, "$1(");

  // 9. Strip `as Type` casts and non-null assertions `foo!.`
  out = out.replace(/\s+as\s+[A-Za-z0-9_]+/g, "");
  out = out.replace(/(\w+)!\./g, "$1.").replace(/\)!/g, ")");

  // 10. Strip parameter type annotations inside multiline and single-line function/method headers
  // Matches `paramName?: Type` right before `,`, `)`, or `=`
  const TYPE_PATTERN =
    "(?:Record<[^>\\n]+>|Map<[^>\\n]+>|Set<[^>\\n]+>|Required<[^>\\n]+>|\\{[^}\\n]+\\}(?:\\[\\])?|[A-Za-z0-9_]+(?:\\[\\])?(?:\\s*\\|\\s*[A-Za-z0-9_]+(?:\\[\\])?)*)";

  const lines = out.split("\n");
  let inParamList = false;
  const processed = lines.map((line) => {
    let l = line;

    // Strip class field type with initializer: `  pos: number = 0;` (only at 2-space indent inside class)
    l = l.replace(/^(\s{2})(\w+)\s*:\s*[^=,\n]+=\s*/, "$1$2 = ");

    // Strip `const x: Type =` or `let x: Type =`
    l = l.replace(new RegExp(`\\b(const|let)\\s+(\\w+)\\s*:\\s*${TYPE_PATTERN}\\s*=`, "g"), "$1 $2 =");
    // Strip `let x: Type;`
    l = l.replace(new RegExp(`\\b(let)\\s+(\\w+)\\s*:\\s*${TYPE_PATTERN};`, "g"), "$1 $2;");

    // Detect start of function/method signature
    const startsFn = /\b(function\s+\w*|constructor|static\s+\w+)\s*\(/.test(l)
      || /^\s+\w+\s*\(\s*$/.test(l) || /^\s+\w+\s*\([^)]*\)\s*:/.test(l) || /^\s+\w+\s*\([^)]*:\s*/.test(l)
      || /=\s*\([^)]*\)\s*:/.test(l) || /=\s*\([^)]*:\s*/.test(l);

    if (startsFn) inParamList = true;

    if (inParamList) {
      // Strip return type annotation `): ReturnType {` or `): ReturnType =>`
      l = l.replace(new RegExp(`\\)\\s*:\\s*${TYPE_PATTERN}(?=\\s*(\\{|=>))`, "g"), ")");
      // Strip param types: `(a: Type`, `, b?: Type`, or indented `  source: string,`
      l = l.replace(new RegExp(`(\\(|,\\s*|^\\s+)(\\w+)\\??\\s*:\\s*${TYPE_PATTERN}(?=\\s*(?:[,)=]|$))`, "g"), "$1$2");
      if (l.includes(")") && (l.includes("{") || l.includes("=>"))) {
        inParamList = false;
      }
    }

    return l;
  });

  out = processed.join("\n");

  const AZT_HEADER = [
    "// File Create by AZT Service : https://aztvn.top/discord",
    "// AZT Obfuscator Azure Version 1.0.0 — Compiled & Lightly Obfuscated ESM Runtime",
    "const AZT_0xAZU = 0x100A; void AZT_0xAZU;",
  ].join("\n");

  return `${AZT_HEADER}\n${out}`;
}

fs.mkdirSync(DIST_DIR, { recursive: true });
const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith(".ts"));

for (const file of files) {
  const srcPath = path.join(SRC_DIR, file);
  const dstPath = path.join(DIST_DIR, file.replace(/\.ts$/, ".mjs"));
  const tsCode = fs.readFileSync(srcPath, "utf8");
  const jsCode = AZT_StripTS(tsCode);
  fs.writeFileSync(dstPath, jsCode, "utf8");
  // Syntax check every compiled module with Node.js!
  execFileSync(process.execPath, ["--check", dstPath], { stdio: "inherit" });
  console.log(`[AZT_Build] OK ${file} -> dist/${path.basename(dstPath)} (${jsCode.length} bytes)`);
}
console.log(`[AZT_Build] All ${files.length} modules compiled and syntax-verified!`);
