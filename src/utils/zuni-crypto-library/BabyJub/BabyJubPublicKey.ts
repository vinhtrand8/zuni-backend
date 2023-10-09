import BN from 'bn.js';
import { Validate } from 'class-validator';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { ECCPublicKeyInterface } from 'library/interfaces/ECCPublicKey';
import { IsHexadecimalWithoutPrefix } from 'library/interfaces/IsHexadecimalWithoutPrefix';
import { BabyJubBasePoint, BabyJubCurvePoint } from './BabyJubBasePoint';
import { FFMathUtility } from './FFMathUtility';

export class BabyJubPublicKey
  extends BaseClassValidator<BabyJubPublicKey>
  implements ECCPublicKeyInterface<BabyJubCurvePoint>
{
  @Validate(IsHexadecimalWithoutPrefix)
  // @Length(127, 130)
  publicKey: string;

  constructor(publicKey: string) {
    super({ publicKey });
    this.publicKey = publicKey;
  }

  toCurvePoint(): BabyJubCurvePoint {
    return FFMathUtility.PointFromHex(this.publicKey);
  }
  toBasePoint(): BabyJubBasePoint {
    return new BabyJubBasePoint(this.toCurvePoint());
  }

  toVoterId(): string {
    // TODO: @galin-chung-nguyen prevent FFjs field overflow
    const u = FFMathUtility.F.e(this.toCurvePoint()[0]);
    const v = FFMathUtility.F.e(this.toCurvePoint()[1]);

    const a = FFMathUtility.F.mul(u, v);
    const b = FFMathUtility.F.add(u, v);
    const c = FFMathUtility.F.add(a, b);
    return FFMathUtility.F.toString(c, 10);
  }

  toHexString(): string {
    return this.publicKey;
  }

  clone(): BabyJubPublicKey {
    return new BabyJubPublicKey(this.publicKey);
  }

  getX(): BN {
    return new BN(FFMathUtility.F.toString(this.toCurvePoint()[0]));
  }

  getY(): BN {
    return new BN(FFMathUtility.F.toString(this.toCurvePoint()[1]));
  }
}
