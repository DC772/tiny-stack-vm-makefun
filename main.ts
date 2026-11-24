// Tiny stack VM for make.fun's tiny-stack-vm-01 ISA (ISA.md in the kit).
// Faithful port of the reference VM (generator/subject/vm.mjs): every trap
// code, limit and wrapping rule exactly as ISA.md states it, including the
// ones the house baseline plain-vm 1.0.0 skips (exact MUL via Math.imul,
// unsigned DIVU/MODU/LTU, INT_MIN/-1, shift masking, stack/call/memory
// bounds, step and output limits, traps 2-11 with output kept).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// [immediate bytes, pops, pushes] for each opcode, from ISA.md / vm.mjs.
function info(op: number): [number, number, number] | null {
  switch (op) {
    case 0x00: return [0, 0, 0]; // HALT
    case 0x01: return [1, 0, 1]; // PUSH8
    case 0x02: return [4, 0, 1]; // PUSH32
    case 0x03: return [0, 1, 0]; // POP
    case 0x04: return [0, 1, 2]; // DUP
    case 0x05: return [0, 2, 2]; // SWAP
    case 0x06: return [0, 2, 3]; // OVER
    case 0x07: return [0, 3, 3]; // ROT
    case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15:
    case 0x16: case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d:
    case 0x1e: case 0x20: case 0x21: case 0x22: return [0, 2, 1];
    case 0x17: case 0x1b: return [0, 1, 1]; // NEG, NOT
    case 0x30: return [2, 0, 0]; // JMP
    case 0x31: case 0x32: return [2, 1, 0]; // JZ, JNZ
    case 0x33: return [2, 0, 0]; // CALL
    case 0x34: return [0, 0, 0]; // RET
    case 0x40: return [0, 1, 1]; // LOAD
    case 0x41: return [0, 2, 0]; // STORE
    case 0x50: case 0x51: case 0x53: return [0, 1, 0]; // PRINT, PUTC, EXIT
    case 0x52: return [0, 0, 1]; // IN
    default: return null;
  }
}

function run(p: Uint8Array, inp: Uint8Array): { out: Uint8Array; code: number } {
  const D = new Int32Array(256);
  let sp = 0;
  const C = new Int32Array(64);
  let cp = 0;
  const M = new Int32Array(256);
  const out = new Uint8Array(65536);
  let ol = 0;
  let ip = 0;
  let pc = 0;
  let steps = 0;
  const done = (code: number): { out: Uint8Array; code: number } => ({ out: out.slice(0, ol), code });
  for (;;) {
    if (steps === 1000000) return done(10);
    if (pc < 0 || pc >= p.length) return done(9);
    const op = p[pc];
    const inf = info(op);
    if (inf === null) return done(5);
    const imm = inf[0];
    const pops = inf[1];
    const pushes = inf[2];
    if (pc + imm >= p.length) return done(9);
    steps++;
    const next = pc + 1 + imm;
    if (sp < pops) return done(2);
    if (sp - pops + pushes > 256) return done(3);
    pc = next;
    switch (op) {
      case 0x00: return done(0);
      case 0x01:
        D[sp++] = (p[next - 1] << 24) >> 24;
        break;
      case 0x02:
        D[sp++] = p[next - 4] | (p[next - 3] << 8) | (p[next - 2] << 16) | (p[next - 1] << 24);
        break;
      case 0x03: sp--; break;
      case 0x04: D[sp] = D[sp - 1]; sp++; break;
      case 0x05: { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; break; }
      case 0x06: D[sp] = D[sp - 2]; sp++; break;
      case 0x07: { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break; }
      case 0x17: D[sp - 1] = (-D[sp - 1]) | 0; break;
      case 0x1b: D[sp - 1] = ~D[sp - 1]; break;
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15:
      case 0x16: case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d:
      case 0x1e: case 0x20: case 0x21: case 0x22: {
        const b = D[sp - 1];
        const a = D[sp - 2];
        let r: number;
        if (op === 0x10) r = (a + b) | 0;
        else if (op === 0x11) r = (a - b) | 0;
        else if (op === 0x12) r = Math.imul(a, b);
        else if (op === 0x13) { if (b === 0) return done(4); r = a === -2147483648 && b === -1 ? a : (a / b) | 0; }
        else if (op === 0x14) { if (b === 0) return done(4); r = b === -1 ? 0 : (a % b) | 0; }
        else if (op === 0x15) { if (b === 0) return done(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
        else if (op === 0x16) { if (b === 0) return done(4); r = ((a >>> 0) % (b >>> 0)) | 0; }
        else if (op === 0x18) r = a & b;
        else if (op === 0x19) r = a | b;
        else if (op === 0x1a) r = a ^ b;
        else if (op === 0x1c) r = a << (b & 31);
        else if (op === 0x1d) r = a >> (b & 31);
        else if (op === 0x1e) r = (a >>> (b & 31)) | 0;
        else if (op === 0x20) r = a === b ? 1 : 0;
        else if (op === 0x21) r = a < b ? 1 : 0;
        else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        sp -= 2;
        D[sp++] = r;
        break;
      }
      case 0x30: case 0x31: case 0x32: {
        const rel = ((p[next - 2] | (p[next - 1] << 8)) << 16) >> 16;
        let take = true;
        if (op !== 0x30) { const v = D[--sp]; take = op === 0x31 ? v === 0 : v !== 0; }
        if (take) pc = next + rel;
        break;
      }
      case 0x33:
        if (cp === 64) return done(7);
        C[cp++] = next;
        pc = p[next - 2] | (p[next - 1] << 8);
        break;
      case 0x34:
        if (cp === 0) return done(8);
        pc = C[--cp];
        break;
      case 0x40: {
        const addr = D[sp - 1];
        if (addr < 0 || addr >= 256) return done(6);
        D[sp - 1] = M[addr];
        break;
      }
      case 0x41: {
        const addr = D[sp - 1];
        const v = D[sp - 2];
        if (addr < 0 || addr >= 256) return done(6);
        sp -= 2;
        M[addr] = v;
        break;
      }
      case 0x50: {
        // PRINT without allocating a string: write the decimal digits
        // straight into the output buffer. This matters because programs
        // that PRINT in a loop otherwise pay a String allocation per value.
        // a is a plain JS number here, so -(-2147483648) is exactly
        // 2147483648 and the digit loop below stays exact.
        let v = D[sp - 1];
        const neg = v < 0;
        const a = neg ? -v : v;
        let n = 0;
        let t = a;
        if (t === 0) n = 1;
        while (t > 0) { n++; t = Math.trunc(t / 10); }
        const len = n + (neg ? 1 : 0);
        if (ol + len > 65536) return done(11);
        sp--;
        let p = ol + len;
        let x = a;
        if (x === 0) out[--p] = 48;
        while (x > 0) { out[--p] = 48 + (x % 10); x = Math.trunc(x / 10); }
        if (neg) out[--p] = 45;
        ol += len;
        break;
      }
      case 0x51:
        if (ol + 1 > 65536) return done(11);
        out[ol++] = D[--sp] & 255;
        break;
      case 0x52:
        D[sp++] = ip < inp.length ? inp[ip++] : -1;
        break;
      case 0x53:
        return done(D[--sp] & 255);
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const r = run(new Uint8Array(readFileSync(join(I, id, 'program.bin'))), new Uint8Array(readFileSync(join(I, id, 'input.bin'))));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), `${r.code}\n`);
}
