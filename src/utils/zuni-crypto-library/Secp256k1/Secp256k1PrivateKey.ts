import BN from 'bn.js';
import { Length, Validate } from 'class-validator';
import { ec as EC } from 'elliptic';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { ECCPrivateKeyInterface } from 'library/interfaces/ECCPrivateKey';
import { ECCPublicKeyInterface } from 'library/interfaces/ECCPublicKey';
import { IsHexadecimalWithoutPrefix } from 'library/interfaces/IsHexadecimalWithoutPrefix';
import { Secp256k1Curve, Secp256k1CurvePoint } from './Secp256k1BasePoint';
import { Secp256k1PublicKey } from './Secp256k1PublicKey';

const ec: EC = new EC('secp256k1');

export class Secp256k1PrivateKey
  extends BaseClassValidator<Secp256k1PrivateKey>
  implements ECCPrivateKeyInterface<Secp256k1CurvePoint>
{
  @Validate(IsHexadecimalWithoutPrefix)
  @Length(50, 64)
  privateKey: string;

  constructor(privateKey: string) {
    super({ privateKey });
    this.privateKey = privateKey;
  }

  toBN(): BN {
    return ec.keyFromPrivate(this.privateKey).getPrivate();
  }

  toHexString(): string {
    return this.privateKey;
  }

  clone(): Secp256k1PrivateKey {
    return new Secp256k1PrivateKey(this.privateKey);
  }
  toPublicKey(): ECCPublicKeyInterface<Secp256k1CurvePoint> {
    const publicKeyString = Secp256k1Curve.g
      .mul(ec.keyFromPrivate(this.privateKey).getPrivate())
      .encode('hex', false);
    return new Secp256k1PublicKey(publicKeyString);
  }
}
