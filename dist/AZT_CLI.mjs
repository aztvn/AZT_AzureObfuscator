// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Compiled & Lightly Obfuscated ESM Runtime
const AZT_0xAZU = 0x100A; void AZT_0xAZU;
// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — High-Speed CLI

import fs from "node:fs";
import path from "node:path";
import { AZT_NAME, AZT_Obfuscate, AZT_VERSION, AZT_DISCORD } from "./AZT_Index.mjs";


function AZT_PrintBanner() {
  console.log(`========================================================`);
  console.log(`  ${AZT_NAME} — Version ${AZT_VERSION}`);
  console.log(`  AZT Service : ${AZT_DISCORD}`);
  console.log(`========================================================`);
}

function AZT_PrintUsage() {
  AZT_PrintBanner();
  console.log(`Usage: azt-obf <input.lua> [options]`);
  console.log(`Options:`);
  console.log(`  -o, --out <file>      Output file path (default: <input>.azt.lua)`);
  console.log(`  --seed <uint32>       Deterministic build seed`);
  console.log(`  --no-watermark        Disable print("AZT Obfuscator Protect this file")`);
  console.log(`  --no-super            Disable Super Instructions fusion`);
  console.log(`  --no-rice             Disable Rice's Theorem opaque predicates`);
  console.log(`  --no-random-layers    Disable random VM/Decode/Payload layer shuffling`);
  console.log(`  --no-anti-tamper      Disable CFF Anti-Tamper guard`);
  console.log(`  --no-ast-obf          Disable Pre-VM AST Obfuscator pass`);
  console.log(`  --no-minify           Keep multi-line CFF formatting instead of 1-line minify`);
}

export function AZT_RunCLI(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    AZT_PrintUsage();
    return;
  }

  let inputPath = "";
  let outPath = "";
  const opts = {};

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-o" || a === "--out") {
      outPath = args[++i] ?? "";
    } else if (a === "--seed") {
      opts.seed = Number(args[++i]);
    } else if (a === "--no-watermark") {
      opts.watermarkPrint = false;
    } else if (a === "--no-super") {
      opts.superInstructions = false;
    } else if (a === "--no-rice") {
      opts.ricePredicates = false;
    } else if (a === "--no-random-layers") {
      opts.randomLayerOrder = false;
    } else if (a === "--no-anti-tamper") {
      opts.antiTamper = false;
    } else if (a === "--no-ast-obf") {
      opts.astObfuscate = false;
    } else if (a === "--no-minify") {
      opts.minify = false;
    } else if (!a.startsWith("-")) {
      inputPath = a;
    }
  }

  if (!inputPath) {
    console.error("Error: Missing input Luau file.");
    process.exit(1);
  }

  const resolvedIn = path.resolve(inputPath);
  const source = fs.readFileSync(resolvedIn, "utf8");
  const result = AZT_Obfuscate(source, opts);

  const resolvedOut = outPath
    ? path.resolve(outPath)
    : resolvedIn.replace(/\.(lua|luau|txt)$/i, "") + ".azt.lua";

  fs.writeFileSync(resolvedOut, result.code, "utf8");

  AZT_PrintBanner();
  console.log(`[+] Input          : ${resolvedIn} (${result.stats.inputBytes} bytes)`);
  console.log(`[+] Output         : ${resolvedOut} (${result.stats.outputBytes} bytes)`);
  console.log(`[+] Compile Time   : ${result.stats.compileTimeMs} ms`);
  console.log(`[+] Build Seed     : 0x${result.stats.seed.toString(16).toUpperCase()}`);
  console.log(`[+] Layer Order    : ${result.stats.layerOrder.join(" -> ")}`);
  console.log(`[+] Protos         : ${result.stats.protoCount}`);
  console.log(`[+] Instructions   : ${result.stats.baseInstructionCount} -> ${result.stats.finalInstructionCount} (Super fused: ${result.stats.superInstructionsFused})`);
  console.log(`[+] Rice Guards    : ${result.stats.opaquePredicatesInjected}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("AZT_CLI.mjs")) {
  AZT_RunCLI(process.argv);
}
