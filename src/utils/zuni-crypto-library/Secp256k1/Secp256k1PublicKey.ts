import BN from 'bn.js';
import { Length, Validate } from 'class-validator';
import { ec as EC } from 'elliptic';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { BasePoint } from 'library/interfaces/BasePoint';
import { ECCPublicKeyInterface } from 'library/interfaces/ECCPublicKey';
import { IsHexadecimalWithoutPrefix } from 'library/interfaces/IsHexadecimalWithoutPrefix';
import { Secp256k1BasePoint, Secp256k1CurvePoint } from './Secp256k1BasePoint';
const ec: EC = new EC('secp256k1');

export class Secp256k1PublicKey
  extends BaseClassValidator<Secp256k1PublicKey>
  implements ECCPublicKeyInterface<Secp256k1CurvePoint>
{
  @Validate(IsHexadecimalWithoutPrefix)
  @Length(129, 130)
  publicKey: string;

  constructor(publicKey: string) {
    super({ publicKey });
    this.publicKey = publicKey;
  }

  toCurvePoint(): Secp256k1CurvePoint {
    return ec.keyFromPublic(this.publicKey, 'hex').getPublic();
  }
  toBasePoint(): BasePoint<Secp256k1CurvePoint> {
    return new Secp256k1BasePoint(this.toCurvePoint());
  }

  toVoterId(): string {
    const p = this.toCurvePoint();
    return p.getX().mul(p.getY()).add(p.getX().add(p.getY())).toString(10);
  }

  toHexString(): string {
    return this.publicKey;
  }

  clone(): Secp256k1PublicKey {
    return new Secp256k1PublicKey(this.publicKey);
  }

  getX(): BN {
    return this.toCurvePoint().getX();
  }

  getY(): BN {
    return this.toCurvePoint().getY();
  }
}
