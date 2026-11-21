// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Core Type Definitions

export interface AZT_ObfuscateOptions {
  /** Optional deterministic seed; if omitted, uses crypto-random seed per build */
  seed?: number;
  /** Inject print("AZT Obfuscator Protect this file") inside protected VM entry */
  watermarkPrint?: boolean;
  /** Enable Super Instructions fusion pass */
  superInstructions?: boolean;
  /** Enable Rice's Theorem undecidable opaque predicates & state-coupled CFG */
  ricePredicates?: boolean;
  /** Enable Advanced Mathematical Encoding (MBA + Modular Inverse + Affine) */
  advancedMath?: boolean;
  /** Enable Multi-Layer Encryption (Affine/Feistel + LZ-RLE + Radix-85 + Dict) */
  multiLayerCrypto?: boolean;
  /** Enable Polymorphic Layer Shuffling (VM, Decode, Payload, APIs order randomized) */
  randomLayerOrder?: boolean;
  /** Use Roblox Luau native buffer.* APIs for Fast Inject (default true) */
  fastInjectBuffer?: boolean;
  /** Enable Pre-VM AST Obfuscation (AZURE_XXX selector functions, fake branches, AST string decode) */
  astObfuscate?: boolean;
  /** Enable CFF-protected Anti-Tamper checks (PlaceId + frozen table check) */
  antiTamper?: boolean;
  /** Strip all local variable names completely (default true) */
  stripLocalNames?: boolean;
  /** Minify generated Luau code body into a single line (default true) */
  minify?: boolean;
  /** Target Luau header comment */
  headerComment?: string;
}

export interface AZT_ObfuscateResult {
  code: string;
  stats: {
    version: string;
    seed: number;
    inputBytes: number;
    outputBytes: number;
    compileTimeMs: number;
    protoCount: number;
    baseInstructionCount: number;
    finalInstructionCount: number;
    superInstructionsFused: number;
    layerOrder: string[];
    opaquePredicatesInjected: number;
    chunkCount: number;
    lazyStringsEncrypted: number;
    astFunctionsWrapped: number;
    astStringsEncoded: number;
    astFakeBranches: number;
  };
}

export type AZT_TokenType =
  | "EOF"
  | "IDENT"
  | "NUMBER"
  | "STRING"
  | "KEYWORD"
  | "OP"
  | "PUNCT";

export interface AZT_Token {
  type: AZT_TokenType;
  value: string;
  line: number;
  col: number;
}

// ── VM AST Nodes ─────────────────────────────────────────────────────────────

export type AZT_Stmt =
  | { kind: "LocalDecl"; names: string[]; values: AZT_Expr[] }
  | { kind: "Assign"; targets: AZT_Expr[]; values: AZT_Expr[] }
  | { kind: "CompoundAssign"; op: string; target: AZT_Expr; value: AZT_Expr }
  | { kind: "FunctionDecl"; nameParts: string[]; isMethod: boolean; params: string[]; isVararg: boolean; body: AZT_Stmt[] }
  | { kind: "LocalFunction"; name: string; params: string[]; isVararg: boolean; body: AZT_Stmt[] }
  | { kind: "IfStmt"; branches: { cond: AZT_Expr; body: AZT_Stmt[] }[]; elseBody?: AZT_Stmt[] }
  | { kind: "WhileStmt"; cond: AZT_Expr; body: AZT_Stmt[] }
  | { kind: "RepeatStmt"; body: AZT_Stmt[]; cond: AZT_Expr }
  | { kind: "NumericFor"; varName: string; start: AZT_Expr; limit: AZT_Expr; step?: AZT_Expr; body: AZT_Stmt[] }
  | { kind: "GenericFor"; vars: string[]; iterators: AZT_Expr[]; body: AZT_Stmt[] }
  | { kind: "DoBlock"; body: AZT_Stmt[] }
  | { kind: "ReturnStmt"; values: AZT_Expr[] }
  | { kind: "BreakStmt" }
  | { kind: "ContinueStmt" }
  | { kind: "CallStmt"; expr: AZT_Expr };

export type AZT_Expr =
  | { kind: "Nil" }
  | { kind: "Bool"; value: boolean }
  | { kind: "Number"; value: number }
  | { kind: "String"; value: string }
  | { kind: "Vararg" }
  | { kind: "Ident"; name: string }
  | { kind: "UnaryOp"; op: string; arg: AZT_Expr }
  | { kind: "BinaryOp"; op: string; left: AZT_Expr; right: AZT_Expr }
  | { kind: "IfExpr"; cond: AZT_Expr; thenExpr: AZT_Expr; elseExpr: AZT_Expr }
  | { kind: "TableCtor"; fields: { key?: AZT_Expr; value: AZT_Expr }[] }
  | { kind: "IndexExpr"; base: AZT_Expr; index: AZT_Expr }
  | { kind: "MemberExpr"; base: AZT_Expr; field: string }
  | { kind: "CallExpr"; callee: AZT_Expr; args: AZT_Expr[] }
  | { kind: "MethodCallExpr"; base: AZT_Expr; method: string; args: AZT_Expr[] }
  | { kind: "FunctionExpr"; params: string[]; isVararg: boolean; body: AZT_Stmt[] };

// ── VM Bytecode ISA (Base + Super Instructions) ──────────────────────────────

export enum AZT_OpCode {
  // Base Luau-inspired Register VM Instructions
  MOVE = 0,
  LOADK = 1,
  LOADBOOL = 2,
  LOADNIL = 3,
  GETGLOBAL = 4,
  SETGLOBAL = 5,
  GETUPVAL = 6,
  SETUPVAL = 7,
  NEWTABLE = 8,
  GETTABLE = 9,
  SETTABLE = 10,
  GETFIELD = 11,
  SETFIELD = 12,
  SELF = 13,
  ADD = 14,
  SUB = 15,
  MUL = 16,
  DIV = 17,
  IDIV = 18,
  MOD = 19,
  POW = 20,
  CONCAT = 21,
  UNM = 22,
  NOT = 23,
  LEN = 24,
  EQ = 25,
  LT = 26,
  LE = 27,
  TEST = 28,
  JMP = 29,
  CALL = 30,
  RETURN = 31,
  FORPREP = 32,
  FORLOOP = 33,
  TFORCALL = 34,
  CLOSURE = 35,
  VARARG = 36,
  SETLIST = 37,

  // ── AZT Azure Super Instructions (Fused Multi-Op Handlers) ──
  SUPER_GETG_GETF = 38,     // R[A] = ENV[K[B]][K[C]]
  SUPER_LOADK_ADD = 39,     // R[A] = R[B] + K[C]
  SUPER_LOADK_SUB = 40,     // R[A] = R[B] - K[C]
  SUPER_LOADK_MUL = 41,     // R[A] = R[B] * K[C]
  SUPER_LOADK_CALL1 = 42,   // R[A](K[B]) -> discard/store C results
  SUPER_MOVE_CALL = 43,     // R[A+1] = R[D]; CALL(A, B, C)
  SUPER_SELF_CALL = 44,     // R[A+1] = R[B]; R[A] = R[B][K[C]]; CALL
  SUPER_LOADK_RET = 45,     // return K[B]
  SUPER_RICE_GUARD = 46,    // Rice's Theorem runtime semantic state invariant check
}

export interface AZT_Instr {
  op: AZT_OpCode;
  a: number;
  b: number;
  c: number;
  d?: number; // extra operand for fused super-instructions
}

export type AZT_Const =
  | { type: "nil" }
  | { type: "bool"; value: boolean }
  | { type: "number"; value: number }
  | { type: "string"; value: string };

export interface AZT_Proto {
  numParams: number;
  isVararg: boolean;
  maxStackSize: number;
  numUpvalues: number;
  upvalDesc: { inStack: boolean; idx: number }[];
  constants: AZT_Const[];
  instructions: AZT_Instr[];
  protos: AZT_Proto[];
}
