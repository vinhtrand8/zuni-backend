import BN from 'bn.js';
import { curve, ec as Secp256k1CurveInterface } from 'elliptic';
import { BasePoint } from 'library/interfaces/BasePoint';
const ec: Secp256k1CurveInterface = new Secp256k1CurveInterface('secp256k1');
const Secp256k1Curve = ec;
type Secp256k1CurvePoint = curve.base.BasePoint;
export { Secp256k1Curve, Secp256k1CurveInterface, Secp256k1CurvePoint };

export class Secp256k1BasePoint implements BasePoint<Secp256k1CurvePoint> {
  point: curve.base.BasePoint;
  constructor(p: curve.base.BasePoint) {
    this.point = p;
  }
  add(other: Secp256k1BasePoint): Secp256k1BasePoint {
    return new Secp256k1BasePoint(this.point.add(other.point));
  }
  mul(k: BN): BasePoint<curve.base.BasePoint> {
    return new Secp256k1BasePoint(this.point.mul(k));
  }
  getX(): BN {
    return this.point.getX();
  }
  getY(): BN {
    return this.point.getY();
  }
  eq(other: Secp256k1BasePoint): boolean {
    return this.point.eq(other.point);
  }
  getRawPoint(): curve.base.BasePoint {
    return this.point;
  }
}
