import BN from 'bn.js';
import { ECCCurvePoint } from './BasePoint';
import { ECCPublicKeyInterface } from './ECCPublicKey';

export abstract class ECCPrivateKeyInterface<P extends ECCCurvePoint> {
  abstract toBN(): BN;
  abstract toHexString(): string;
  abstract clone(): ECCPrivateKeyInterface<P>;
  abstract toPublicKey(): ECCPublicKeyInterface<P>;
}
