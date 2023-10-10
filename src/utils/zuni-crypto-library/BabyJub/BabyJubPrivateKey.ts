import BN from 'bn.js';
import { Validate } from 'class-validator';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { ECCPrivateKeyInterface } from 'library/interfaces/ECCPrivateKey';
import { IsHexadecimalWithoutPrefix } from 'library/interfaces/IsHexadecimalWithoutPrefix';
import { BabyJubCurvePoint } from './BabyJubBasePoint';
import { BabyJubPublicKey } from './BabyJubPublicKey';
import { FFMathUtility } from './FFMathUtility';

export class BabyJubPrivateKey
  extends BaseClassValidator<BabyJubPrivateKey>
  implements ECCPrivateKeyInterface<BabyJubCurvePoint>
{
  @Validate(IsHexadecimalWithoutPrefix)
  // @Length(50, 64)
  privateKey: string;

  constructor(privateKey: string) {
    super({ privateKey });
    this.privateKey = privateKey;
  }

  toBN(): BN {
    return new BN(this.privateKey, 'hex');
  }

  toHexString(): string {
    return this.privateKey;
  }

  clone(): BabyJubPrivateKey {
    return new BabyJubPrivateKey(this.privateKey);
  }

  toPublicKey(): BabyJubPublicKey {
    const g = FFMathUtility.getBabyJubGenerator();
    const publicKeyString = FFMathUtility.PointToHex(
      FFMathUtility.mulPointEscalar(g, this.toBN().toString(10)),
    );
    return new BabyJubPublicKey(publicKeyString);
  }
}
