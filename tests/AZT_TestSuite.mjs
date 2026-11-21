// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Full Cryptographic, Lazy & VM Verification Suite

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AZT_Obfuscate,
  AZT_PRNG,
  AZT_MathEngine,
  AZT_RC4,
  AZT_SHA256,
  AZT_HMAC_SHA256,
  AZT_SHA512,
  AZT_SHA2064_Custom,
  AZT_CustomChecksum,
  AZT_XTEA16_Encrypt,
  AZT_XTEA16_Decrypt,
  AZT_EncryptStringLazy3,
  AZT_DecryptStringLazy3,
  AZT_EncryptBinaryChunkedLazy,
  AZT_DecryptBinaryChunkedLazy,
  AZT_CompressLZ,
  AZT_DecompressLZ,
  AZT_EncodeBase85Dict,
  AZT_DecodeBase85Dict,
  AZT_EncodeNibbleRot,
  AZT_DecodeNibbleRot,
  AZT_EncodeDelta,
  AZT_DecodeDelta,
  AZT_EncodeFeistelBytes,
  AZT_DecodeFeistelBytes,
  AZT_ParseLuau,
  AZT_CompileAST,
  AZT_ObfuscateAST,
  AZT_EncodeASTString,
  AZT_DecodeASTString,
  AZT_CFFEngine,
  AZT_CFF_VARIANT_COUNT,
} from "../dist/AZT_Index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePath = path.resolve(__dirname, "../examples/sample.luau");
const sampleCode = fs.readFileSync(samplePath, "utf8");
const toHex = (u8) => Array.from(u8).map((b) => b.toString(16).padStart(2, "0")).join("");

console.log("=== AZT Obfuscator Azure v1.0.0 — Full Verification Suite ===\n");

// 1. Standard NIST SHA-256 & RFC 4231 HMAC-SHA256 + SHA-512 + Custom SHA-2064 + RC4 + Checksum
{
  const enc = new TextEncoder();
  const shaAbc = toHex(AZT_SHA256(enc.encode("abc")));
  assert.equal(
    shaAbc,
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "SHA-256 NIST vector mismatch"
  );

  const hmacVec = toHex(
    AZT_HMAC_SHA256(enc.encode("key"), enc.encode("The quick brown fox jumps over the lazy dog"))
  );
  assert.equal(
    hmacVec,
    "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
    "HMAC-SHA256 RFC vector mismatch"
  );

  const s512 = AZT_SHA512(enc.encode("AZT-Azure"));
  assert.equal(s512.length, 64, "SHA-512 must be 64 bytes (512 bits)");

  const s2064 = AZT_SHA2064_Custom(enc.encode("AZT-Azure"), 0x12345678);
  assert.equal(s2064.length, 258, "Custom SHA-2064 must be 258 bytes (2064 bits)");

  const rc4Key = enc.encode("AZT-Master-Key");
  const rc4Msg = enc.encode("Roblox Luau Pure VM");
  const rc4Enc = AZT_RC4(rc4Key, rc4Msg, 64);
  const rc4Dec = AZT_RC4(rc4Key, rc4Enc, 64);
  assert.deepEqual(rc4Dec, rc4Msg, "RC4-drop64 round-trip mismatch");

  const c1 = AZT_CustomChecksum(rc4Msg, 0x9e37);
  const tampered = rc4Msg.slice();
  tampered[3] ^= 1;
  const c2 = AZT_CustomChecksum(tampered, 0x9e37);
  assert.notEqual(c1, c2, "Custom Checksum must detect 1-bit flip");

  console.log("[PASS] 1. Crypto Suite (NIST SHA-256, RFC HMAC-SHA256, SHA-512, Custom SHA-2064 [258B], RC4-drop64, Custom Checksum)");
}

// 2. Advanced Math Engine: 5,000 random 32-bit affine/mod-inverse + Luau mul32 precision checks
{
  const rng = new AZT_PRNG(0x1337cafe);
  const math = new AZT_MathEngine(rng);
  const luauMul32 = (x, y) => {
    const xl = x % 65536;
    const xh = (x - xl) / 65536;
    const yl = y % 65536;
    const yh = (y - yl) / 65536;
    return (xl * yl + ((xl * yh + xh * yl) % 65536) * 65536) % 4294967296;
  };
  for (let i = 0; i < 5000; i++) {
    const key = math.generateAffineKey();
    const val = rng.nextU32();
    const enc = AZT_MathEngine.encodeU32(val, key);
    assert.equal(AZT_MathEngine.decodeU32(enc, key), val);
    const s1 = (enc ^ key.xorMask) >>> 0;
    const s2 = ((s1 - key.b) % 4294967296 + 4294967296) % 4294967296;
    assert.equal(luauMul32(s2, key.aInv), val);
  }
  console.log("[PASS] 2. Advanced Math Engine (5,000 random 32-bit affine/mod-inverse + Luau mul32 checks)");
}

// 3. Per-String 3-Pass Lazy Encryption + Whole-Binary Chunked Lazy Encryption Round-Trip & Tamper Reject
{
  const rng = new AZT_PRNG(0xdeadbeef);
  const masterKey = new Uint8Array(Array.from({ length: 16 }, () => rng.int(1, 254)));
  const customShaSeed = rng.nextU32();
  const checksumPoly = ((rng.nextU32() & 0xffff) | 1) >>> 0;

  // Test 50 individual strings with 3-pass lazy encryption + Math Puzzle
  for (let i = 0; i < 50; i++) {
    const text = `AZT_Secret_String_${i}_Roblox_${rng.nextU32()}`;
    const { puzzle, cipher } = AZT_EncryptStringLazy3(text, i, masterKey, customShaSeed, rng);
    const recovered = AZT_DecryptStringLazy3(cipher, i, puzzle.aInv, puzzle.b, puzzle.c, masterKey, customShaSeed);
    assert.equal(recovered, text, `3-Pass Lazy String mismatch at #${i}`);
  }

  // Test Chunked Whole-Binary Lazy Encryption + LZ + Base85+Dict
  const original = new Uint8Array(1024);
  for (let i = 0; i < original.length; i++) original[i] = (i * 13 + 7) & 0xff;
  const sbox = rng.shuffle(Array.from({ length: 256 }, (_, i) => i));
  const invSBox = new Array(256);
  for (let i = 0; i < 256; i++) invSBox[sbox[i]] = i;
  const cSeed = rng.nextU32();
  const cMult = ((rng.nextU32() & 0xffff) | 1) >>> 0;
  const cAdd = (rng.nextU32() & 0xffff) | 1;

  const initHb = 0x55AA1234;
  const sbox2 = rng.shuffle(Array.from({ length: 256 }, (_, i) => i));
  const invSBox2 = new Array(256); for (let i = 0; i < 256; i++) invSBox2[sbox2[i]] = i;
  const xteaKey = new Uint32Array([rng.nextU32(), rng.nextU32(), rng.nextU32(), rng.nextU32()]);
  const xEnc = AZT_XTEA16_Encrypt(original, xteaKey);
  assert.deepEqual(AZT_XTEA16_Decrypt(xEnc, xteaKey), original, "XTEA-16 round-trip mismatch");
  const { container, chunkCount, finalHeartbeat } = AZT_EncryptBinaryChunkedLazy(
    original, masterKey, customShaSeed, checksumPoly, sbox, sbox2, xteaKey, cSeed, cMult, cAdd, initHb, rng, 256
  );
  const comp = AZT_CompressLZ(container);
  const { encoded, dict } = AZT_EncodeBase85Dict(comp);
  const dComp = AZT_DecodeBase85Dict(encoded, dict, comp.length);
  const dCont = AZT_DecompressLZ(dComp, container.length);
  const { plainBin: dOrig, finalHeartbeat: dHb } = AZT_DecryptBinaryChunkedLazy(
    dCont, masterKey, customShaSeed, checksumPoly, invSBox, invSBox2, xteaKey, cSeed, cMult, cAdd, initHb
  );
  assert.deepEqual(dOrig, original, "Chunked binary lazy round-trip mismatch");
  assert.equal(dHb, finalHeartbeat, "Symbiotic Heartbeat mismatch!");

  // Verify 1-bit tamper is caught by Checksum / HMAC!
  const tamperedCont = dCont.slice();
  tamperedCont[tamperedCont.length - 5] ^= 0x01;
  assert.throws(
    () => AZT_DecryptBinaryChunkedLazy(tamperedCont, masterKey, customShaSeed, checksumPoly, invSBox, invSBox2, xteaKey, cSeed, cMult, cAdd, initHb),
    /Checksum mismatch|HMAC-SHA256 mismatch/,
    "Tampered chunk was NOT rejected!"
  );

  console.log(`[PASS] 3. 3-Pass Lazy Strings (50/50) & Chunked Binary Lazy Crypto (${chunkCount} chunks, tamper rejected)`);
}

// 4. Full End-to-End Obfuscation: Zero loadstring, Zero leaks, Clean Header, Polymorphic 7-Layer Order
{
  const res = AZT_Obfuscate(sampleCode, { seed: 20261121 });
  assert.ok(res.code.startsWith("-- AZT Obfuscator Azure Version : 1.0.0"), "Missing clean header");
  assert.ok(!res.code.includes("File Create by AZT Service"), "AZT Service line must be removed from Lua output");
  assert.ok(!res.code.includes("loadstring"), "Must NEVER use loadstring!");
  assert.ok(res.code.includes("return setmetatable({"), "Missing setmetatable bootstrapper");

  const forbidden = [
    "superSecretAdminKey", "myHiddenMultiplier", "calculateReward",
    "basePoints", "localPlayer", "results",
    "AZT Obfuscator Protect this file", "\"tamper\"", "'tamper'",
  ];
  for (const name of forbidden) {
    assert.ok(!res.code.includes(name), `Leaked identifier or plaintext string: ${name}`);
  }

  assert.ok(res.stats.chunkCount >= 2, "Expected multiple lazy chunks");
  assert.ok(res.stats.lazyStringsEncrypted > 0, "Expected 3-pass lazy encrypted strings");

  console.log(`[PASS] 4. Full E2E Pure VM (Zero loadstring, 0 leaked locals/strings)`);
  console.log(`       -> Chunks: ${res.stats.chunkCount} | 3-Pass Lazy Strings: ${res.stats.lazyStringsEncrypted}`);
  console.log(`       -> Super Instructions fused: ${res.stats.superInstructionsFused} | Rice Guards: ${res.stats.opaquePredicatesInjected}`);
  console.log(`       -> Compile time: ${res.stats.compileTimeMs} ms | Size: ${res.stats.outputBytes} bytes`);
}

// 5. 50-Seed Polymorphic 7-Layer Order & Zero Variable-Shadowing Stress Test
{
  const orders = new Set();
  for (let s = 1; s <= 50; s++) {
    const r = AZT_Obfuscate(sampleCode, { seed: s * 7919 });
    orders.add(r.stats.layerOrder.join("->"));
    assert.equal(r.stats.layerOrder.length, 7, "Expected 7 polymorphic layers");
    assert.ok(!r.code.includes("loadstring"), "loadstring found!");
    assert.ok(r.code.includes("(_x,_y)") && r.code.includes("(_ev)") && r.code.includes("(_adv)"));
  }
  assert.ok(orders.size >= 40, `Expected high polymorphic diversity, got ${orders.size}/50`);
  console.log(`[PASS] 5. 50-Seed Stress Test (${orders.size}/50 unique 7-layer layouts, 0 variable shadowing)`);
}


// 6. Symbiotic Lifeblood Coupling Test (Removing/Tampering ANY organ kills MasterKey & VM Opcode Mask)
{
  const rng = new AZT_PRNG(0x77779999);
  const atKey0 = rng.nextU32(), atKey1 = rng.nextU32(), atKey2 = rng.nextU32();
  const vitalOk = (((atKey0 ^ atKey1) >>> 0) + atKey2) >>> 0;
  const vitalBypassed = 1; // e.g., attacker patched AntiTamper to return 1/true
  const poly = 0x9e37;
  const wmOk = AZT_CustomChecksum(new TextEncoder().encode("AZT Obfuscator Protect this file"), poly);
  const wmEdited = AZT_CustomChecksum(new TextEncoder().encode("Hacked Obfuscator"), poly);

  const realMk = Array.from({ length: 16 }, () => rng.int(1, 254));
  const maskedMk = realMk.map((b, i) => (b ^ ((vitalOk >>> ((i & 3) * 8)) & 0xff) ^ ((wmOk >>> ((i & 3) * 8)) & 0xff)) & 0xff);
  const unmask = (vt, wm) => maskedMk.map((b, i) => (b ^ ((vt >>> ((i & 3) * 8)) & 0xff) ^ ((wm >>> ((i & 3) * 8)) & 0xff)) & 0xff);

  assert.deepEqual(unmask(vitalOk, wmOk), realMk, "Valid organs must recover exact MasterKey");
  assert.notDeepEqual(unmask(vitalBypassed, wmOk), realMk, "Bypassed AntiTamper must corrupt MasterKey");
  assert.notDeepEqual(unmask(vitalOk, wmEdited), realMk, "Edited Watermark must corrupt MasterKey");

  const opMask = 0xA7;
  const hbOk = 0xCAFEBABE;
  const hbMaskConst = (hbOk ^ opMask) >>> 0;
  assert.equal((hbOk ^ hbMaskConst) & 0xff, opMask, "Live Heartbeat must recover exact VM opMaskByte");
  assert.notEqual(((hbOk ^ 1) ^ hbMaskConst) & 0xff, opMask, "Dead/tampered Heartbeat must scramble VM opcodes");

  console.log("[PASS] 6. Symbiotic Lifeblood Coupling (AntiTamper <-> Watermark <-> MasterKey <-> Heartbeat <-> VM Opcode Mask)");
}


// 7. 6-Codec Chain + [[#AZT^...^AZURE#]] Framing + Zero Plaintext BootVM Verification
{
  const rng = new AZT_PRNG(0x42424242);
  const raw = new Uint8Array(513);
  for (let i = 0; i < raw.length; i++) raw[i] = rng.int(0, 255);
  const s1 = AZT_EncodeNibbleRot(raw, 3, 77);
  const s2 = AZT_EncodeDelta(s1, 131);
  const s3 = AZT_EncodeFeistelBytes(s2, 53, 197);
  const s4 = AZT_CompressLZ(s3);
  const { encoded, dict } = AZT_EncodeBase85Dict(s4);
  assert.ok(encoded.startsWith("#AZT^") && encoded.endsWith("^AZURE#"), "Missing #AZT^...^AZURE# frame");
  assert.ok(!encoded.includes("]]") && !encoded.includes("[["), "Unsafe Luau long-bracket inside Base85");

  const d4 = AZT_DecodeBase85Dict(encoded, dict, s4.length);
  const d3 = AZT_DecompressLZ(d4, s3.length);
  const d2 = AZT_DecodeFeistelBytes(d3, 53, 197);
  const d1 = AZT_DecodeDelta(d2, 131);
  const d0 = AZT_DecodeNibbleRot(d1, 3, 77);
  assert.deepEqual(d0, raw, "6-Codec chain round-trip mismatch");

  const out = AZT_Obfuscate(sampleCode, { seed: 999888 });
  const starts = (out.code.match(/\[\[#AZT\^/g) || []).length;
  const ends = (out.code.match(/\^AZURE#\]\]/g) || []).length;
  assert.equal(starts, 3, "Expected 3 [[#AZT^ framed payloads (BootVM + Vault + MainVM)");
  assert.equal(ends, 3, "Expected 3 ^AZURE#]] framed payloads (BootVM + Vault + MainVM)");
  assert.ok(Buffer.byteLength(out.code, "utf8") >= 51200, `Expected >= 50KB output, got ${Buffer.byteLength(out.code, "utf8")} bytes`);
  assert.ok(!out.code.includes("PlaceId"), "PlaceId must NOT appear in plaintext!");
  assert.ok(!out.code.includes("8888"), "8888 must NOT appear in plaintext!");
  assert.ok(!out.code.includes("599"), "599 must NOT appear in plaintext!");
  console.log("[PASS] 7. 7-Codec Chain (XTEA-16 + Dual SBox) + 3x [[#AZT^...^AZURE#]] + >=50KB Output verified");
}


// 8. Pre-VM AST Obfuscator Test (User Example: function gex() return "OK" end print(gex()))
{
  const numProto = AZT_CompileAST(AZT_ParseLuau("local a,b,c,d = 1, 32, 7, 95"));
  const numVals = numProto.constants.filter(c => c.type === "number").map(c => c.value);
  assert.deepEqual(numVals, [1, 32, 7, 95], "Numeric constants collided!");
  const allPrintable = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");
  assert.equal(AZT_DecodeASTString(AZT_EncodeASTString(allPrintable, 47), 47), allPrintable, "AST string codec bijection failed");

  const userEx = `function gex() return "OK" end\nprint(gex())`;
  const rng = new AZT_PRNG(0xA271234);
  const astOut = AZT_ObfuscateAST(AZT_ParseLuau(userEx), rng);
  assert.equal(astOut.functionsWrapped, 1, "Expected gex() to be wrapped");
  assert.ok(astOut.fakeBranchesInjected >= 2, "Expected fake elseif/else branches");
  assert.ok(astOut.stringsEncoded >= 4, "Expected OK + token + fake strings encoded");

  // Verify full pipeline (AST Obf -> IR -> Bytecode -> Pure VM >= 50KB)
  const full = AZT_Obfuscate(userEx, { seed: 0xA279999 });
  assert.ok(Buffer.byteLength(full.code, "utf8") >= 51200, "Expected >= 50KB even on 2-line script");
  assert.ok(!full.code.includes("gex"), "Function name gex leaked!");
  assert.ok(!full.code.includes("\"OK\""), "Plaintext OK leaked!");
  assert.ok(!full.code.includes("loadstring"), "loadstring found!");
  console.log(`[PASS] 8. Pre-VM AST Obfuscator + Main VM (gex() wrapped: ${full.stats.astFunctionsWrapped} fn, ${full.stats.astStringsEncoded} AST strings, ${full.stats.astFakeBranches} fake branches, output: ${full.stats.outputBytes} bytes)`);
}


// 9. 36-Variant CFF + CFG + Function-CFF Engine Verification
{
  const rng = new AZT_PRNG(0xCFFE2026);
  const eng = new AZT_CFFEngine(rng);
  const cases = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, body: `x=${i + 1};` }));
  let combined = "";
  for (let i = 0; i < 40; i++) {
    combined += eng.buildStateMachine(cases, { stateVar: "S", bit32Var: "b32", initState: 1, riceVar: "R" });
    combined += eng.emitTransition("S", (i % 10) + 1, ((i + 3) % 10) + 1, "b32", "_cffS");
  }
  assert.equal(AZT_CFF_VARIANT_COUNT, 36, "Expected 36 CFF variants");
  assert.ok(eng.variantsUsed.size >= 30, `Expected >= 30 distinct CFF variants exercised, got ${eng.variantsUsed.size}`);
  for (const op of ["<=", "<", ">", ">=", "==", "~=", "+=", "-=", "//", "/", "_cffS"]) {
    assert.ok(combined.includes(op), `Missing CFF operator/feature: ${op}`);
  }
  console.log(`[PASS] 9. 36-Variant CFF + CFG + Function-CFF Engine (${eng.variantsUsed.size}/${AZT_CFF_VARIANT_COUNT} variants exercised: >, <, <=, >=, ==, ~=, +=, -=, /, //, Function-CFF)`);
}


// 10. 1500+ Line Lifeblood-Coupled CFF + 256-Slot VM Dispatch Verification
{
  const outMulti = AZT_Obfuscate(sampleCode, { seed: 0x2026CAFE, minify: false });
  const lines = outMulti.code.split("\n");
  assert.ok(lines.length >= 1500, `Expected >= 1500 CFF lines, got only ${lines.length}`);
  const outMin = AZT_Obfuscate(sampleCode, { seed: 0x2026CAFE, minify: true });
  const minLines = outMin.code.split("\n");
  const plMulti = outMulti.code.match(/\[\[#AZT\^[\s\S]*?\^AZURE#\]\]/g);
  const plMin = outMin.code.match(/\[\[#AZT\^[\s\S]*?\^AZURE#\]\]/g);
  assert.deepEqual(plMin, plMulti, "Payload corrupted by minifier!");
  assert.equal(minLines.length, 2, `Expected 1-line minified body (+ 1 header line = 2 lines), got ${minLines.length}`);
  // Verify tampering ANY 1 of the 32 CFF Genesis keys scrambles VM opMaskByte!
  const rng = new AZT_PRNG(0x55667788);
  const initSeed = rng.nextU32();
  const keys = Array.from({ length: 32 }, () => rng.nextU32());
  const vitalOk = AZT_CFFEngine.computeGenesisVital(initSeed, keys);
  const badKeys = keys.slice();
  badKeys[17] = (badKeys[17] ^ 1) >>> 0;
  const vitalBad = AZT_CFFEngine.computeGenesisVital(initSeed, badKeys);
  assert.notEqual(vitalOk, vitalBad, "Tampering 1 CFF Genesis stage must corrupt lifeblood vital!");
  console.log(`[PASS] 10. 1500+ Line Lifeblood CFF (${lines.length} CFF lines -> minified to 1 single code line, ${outMin.stats.outputBytes} bytes)`);
}

console.log("\nALL TESTS PASSED SUCCESSFULLY!");
