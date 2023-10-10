import { ECCCurvePoint } from './BasePoint';
import { ECCPrivateKeyInterface } from './ECCPrivateKey';
import { ECCPublicKeyInterface } from './ECCPublicKey';
export abstract class ECCKeyStringPair<P extends ECCCurvePoint> {
  abstract getPublicKey(): ECCPublicKeyInterface<P>;
  abstract getPrivateKey(): ECCPrivateKeyInterface<P>;
  abstract clone(): ECCKeyStringPair<P>;
}
