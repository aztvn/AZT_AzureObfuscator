// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Heavyweight Symbiotic 3-Payload Pure Luau VM (>= 50KB Encrypted Output)
// Zero loadstring | 3x [[#AZT^...^AZURE#]] Payloads (BootVM + Crypto Vault + MainVM) | XTEA-16 + Dual S-Box + RC4 + SHA-256/512/2064 + Full 32B HMAC + 95-Branch VM Dispatch

import { AZT_ObfuscateOptions, AZT_OpCode } from "./AZT_Types.js";
import { AZT_PRNG } from "./AZT_PRNG.js";
import { AZT_MathEngine } from "./AZT_MathEngine.js";
import { AZT_CFFEngine } from "./AZT_CFFEngine.js";
import { AZT_B85_ALPHABET, AZT_BootOp, AZT_EncodedPayload, AZT_PUZZLE_PRIME } from "./AZT_Crypto.js";

export interface AZT_VMGenOutput {
  code: string;
  layerOrder: string[];
  opaquePredicatesInjected: number;
}

function AZT_LuauStr(s: string): string {
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 34) out += '\\"';
    else if (c === 92) out += "\\\\";
    else if (c === 10) out += "\\n";
    else if (c === 13) out += "\\r";
    else if (c === 9) out += "\\t";
    else if (c < 32 || c > 126) out += "\\" + c;
    else out += s[i];
  }
  return out + '"';
}

function AZT_BuildBinaryTree(
  varName: string,
  cases: { id: number; body: string }[]
): string {
  const sorted = cases.slice().sort((a, b) => a.id - b.id);
  const build = (lo: number, hi: number): string => {
    if (lo === hi) return sorted[lo].body;
    if (hi - lo === 1) {
      return `if ${varName}<=${sorted[lo].id} then ${sorted[lo].body} else ${sorted[hi].body} end`;
    }
    const mid = (lo + hi) >> 1;
    return `if ${varName}<=${sorted[mid].id} then ${build(lo, mid)} else ${build(mid + 1, hi)} end`;
  };
  return build(0, sorted.length - 1);
}

function AZT_FormatTableKey(key: string | number): string {
  return typeof key === "number" ? `[${key}]` : key;
}

function AZT_FormatTableAccess(tbl: string, key: string | number): string {
  return typeof key === "number" ? `${tbl}[${key}]` : `${tbl}.${key}`;
}

function AZT_EncodeXorBytes(plain: string, key: number, step: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < plain.length; i++) {
    arr.push(plain.charCodeAt(i) ^ ((key + i * step) & 0xff));
  }
  return arr;
}

const SHA256_K_LIST = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

export function AZT_GenerateLuauVM(
  payload: AZT_EncodedPayload,
  rng: AZT_PRNG,
  math: AZT_MathEngine,
  options: Required<AZT_ObfuscateOptions>
): AZT_VMGenOutput {
  let opaquePredicatesInjected = 0;
  const cff = new AZT_CFFEngine(rng);
  const sym = payload.symbiotic;
  const cd = sym.codec;

  // Pool identifiers NEVER start with '_' — all internal scratch locals/params ALWAYS start with '_'.
  const pool = rng.createNamePool(190);
  let pIdx = 0;
  const v = (): string => pool[pIdx++];

  const numKeys = rng.shuffle(Array.from({ length: 240 }, (_, i) => i + 1));
  let nkIdx = 0;
  const idKeys = rng.createNamePool(40);
  let ikIdx = 0;
  const nextKey = (preferIdent = false): string | number =>
    preferIdent ? idKeys[ikIdx++] : numKeys[nkIdx++];

  // Core polymorphic layer keys
  const K_ENTRY = nextKey(true);
  const K_CRYPTO = nextKey(true);
  const K_BOOTVM = nextKey(true);
  const K_DECODE = nextKey(true);
  const K_VM = nextKey(true);
  const K_PAYLOAD = nextKey(true);
  const K_DICT = nextKey(true);
  const K_BOOT_PAYLOAD = nextKey(true);
  const K_BOOT_DICT = nextKey(true);
  const K_BOOT_KEY = nextKey(true);
  const K_VAULT_PAYLOAD = nextKey(true);
  const K_VAULT_DICT = nextKey(true);
  const K_B85_ALPHA = nextKey(true);
  const K_PATTERN = nextKey(true);
  const K_SBOX = nextKey(true);
  const K_MKEY = nextKey(true);
  const K_SHA_K = nextKey(true);
  const K_WM = nextKey(true);
  const K_TAMPER_MSG = nextKey(true);

  // API slot keys
  const K_BUF_FROM = nextKey(false);
  const K_BUF_CREATE = nextKey(false);
  const K_BUF_RU8 = nextKey(false);
  const K_BUF_RU16 = nextKey(false);
  const K_BUF_RU32 = nextKey(false);
  const K_BUF_RF64 = nextKey(false);
  const K_BUF_WU8 = nextKey(false);
  const K_BUF_WU32 = nextKey(false);
  const K_BUF_COPY = nextKey(false);
  const K_BUF_STR = nextKey(false);
  const K_TBL = nextKey(false);
  const K_TBL_CREATE = nextKey(false);
  const K_TBL_CONCAT = nextKey(false);
  const K_TBL_PACK = nextKey(false);
  const K_TBL_UNPACK = nextKey(false);
  const K_STR_SUB = nextKey(false);
  const K_STR_GSUB = nextKey(false);
  const K_STR_CHAR = nextKey(false);
  const K_STR_BYTE = nextKey(false);
  const K_BIT32 = nextKey(false);
  const K_PRINT = nextKey(false);
  const K_FLOOR = nextKey(false);
  const K_GETFENV = nextKey(false);
  const K_PCALL = nextKey(false);
  const K_TONUMBER = nextKey(false);
  const K_ERROR = nextKey(false);
  const K_TYPE = nextKey(false);

  // Encrypted runtime strings
  const wmKey = rng.int(17, 239);
  const wmEncBytes = AZT_EncodeXorBytes("AZT Obfuscator Protect this file", wmKey, 13);
  const tamperKey = rng.int(19, 233);
  const tamperStep = rng.int(5, 29);
  const tamperEncBytes = AZT_EncodeXorBytes("tamper", tamperKey, tamperStep);
  const lazyTag = rng.int(100001, 999999);

  // ── LAYER 1: CryptoSuite + 7-Codec Unpacker + XTEA-16 Block Cipher ─────────
  const c_self = v();
  const c_bit = v();
  const c_tCreate = v();
  const c_bFrom = v();
  const c_bCreate = v();
  const c_bRU8 = v();
  const c_bRU16 = v();
  const c_bRU32 = v();
  const c_bWU8 = v();
  const c_bWU32 = v();
  const c_bCopy = v();
  const c_bStr = v();
  const c_sub = v();
  const c_gsub = v();
  const c_sByte = v();
  const c_err = v();
  const c_shaK = v();
  const c_rawMk = v();

  const cryptoFnCode = `function(${c_self}) `
    + `local ${c_bit},${c_tCreate},${c_bFrom},${c_bCreate},${c_bRU8},${c_bRU16},${c_bRU32},${c_bWU8},${c_bWU32},${c_bCopy},${c_bStr},${c_sub},${c_gsub},${c_sByte},${c_err},${c_shaK},${c_rawMk}=`
    + `${AZT_FormatTableAccess(c_self, K_BIT32)},${AZT_FormatTableAccess(c_self, K_TBL_CREATE)},${AZT_FormatTableAccess(c_self, K_BUF_FROM)},${AZT_FormatTableAccess(c_self, K_BUF_CREATE)},${AZT_FormatTableAccess(c_self, K_BUF_RU8)},${AZT_FormatTableAccess(c_self, K_BUF_RU16)},${AZT_FormatTableAccess(c_self, K_BUF_RU32)},${AZT_FormatTableAccess(c_self, K_BUF_WU8)},${AZT_FormatTableAccess(c_self, K_BUF_WU32)},${AZT_FormatTableAccess(c_self, K_BUF_COPY)},${AZT_FormatTableAccess(c_self, K_BUF_STR)},${AZT_FormatTableAccess(c_self, K_STR_SUB)},${AZT_FormatTableAccess(c_self, K_STR_GSUB)},${AZT_FormatTableAccess(c_self, K_STR_BYTE)},${AZT_FormatTableAccess(c_self, K_ERROR)},${AZT_FormatTableAccess(c_self, K_SHA_K)},${AZT_FormatTableAccess(c_self, K_MKEY)};`
    + `local _bx,_ba,_bn,_rr,_rl,_rs,_ls=${c_bit}.bxor,${c_bit}.band,${c_bit}.bnot,${c_bit}.rrotate,${c_bit}.lrotate,${c_bit}.rshift,${c_bit}.lshift;`
    + `local _al=${AZT_FormatTableAccess(c_self, K_B85_ALPHA)};local _bRev=${c_tCreate}(128,0);for _i=1,#_al do _bRev[${c_sByte}(_al,_i)]=_i-1;end;`
    // Multi-Codec Frame Unpacker: Verify #AZT^...^AZURE# -> Dict -> Base85 -> LZ -> Feistel -> Delta -> NibbleRot
    + `local function _unpack(_raw,_dct,_cl,_rl2) `
    + `if ${c_sub}(_raw,1,5)~="#AZT^" or ${c_sub}(_raw,-7)~="^AZURE#" then return ${c_err}(0);end;`
    + `local _ex=${c_gsub}(${c_sub}(_raw,6,-8),${AZT_FormatTableAccess(c_self, K_PATTERN)},_dct);`
    + `local _ib=${c_bFrom}(_ex);local _cb=${c_bCreate}(math.floor((_cl+3)/4)*4+4);local _ca={};local _ps,_op,_el=0,0,#_ex;`
    + `while _ps+4<_el do local _u=${c_bRU32}(_ib,_ps);local _e=${c_bRU8}(_ib,_ps+4);local _k=_u+_e*4294967296;local _v=_ca[_k];`
    + `if not _v then local _c0=_u%256;local _t=(_u-_c0)/256;local _c1=_t%256;_t=(_t-_c1)/256;local _c2=_t%256;local _c3=(_t-_c2)/256;`
    + `_v=_bRev[_c0]+_bRev[_c1]*85+_bRev[_c2]*7225+_bRev[_c3]*614125+_bRev[_e]*52200625;_ca[_k]=_v;end;`
    + `${c_bWU32}(_cb,_op,_v);_ps+=5;_op+=4;end;`
    + `local _lz=${c_bCreate}(_rl2);local _ip,_wp=0,0;while _ip<_cl and _wp<_rl2 do local _fl=${c_bRU8}(_cb,_ip);_ip+=1;`
    + `if _fl<128 then local _ln=_fl+1;${c_bCopy}(_lz,_wp,_cb,_ip,_ln);_ip+=_ln;_wp+=_ln;`
    + `else local _ln=(_fl-128)+3;local _ds=${c_bRU16}(_cb,_ip);_ip+=2;if _ln<=_ds then ${c_bCopy}(_lz,_wp,_lz,_wp-_ds,_ln);_wp+=_ln;`
    + `else for _j=1,_ln do ${c_bWU8}(_lz,_wp,${c_bRU8}(_lz,_wp-_ds));_wp+=1;end;end;end;end;`
    + `local _arr=${c_tCreate}(_rl2);for _i=1,_rl2 do _arr[_i]=${c_bRU8}(_lz,_i-1);end;`
    // Inverse 2-Round Byte-Pair Feistel
    + `local _pr=math.floor(_rl2/2);for _i=0,_pr-1 do local _L2,_R2=_arr[_i*2+1],_arr[_i*2+2];`
    + `local _R1=_L2;local _f2=_bx((_R1*19+${cd.feistelK2}+_i*11)%256,_rs(_R1,2));local _L1=_bx(_R2,_f2);`
    + `local _R=_L1;local _f1=_bx((_R*13+${cd.feistelK1}+_i*5)%256,_rs(_R,3));local _L=_bx(_R1,_f1);`
    + `_arr[_i*2+1]=_L;_arr[_i*2+2]=_R;end;`
    // Inverse Delta
    + `local _pv=${cd.deltaSeed};for _i=1,_rl2 do _pv=(_arr[_i]+_pv)%256;_arr[_i]=_pv;end;`
    // Inverse Nibble-Swap + Bit-Rotate
    + `local _sh=${cd.rotShift};local _rs2=8-_sh;for _i=1,_rl2 do local _b=_arr[_i];`
    + `_b=_ba(_ls(_b,4)+_rs(_b,4),255);_b=_ba(_rs(_b,_sh)+_ls(_b,_rs2),255);`
    + `_arr[_i]=_bx(_b,(${cd.rotMask}+(_i-1)*7)%256);end;`
    + `return _arr;end;`
    // XTEA-16 Block Cipher Decryptor (64-bit Feistel, 16 rounds)
    + `local function _xteaDec(_dt,_xk) `
    + `local _n=#_dt;local _o=${c_tCreate}(_n);for _i=1,_n do _o[_i]=_dt[_i];end;`
    + `local _bl=math.floor(_n/8);for _bi=0,_bl-1 do local _p=_bi*8+1;`
    + `local _v0=_o[_p]+_o[_p+1]*256+_o[_p+2]*65536+_o[_p+3]*16777216;`
    + `local _v1=_o[_p+4]+_o[_p+5]*256+_o[_p+6]*65536+_o[_p+7]*16777216;`
    + `local _sm=3816266640;`
    + `for _r=1,16 do `
    + `local _m1=(_bx(_ls(_v0,4),_rs(_v0,5))+_v0)%4294967296;`
    + `local _k1=(_sm+_xk[_ba(_rs(_sm,11),3)+1])%4294967296;`
    + `_v1=(_v1-_bx(_m1,_k1))%4294967296;_sm=(_sm-2654435769)%4294967296;`
    + `local _m0=(_bx(_ls(_v1,4),_rs(_v1,5))+_v1)%4294967296;`
    + `local _k0=(_sm+_xk[_ba(_sm,3)+1])%4294967296;`
    + `_v0=(_v0-_bx(_m0,_k0))%4294967296;end;`
    + `_o[_p]=_ba(_v0,255);_o[_p+1]=_ba(_rs(_v0,8),255);_o[_p+2]=_ba(_rs(_v0,16),255);_o[_p+3]=_ba(_rs(_v0,24),255);`
    + `_o[_p+4]=_ba(_v1,255);_o[_p+5]=_ba(_rs(_v1,8),255);_o[_p+6]=_ba(_rs(_v1,16),255);_o[_p+7]=_ba(_rs(_v1,24),255);end;`
    + `return _o;end;`
    // RC4-dropN
    + `local function _rc4(_ky,_dt,_dr) `
    + `local _S=${c_tCreate}(256);for _i=0,255 do _S[_i]=_i;end;`
    + `local _j,_kl=0,#_ky;for _i=0,255 do _j=(_j+_S[_i]+_ky[(_i%_kl)+1])%256;_S[_i],_S[_j]=_S[_j],_S[_i];end;`
    + `local _i=0;_j=0;for _d=1,_dr do _i=(_i+1)%256;_j=(_j+_S[_i])%256;_S[_i],_S[_j]=_S[_j],_S[_i];end;`
    + `local _n=#_dt;local _o=${c_tCreate}(_n);for _k=1,_n do _i=(_i+1)%256;_j=(_j+_S[_i])%256;_S[_i],_S[_j]=_S[_j],_S[_i];_o[_k]=_bx(_dt[_k],_S[(_S[_i]+_S[_j])%256]);end;`
    + `return _o;end;`
    // SHA-256
    + `local function _sha256(_dt) `
    + `local _n=#_dt;local _bl=_n*8;local _pl=math.floor((_n+9+63)/64)*64;`
    + `local _pd=${c_tCreate}(_pl,0);for _i=1,_n do _pd[_i]=_dt[_i];end;_pd[_n+1]=128;`
    + `local _hi=math.floor(_bl/4294967296);local _lo=_bl%4294967296;`
    + `_pd[_pl-7]=_ba(_rs(_hi,24),255);_pd[_pl-6]=_ba(_rs(_hi,16),255);_pd[_pl-5]=_ba(_rs(_hi,8),255);_pd[_pl-4]=_ba(_hi,255);`
    + `_pd[_pl-3]=_ba(_rs(_lo,24),255);_pd[_pl-2]=_ba(_rs(_lo,16),255);_pd[_pl-1]=_ba(_rs(_lo,8),255);_pd[_pl]=_ba(_lo,255);`
    + `local _h0,_h1,_h2,_h3,_h4,_h5,_h6,_h7=1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225;`
    + `local _W=${c_tCreate}(64);`
    + `for _of=1,_pl,64 do `
    + `for _t=0,15 do local _p=_of+_t*4;_W[_t+1]=_pd[_p]*16777216+_pd[_p+1]*65536+_pd[_p+2]*256+_pd[_p+3];end;`
    + `for _t=17,64 do local _w15,_w2=_W[_t-15],_W[_t-2];local _s0=_bx(_rr(_w15,7),_rr(_w15,18),_rs(_w15,3));local _s1=_bx(_rr(_w2,17),_rr(_w2,19),_rs(_w2,10));_W[_t]=(_W[_t-16]+_s0+_W[_t-7]+_s1)%4294967296;end;`
    + `local _a,_b,_c,_d,_e,_f,_g,_h=_h0,_h1,_h2,_h3,_h4,_h5,_h6,_h7;`
    + `for _t=1,64 do `
    + `local _S1=_bx(_rr(_e,6),_rr(_e,11),_rr(_e,25));local _ch=_bx(_ba(_e,_f),_ba(_bn(_e),_g));`
    + `local _t1=(_h+_S1+_ch+${c_shaK}[_t]+_W[_t])%4294967296;`
    + `local _S0=_bx(_rr(_a,2),_rr(_a,13),_rr(_a,22));local _mj=_bx(_ba(_a,_b),_ba(_a,_c),_ba(_b,_c));`
    + `local _t2=(_S0+_mj)%4294967296;`
    + `_h=_g;_g=_f;_f=_e;_e=(_d+_t1)%4294967296;_d=_c;_c=_b;_b=_a;_a=(_t1+_t2)%4294967296;end;`
    + `_h0=(_h0+_a)%4294967296;_h1=(_h1+_b)%4294967296;_h2=(_h2+_c)%4294967296;_h3=(_h3+_d)%4294967296;`
    + `_h4=(_h4+_e)%4294967296;_h5=(_h5+_f)%4294967296;_h6=(_h6+_g)%4294967296;_h7=(_h7+_h)%4294967296;end;`
    + `local _hs={_h0,_h1,_h2,_h3,_h4,_h5,_h6,_h7};local _o=${c_tCreate}(32);`
    + `for _i=1,8 do local _w=_hs[_i];local _p=(_i-1)*4;_o[_p+1]=_ba(_rs(_w,24),255);_o[_p+2]=_ba(_rs(_w,16),255);_o[_p+3]=_ba(_rs(_w,8),255);_o[_p+4]=_ba(_w,255);end;`
    + `return _o;end;`
    // HMAC-SHA256
    + `local function _hmac(_ky,_ms) `
    + `local _k=#_ky>64 and _sha256(_ky) or _ky;local _kp=${c_tCreate}(64,0);for _i=1,#_k do _kp[_i]=_k[_i];end;`
    + `local _ip=${c_tCreate}(64+#_ms);local _op=${c_tCreate}(96);`
    + `for _i=1,64 do _ip[_i]=_bx(_kp[_i],54);_op[_i]=_bx(_kp[_i],92);end;`
    + `for _i=1,#_ms do _ip[64+_i]=_ms[_i];end;`
    + `local _in=_sha256(_ip);for _i=1,32 do _op[64+_i]=_in[_i];end;`
    + `return _sha256(_op);end;`
    // SHA-512
    + `local function _sha512(_dt) `
    + `local _n=#_dt;local _dA=${c_tCreate}(_n+4);local _dB=${c_tCreate}(_n+4);`
    + `_dA[1],_dA[2],_dA[3],_dA[4]=81,14,82,127;_dB[1],_dB[2],_dB[3],_dB[4]=187,103,174,133;`
    + `for _i=1,_n do local _b=_dt[_i];_dA[4+_i]=_b;_dB[4+_i]=_b;end;`
    + `local _L,_R=_sha256(_dA),_sha256(_dB);local _st=${c_tCreate}(16);`
    + `for _i=0,7 do local _p=_i*4;_st[_i+1]=_L[_p+1]*16777216+_L[_p+2]*65536+_L[_p+3]*256+_L[_p+4];_st[_i+9]=_R[_p+1]*16777216+_R[_p+2]*65536+_R[_p+3]*256+_R[_p+4];end;`
    + `for _r=0,3 do for _i=0,15 do local _nx=_st[((_i+1)%16)+1];local _op=_st[((_i+7)%16)+1];_st[_i+1]=_bx(_rl((_st[_i+1]+_op+${c_shaK}[((_r*16+_i)%64)+1])%4294967296,11),_nx);end;end;`
    + `local _o=${c_tCreate}(64);for _i=1,16 do local _w=_st[_i];local _p=(_i-1)*4;_o[_p+1]=_ba(_rs(_w,24),255);_o[_p+2]=_ba(_rs(_w,16),255);_o[_p+3]=_ba(_rs(_w,8),255);_o[_p+4]=_ba(_w,255);end;`
    + `return _o;end;`
    // Custom SHA-2064 (258 bytes)
    + `local function _sha2064(_dt,_sd) `
    + `local _n=#_dt;local _ib=${c_tCreate}(_n+4);`
    + `_ib[1]=_ba(_rs(_sd,24),255);_ib[2]=_ba(_rs(_sd,16),255);_ib[3]=_ba(_rs(_sd,8),255);_ib[4]=_ba(_sd,255);`
    + `for _i=1,_n do _ib[4+_i]=_dt[_i];end;`
    + `local _ln=_sha512(_ib);local _o=${c_tCreate}(258);local _ps,_rd=0,0;`
    + `while _ps<258 do local _tk=258-_ps;if _tk>64 then _tk=64;end;for _i=1,_tk do _o[_ps+_i]=_ln[_i];end;_ps+=_tk;`
    + `if _ps<258 then _rd+=1;local _ni=${c_tCreate}(68);for _i=1,64 do _ni[_i]=_ln[_i];end;`
    + `_ni[65]=_bx(_rd,_ba(_sd,255))%256;_ni[66]=(_ba(_rs(_sd,8),255)+_rd*17)%256;_ni[67]=_bx(_ba(_rs(_sd,16),255),(_rd*31)%256)%256;_ni[68]=(_ba(_rs(_sd,24),255)+_rd*47)%256;_ln=_sha512(_ni);end;end;`
    + `return _o;end;`
    // Custom Checksum
    + `local function _csum(_dt,_pl) `
    + `local _h1=_bx(2166136261,_pl);local _h2=(2654435769+_pl)%4294967296;local _p=_ba(_pl,65535);if _p%2==0 then _p+=1;end;`
    + `for _i=1,#_dt do local _b=_dt[_i];_h1=((_bx(_h1,_b)*_p)+(((_i-1)*17)%65536))%4294967296;_h2=_bx(_rl((_h2+_b+1)%4294967296,5),_h1);end;`
    + `return _bx(_h1,_rr(_h2,13));end;`
    + `local function _solve(_ai,_b,_c) return ((((_c-_b)%${AZT_PUZZLE_PRIME}+${AZT_PUZZLE_PRIME})%${AZT_PUZZLE_PRIME})*_ai)%${AZT_PUZZLE_PRIME};end;`
    + `local function _unmask(_vt,_wmH) `
    + `local _mk=${c_tCreate}(16);for _i=1,16 do local _sh=((_i-1)%4)*8;_mk[_i]=_bx(${c_rawMk}[_i],_ba(_rs(_vt,_sh),255),_ba(_rs(_wmH,_sh),255));end;`
    + `local _vSd=_bx(_vt,_wmH);`
    + `local function _lazyStr(_cp) `
    + `local _ci,_ai,_b,_c,_ct=_cp[2],_cp[3],_cp[4],_cp[5],_cp[6];local _x=_solve(_ai,_b,_c);`
    + `local _m2={_ci%256,math.floor(_ci/256)%256,_x%256,math.floor(_x/256)%256};`
    + `local _s2064=_sha2064(_m2,${payload.customShaSeed});local _n=#_ct;local _p2=${c_tCreate}(_n);`
    + `for _i=1,_n do _p2[_i]=_bx(_ct[_i],_s2064[((_i-1)%258)+1]);end;`
    + `local _p1=_rc4(_hmac(_mk,_m2),_p2,32);local _sb=${c_bCreate}(_n);local _k1=_bx(_x,(_ci*29+17)%256)%256;`
    + `for _i=1,_n do ${c_bWU8}(_sb,_i-1,_bx(_p1[_i],_k1));_k1=(_k1*37+(_x%128)+19)%256;end;`
    + `return ${c_bStr}(_sb);end;`
    + `return _mk,_vSd,_lazyStr;end;`
    + `return {_rc4,_sha256,_hmac,_sha512,_sha2064,_csum,_solve,_unpack,_unmask,_xteaDec};end`;

  // ── LAYER 2: Boot Micro-VM Bytecode Interpreter ────────────────────────────
  const b_self = v();
  const b_env = v();
  const b_cs = v();
  const b_bit = v();
  const b_pcall = v();
  const b_tonum = v();
  const b_err = v();
  const b_tbl = v();
  const b_char = v();
  const b_tCreate = v();
  const b_tConcat = v();
  const b_print = v();
  const b_op = v();
  const b_a1 = v();
  const b_a2 = v();
  const b_vt = v();
  const b_wmH = v();
  const b_rice = v();

  const bRiceExpr = options.ricePredicates
    ? (opaquePredicatesInjected++, math.generateRiceOpaqueTrue(b_rice, b_bit))
    : "true";

  const tripStmt = `local _m=${AZT_FormatTableAccess(b_self, K_TAMPER_MSG)};local _b=${b_tCreate}(#_m);for _i=1,#_m do _b[_i]=${b_char}(${b_bit}.bxor(_m[_i],(${tamperKey}+(_i-1)*${tamperStep})%256));end;return ${b_err}(${b_tConcat}(_b));`;
  const wmPrintBoot = options.watermarkPrint ? `${b_print}(${b_tConcat}(_wt));` : "";

  const pidKey = rng.int(17, 239);
  const pidEnc = AZT_EncodeXorBytes("PlaceId", pidKey, 11);

  const bootCases: { id: number; body: string }[] = [
    { id: sym.bootOpMap[AZT_BootOp.INIT_VITAL], body: `${b_vt}=${b_a1};${b_rice}=${b_a2};` },
    { id: sym.bootOpMap[AZT_BootOp.RICE_BARRIER], body: `${b_rice}=(${b_rice}+${b_a1}*${b_a2})%65521;if not (${bRiceExpr}) then ${tripStmt} end;` },
    {
      id: sym.bootOpMap[AZT_BootOp.CHECK_PLACEID],
      body: `if ${b_a1}>0 then local _g=${b_env} and ${b_env}.game or game;if _g~=nil then local _pe={${pidEnc.join(",")}};local _pt=${b_tCreate}(#_pe);for _i=1,#_pe do _pt[_i]=${b_char}(${b_bit}.bxor(_pe[_i],(${pidKey}+(_i-1)*11)%256));end;local _pk=${b_tConcat}(_pt);local _ok,_pv=${b_pcall}(function() return _g[_pk];end);local _pn=_ok and ${b_tonum}(_pv) or nil;if _pn and _pn<${b_a1} then ${tripStmt} end;end;end;${b_vt}=${b_bit}.bxor(${b_vt},${b_a2});`,
    },
    {
      id: sym.bootOpMap[AZT_BootOp.CHECK_TABLE_FROZEN],
      body: `if ${b_a1}>0 then local _ok=${b_pcall}(function() ${b_tbl}[${b_a1}]=${b_tbl};end);if _ok then ${tripStmt} end;end;${b_vt}=(${b_vt}+${b_a2})%4294967296;`,
    },
    {
      id: sym.bootOpMap[AZT_BootOp.DECODE_WM_HASH],
      body: `local _we=${AZT_FormatTableAccess(b_self, K_WM)};local _wn=#_we;local _wb=${b_tCreate}(_wn);local _wt=${b_tCreate}(_wn);for _i=1,_wn do local _ch=${b_bit}.bxor(_we[_i],(${wmKey}+(_i-1)*13)%256);_wb[_i]=_ch;_wt[_i]=${b_char}(_ch);end;${b_wmH}=${b_cs}[6](_wb,${payload.checksumPoly});${wmPrintBoot}`,
    },
    { id: sym.bootOpMap[AZT_BootOp.FINALIZE_VITAL], body: `return ${b_vt},${b_wmH};` },
  ];

  const bootDispatchTree = cff.buildDispatchTree(b_op, bootCases, true);

  const bootVmFnCode = `function(${b_self},${b_env},${b_cs}) `
    + `local ${b_bit},${b_pcall},${b_tonum},${b_err},${b_tbl},${b_char},${b_tCreate},${b_tConcat},${b_print}=`
    + `${AZT_FormatTableAccess(b_self, K_BIT32)},${AZT_FormatTableAccess(b_self, K_PCALL)},${AZT_FormatTableAccess(b_self, K_TONUMBER)},${AZT_FormatTableAccess(b_self, K_ERROR)},${AZT_FormatTableAccess(b_self, K_TBL)},${AZT_FormatTableAccess(b_self, K_STR_CHAR)},${AZT_FormatTableAccess(b_self, K_TBL_CREATE)},${AZT_FormatTableAccess(b_self, K_TBL_CONCAT)},${AZT_FormatTableAccess(b_self, K_PRINT)};`
    + `local _up=${b_cs}[8](${AZT_FormatTableAccess(b_self, K_BOOT_PAYLOAD)},${AZT_FormatTableAccess(b_self, K_BOOT_DICT)},${sym.bootCompLen},${sym.bootRawLen});`
    + `local _bc=${b_cs}[1](${AZT_FormatTableAccess(b_self, K_BOOT_KEY)},_up,32);`
    + `local ${b_vt},${b_wmH},${b_rice},_pc=0,0,17,1;`
    + `while _pc+8<=#_bc do `
    + `local ${b_op}=_bc[_pc];`
    + `local ${b_a1}=_bc[_pc+1]+_bc[_pc+2]*256+_bc[_pc+3]*65536+_bc[_pc+4]*16777216;`
    + `local ${b_a2}=_bc[_pc+5]+_bc[_pc+6]*256+_bc[_pc+7]*65536+_bc[_pc+8]*16777216;_pc+=9;`
    + `${bootDispatchTree} `
    + `end;return ${b_vt},${b_wmH};end`;

  // ── LAYER 3: Symbiotic Vault + Heavyweight Chunked Lazy Decoder ────────────
  const d_self = v();
  const d_raw = v();
  const d_cs = v();
  const d_mKey = v();
  const d_vSeed = v();
  const d_bCreate = v();
  const d_bRU8 = v();
  const d_bRU16 = v();
  const d_bRU32 = v();
  const d_bRF64 = v();
  const d_bWU8 = v();
  const d_tCreate = v();
  const d_bit = v();
  const d_err = v();
  const d_sbox = v();
  const d_sbox2 = v();
  const d_xteaK = v();
  const d_affXor = v();
  const d_mul32 = v();
  const d_decU32 = v();
  const d_readProto = v();

  const aInv = payload.instrKey.aInv;
  const affB = payload.instrKey.b;
  const mba = (val: number): string =>
    options.advancedMath ? math.generateMBAConstantExpr(val, d_bit) : String(val);

  const d_state = v();
  const d_rice = v();
  const d_cntArr = v();
  const d_rawBuf = v();
  const d_hb = v();
  const d_proto = v();

  const decStates = rng.shuffle([1, 2, 3, 4, 5, 6]);
  const [ST_VAULT, ST_UNPACK, ST_CHUNKS, ST_DESER, ST_DONE, ST_DECOY] = decStates;

  const riceTrue1 = options.ricePredicates
    ? (opaquePredicatesInjected++, math.generateRiceOpaqueTrue(d_rice, d_bit))
    : "true";
  const riceFalse1 = options.ricePredicates
    ? (opaquePredicatesInjected++, math.generateRiceOpaqueFalse(d_rice, d_bit))
    : "false";

  const tr = (f: number, t: number): string => cff.emitTransition(d_state, f, t, d_bit, "_cffS");
  const decoderMachine = cff.buildStateMachine([
    {
      // Unpack & verify Payload 2 (10KB+ Crypto Vault) -> extract live invSBox2 & XTEA-16 Key!
      id: ST_VAULT,
      body: `local _vu=${d_cs}[8](${AZT_FormatTableAccess(d_self, K_VAULT_PAYLOAD)},${AZT_FormatTableAccess(d_self, K_VAULT_DICT)},${mba(sym.vaultCompLen)},${mba(sym.vaultRawLen)});`
        + `local _vp=${d_cs}[1](${d_mKey},_vu,64);`
        + `if ${d_cs}[6](_vp,${payload.checksumPoly})~=${sym.vaultChecksum} then return ${d_err}(0);end;`
        + `${d_sbox2}=${d_tCreate}(256);for _i=1,256 do ${d_sbox2}[_i]=_vp[_i];end;`
        + `${d_xteaK}=${d_tCreate}(4);for _i=0,3 do local _p=257+_i*4;${d_xteaK}[_i+1]=_vp[_p]+_vp[_p+1]*256+_vp[_p+2]*65536+_vp[_p+3]*16777216;end;`
        + `${d_rice}+=17;if ${riceTrue1} then ${tr(ST_VAULT, ST_UNPACK)} else ${tr(ST_VAULT, ST_DECOY)} end`,
    },
    {
      id: ST_UNPACK,
      body: `${d_cntArr}=${d_cs}[8](${d_raw},${AZT_FormatTableAccess(d_self, K_DICT)},${mba(payload.compLen)},${mba(payload.rawLen)});${d_rice}+=7;if ${riceTrue1} then ${tr(ST_UNPACK, ST_CHUNKS)} else ${tr(ST_UNPACK, ST_DECOY)} end`,
    },
    {
      id: ST_CHUNKS,
      body: `${d_rawBuf}=${d_bCreate}(${mba(payload.plainBinLen)});local _cp,_wo=3,0;local _cc=${d_cntArr}[1]+${d_cntArr}[2]*256;`
        + `local _rc4,_s256,_hmc,_s512,_s2064,_csm,_slv,_xtd=${d_cs}[1],${d_cs}[2],${d_cs}[3],${d_cs}[4],${d_cs}[5],${d_cs}[6],${d_cs}[7],${d_cs}[10];`
        + `local _ch=_s256(${d_mKey});${d_hb}=${d_vSeed};`
        + `for _ci=0,_cc-1 do `
        + `local _pln=${d_cntArr}[_cp]+${d_cntArr}[_cp+1]*256+${d_cntArr}[_cp+2]*65536+${d_cntArr}[_cp+3]*16777216;_cp+=4;`
        + `local _tln=${d_cntArr}[_cp]+${d_cntArr}[_cp+1]*256+${d_cntArr}[_cp+2]*65536+${d_cntArr}[_cp+3]*16777216;_cp+=4;`
        + `local _ai=${d_cntArr}[_cp]+${d_cntArr}[_cp+1]*256;_cp+=2;local _pb=${d_cntArr}[_cp]+${d_cntArr}[_cp+1]*256;_cp+=2;local _pc=${d_cntArr}[_cp]+${d_cntArr}[_cp+1]*256;_cp+=2;`
        + `local _exC=${d_cntArr}[_cp]+${d_cntArr}[_cp+1]*256+${d_cntArr}[_cp+2]*65536+${d_cntArr}[_cp+3]*16777216;_cp+=4;`
        + `local _exH=${d_tCreate}(32);for _k=1,32 do _exH[_k]=${d_cntArr}[_cp];_cp+=1;end;`
        + `local _x=_slv(_ai,_pb,_pc);`
        + `${d_hb}=(${d_bit}.bxor(${d_hb},_x,_exC)+(_ci*2654435769)%4294967296)%4294967296;`
        + `local _st2=${d_tCreate}(_tln);local _cs0=${d_bit}.bxor(${payload.cipherSeed},(_ci*2654435769)%4294967296);local _cm=${mba(payload.cipherMult)};local _ca=${mba(payload.cipherAdd)};`
        + `for _i=1,_tln do _cs0=(_cs0*_cm+_ca)%4294967296;local _mk=${d_bit}.band(${d_bit}.rshift(_cs0,16),255);_st2[_i]=${d_bit}.bxor(${d_sbox2}[${d_sbox}[${d_cntArr}[_cp]+1]+1],_mk);_cp+=1;end;`
        + `local _km=${d_tCreate}(35);for _i=1,32 do _km[_i]=_ch[_i];end;_km[33]=_ci%256;_km[34]=_x%256;_km[35]=math.floor(_x/256)%256;`
        + `local _ks=_s2064(_km,${payload.customShaSeed});local _st1=${d_tCreate}(_tln);for _i=1,_tln do _st1[_i]=${d_bit}.bxor(_st2[_i],_ks[((_i-1)%258)+1]);end;`
        + `local _st0=_rc4(_s512(_km),_st1,64);`
        + `local _pd=_xtd(_st0,${d_xteaK});`
        + `if _csm(_pd,${payload.checksumPoly})~=_exC then return ${d_err}(0);end;`
        + `local _acH=_hmc(${d_mKey},_pd);for _k=1,32 do if _acH[_k]~=_exH[_k] then return ${d_err}(0);end;end;`
        + `local _pl=${d_tCreate}(_pln);for _i=1,_pln do local _bt=_pd[_i];_pl[_i]=_bt;${d_bWU8}(${d_rawBuf},_wo,_bt);_wo+=1;end;`
        + `_ch=_s256(_pl);end;${d_rice}+=13;if ${riceFalse1} then ${tr(ST_CHUNKS, ST_DECOY)} else ${tr(ST_CHUNKS, ST_DESER)} end`,
    },
    {
      id: ST_DESER,
      body: `local _o=0;${d_proto}=${d_readProto}(function(_n) local _r=_o;_o+=_n;return _r;end);${tr(ST_DESER, ST_DONE)}`,
    },
    {
      id: ST_DONE,
      body: `return ${d_proto},${d_hb};`,
    },
    {
      id: ST_DECOY,
      body: `${d_rice}=${d_bit}.bxor(${d_rice},0x5A3C);${tr(ST_DECOY, ST_VAULT)}`,
    },
  ], { stateVar: d_state, bit32Var: d_bit, initState: ST_VAULT, riceVar: d_rice, multiline: true });

  const decodeFnCode = `function(${d_self},${d_raw},${d_cs},${d_mKey},${d_vSeed}) `
    + `local ${d_bCreate},${d_bRU8},${d_bRU16},${d_bRU32},${d_bRF64},${d_bWU8},${d_tCreate},${d_bit},${d_err},${d_sbox}=`
    + `${AZT_FormatTableAccess(d_self, K_BUF_CREATE)},${AZT_FormatTableAccess(d_self, K_BUF_RU8)},${AZT_FormatTableAccess(d_self, K_BUF_RU16)},${AZT_FormatTableAccess(d_self, K_BUF_RU32)},${AZT_FormatTableAccess(d_self, K_BUF_RF64)},${AZT_FormatTableAccess(d_self, K_BUF_WU8)},${AZT_FormatTableAccess(d_self, K_TBL_CREATE)},${AZT_FormatTableAccess(d_self, K_BIT32)},${AZT_FormatTableAccess(d_self, K_ERROR)},${AZT_FormatTableAccess(d_self, K_SBOX)};`
    + `local ${d_affXor}=${d_bit}.bxor(${sym.entangledAffXor},${d_vSeed});`
    + `local function ${d_mul32}(_x,_y) local _xl=_x%65536;local _xh=(_x-_xl)/65536;local _yl=_y%65536;local _yh=(_y-_yl)/65536;return (_xl*_yl+((_xl*_yh+_xh*_yl)%65536)*65536)%4294967296;end;`
    + `local function ${d_decU32}(_ev) local _s1=${d_bit}.bxor(_ev,${d_affXor});local _s2=(_s1-${affB})%4294967296;return ${d_mul32}(_s2,${aInv});end;`
    + `local function _i32(_uv) return _uv>=2147483648 and _uv-4294967296 or _uv;end;`
    + `local ${d_sbox2},${d_xteaK},${d_cntArr},${d_rawBuf},${d_hb},${d_proto};`
    + `local function ${d_readProto}(_adv) `
    + `local _np=${d_bRU8}(${d_rawBuf},_adv(1));local _iv=${d_bRU8}(${d_rawBuf},_adv(1))==1;local _ms=${d_bRU16}(${d_rawBuf},_adv(2));local _nu=${d_bRU16}(${d_rawBuf},_adv(2));`
    + `local _ud=${d_tCreate}(_nu);for _i=1,_nu do _ud[_i]={${d_bRU8}(${d_rawBuf},_adv(1))==1,${d_bRU16}(${d_rawBuf},_adv(2))};end;`
    + `local _nc=${d_bRU32}(${d_rawBuf},_adv(4));local _cs=${d_tCreate}(_nc);for _i=1,_nc do local _tp=${d_bRU8}(${d_rawBuf},_adv(1));`
    + `if _tp==0 then _cs[_i]=nil;elseif _tp==1 then _cs[_i]=${d_bRU8}(${d_rawBuf},_adv(1))==1;elseif _tp==2 then _cs[_i]=${d_bRF64}(${d_rawBuf},_adv(8));`
    + `else local _ai=${d_bRU16}(${d_rawBuf},_adv(2));local _pb=${d_bRU16}(${d_rawBuf},_adv(2));local _pc=${d_bRU16}(${d_rawBuf},_adv(2));local _sl=${d_bRU32}(${d_rawBuf},_adv(4));local _ct=${d_tCreate}(_sl);for _j=1,_sl do _ct[_j]=${d_bRU8}(${d_rawBuf},_adv(1));end;_cs[_i]={${lazyTag},_i-1,_ai,_pb,_pc,_ct};end;end;`
    + `local _ni=${d_bRU32}(${d_rawBuf},_adv(4));local _ins=${d_tCreate}(_ni);for _i=1,_ni do `
    + `local _w0=${d_decU32}(${d_bRU32}(${d_rawBuf},_adv(4)));local _op=_w0%256;local _a=((_w0-_op)/256)%256;local _d=((_w0-_op-_a*256)/65536)%256;`
    + `local _b=_i32(${d_decU32}(${d_bRU32}(${d_rawBuf},_adv(4))));local _c=_i32(${d_decU32}(${d_bRU32}(${d_rawBuf},_adv(4))));`
    + `_ins[_i]={_op,_a,_b,_c,_d};end;`
    + `local _npr=${d_bRU32}(${d_rawBuf},_adv(4));local _prs=${d_tCreate}(_npr);for _i=1,_npr do _prs[_i]=${d_readProto}(_adv);end;`
    + `return {_np,_iv,_ms,_ud,_cs,_ins,_prs};end;`
    + `local ${d_state},${d_rice}=${ST_VAULT},${rng.int(11, 999)};`
    + `${decoderMachine}`
    + `end`;

  // ── LAYER 4: Heavyweight 95-Branch Symbiotic Pure Luau VM ──────────────────
  const m_self = v();
  const m_proto = v();
  const m_env = v();
  const m_upvals = v();
  const m_lazyFn = v();
  const m_hb = v();
  const m_opMask = v();
  const m_exec = v();
  const m_R = v();
  const m_K = v();
  const m_I = v();
  const m_P = v();
  const m_PC = v();
  const m_ins = v();
  const m_op = v();
  const m_A = v();
  const m_B = v();
  const m_C = v();
  const m_D = v();
  const m_rice = v();
  const m_tCreate = v();
  const m_tPack = v();
  const m_tUnpack = v();
  const m_bit = v();
  const m_floor = v();
  const m_type = v();
  const m_getK = v();

  const opId = (op: AZT_OpCode): number => payload.opcodeMap.get(op) ?? op;

  const vmRiceGuardExpr = options.ricePredicates
    ? (opaquePredicatesInjected++, math.generateRiceOpaqueTrue(m_rice, m_bit))
    : "true";

  const vmCases: { id: number; body: string }[] = [
    { id: opId(AZT_OpCode.MOVE), body: `${m_R}[${m_A}]=${m_R}[${m_B}];` },
    { id: opId(AZT_OpCode.LOADK), body: `${m_R}[${m_A}]=${m_getK}(${m_B}+1);` },
    { id: opId(AZT_OpCode.LOADBOOL), body: `${m_R}[${m_A}]=(${m_B}~=0);` },
    { id: opId(AZT_OpCode.LOADNIL), body: `${m_R}[${m_A}]=nil;` },
    { id: opId(AZT_OpCode.GETGLOBAL), body: `${m_R}[${m_A}]=${m_env}[${m_getK}(${m_B}+1)];` },
    { id: opId(AZT_OpCode.SETGLOBAL), body: `${m_env}[${m_getK}(${m_B}+1)]=${m_R}[${m_A}];` },
    { id: opId(AZT_OpCode.GETUPVAL), body: `local _u=${m_upvals}[${m_B}+1];${m_R}[${m_A}]=_u[1][_u[2]];` },
    { id: opId(AZT_OpCode.SETUPVAL), body: `local _u=${m_upvals}[${m_B}+1];_u[1][_u[2]]=${m_R}[${m_A}];` },
    { id: opId(AZT_OpCode.NEWTABLE), body: `${m_R}[${m_A}]=${m_B}>0 and ${m_tCreate}(${m_B}) or {};` },
    { id: opId(AZT_OpCode.GETTABLE), body: `${m_R}[${m_A}]=${m_R}[${m_B}][${m_R}[${m_C}]];` },
    { id: opId(AZT_OpCode.SETTABLE), body: `${m_R}[${m_A}][${m_R}[${m_B}]]=${m_R}[${m_C}];` },
    { id: opId(AZT_OpCode.GETFIELD), body: `${m_R}[${m_A}]=${m_R}[${m_B}][${m_getK}(${m_C}+1)];` },
    { id: opId(AZT_OpCode.SETFIELD), body: `${m_R}[${m_A}][${m_getK}(${m_B}+1)]=${m_R}[${m_C}];` },
    { id: opId(AZT_OpCode.SELF), body: `local _o=${m_R}[${m_B}];${m_R}[${m_A}+1]=_o;${m_R}[${m_A}]=_o[${m_getK}(${m_C}+1)];` },
    { id: opId(AZT_OpCode.ADD), body: `${m_R}[${m_A}]=${m_R}[${m_B}]+${m_R}[${m_C}];` },
    { id: opId(AZT_OpCode.SUB), body: `${m_R}[${m_A}]=${m_R}[${m_B}]-${m_R}[${m_C}];` },
    { id: opId(AZT_OpCode.MUL), body: `${m_R}[${m_A}]=${m_R}[${m_B}]*${m_R}[${m_C}];` },
    { id: opId(AZT_OpCode.DIV), body: `${m_R}[${m_A}]=${m_R}[${m_B}]/${m_R}[${m_C}];` },
    { id: opId(AZT_OpCode.IDIV), body: `${m_R}[${m_A}]=${m_floor}(${m_R}[${m_B}]/${m_R}[${m_C}]);` },
    { id: opId(AZT_OpCode.MOD), body: `${m_R}[${m_A}]=${m_R}[${m_B}]%${m_R}[${m_C}];` },
    { id: opId(AZT_OpCode.POW), body: `${m_R}[${m_A}]=${m_R}[${m_B}]^${m_R}[${m_C}];` },
    { id: opId(AZT_OpCode.CONCAT), body: `${m_R}[${m_A}]=${m_R}[${m_B}]..${m_R}[${m_C}];` },
    { id: opId(AZT_OpCode.UNM), body: `${m_R}[${m_A}]=-${m_R}[${m_B}];` },
    { id: opId(AZT_OpCode.NOT), body: `${m_R}[${m_A}]=not ${m_R}[${m_B}];` },
    { id: opId(AZT_OpCode.LEN), body: `${m_R}[${m_A}]=#${m_R}[${m_B}];` },
    { id: opId(AZT_OpCode.EQ), body: `${m_R}[${m_A}]=(${m_R}[${m_B}]==${m_R}[${m_C}]);` },
    { id: opId(AZT_OpCode.LT), body: `${m_R}[${m_A}]=(${m_R}[${m_B}]<${m_R}[${m_C}]);` },
    { id: opId(AZT_OpCode.LE), body: `${m_R}[${m_A}]=(${m_R}[${m_B}]<=${m_R}[${m_C}]);` },
    { id: opId(AZT_OpCode.TEST), body: `local _t=not not ${m_R}[${m_A}];if (${m_C}==0 and _t) or (${m_C}~=0 and not _t) then ${m_PC}+=1;end;` },
    { id: opId(AZT_OpCode.JMP), body: `${m_PC}+=${m_B};` },
    {
      id: opId(AZT_OpCode.CALL),
      body: `local _fn=${m_R}[${m_A}];local _rs;if ${m_B}==0 then _rs=${m_tPack}(_fn());else local _ag=${m_tCreate}(${m_B});for _j=1,${m_B} do _ag[_j]=${m_R}[${m_A}+_j];end;_rs=${m_tPack}(_fn(${m_tUnpack}(_ag,1,${m_B})));end;for _j=1,${m_C} do ${m_R}[${m_A}+_j-1]=_rs[_j];end;`,
    },
    {
      id: opId(AZT_OpCode.RETURN),
      body: `if ${m_B}==0 then return;elseif ${m_B}==1 then return ${m_R}[${m_A}];else local _rt=${m_tCreate}(${m_B});for _j=1,${m_B} do _rt[_j]=${m_R}[${m_A}+_j-1];end;return ${m_tUnpack}(_rt,1,${m_B});end;`,
    },
    { id: opId(AZT_OpCode.FORPREP), body: `${m_R}[${m_A}]=${m_R}[${m_A}]-${m_R}[${m_A}+2];${m_PC}+=${m_B};` },
    {
      id: opId(AZT_OpCode.FORLOOP),
      body: `local _st=${m_R}[${m_A}+2];local _ix=${m_R}[${m_A}]+_st;${m_R}[${m_A}]=_ix;local _lm=${m_R}[${m_A}+1];if (_st>0 and _ix<=_lm) or (_st<=0 and _ix>=_lm) then ${m_R}[${m_A}+3]=_ix;${m_PC}+=${m_B};end;`,
    },
    {
      id: opId(AZT_OpCode.TFORCALL),
      body: `local _rs=${m_tPack}(${m_R}[${m_A}](${m_R}[${m_A}+1],${m_R}[${m_A}+2]));for _j=1,${m_B} do ${m_R}[${m_A}+2+_j]=_rs[_j];end;if ${m_R}[${m_A}+3]~=nil then ${m_R}[${m_A}+2]=${m_R}[${m_A}+3];${m_PC}+=1;end;`,
    },
    {
      id: opId(AZT_OpCode.CLOSURE),
      body: `local _cp=${m_P}[${m_B}+1];local _ud=_cp[4];local _cu=${m_tCreate}(#_ud);for _j=1,#_ud do local _d=_ud[_j];if _d[1] then _cu[_j]={${m_R},_d[2]};else _cu[_j]=${m_upvals}[_d[2]+1];end;end;${m_R}[${m_A}]=${m_exec}(${m_self},_cp,${m_env},_cu,${m_lazyFn},${m_hb});`,
    },
    { id: opId(AZT_OpCode.VARARG), body: `for _j=1,${m_B} do ${m_R}[${m_A}+_j-1]=_va[_j];end;` },
    { id: opId(AZT_OpCode.SETLIST), body: `${m_R}[${m_A}][${m_B}]=${m_R}[${m_C}];` },
    { id: opId(AZT_OpCode.SUPER_GETG_GETF), body: `${m_R}[${m_A}]=${m_env}[${m_getK}(${m_B}+1)][${m_getK}(${m_C}+1)];` },
    { id: opId(AZT_OpCode.SUPER_LOADK_ADD), body: `${m_R}[${m_A}]=${m_R}[${m_B}]+${m_getK}(${m_C}+1);` },
    { id: opId(AZT_OpCode.SUPER_LOADK_SUB), body: `${m_R}[${m_A}]=${m_R}[${m_B}]-${m_getK}(${m_C}+1);` },
    { id: opId(AZT_OpCode.SUPER_LOADK_MUL), body: `${m_R}[${m_A}]=${m_R}[${m_B}]*${m_getK}(${m_C}+1);` },
    {
      id: opId(AZT_OpCode.SUPER_LOADK_CALL1),
      body: `local _rs=${m_tPack}(${m_R}[${m_A}](${m_getK}(${m_B}+1)));for _j=1,${m_C} do ${m_R}[${m_A}+_j-1]=_rs[_j];end;`,
    },
    {
      id: opId(AZT_OpCode.SUPER_MOVE_CALL),
      body: `${m_R}[${m_A}+1]=${m_R}[${m_D}];local _ag=${m_tCreate}(${m_B});for _j=1,${m_B} do _ag[_j]=${m_R}[${m_A}+_j];end;local _rs=${m_tPack}(${m_R}[${m_A}](${m_tUnpack}(_ag,1,${m_B})));for _j=1,${m_C} do ${m_R}[${m_A}+_j-1]=_rs[_j];end;`,
    },
    {
      id: opId(AZT_OpCode.SUPER_SELF_CALL),
      body: `local _o=${m_R}[${m_B}];local _rs=${m_tPack}(_o[${m_getK}(${m_C}+1)](_o));for _j=1,${m_D} do ${m_R}[${m_A}+_j-1]=_rs[_j];end;`,
    },
    { id: opId(AZT_OpCode.SUPER_LOADK_RET), body: `return ${m_getK}(${m_B}+1);` },
    {
      id: opId(AZT_OpCode.SUPER_RICE_GUARD),
      body: `${m_rice}=(${m_rice}+${m_A}*${m_B})%65521;if not (${vmRiceGuardExpr}) then return;end;`,
    },
  ];

  // Inject 48 Polymorphic Honey-Pot VM Opcodes into unused IDs (anti-devirtualization & dense binary tree!)
  const usedIds = new Set(vmCases.map((c) => c.id));
  const freeIds = rng.shuffle(Array.from({ length: 256 }, (_, i) => i).filter((id) => !usedIds.has(id)));
  for (let h = 0; h < freeIds.length; h++) {
    const mode = h % 6;
    const k1 = rng.int(11, 241);
    const k2 = rng.int(17, 251);
    let body: string;
    if (mode === 0) body = `${m_rice}=(${m_bit}.bxor(${m_rice},${k1})+${m_A}*${k2})%65521;${m_R}[${m_A}]=${m_bit}.bxor(${m_B},${m_C});`;
    else if (mode === 1) body = `local _z=${m_R}[${m_B}];if _z~=nil then ${m_R}[${m_A}]=_z;${m_PC}+=${m_D};end;`;
    else if (mode === 2) body = `${m_R}[${m_A}]=${m_bit}.band(${m_bit}.bxor(${m_rice},${m_B}),${k2});${m_rice}=(${m_rice}+${k1})%65521;`;
    else if (mode === 3) body = `local _q=${m_getK}(${m_B}+1);if ${m_type}(_q)=="number" then ${m_R}[${m_A}]=_q*${k1}+${k2};end;`;
    else if (mode === 4) body = `local _t=${m_R}[${m_B}];if ${m_type}(_t)=="table" then ${m_R}[${m_A}]=_t[${m_C}];else ${m_PC}+=0;end;`;
    else body = `${m_rice}=${m_bit}.rrotate(${m_bit}.bxor(${m_rice},${k1}),${(h % 7) + 1})%65521;if ${m_C}==${k2} then return;end;`;
    vmCases.push({ id: freeIds[h], body });
  }

  const vmDispatchTree = cff.buildDispatchTree(m_op, vmCases, true);
  const cffGenesisExpr = cff.buildGenesisCFF(sym.cffInitSeed, sym.cffKeys, m_bit);

  const vmFnCode = `function(${m_self},${m_proto},${m_env},${m_upvals},${m_lazyFn},${m_hb}) `
    + `local ${m_tCreate},${m_tPack},${m_tUnpack},${m_bit},${m_floor},${m_type},${m_exec}=`
    + `${AZT_FormatTableAccess(m_self, K_TBL_CREATE)},${AZT_FormatTableAccess(m_self, K_TBL_PACK)},${AZT_FormatTableAccess(m_self, K_TBL_UNPACK)},${AZT_FormatTableAccess(m_self, K_BIT32)},${AZT_FormatTableAccess(m_self, K_FLOOR)},${AZT_FormatTableAccess(m_self, K_TYPE)},${AZT_FormatTableAccess(m_self, K_VM)};`
    + `local _cv=${cffGenesisExpr};\nlocal ${m_opMask}=${m_bit}.band(${m_bit}.bxor(${m_hb},_cv,${sym.hbMaskConst}),255);`
    + `local ${m_K},${m_I},${m_P}=${m_proto}[5],${m_proto}[6],${m_proto}[7];`
    + `local function ${m_getK}(_idx) local _v=${m_K}[_idx];if ${m_type}(_v)=="table" and _v[1]==${lazyTag} then _v=${m_lazyFn}(_v);${m_K}[_idx]=_v;end;return _v;end;`
    + `return function(...) `
    + `local ${m_R}=${m_tCreate}(${m_proto}[3]);local _ap=${m_tPack}(...);local _np=${m_proto}[1];`
    + `for _i=1,_np do ${m_R}[_i-1]=_ap[_i];end;`
    + `local _va={};if _ap.n>_np then for _i=1,_ap.n-_np do _va[_i]=_ap[_np+_i];end;end;`
    + `local ${m_PC},${m_rice}=1,(${m_hb}%65521)+17;`
    + `while true do `
    + `local ${m_ins}=${m_I}[${m_PC}];if not ${m_ins} then return;end;${m_PC}+=1;`
    + `local ${m_op},${m_A},${m_B},${m_C},${m_D}=${m_bit}.bxor(${m_ins}[1],${m_opMask}),${m_ins}[2],${m_ins}[3],${m_ins}[4],${m_ins}[5];`
    + `${vmDispatchTree} `
    + `end;end;end`;

  // ── LAYER 5: Entry Bootstrapper ────────────────────────────────────────────
  const e_self = v();
  const e_env = v();
  const e_cs = v();
  const e_vt = v();
  const e_wmH = v();
  const e_mk = v();
  const e_vSd = v();
  const e_lazy = v();
  const e_proto = v();
  const e_hb = v();

  const entryFnCode = `function(${e_self}) `
    + `local ${e_env}=${AZT_FormatTableAccess(e_self, K_GETFENV)} and ${AZT_FormatTableAccess(e_self, K_GETFENV)}(0) or _ENV;`
    + `local ${e_cs}=${AZT_FormatTableAccess(e_self, K_CRYPTO)}(${e_self});`
    + `local ${e_vt},${e_wmH}=${AZT_FormatTableAccess(e_self, K_BOOTVM)}(${e_self},${e_env},${e_cs});`
    + `local ${e_mk},${e_vSd},${e_lazy}=${e_cs}[9](${e_vt},${e_wmH});`
    + `local ${e_proto},${e_hb}=${AZT_FormatTableAccess(e_self, K_DECODE)}(${e_self},${AZT_FormatTableAccess(e_self, K_PAYLOAD)},${e_cs},${e_mk},${e_vSd});`
    + `return ${AZT_FormatTableAccess(e_self, K_VM)}(${e_self},${e_proto},${e_env},{},${e_lazy},${e_hb});`
    + `end`;

  // ── LAYER 6: 3 Framed Payloads (ALL [[#AZT^...^AZURE#]]) ───────────────────
  const fmtDict = (d: Record<string, string>): string =>
    Object.entries(d).map(([tok, val]) => `[${AZT_LuauStr(tok)}]=${AZT_LuauStr(val)}`).join(",");

  const payloadBlock = [
    `${AZT_FormatTableKey(K_PAYLOAD)}=[[${payload.encoded}]]`,
    `${AZT_FormatTableKey(K_DICT)}={${fmtDict(payload.dict)}}`,
    `${AZT_FormatTableKey(K_BOOT_PAYLOAD)}=[[${sym.bootEncoded}]]`,
    `${AZT_FormatTableKey(K_BOOT_DICT)}={${fmtDict(sym.bootDict)}}`,
    `${AZT_FormatTableKey(K_BOOT_KEY)}={${sym.bootRc4Key.join(",")}}`,
    `${AZT_FormatTableKey(K_VAULT_PAYLOAD)}=[[${sym.vaultEncoded}]]`,
    `${AZT_FormatTableKey(K_VAULT_DICT)}={${fmtDict(sym.vaultDict)}}`,
    `${AZT_FormatTableKey(K_B85_ALPHA)}=${AZT_LuauStr(AZT_B85_ALPHABET)}`,
    `${AZT_FormatTableKey(K_PATTERN)}=${AZT_LuauStr('[ !"~}]')}`,
    `${AZT_FormatTableKey(K_SBOX)}={${payload.invSBox.join(",")}}`,
    `${AZT_FormatTableKey(K_MKEY)}={${sym.maskedMasterKey.join(",")}}`,
    `${AZT_FormatTableKey(K_SHA_K)}={${SHA256_K_LIST.join(",")}}`,
    `${AZT_FormatTableKey(K_WM)}={${wmEncBytes.join(",")}}`,
    `${AZT_FormatTableKey(K_TAMPER_MSG)}={${tamperEncBytes.join(",")}}`,
  ];

  const apiEntries = [
    `${AZT_FormatTableKey(K_BUF_FROM)}=buffer.fromstring`,
    `${AZT_FormatTableKey(K_BUF_CREATE)}=buffer.create`,
    `${AZT_FormatTableKey(K_BUF_RU8)}=buffer.readu8`,
    `${AZT_FormatTableKey(K_BUF_RU16)}=buffer.readu16`,
    `${AZT_FormatTableKey(K_BUF_RU32)}=buffer.readu32`,
    `${AZT_FormatTableKey(K_BUF_RF64)}=buffer.readf64`,
    `${AZT_FormatTableKey(K_BUF_WU8)}=buffer.writeu8`,
    `${AZT_FormatTableKey(K_BUF_WU32)}=buffer.writeu32`,
    `${AZT_FormatTableKey(K_BUF_COPY)}=buffer.copy`,
    `${AZT_FormatTableKey(K_BUF_STR)}=buffer.tostring`,
    `${AZT_FormatTableKey(K_TBL)}=table`,
    `${AZT_FormatTableKey(K_TBL_CREATE)}=table.create`,
    `${AZT_FormatTableKey(K_TBL_CONCAT)}=table.concat`,
    `${AZT_FormatTableKey(K_TBL_PACK)}=table.pack`,
    `${AZT_FormatTableKey(K_TBL_UNPACK)}=table.unpack`,
    `${AZT_FormatTableKey(K_STR_SUB)}=string.sub`,
    `${AZT_FormatTableKey(K_STR_GSUB)}=string.gsub`,
    `${AZT_FormatTableKey(K_STR_CHAR)}=string.char`,
    `${AZT_FormatTableKey(K_STR_BYTE)}=string.byte`,
    `${AZT_FormatTableKey(K_BIT32)}=bit32`,
    `${AZT_FormatTableKey(K_PRINT)}=print`,
    `${AZT_FormatTableKey(K_FLOOR)}=math.floor`,
    `${AZT_FormatTableKey(K_GETFENV)}=getfenv`,
    `${AZT_FormatTableKey(K_PCALL)}=pcall`,
    `${AZT_FormatTableKey(K_TONUMBER)}=tonumber`,
    `${AZT_FormatTableKey(K_ERROR)}=error`,
    `${AZT_FormatTableKey(K_TYPE)}=type`,
  ];

  const layers: { name: string; entries: string[] }[] = [
    { name: "BootVM", entries: [`${AZT_FormatTableKey(K_BOOTVM)}=${bootVmFnCode}`] },
    { name: "CryptoSuite", entries: [`${AZT_FormatTableKey(K_CRYPTO)}=${cryptoFnCode}`] },
    { name: "VM", entries: [`${AZT_FormatTableKey(K_VM)}=${vmFnCode}`] },
    { name: "Decode", entries: [`${AZT_FormatTableKey(K_DECODE)}=${decodeFnCode}`] },
    { name: "Payload", entries: rng.shuffle(payloadBlock) },
    { name: "Entry", entries: [`${AZT_FormatTableKey(K_ENTRY)}=${entryFnCode}`] },
    { name: "APIs", entries: rng.shuffle(apiEntries) },
  ];

  const orderedLayers = options.randomLayerOrder ? rng.shuffle(layers) : layers;
  const layerOrder = orderedLayers.map((l) => l.name);
  const allEntries = orderedLayers.flatMap((l) => l.entries);

  const entryCall = typeof K_ENTRY === "number" ? `([${K_ENTRY}])` : `:${K_ENTRY}()`;
  const header = options.headerComment
    ? `${options.headerComment}\n`
    : `-- AZT Obfuscator Azure Version : 1.0.0\n`;

  let bodyCode = `return setmetatable({${allEntries.join(",")}},{})${entryCall}(...)`;
  if (options.minify) {
    // Minify code to 1 single line while strictly preserving [[#AZT^...^AZURE#]] payload bytes untouched!
    const saved: string[] = [];
    bodyCode = bodyCode.replace(/\[\[#AZT\^[\s\S]*?\^AZURE#\]\]/g, (m) => {
      saved.push(m);
      return `__AZT_PL_${saved.length - 1}__`;
    });
    bodyCode = bodyCode.replace(/[\r\n]+/g, " ").replace(/;\s+/g, ";").replace(/\s+;/g, ";").replace(/ {2,}/g, " ").trim();
    bodyCode = bodyCode.replace(/__AZT_PL_(\d+)__/g, (_, idx) => saved[Number(idx)]);
  }
  const finalCode = `${header}${bodyCode}`;

  return {
    code: finalCode,
    layerOrder,
    opaquePredicatesInjected,
  };
}
