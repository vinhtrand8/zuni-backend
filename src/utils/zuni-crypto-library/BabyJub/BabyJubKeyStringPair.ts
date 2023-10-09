import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { ECCKeyStringPair } from 'library/interfaces/ECCKeyStringPair';
import { ECCPrivateKeyInterface } from 'library/interfaces/ECCPrivateKey';
import { ECCPublicKeyInterface } from 'library/interfaces/ECCPublicKey';
import { BabyJubCurvePoint } from './BabyJubBasePoint';
import { BabyJubPrivateKey } from './BabyJubPrivateKey';
import { BabyJubPublicKey } from './BabyJubPublicKey';

export class BabyJubKeyStringPair
  extends BaseClassValidator<BabyJubKeyStringPair>
  implements ECCKeyStringPair<BabyJubCurvePoint>
{
  privateKey: BabyJubPrivateKey;
  publicKey: BabyJubPublicKey;

  constructor(data: {
    privateKey: BabyJubPrivateKey;
    publicKey: BabyJubPublicKey;
  }) {
    super(data);
    this.privateKey = data.privateKey;
    this.publicKey = data.publicKey;
  }

  getPublicKey(): ECCPublicKeyInterface<BabyJubCurvePoint> {
    return this.publicKey.clone();
  }

  getPrivateKey(): ECCPrivateKeyInterface<BabyJubCurvePoint> {
    return this.privateKey;
  }

  clone(): BabyJubKeyStringPair {
    return new BabyJubKeyStringPair({
      publicKey: this.publicKey.clone(),
      privateKey: this.privateKey.clone(),
    });
  }
}
