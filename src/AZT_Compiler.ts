// File Create by AZT Service : https://aztvn.top/discord
// AZT Obfuscator Azure Version 1.0.0 — VM AST to Register Bytecode Compiler
// Strips 100% of local variable names during register allocation.

import { AZT_Const, AZT_Expr, AZT_Instr, AZT_OpCode, AZT_Proto, AZT_Stmt } from "./AZT_Types.js";

interface AZT_LocalVar {
  name: string;
  reg: number;
  depth: number;
}

interface AZT_LoopCtx {
  breaks: number[];
  continues: number[];
  continueTarget?: number;
}

class AZT_FuncCompiler {
  public readonly parent: AZT_FuncCompiler | null;
  public readonly instructions: AZT_Instr[] = [];
  public readonly constants: AZT_Const[] = [];
  public readonly protos: AZT_Proto[] = [];
  public readonly upvalDesc: { inStack: boolean; idx: number }[] = [];
  private readonly upvalNames: string[] = [];

  private readonly locals: AZT_LocalVar[] = [];
  private scopeDepth = 0;
  private freeReg = 0;
  private maxStack = 2;
  private readonly loops: AZT_LoopCtx[] = [];
  private readonly constMap = new Map<string, number>();

  public numParams = 0;
  public isVararg = false;

  constructor(parent: AZT_FuncCompiler | null) {
    this.parent = parent;
  }

  private allocReg(): number {
    const r = this.freeReg++;
    if (this.freeReg > this.maxStack) this.maxStack = this.freeReg;
    return r;
  }

  private setFreeReg(r: number): void {
    this.freeReg = r;
    if (this.freeReg > this.maxStack) this.maxStack = this.freeReg;
  }

  private emit(op: AZT_OpCode, a = 0, b = 0, c = 0): number {
    const pc = this.instructions.length;
    this.instructions.push({ op, a, b, c });
    return pc;
  }

  private patchJump(pc: number, target?: number): void {
    const dest = target !== undefined ? target : this.instructions.length;
    // JMP stores relative signed offset: nextPC = pc + 1 + offset
    this.instructions[pc].b = dest - (pc + 1);
  }

  private addConst(c: AZT_Const): number {
    let key: string;
    if (c.type === "nil") key = "N";
    else if (c.type === "bool") key = c.value ? "B1" : "B0";
    else if (c.type === "number") key = "D:" + (Object.is(c.value, -0) ? "-0" : String(c.value));
    else key = "S:" + c.value;

    const existing = this.constMap.get(key);
    if (existing !== undefined) return existing;
    const idx = this.constants.length;
    this.constants.push(c);
    this.constMap.set(key, idx);
    return idx;
  }

  private declareLocal(name: string, reg?: number): number {
    const r = reg !== undefined ? reg : this.allocReg();
    this.locals.push({ name, reg: r, depth: this.scopeDepth });
    return r;
  }

  private resolveLocal(name: string): number {
    for (let i = this.locals.length - 1; i >= 0; i--) {
      if (this.locals[i].name === name) return this.locals[i].reg;
    }
    return -1;
  }

  private resolveUpvalue(name: string): number {
    if (!this.parent) return -1;
    const localReg = this.parent.resolveLocal(name);
    if (localReg !== -1) {
      return this.addUpvalue(name, true, localReg);
    }
    const parentUp = this.parent.resolveUpvalue(name);
    if (parentUp !== -1) {
      return this.addUpvalue(name, false, parentUp);
    }
    return -1;
  }

  private addUpvalue(name: string, inStack: boolean, idx: number): number {
    for (let i = 0; i < this.upvalNames.length; i++) {
      if (this.upvalNames[i] === name) return i;
    }
    const uIdx = this.upvalDesc.length;
    this.upvalNames.push(name);
    this.upvalDesc.push({ inStack, idx });
    return uIdx;
  }

  private pushScope(): void {
    this.scopeDepth++;
  }

  private popScope(): void {
    this.scopeDepth--;
    while (this.locals.length > 0 && this.locals[this.locals.length - 1].depth > this.scopeDepth) {
      this.locals.pop();
    }
    const topLocal = this.locals.length > 0 ? this.locals[this.locals.length - 1].reg + 1 : 0;
    this.freeReg = topLocal;
  }

  public compileBlock(stmts: AZT_Stmt[]): void {
    for (const s of stmts) {
      this.compileStmt(s);
    }
  }

  private compileStmt(stmt: AZT_Stmt): void {
    const savedFree = this.freeReg;

    switch (stmt.kind) {
      case "LocalDecl": {
        const count = stmt.names.length;
        const baseReg = this.freeReg;
        for (let i = 0; i < count; i++) {
          const r = this.allocReg();
          if (i < stmt.values.length) {
            this.compileExprInto(stmt.values[i], r);
          } else {
            this.emit(AZT_OpCode.LOADNIL, r, 0, 0);
          }
        }
        // Register local slots (names are ONLY used at compile-time and NEVER emitted!)
        for (let i = 0; i < count; i++) {
          this.declareLocal(stmt.names[i], baseReg + i);
        }
        return; // keep local regs allocated
      }

      case "LocalFunction": {
        const reg = this.declareLocal(stmt.name);
        const protoIdx = this.compileSubFunction(stmt.params, stmt.isVararg, stmt.body);
        this.emit(AZT_OpCode.CLOSURE, reg, protoIdx, 0);
        return;
      }

      case "FunctionDecl": {
        const params = stmt.isMethod ? ["self", ...stmt.params] : stmt.params;
        const protoIdx = this.compileSubFunction(params, stmt.isVararg, stmt.body);
        const fnReg = this.allocReg();
        this.emit(AZT_OpCode.CLOSURE, fnReg, protoIdx, 0);

        if (stmt.nameParts.length === 1) {
          this.compileStoreName(stmt.nameParts[0], fnReg);
        } else {
          let baseReg = this.allocReg();
          this.compileLoadName(stmt.nameParts[0], baseReg);
          for (let i = 1; i < stmt.nameParts.length - 1; i++) {
            const kIdx = this.addConst({ type: "string", value: stmt.nameParts[i] });
            this.emit(AZT_OpCode.GETFIELD, baseReg, baseReg, kIdx);
          }
          const lastKey = this.addConst({ type: "string", value: stmt.nameParts[stmt.nameParts.length - 1] });
          this.emit(AZT_OpCode.SETFIELD, baseReg, lastKey, fnReg);
        }
        this.setFreeReg(savedFree);
        return;
      }

      case "Assign": {
        const valRegs: number[] = [];
        for (const v of stmt.values) {
          const r = this.allocReg();
          this.compileExprInto(v, r);
          valRegs.push(r);
        }
        for (let i = 0; i < stmt.targets.length; i++) {
          const vReg = i < valRegs.length ? valRegs[i] : (() => {
            const nr = this.allocReg();
            this.emit(AZT_OpCode.LOADNIL, nr, 0, 0);
            return nr;
          })();
          this.compileAssignTarget(stmt.targets[i], vReg);
        }
        this.setFreeReg(savedFree);
        return;
      }

      case "CompoundAssign": {
        const binOp = stmt.op.slice(0, -1); // "+=" -> "+"
        const synthetic: AZT_Expr = { kind: "BinaryOp", op: binOp, left: stmt.target, right: stmt.value };
        const resReg = this.allocReg();
        this.compileExprInto(synthetic, resReg);
        this.compileAssignTarget(stmt.target, resReg);
        this.setFreeReg(savedFree);
        return;
      }

      case "CallStmt": {
        const r = this.allocReg();
        this.compileExprInto(stmt.expr, r, 0);
        this.setFreeReg(savedFree);
        return;
      }

      case "DoBlock": {
        this.pushScope();
        this.compileBlock(stmt.body);
        this.popScope();
        return;
      }

      case "IfStmt": {
        const endJumps: number[] = [];
        for (const br of stmt.branches) {
          const condReg = this.allocReg();
          this.compileExprInto(br.cond, condReg);
          // TEST: if not R[condReg] then jump
          this.emit(AZT_OpCode.TEST, condReg, 0, 0);
          const skipJump = this.emit(AZT_OpCode.JMP, 0, 0, 0);
          this.setFreeReg(savedFree);

          this.pushScope();
          this.compileBlock(br.body);
          this.popScope();

          endJumps.push(this.emit(AZT_OpCode.JMP, 0, 0, 0));
          this.patchJump(skipJump);
        }
        if (stmt.elseBody) {
          this.pushScope();
          this.compileBlock(stmt.elseBody);
          this.popScope();
        }
        for (const j of endJumps) this.patchJump(j);
        this.setFreeReg(savedFree);
        return;
      }

      case "WhileStmt": {
        const loopStart = this.instructions.length;
        const ctx: AZT_LoopCtx = { breaks: [], continues: [], continueTarget: loopStart };
        this.loops.push(ctx);

        const condReg = this.allocReg();
        this.compileExprInto(stmt.cond, condReg);
        this.emit(AZT_OpCode.TEST, condReg, 0, 0);
        const exitJmp = this.emit(AZT_OpCode.JMP, 0, 0, 0);
        this.setFreeReg(savedFree);

        this.pushScope();
        this.compileBlock(stmt.body);
        this.popScope();

        const backJmp = this.emit(AZT_OpCode.JMP, 0, 0, 0);
        this.patchJump(backJmp, loopStart);
        this.patchJump(exitJmp);

        for (const b of ctx.breaks) this.patchJump(b);
        for (const c of ctx.continues) this.patchJump(c, loopStart);
        this.loops.pop();
        this.setFreeReg(savedFree);
        return;
      }

      case "RepeatStmt": {
        const loopStart = this.instructions.length;
        const ctx: AZT_LoopCtx = { breaks: [], continues: [] };
        this.loops.push(ctx);

        this.pushScope();
        this.compileBlock(stmt.body);
        const condPC = this.instructions.length;
        for (const c of ctx.continues) this.patchJump(c, condPC);

        const condReg = this.allocReg();
        this.compileExprInto(stmt.cond, condReg);
        this.emit(AZT_OpCode.TEST, condReg, 0, 0);
        const backJmp = this.emit(AZT_OpCode.JMP, 0, 0, 0);
        this.patchJump(backJmp, loopStart);
        this.popScope();

        for (const b of ctx.breaks) this.patchJump(b);
        this.loops.pop();
        this.setFreeReg(savedFree);
        return;
      }

      case "NumericFor": {
        this.pushScope();
        const base = this.freeReg;
        const idxReg = this.allocReg();
        const limReg = this.allocReg();
        const stpReg = this.allocReg();
        const extReg = this.declareLocal(stmt.varName);

        this.compileExprInto(stmt.start, idxReg);
        this.compileExprInto(stmt.limit, limReg);
        if (stmt.step) {
          this.compileExprInto(stmt.step, stpReg);
        } else {
          const oneK = this.addConst({ type: "number", value: 1 });
          this.emit(AZT_OpCode.LOADK, stpReg, oneK, 0);
        }

        const prepPC = this.emit(AZT_OpCode.FORPREP, base, 0, 0);
        const bodyStart = this.instructions.length;

        const ctx: AZT_LoopCtx = { breaks: [], continues: [] };
        this.loops.push(ctx);

        this.compileBlock(stmt.body);

        const loopPC = this.instructions.length;
        for (const c of ctx.continues) this.patchJump(c, loopPC);
        this.patchJump(prepPC, loopPC);

        const forLoopPC = this.emit(AZT_OpCode.FORLOOP, base, 0, 0);
        this.patchJump(forLoopPC, bodyStart);

        for (const b of ctx.breaks) this.patchJump(b);
        this.loops.pop();
        this.popScope();
        this.setFreeReg(savedFree);
        void extReg;
        return;
      }

      case "GenericFor": {
        this.pushScope();
        const base = this.freeReg;
        const fnReg = this.allocReg();
        const stateReg = this.allocReg();
        const ctrlReg = this.allocReg();

        if (stmt.iterators.length === 1) {
          // Single call (e.g., pairs(t), ipairs(t)) produces up to 3 values into fnReg..ctrlReg
          this.compileExprInto(stmt.iterators[0], fnReg, 3);
        } else {
          this.compileExprInto(stmt.iterators[0], fnReg);
          if (stmt.iterators[1]) this.compileExprInto(stmt.iterators[1], stateReg);
          else this.emit(AZT_OpCode.LOADNIL, stateReg, 0, 0);
          if (stmt.iterators[2]) this.compileExprInto(stmt.iterators[2], ctrlReg);
          else this.emit(AZT_OpCode.LOADNIL, ctrlReg, 0, 0);
        }

        for (const v of stmt.vars) {
          this.declareLocal(v);
        }

        const loopStart = this.instructions.length;
        const ctx: AZT_LoopCtx = { breaks: [], continues: [], continueTarget: loopStart };
        this.loops.push(ctx);

        // TFORCALL base, numVars -> calls R[base](R[base+1], R[base+2]) into R[base+3 .. base+2+numVars]
        // If R[base+3] == nil, jumps out via next JMP; else sets R[base+2] = R[base+3]
        this.emit(AZT_OpCode.TFORCALL, base, stmt.vars.length, 0);
        const exitJmp = this.emit(AZT_OpCode.JMP, 0, 0, 0);

        this.compileBlock(stmt.body);

        const backJmp = this.emit(AZT_OpCode.JMP, 0, 0, 0);
        this.patchJump(backJmp, loopStart);
        this.patchJump(exitJmp);

        for (const b of ctx.breaks) this.patchJump(b);
        for (const c of ctx.continues) this.patchJump(c, loopStart);
        this.loops.pop();
        this.popScope();
        this.setFreeReg(savedFree);
        return;
      }

      case "BreakStmt": {
        const ctx = this.loops[this.loops.length - 1];
        if (!ctx) throw new Error("AZT_Compiler: 'break' outside loop");
        ctx.breaks.push(this.emit(AZT_OpCode.JMP, 0, 0, 0));
        return;
      }

      case "ContinueStmt": {
        const ctx = this.loops[this.loops.length - 1];
        if (!ctx) throw new Error("AZT_Compiler: 'continue' outside loop");
        ctx.continues.push(this.emit(AZT_OpCode.JMP, 0, 0, 0));
        return;
      }

      case "ReturnStmt": {
        if (stmt.values.length === 0) {
          this.emit(AZT_OpCode.RETURN, 0, 0, 0);
        } else {
          const base = this.freeReg;
          for (let i = 0; i < stmt.values.length; i++) {
            const r = this.allocReg();
            this.compileExprInto(stmt.values[i], r);
          }
          this.emit(AZT_OpCode.RETURN, base, stmt.values.length, 0);
        }
        this.setFreeReg(savedFree);
        return;
      }
    }
  }

  private compileLoadName(name: string, dest: number): void {
    const loc = this.resolveLocal(name);
    if (loc !== -1) {
      if (loc !== dest) this.emit(AZT_OpCode.MOVE, dest, loc, 0);
      return;
    }
    const up = this.resolveUpvalue(name);
    if (up !== -1) {
      this.emit(AZT_OpCode.GETUPVAL, dest, up, 0);
      return;
    }
    const kIdx = this.addConst({ type: "string", value: name });
    this.emit(AZT_OpCode.GETGLOBAL, dest, kIdx, 0);
  }

  private compileStoreName(name: string, srcReg: number): void {
    const loc = this.resolveLocal(name);
    if (loc !== -1) {
      if (loc !== srcReg) this.emit(AZT_OpCode.MOVE, loc, srcReg, 0);
      return;
    }
    const up = this.resolveUpvalue(name);
    if (up !== -1) {
      this.emit(AZT_OpCode.SETUPVAL, srcReg, up, 0);
      return;
    }
    const kIdx = this.addConst({ type: "string", value: name });
    this.emit(AZT_OpCode.SETGLOBAL, srcReg, kIdx, 0);
  }

  private compileAssignTarget(target: AZT_Expr, valReg: number): void {
    if (target.kind === "Ident") {
      this.compileStoreName(target.name, valReg);
    } else if (target.kind === "MemberExpr") {
      const baseReg = this.allocReg();
      this.compileExprInto(target.base, baseReg);
      const kIdx = this.addConst({ type: "string", value: target.field });
      this.emit(AZT_OpCode.SETFIELD, baseReg, kIdx, valReg);
    } else if (target.kind === "IndexExpr") {
      const baseReg = this.allocReg();
      const idxReg = this.allocReg();
      this.compileExprInto(target.base, baseReg);
      this.compileExprInto(target.index, idxReg);
      this.emit(AZT_OpCode.SETTABLE, baseReg, idxReg, valReg);
    } else {
      throw new Error(`AZT_Compiler: Invalid assignment target '${target.kind}'`);
    }
  }

  private compileSubFunction(params: string[], isVararg: boolean, body: AZT_Stmt[]): number {
    const sub = new AZT_FuncCompiler(this);
    sub.numParams = params.length;
    sub.isVararg = isVararg;
    for (const p of params) {
      sub.declareLocal(p);
    }
    sub.compileBlock(body);
    sub.emit(AZT_OpCode.RETURN, 0, 0, 0);
    const protoIdx = this.protos.length;
    this.protos.push(sub.toProto());
    return protoIdx;
  }

  private compileExprInto(expr: AZT_Expr, dest: number, numResults = 1): void {
    const savedFree = this.freeReg;

    switch (expr.kind) {
      case "Nil":
        this.emit(AZT_OpCode.LOADNIL, dest, 0, 0);
        return;

      case "Bool":
        this.emit(AZT_OpCode.LOADBOOL, dest, expr.value ? 1 : 0, 0);
        return;

      case "Number": {
        const k = this.addConst({ type: "number", value: expr.value });
        this.emit(AZT_OpCode.LOADK, dest, k, 0);
        return;
      }

      case "String": {
        const k = this.addConst({ type: "string", value: expr.value });
        this.emit(AZT_OpCode.LOADK, dest, k, 0);
        return;
      }

      case "Vararg":
        this.emit(AZT_OpCode.VARARG, dest, numResults, 0);
        return;

      case "Ident":
        this.compileLoadName(expr.name, dest);
        return;

      case "FunctionExpr": {
        const protoIdx = this.compileSubFunction(expr.params, expr.isVararg, expr.body);
        this.emit(AZT_OpCode.CLOSURE, dest, protoIdx, 0);
        return;
      }

      case "UnaryOp": {
        const argReg = this.allocReg();
        this.compileExprInto(expr.arg, argReg);
        const opMap: Record<string, AZT_OpCode> = {
          "-": AZT_OpCode.UNM,
          "not": AZT_OpCode.NOT,
          "#": AZT_OpCode.LEN,
        };
        this.emit(opMap[expr.op], dest, argReg, 0);
        this.setFreeReg(savedFree);
        return;
      }

      case "BinaryOp": {
        // Short-circuit logical operators
        if (expr.op === "and" || expr.op === "or") {
          this.compileExprInto(expr.left, dest);
          // TEST dest, 0, invert: if (op=='and' and falsy) or (op=='or' and truthy) then skip RHS
          this.emit(AZT_OpCode.TEST, dest, 0, expr.op === "or" ? 1 : 0);
          const skipJmp = this.emit(AZT_OpCode.JMP, 0, 0, 0);
          this.compileExprInto(expr.right, dest);
          this.patchJump(skipJmp);
          this.setFreeReg(savedFree);
          return;
        }

        const leftReg = this.allocReg();
        const rightReg = this.allocReg();
        this.compileExprInto(expr.left, leftReg);
        this.compileExprInto(expr.right, rightReg);

        switch (expr.op) {
          case "+": this.emit(AZT_OpCode.ADD, dest, leftReg, rightReg); break;
          case "-": this.emit(AZT_OpCode.SUB, dest, leftReg, rightReg); break;
          case "*": this.emit(AZT_OpCode.MUL, dest, leftReg, rightReg); break;
          case "/": this.emit(AZT_OpCode.DIV, dest, leftReg, rightReg); break;
          case "//": this.emit(AZT_OpCode.IDIV, dest, leftReg, rightReg); break;
          case "%": this.emit(AZT_OpCode.MOD, dest, leftReg, rightReg); break;
          case "^": this.emit(AZT_OpCode.POW, dest, leftReg, rightReg); break;
          case "..": this.emit(AZT_OpCode.CONCAT, dest, leftReg, rightReg); break;
          case "==": this.emit(AZT_OpCode.EQ, dest, leftReg, rightReg); break;
          case "~=":
            this.emit(AZT_OpCode.EQ, dest, leftReg, rightReg);
            this.emit(AZT_OpCode.NOT, dest, dest, 0);
            break;
          case "<": this.emit(AZT_OpCode.LT, dest, leftReg, rightReg); break;
          case "<=": this.emit(AZT_OpCode.LE, dest, leftReg, rightReg); break;
          case ">": this.emit(AZT_OpCode.LT, dest, rightReg, leftReg); break;
          case ">=": this.emit(AZT_OpCode.LE, dest, rightReg, leftReg); break;
          default:
            throw new Error(`AZT_Compiler: Unsupported binary op '${expr.op}'`);
        }
        this.setFreeReg(savedFree);
        return;
      }

      case "IfExpr": {
        const condReg = this.allocReg();
        this.compileExprInto(expr.cond, condReg);
        this.emit(AZT_OpCode.TEST, condReg, 0, 0);
        const elseJmp = this.emit(AZT_OpCode.JMP, 0, 0, 0);
        this.compileExprInto(expr.thenExpr, dest);
        const endJmp = this.emit(AZT_OpCode.JMP, 0, 0, 0);
        this.patchJump(elseJmp);
        this.compileExprInto(expr.elseExpr, dest);
        this.patchJump(endJmp);
        this.setFreeReg(savedFree);
        return;
      }

      case "MemberExpr": {
        const baseReg = this.allocReg();
        this.compileExprInto(expr.base, baseReg);
        const kIdx = this.addConst({ type: "string", value: expr.field });
        this.emit(AZT_OpCode.GETFIELD, dest, baseReg, kIdx);
        this.setFreeReg(savedFree);
        return;
      }

      case "IndexExpr": {
        const baseReg = this.allocReg();
        const idxReg = this.allocReg();
        this.compileExprInto(expr.base, baseReg);
        this.compileExprInto(expr.index, idxReg);
        this.emit(AZT_OpCode.GETTABLE, dest, baseReg, idxReg);
        this.setFreeReg(savedFree);
        return;
      }

      case "TableCtor": {
        let arrayCount = 0;
        let hashCount = 0;
        for (const f of expr.fields) {
          if (f.key) hashCount++; else arrayCount++;
        }
        this.emit(AZT_OpCode.NEWTABLE, dest, arrayCount, hashCount);

        let arrIdx = 1;
        for (const f of expr.fields) {
          if (f.key) {
            const kReg = this.allocReg();
            const vReg = this.allocReg();
            this.compileExprInto(f.key, kReg);
            this.compileExprInto(f.value, vReg);
            this.emit(AZT_OpCode.SETTABLE, dest, kReg, vReg);
            this.setFreeReg(savedFree);
          } else {
            const vReg = this.allocReg();
            this.compileExprInto(f.value, vReg);
            this.emit(AZT_OpCode.SETLIST, dest, arrIdx++, vReg);
            this.setFreeReg(savedFree);
          }
        }
        return;
      }

      case "CallExpr": {
        // Reserve contiguous call frame starting at callBase >= freeReg
        const callBase = Math.max(dest, this.freeReg);
        this.setFreeReg(callBase + 1 + expr.args.length);
        this.compileExprInto(expr.callee, callBase);
        for (let i = 0; i < expr.args.length; i++) {
          this.compileExprInto(expr.args[i], callBase + 1 + i);
        }
        this.emit(AZT_OpCode.CALL, callBase, expr.args.length, numResults);
        if (numResults > 0 && callBase !== dest) {
          for (let i = 0; i < numResults; i++) {
            this.emit(AZT_OpCode.MOVE, dest + i, callBase + i, 0);
          }
        }
        this.setFreeReg(savedFree);
        return;
      }

      case "MethodCallExpr": {
        const callBase = Math.max(dest, this.freeReg);
        this.setFreeReg(callBase + 2 + expr.args.length);
        const objReg = this.allocReg();
        this.compileExprInto(expr.base, objReg);
        const kIdx = this.addConst({ type: "string", value: expr.method });
        this.emit(AZT_OpCode.SELF, callBase, objReg, kIdx);
        for (let i = 0; i < expr.args.length; i++) {
          this.compileExprInto(expr.args[i], callBase + 2 + i);
        }
        this.emit(AZT_OpCode.CALL, callBase, expr.args.length + 1, numResults);
        if (numResults > 0 && callBase !== dest) {
          for (let i = 0; i < numResults; i++) {
            this.emit(AZT_OpCode.MOVE, dest + i, callBase + i, 0);
          }
        }
        this.setFreeReg(savedFree);
        return;
      }
    }
  }

  public toProto(): AZT_Proto {
    return {
      numParams: this.numParams,
      isVararg: this.isVararg,
      maxStackSize: Math.max(this.maxStack + 4, 8),
      numUpvalues: this.upvalDesc.length,
      upvalDesc: this.upvalDesc,
      constants: this.constants,
      instructions: this.instructions,
      protos: this.protos,
    };
  }
}

export function AZT_CompileAST(stmts: AZT_Stmt[]): AZT_Proto {
  const root = new AZT_FuncCompiler(null);
  root.isVararg = true;
  root.compileBlock(stmts);
  root.emit(AZT_OpCode.RETURN, 0, 0, 0);
  return root.toProto();
}
