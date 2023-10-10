import BN from 'bn.js';
import { Point } from 'circomlibjs';
import { ec as BabyJubCurveInterface } from 'elliptic';
import { BasePoint } from 'library/interfaces/BasePoint';
import { FFMathUtility } from './FFMathUtility';
type BabyJubCurvePoint = Point;
export { BabyJubCurveInterface, BabyJubCurvePoint };

export class BabyJubBasePoint implements BasePoint<BabyJubCurvePoint> {
  point: BabyJubCurvePoint;
  constructor(p: BabyJubCurvePoint) {
    this.point = p;
  }

  add(other: BabyJubBasePoint): BabyJubBasePoint {
    return new BabyJubBasePoint(
      FFMathUtility.addPoint(this.point, other.point),
    );
  }
  mul(k: BN): BasePoint<BabyJubCurvePoint> {
    return new BabyJubBasePoint(
      FFMathUtility.mulPointEscalar(this.point, k.toString()),
    );
  }
  getX(): BN {
    return new BN(FFMathUtility.F.toString(this.point[0], 10));
  }
  getY(): BN {
    return new BN(FFMathUtility.F.toString(this.point[1]));
  }
  eq(other: BabyJubBasePoint): boolean {
    return (
      this.point[0].toString() === other.point[0].toString() &&
      this.point[1].toString() === other.point[1].toString()
    );
  }
  getRawPoint(): BabyJubCurvePoint {
    return this.point;
  }
}
