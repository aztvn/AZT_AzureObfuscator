// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Main Entrypoint
// Full Pipeline: AST -> IR -> Register Bytecode -> SuperInstr + Rice -> 3-Pass Lazy String & Chunked Crypto -> Pure Luau VM (Zero loadstring)

import { AZT_ObfuscateOptions, AZT_ObfuscateResult, AZT_Proto } from "./AZT_Types.js";
import { AZT_PRNG } from "./AZT_PRNG.js";
import { AZT_MathEngine } from "./AZT_MathEngine.js";
import { AZT_ParseLuau } from "./AZT_AST.js";
import { AZT_ObfuscateAST } from "./AZT_ASTObf.js";
import { AZT_LowerASTToIR, AZT_FlattenIRToStmts } from "./AZT_IR.js";
import { AZT_CompileAST } from "./AZT_Compiler.js";
import { AZT_OptimizeSuperInstructions } from "./AZT_SuperInstr.js";
import { AZT_PackMultiLayerPayload } from "./AZT_Crypto.js";
import { AZT_GenerateLuauVM } from "./AZT_VMGen.js";

export const AZT_NAME = "AZT Obfuscator Azure";
export const AZT_VERSION = "1.0.0";
export const AZT_DISCORD = "https://aztvn.top/discord";

function AZT_CountProtos(p: AZT_Proto): number {
  let c = 1;
  for (const child of p.protos) c += AZT_CountProtos(child);
  return c;
}

export function AZT_Obfuscate(
  source: string,
  userOptions: AZT_ObfuscateOptions = {}
): AZT_ObfuscateResult {
  const t0 = performance.now();

  const options: Required<AZT_ObfuscateOptions> = {
    seed: userOptions.seed ?? ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0),
    watermarkPrint: userOptions.watermarkPrint ?? true,
    superInstructions: userOptions.superInstructions ?? true,
    ricePredicates: userOptions.ricePredicates ?? true,
    advancedMath: userOptions.advancedMath ?? true,
    multiLayerCrypto: userOptions.multiLayerCrypto ?? true,
    randomLayerOrder: userOptions.randomLayerOrder ?? true,
    fastInjectBuffer: userOptions.fastInjectBuffer ?? true,
    astObfuscate: userOptions.astObfuscate ?? true,
    antiTamper: userOptions.antiTamper ?? true,
    stripLocalNames: userOptions.stripLocalNames ?? true,
    minify: userOptions.minify ?? true,
    headerComment:
      userOptions.headerComment ??
      `-- ${AZT_NAME} Version : ${AZT_VERSION}`,
  };

  const rng = new AZT_PRNG(options.seed);
  const math = new AZT_MathEngine(rng);

  // Stage 1: Lex & Parse Luau -> AST
  const rawAst = AZT_ParseLuau(source);

  // Stage 1.5: Pre-VM AST Obfuscator Pass (AZURE_XXX selector functions, fake branches, AST Decode)
  const astObf = options.astObfuscate
    ? AZT_ObfuscateAST(rawAst, rng)
    : { stmts: rawAst, functionsWrapped: 0, stringsEncoded: 0, fakeBranchesInjected: 0 };

  // Stage 2: Lower Obfuscated AST -> Intermediate Representation (IR) + Rice CFG Tags
  const ir = AZT_LowerASTToIR(astObf.stmts, rng, options.ricePredicates);
  const loweredStmts = AZT_FlattenIRToStmts(ir);

  // Stage 3: Compile IR -> Register-Based VM Bytecode (100% local names stripped)
  const rootProto = AZT_CompileAST(loweredStmts);

  // Stage 4: Super Instructions Fusion + Rice's Theorem Runtime Guards
  const superStats = AZT_OptimizeSuperInstructions(
    rootProto,
    rng,
    options.superInstructions,
    options.ricePredicates
  );

  // Stage 5: 3-Pass Lazy String Encryption + Chunked Whole-Binary Lazy Crypto (RC4 + SHA-256/512/2064 + HMAC + Custom Checksum + Math Puzzles)
  const payload = AZT_PackMultiLayerPayload(rootProto, rng, math, options.antiTamper);

  // Stage 6: Polymorphic Fast-Inject Pure Luau VM (Zero loadstring)
  const vmOut = AZT_GenerateLuauVM(payload, rng, math, options);

  const compileTimeMs = Number((performance.now() - t0).toFixed(3));

  return {
    code: vmOut.code,
    stats: {
      version: `${AZT_NAME} v${AZT_VERSION}`,
      seed: rng.seed,
      inputBytes: Buffer.byteLength(source, "utf8"),
      outputBytes: Buffer.byteLength(vmOut.code, "utf8"),
      compileTimeMs,
      protoCount: AZT_CountProtos(rootProto),
      baseInstructionCount: superStats.baseInstructionCount,
      finalInstructionCount: superStats.finalInstructionCount,
      superInstructionsFused: superStats.superInstructionsFused,
      layerOrder: vmOut.layerOrder,
      opaquePredicatesInjected:
        vmOut.opaquePredicatesInjected + superStats.riceGuardsInjected + ir.riceBlocksInjected,
      chunkCount: payload.chunkCount,
      lazyStringsEncrypted: payload.lazyStringsEncrypted,
      astFunctionsWrapped: astObf.functionsWrapped,
      astStringsEncoded: astObf.stringsEncoded,
      astFakeBranches: astObf.fakeBranchesInjected,
    },
  };
}

export * from "./AZT_Types.js";
export * from "./AZT_PRNG.js";
export * from "./AZT_MathEngine.js";
export * from "./AZT_CFFEngine.js";
export * from "./AZT_HashSuite.js";
export * from "./AZT_Lexer.js";
export * from "./AZT_AST.js";
export * from "./AZT_ASTObf.js";
export * from "./AZT_IR.js";
export * from "./AZT_Compiler.js";
export * from "./AZT_SuperInstr.js";
export * from "./AZT_Crypto.js";
export * from "./AZT_VMGen.js";
