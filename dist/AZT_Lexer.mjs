// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Compiled & Lightly Obfuscated ESM Runtime
const AZT_0xAZU = 0x100A; void AZT_0xAZU;
// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — High-Speed Luau Lexer



const AZT_KEYWORDS = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for",
  "function", "if", "in", "local", "nil", "not", "or", "repeat",
  "return", "then", "true", "until", "while", "continue",
]);

export function AZT_LexLuau(source) {
  const tokens = [];
  const len = source.length;
  let i = 0;
  let line = 1;
  let col = 1;

  const advance = () => {
    const ch = source[i++];
    if (ch === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
    return ch;
  };

  const matchLongBracket = () => {
    if (source[i] !== "[") return -1;
    let j = i + 1;
    let eq = 0;
    while (j < len && source[j] === "=") {
      eq++;
      j++;
    }
    if (j < len && source[j] === "[") {
      return eq;
    }
    return -1;
  };

  const readLongString = (eqCount) => {
    // skip opening [=*[
    for (let k = 0; k < eqCount + 2; k++) advance();
    if (source[i] === "\r" && source[i + 1] === "\n") {
      advance();
      advance();
    } else if (source[i] === "\n") {
      advance();
    }
    const closing = "]" + "=".repeat(eqCount) + "]";
    let out = "";
    while (i < len) {
      if (source.startsWith(closing, i)) {
        for (let k = 0; k < closing.length; k++) advance();
        return out;
      }
      out += advance();
    }
    throw new Error(`AZT_Lexer: Unterminated long string at line ${line}`);
  };

  while (i < len) {
    const ch = source[i];

    // Whitespace
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n" || ch === "\f") {
      advance();
      continue;
    }

    // Comments: -- or --[=[ ... ]=]
    if (ch === "-" && source[i + 1] === "-") {
      advance();
      advance();
      const eq = matchLongBracket();
      if (eq >= 0) {
        readLongString(eq);
      } else {
        while (i < len && source[i] !== "\n") advance();
      }
      continue;
    }

    const startLine = line;
    const startCol = col;

    // Long string literal [=*[ ... ]=*]
    if (ch === "[") {
      const eq = matchLongBracket();
      if (eq >= 0) {
        const val = readLongString(eq);
        tokens.push({ type: "STRING", value: val, line: startLine, col: startCol });
        continue;
      }
    }

    // Quoted string literal
    if (ch === '"' || ch === "'") {
      const quote = advance();
      let str = "";
      while (i < len && source[i] !== quote) {
        if (source[i] === "\\") {
          advance();
          if (i >= len) break;
          const esc = advance();
          switch (esc) {
            case "n": str += "\n"; break;
            case "r": str += "\r"; break;
            case "t": str += "\t"; break;
            case "\\": str += "\\"; break;
            case '"': str += '"'; break;
            case "'": str += "'"; break;
            case "a": str += "\x07"; break;
            case "b": str += "\b"; break;
            case "f": str += "\f"; break;
            case "v": str += "\v"; break;
            case "0": str += "\0"; break;
            case "x": {
              const hex = source.slice(i, i + 2);
              if (/^[0-9a-fA-F]{2}$/.test(hex)) {
                advance(); advance();
                str += String.fromCharCode(parseInt(hex, 16));
              } else {
                str += "x";
              }
              break;
            }
            default:
              if (esc >= "0" && esc <= "9") {
                let numStr = esc;
                for (let k = 0; k < 2 && i < len && source[i] >= "0" && source[i] <= "9"; k++) {
                  numStr += advance();
                }
                str += String.fromCharCode(parseInt(numStr, 10) & 0xff);
              } else {
                str += esc;
              }
          }
        } else {
          str += advance();
        }
      }
      if (source[i] === quote) advance();
      tokens.push({ type: "STRING", value: str, line: startLine, col: startCol });
      continue;
    }

    // Numbers (decimal, hex 0x, binary 0b, scientific, underscores)
    if ((ch >= "0" && ch <= "9") || (ch === "." && source[i + 1] >= "0" && source[i + 1] <= "9")) {
      let num = "";
      if (ch === "0" && (source[i + 1] === "x" || source[i + 1] === "X")) {
        num += advance() + advance();
        while (i < len && /[0-9a-fA-F_]/.test(source[i])) num += advance();
      } else if (ch === "0" && (source[i + 1] === "b" || source[i + 1] === "B")) {
        num += advance() + advance();
        while (i < len && /[01_]/.test(source[i])) num += advance();
      } else {
        while (i < len && /[0-9_]/.test(source[i])) num += advance();
        if (source[i] === "." && source[i + 1] !== ".") {
          num += advance();
          while (i < len && /[0-9_]/.test(source[i])) num += advance();
        }
        if (source[i] === "e" || source[i] === "E") {
          num += advance();
          if (source[i] === "+" || source[i] === "-") num += advance();
          while (i < len && /[0-9_]/.test(source[i])) num += advance();
        }
      }
      tokens.push({ type: "NUMBER", value: num.replace(/_/g, ""), line: startLine, col: startCol });
      continue;
    }

    // Identifiers & Keywords
    if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_") {
      let ident = "";
      while (i < len && /[a-zA-Z0-9_]/.test(source[i])) ident += advance();
      const type = AZT_KEYWORDS.has(ident) ? "KEYWORD" : "IDENT";
      tokens.push({ type, value: ident, line: startLine, col: startCol });
      continue;
    }

    // Multi-char operators
    const three = source.slice(i, i + 3);
    if (three === "..." || three === "..=" || three === "//=") {
      advance(); advance(); advance();
      tokens.push({ type: "OP", value: three, line: startLine, col: startCol });
      continue;
    }

    const two = source.slice(i, i + 2);
    if (
      two === "==" || two === "~=" || two === "<=" || two === ">=" ||
      two === ".." || two === "//" || two === "::" ||
      two === "+=" || two === "-=" || two === "*=" || two === "/=" ||
      two === "%=" || two === "^=" || two === "->"
    ) {
      advance(); advance();
      tokens.push({ type: "OP", value: two, line: startLine, col: startCol });
      continue;
    }

    // Single-char operators & punctuation
    advance();
    if ("+-*/%^#=<>~".includes(ch)) {
      tokens.push({ type: "OP", value: ch, line: startLine, col: startCol });
    } else {
      tokens.push({ type: "PUNCT", value: ch, line: startLine, col: startCol });
    }
  }

  tokens.push({ type: "EOF", value: "", line, col });
  return tokens;
}
