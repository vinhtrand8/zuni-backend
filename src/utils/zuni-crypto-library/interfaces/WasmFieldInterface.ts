import { BigNumberish } from 'circomlibjs';

export interface WasmField1Interface {
  // ref: https://github.com/iden3/ffjavascript/blob/master/src/wasm_field1.js
  op2(opName: string, a: Uint8Array, b: Uint8Array): Uint8Array;
  op2Bool(opName: string, a: Uint8Array, b: Uint8Array): boolean;
  op1(opName: string, a: Uint8Array): Uint8Array;
  op1Bool(opName: string, a: Uint8Array): boolean;
  add(a: Uint8Array, b: Uint8Array): Uint8Array;
  eq(a: Uint8Array, b: Uint8Array): boolean;
  isZero(a: Uint8Array): boolean;
  sub(a: Uint8Array, b: Uint8Array): Uint8Array;
  neg(a: Uint8Array): Uint8Array;
  inv(a: Uint8Array): Uint8Array;
  toMontgomery(a: Uint8Array): Uint8Array;
  fromMontgomery(a: Uint8Array): Uint8Array;
  mul(a: Uint8Array, b: Uint8Array): Uint8Array;
  div(a: Uint8Array, b: Uint8Array): Uint8Array;
  square(a: Uint8Array): Uint8Array;
  isSquare(a: Uint8Array): boolean;
  sqrt(a: Uint8Array): Uint8Array;
  exp(a: Uint8Array, b: Uint8Array | number): Uint8Array;
  isNegative(a: Uint8Array): boolean;
  e(a: BigNumberish, b?: Uint8Array | number): Uint8Array;
  toString(a: BigNumberish, radix?: number): string;
  fromRng(rng: any): Uint8Array;
  random(): Uint8Array;
  toObject(a: Uint8Array): any;
  fromObject(a: any): Uint8Array;
  toRprLE(buff: Uint8Array, offset: number, a: Uint8Array): void;
  toRprBE(buff: Uint8Array, offset: number, a: Uint8Array): void;
  fromRprLE(buff: Uint8Array, offset?: number): Uint8Array;
  batchInverse(
    buffIn: Uint8Array[] | Uint8Array,
  ): Promise<Uint8Array[] | Uint8Array>;
}
export interface WasmField2Interface {
  op2(opName: string, a: number[], b: number[]): number[];
  op2Bool(opName: string, a: number[], b: number[]): boolean;
  op1(opName: string, a: number[]): number[];
  op1Bool(opName: string, a: number[]): boolean;
  add(a: number[], b: number[]): number[];
  eq(a: number[], b: number[]): boolean;
  isZero(a: number[]): boolean;
  sub(a: number[], b: number[]): number[];
  neg(a: number[]): number[];
}

export interface WasmField3Interface {
  op2(opName: string, a: number[], b: number[]): number[];
  op2Bool(opName: string, a: number[], b: number[]): boolean;
  op1(opName: string, a: number[]): number[];
  op1Bool(opName: string, a: number[]): boolean;
  add(a: number[], b: number[]): number[];
  eq(a: number[], b: number[]): boolean;
  isZero(a: number[]): boolean;
  sub(a: number[], b: number[]): number[];
  neg(a: number[]): number[];
}
export interface WasmCurveInterface {
  op2(opName: string, a: number[], b: number[]): number[];
  op2Bool(opName: string, a: number[], b: number[]): boolean;
  op1(opName: string, a: number[]): number[];
  op1Bool(opName: string, a: number[]): boolean;
  add(a: number[], b: number[]): number[];
  eq(a: number[], b: number[]): boolean;
  isZero(a: number[]): boolean;
  sub(a: number[], b: number[]): number[];
  neg(a: number[]): number[];
  double(a: number[]): number[];
  scalarMult(a: number[], b: number[]): number[];
  isOnCurve(x: number[], y: number[]): boolean;
}

export interface FFJavascriptCurve {
  q: string;
  r: string;
  name: string;
  tm: any;
  prePSize: number;
  preQSize: number;
  Fr: WasmField1Interface;
  F1: WasmField1Interface;
  F2: WasmField2Interface;
  G1: WasmCurveInterface;
  G2: WasmCurveInterface;
  F6: WasmField3Interface;
  F12: WasmField2Interface;
  Gt: WasmField2Interface;
  array2buffer(arr: Uint8Array[], sG: number): Uint8Array;
  buffer2array(buff: Uint8Array, sG: number): Uint8Array[];
}
