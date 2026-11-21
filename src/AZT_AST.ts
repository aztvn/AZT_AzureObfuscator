// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — Luau VM AST Parser

import { AZT_Expr, AZT_Stmt, AZT_Token } from "./AZT_Types.js";
import { AZT_LexLuau } from "./AZT_Lexer.js";

const AZT_BIN_PREC: Record<string, [number, number]> = {
  "or": [1, 1],
  "and": [2, 2],
  "<": [3, 3], ">": [3, 3], "<=": [3, 3], ">=": [3, 3], "~=": [3, 3], "==": [3, 3],
  "..": [5, 4], // right-associative
  "+": [6, 6], "-": [6, 6],
  "*": [7, 7], "/": [7, 7], "//": [7, 7], "%": [7, 7],
  "^": [10, 9], // right-associative
};

const AZT_COMPOUND_OPS = new Set(["+=", "-=", "*=", "/=", "//=", "%=", "^=", "..="]);

export class AZT_Parser {
  private readonly tokens: AZT_Token[];
  private pos = 0;

  constructor(source: string) {
    this.tokens = AZT_LexLuau(source);
  }

  private peek(offset = 0): AZT_Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private next(): AZT_Token {
    return this.tokens[this.pos++];
  }

  private check(value: string, type?: string): boolean {
    const t = this.peek();
    return t.value === value && (!type || t.type === type);
  }

  private match(value: string): boolean {
    if (this.peek().value === value) {
      this.pos++;
      return true;
    }
    return false;
  }

  private expect(value: string): AZT_Token {
    const t = this.next();
    if (t.value !== value) {
      throw new Error(`AZT_Parser: Expected '${value}' but got '${t.value}' at line ${t.line}:${t.col}`);
    }
    return t;
  }

  /** Skip optional Luau type annotation `: Type` */
  private skipTypeAnnotation(): void {
    if (!this.match(":")) return;
    let depth = 0;
    while (this.peek().type !== "EOF") {
      const v = this.peek().value;
      if (v === "(" || v === "{" || v === "<") {
        depth++;
        this.next();
        continue;
      }
      if (v === ")" || v === "}" || v === ">") {
        if (depth === 0) break;
        depth--;
        this.next();
        continue;
      }
      if (depth === 0 && (v === "=" || v === "," || v === ")" || v === "in" || v === "do" || v === "then")) {
        break;
      }
      this.next();
      if (depth === 0) {
        const nxt = this.peek().value;
        if (nxt !== "|" && nxt !== "&" && nxt !== "?" && nxt !== "." && nxt !== "<" && nxt !== "->") {
          break;
        }
      }
    }
  }

  public parseChunk(): AZT_Stmt[] {
    const body = this.parseBlock(new Set(["EOF"]));
    return body;
  }

  private parseBlock(stopKeywords: Set<string>): AZT_Stmt[] {
    const stmts: AZT_Stmt[] = [];
    while (this.peek().type !== "EOF") {
      if (stopKeywords.has(this.peek().value)) break;
      if (this.match(";")) continue;
      stmts.push(this.parseStmt());
      this.match(";");
    }
    return stmts;
  }

  private parseStmt(): AZT_Stmt {
    const t = this.peek();

    if (t.type === "KEYWORD") {
      switch (t.value) {
        case "local": return this.parseLocal();
        case "function": return this.parseFunctionDecl();
        case "if": return this.parseIfStmt();
        case "while": return this.parseWhileStmt();
        case "repeat": return this.parseRepeatStmt();
        case "for": return this.parseForStmt();
        case "do": {
          this.next();
          const body = this.parseBlock(new Set(["end"]));
          this.expect("end");
          return { kind: "DoBlock", body };
        }
        case "return": {
          this.next();
          const values: AZT_Expr[] = [];
          const nxt = this.peek();
          if (
            nxt.type !== "EOF" &&
            nxt.value !== ";" &&
            nxt.value !== "end" &&
            nxt.value !== "else" &&
            nxt.value !== "elseif" &&
            nxt.value !== "until"
          ) {
            values.push(this.parseExpr());
            while (this.match(",")) values.push(this.parseExpr());
          }
          return { kind: "ReturnStmt", values };
        }
        case "break":
          this.next();
          return { kind: "BreakStmt" };
        case "continue":
          this.next();
          return { kind: "ContinueStmt" };
      }
    }

    // Luau `type Foo = ...` or `export type Foo = ...` — skip cleanly
    if (
      (t.type === "IDENT" && t.value === "type" && this.peek(1).type === "IDENT" && this.peek(2).value === "=") ||
      (t.type === "IDENT" && t.value === "export" && this.peek(1).value === "type")
    ) {
      while (this.peek().type !== "EOF" && this.peek().line === t.line) this.next();
      return { kind: "DoBlock", body: [] };
    }

    // Expression statement: Call, Assignment, or Compound Assignment
    const first = this.parseSuffixedExpr();

    if (AZT_COMPOUND_OPS.has(this.peek().value)) {
      const op = this.next().value;
      const val = this.parseExpr();
      return { kind: "CompoundAssign", op, target: first, value: val };
    }

    if (this.check(",") || this.check("=")) {
      const targets: AZT_Expr[] = [first];
      while (this.match(",")) {
        targets.push(this.parseSuffixedExpr());
      }
      this.expect("=");
      const values: AZT_Expr[] = [this.parseExpr()];
      while (this.match(",")) values.push(this.parseExpr());
      return { kind: "Assign", targets, values };
    }

    return { kind: "CallStmt", expr: first };
  }

  private parseLocal(): AZT_Stmt {
    this.expect("local");
    if (this.match("function")) {
      const name = this.next().value;
      const { params, isVararg, body } = this.parseFuncBody();
      return { kind: "LocalFunction", name, params, isVararg, body };
    }
    const names: string[] = [];
    names.push(this.next().value);
    this.skipTypeAnnotation();
    while (this.match(",")) {
      names.push(this.next().value);
      this.skipTypeAnnotation();
    }
    const values: AZT_Expr[] = [];
    if (this.match("=")) {
      values.push(this.parseExpr());
      while (this.match(",")) values.push(this.parseExpr());
    }
    return { kind: "LocalDecl", names, values };
  }

  private parseFunctionDecl(): AZT_Stmt {
    this.expect("function");
    const nameParts: string[] = [this.next().value];
    while (this.match(".")) {
      nameParts.push(this.next().value);
    }
    let isMethod = false;
    if (this.match(":")) {
      isMethod = true;
      nameParts.push(this.next().value);
    }
    const { params, isVararg, body } = this.parseFuncBody();
    return { kind: "FunctionDecl", nameParts, isMethod, params, isVararg, body };
  }

  private parseFuncBody(): { params: string[]; isVararg: boolean; body: AZT_Stmt[] } {
    this.expect("(");
    const params: string[] = [];
    let isVararg = false;
    if (!this.check(")")) {
      while (true) {
        if (this.match("...")) {
          isVararg = true;
          this.skipTypeAnnotation();
          break;
        }
        params.push(this.next().value);
        this.skipTypeAnnotation();
        if (!this.match(",")) break;
      }
    }
    this.expect(")");
    this.skipTypeAnnotation(); // optional return type
    const body = this.parseBlock(new Set(["end"]));
    this.expect("end");
    return { params, isVararg, body };
  }

  private parseIfStmt(): AZT_Stmt {
    this.expect("if");
    const branches: { cond: AZT_Expr; body: AZT_Stmt[] }[] = [];
    const cond = this.parseExpr();
    this.expect("then");
    const body = this.parseBlock(new Set(["elseif", "else", "end"]));
    branches.push({ cond, body });

    while (this.match("elseif")) {
      const eCond = this.parseExpr();
      this.expect("then");
      const eBody = this.parseBlock(new Set(["elseif", "else", "end"]));
      branches.push({ cond: eCond, body: eBody });
    }

    let elseBody: AZT_Stmt[] | undefined;
    if (this.match("else")) {
      elseBody = this.parseBlock(new Set(["end"]));
    }
    this.expect("end");
    return { kind: "IfStmt", branches, elseBody };
  }

  private parseWhileStmt(): AZT_Stmt {
    this.expect("while");
    const cond = this.parseExpr();
    this.expect("do");
    const body = this.parseBlock(new Set(["end"]));
    this.expect("end");
    return { kind: "WhileStmt", cond, body };
  }

  private parseRepeatStmt(): AZT_Stmt {
    this.expect("repeat");
    const body = this.parseBlock(new Set(["until"]));
    this.expect("until");
    const cond = this.parseExpr();
    return { kind: "RepeatStmt", body, cond };
  }

  private parseForStmt(): AZT_Stmt {
    this.expect("for");
    const firstVar = this.next().value;
    this.skipTypeAnnotation();
    if (this.match("=")) {
      const start = this.parseExpr();
      this.expect(",");
      const limit = this.parseExpr();
      let step: AZT_Expr | undefined;
      if (this.match(",")) step = this.parseExpr();
      this.expect("do");
      const body = this.parseBlock(new Set(["end"]));
      this.expect("end");
      return { kind: "NumericFor", varName: firstVar, start, limit, step, body };
    }
    const vars = [firstVar];
    while (this.match(",")) {
      vars.push(this.next().value);
      this.skipTypeAnnotation();
    }
    this.expect("in");
    const iterators = [this.parseExpr()];
    while (this.match(",")) iterators.push(this.parseExpr());
    this.expect("do");
    const body = this.parseBlock(new Set(["end"]));
    this.expect("end");
    return { kind: "GenericFor", vars, iterators, body };
  }

  private parseExpr(minPrec = 1): AZT_Expr {
    let left: AZT_Expr;
    const t = this.peek();
    if ((t.type === "OP" && (t.value === "-" || t.value === "#")) || (t.type === "KEYWORD" && t.value === "not")) {
      const op = this.next().value;
      const arg = this.parseExpr(8); // unary precedence
      left = { kind: "UnaryOp", op, arg };
    } else {
      left = this.parseSimpleExpr();
    }

    while (true) {
      const bt = this.peek();
      const op = (bt.type === "OP" || bt.type === "KEYWORD") ? bt.value : "";
      const prec = AZT_BIN_PREC[op];
      if (!prec || prec[0] < minPrec) break;
      this.next();
      const right = this.parseExpr(prec[1] + 1);
      left = { kind: "BinaryOp", op, left, right };
    }

    return left;
  }

  private parseSimpleExpr(): AZT_Expr {
    const t = this.peek();
    if (t.type === "NUMBER") {
      this.next();
      let val: number;
      if (t.value.startsWith("0b") || t.value.startsWith("0B")) {
        val = parseInt(t.value.slice(2), 2);
      } else {
        val = Number(t.value);
      }
      return { kind: "Number", value: val };
    }
    if (t.type === "STRING") {
      this.next();
      return { kind: "String", value: t.value };
    }
    if (t.type === "KEYWORD" && t.value === "nil") { this.next(); return { kind: "Nil" }; }
    if (t.type === "KEYWORD" && t.value === "true") { this.next(); return { kind: "Bool", value: true }; }
    if (t.type === "KEYWORD" && t.value === "false") { this.next(); return { kind: "Bool", value: false }; }
    if (t.type === "OP" && t.value === "...") { this.next(); return { kind: "Vararg" }; }
    if (t.type === "PUNCT" && t.value === "{") return this.parseTableCtor();
    if (t.type === "KEYWORD" && t.value === "function") {
      this.next();
      const { params, isVararg, body } = this.parseFuncBody();
      return { kind: "FunctionExpr", params, isVararg, body };
    }
    // Luau if-then-else expression
    if (t.type === "KEYWORD" && t.value === "if") {
      this.next();
      const cond = this.parseExpr();
      this.expect("then");
      const thenExpr = this.parseExpr();
      let elseExpr: AZT_Expr;
      if (this.check("elseif")) {
        // Desugar elseif chain into nested IfExpr
        const buildElseIf = (): AZT_Expr => {
          this.expect("elseif");
          const c = this.parseExpr();
          this.expect("then");
          const th = this.parseExpr();
          const el = this.check("elseif") ? buildElseIf() : (this.expect("else"), this.parseExpr());
          return { kind: "IfExpr", cond: c, thenExpr: th, elseExpr: el };
        };
        elseExpr = buildElseIf();
      } else {
        this.expect("else");
        elseExpr = this.parseExpr();
      }
      return { kind: "IfExpr", cond, thenExpr, elseExpr };
    }
    return this.parseSuffixedExpr();
  }

  private parsePrimaryExpr(): AZT_Expr {
    if (this.check("(", "PUNCT") && this.match("(")) {
      const expr = this.parseExpr();
      this.expect(")");
      return expr;
    }
    const t = this.next();
    if (t.type !== "IDENT") {
      throw new Error(`AZT_Parser: Unexpected token '${t.value}' at line ${t.line}:${t.col}`);
    }
    return { kind: "Ident", name: t.value };
  }

  private parseSuffixedExpr(): AZT_Expr {
    let expr = this.parsePrimaryExpr();
    while (true) {
      if (this.match(".")) {
        const field = this.next().value;
        expr = { kind: "MemberExpr", base: expr, field };
      } else if (this.match("[")) {
        const index = this.parseExpr();
        this.expect("]");
        expr = { kind: "IndexExpr", base: expr, index };
      } else if (this.match(":")) {
        const method = this.next().value;
        const args = this.parseCallArgs();
        expr = { kind: "MethodCallExpr", base: expr, method, args };
      } else if (this.check("(", "PUNCT") || this.check("{", "PUNCT") || this.peek().type === "STRING") {
        const args = this.parseCallArgs();
        expr = { kind: "CallExpr", callee: expr, args };
      } else {
        break;
      }
    }
    return expr;
  }

  private parseCallArgs(): AZT_Expr[] {
    if (this.check("(", "PUNCT") && this.match("(")) {
      const args: AZT_Expr[] = [];
      if (!this.check(")")) {
        args.push(this.parseExpr());
        while (this.match(",")) args.push(this.parseExpr());
      }
      this.expect(")");
      return args;
    }
    if (this.check("{")) return [this.parseTableCtor()];
    if (this.peek().type === "STRING") {
      const s = this.next().value;
      return [{ kind: "String", value: s }];
    }
    throw new Error(`AZT_Parser: Expected call arguments at line ${this.peek().line}`);
  }

  private parseTableCtor(): AZT_Expr {
    this.expect("{");
    const fields: { key?: AZT_Expr; value: AZT_Expr }[] = [];
    while (!this.check("}") && this.peek().type !== "EOF") {
      if (this.match("[")) {
        const key = this.parseExpr();
        this.expect("]");
        this.expect("=");
        const value = this.parseExpr();
        fields.push({ key, value });
      } else if (this.peek().type === "IDENT" && this.peek(1).value === "=") {
        const keyName = this.next().value;
        this.expect("=");
        const value = this.parseExpr();
        fields.push({ key: { kind: "String", value: keyName }, value });
      } else {
        const value = this.parseExpr();
        fields.push({ value });
      }
      if (!this.match(",") && !this.match(";")) break;
    }
    this.expect("}");
    return { kind: "TableCtor", fields };
  }
}

export function AZT_ParseLuau(source: string): AZT_Stmt[] {
  return new AZT_Parser(source).parseChunk();
}
