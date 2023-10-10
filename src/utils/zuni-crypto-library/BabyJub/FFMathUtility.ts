import { assert } from 'chai';
import {
  BabyJub,
  BigNumberish,
  buildBabyjub,
  buildPoseidon,
  Poseidon,
  SMT,
  SMTMemDb,
} from 'circomlibjs';
import { getCurveFromName } from 'ffjavascript';

import {
  FFJavascriptCurve,
  WasmField1Interface,
} from 'library/interfaces/WasmFieldInterface';
import { BabyJubCurvePoint } from './BabyJubBasePoint';

export class FFMathUtility {
  private static bn128Curve: FFJavascriptCurve;
  private static poseidon: Poseidon;
  public static F: WasmField1Interface;
  private static isInitialized = false;
  public static babyJub: BabyJub;
  static MAX_BABYJUB_PRIVATE_KEY_HEX_LENGTH = 64;

  static assertInitialized() {
    if (!FFMathUtility.isInitialized) {
      throw new Error('FFMathUtility is not initialized yet');
    }
  }

  static async initialize(): Promise<void> {
    if (!FFMathUtility.isInitialized || !FFMathUtility.bn128Curve) {
      // baby jub
      FFMathUtility.isInitialized = true;
      FFMathUtility.babyJub = await buildBabyjub();
      FFMathUtility.F = FFMathUtility.babyJub.F;
      // bn128 & SMT
      const bn128Curve: FFJavascriptCurve = await getCurveFromName(
        'bn128',
        true,
      );
      FFMathUtility.bn128Curve = bn128Curve;
      FFMathUtility.poseidon = await buildPoseidon();
    }
  }

  private static getHashes() {
    FFMathUtility.assertInitialized();
    return {
      hash0: function (left, right) {
        return FFMathUtility.poseidon([left, right]);
      },
      hash1: function (key, value) {
        return FFMathUtility.poseidon([
          key,
          value,
          (FFMathUtility.bn128Curve.Fr as any).one,
        ]);
      },
      F: FFMathUtility.bn128Curve.Fr,
    };
  }

  static toCircomFieldNumString(x: BigNumberish): string {
    return FFMathUtility.F.toString(FFMathUtility.F.e(x));
  }

  static async createSMT(): Promise<SMT> {
    const hashes = FFMathUtility.getHashes();
    const db = new SMTMemDb(hashes.F);
    const rt = await db.getRoot();
    const smt = new SMT(db, rt, hashes.hash0, hashes.hash1, hashes.F);
    return smt;
  }

  static PointToHex(p: BabyJubCurvePoint): string {
    assert.equal(p[0].length, 32);
    assert.equal(p[1].length, 32);
    const hexStr = [Array.from(p[0]), Array.from(p[1])]
      .flat()
      .map((byte: number) => byte.toString(16).padStart(4, '0'))
      .join('');

    return hexStr;
  }

  static PointFromHex(hexStr: string): BabyJubCurvePoint {
    assert.equal(hexStr.length, 256);
    const buffers = Array.from(hexStr)
      .map((_, index) =>
        index % 4 == 0 ? parseInt(hexStr.slice(index, index + 4), 16) : -1,
      )
      .filter((x) => x >= 0);
    return [
      new Uint8Array(buffers.slice(0, 32)),
      new Uint8Array(buffers.slice(32)),
    ];
  }

  // '995203441582195749578291179787384436505546430278305826713579947235728471134'
  // '5472060717959818805561601436314318772137091100104008585924551046643952123905'
  // BabyJub
  static getBabyJubGenerator(): BabyJubCurvePoint {
    FFMathUtility.assertInitialized();
    return FFMathUtility.babyJub.Base8;
  }
  static addPoint(a: BabyJubCurvePoint, b: BabyJubCurvePoint) {
    FFMathUtility.assertInitialized();
    return FFMathUtility.babyJub.addPoint(a, b);
  }

  static mulPointEscalar(
    base: BabyJubCurvePoint,
    e: BigNumberish,
  ): BabyJubCurvePoint {
    FFMathUtility.assertInitialized();
    return FFMathUtility.babyJub.mulPointEscalar(base, e);
  }

  static inSubgroup(point: BabyJubCurvePoint): boolean {
    FFMathUtility.assertInitialized();
    return FFMathUtility.babyJub.inSubgroup(point);
  }

  static inCurve(point: BabyJubCurvePoint): boolean {
    FFMathUtility.assertInitialized();
    return FFMathUtility.babyJub.inCurve(point);
  }

  static packPoint(point: BabyJubCurvePoint): Uint8Array {
    FFMathUtility.assertInitialized();
    return FFMathUtility.babyJub.packPoint(point);
  }

  static unpackPoint(buff: Uint8Array): BabyJubCurvePoint {
    FFMathUtility.assertInitialized();
    return FFMathUtility.babyJub.unpackPoint(buff);
  }
}
