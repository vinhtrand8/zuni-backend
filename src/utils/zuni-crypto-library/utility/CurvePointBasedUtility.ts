import { BabyJubUtility } from 'library/BabyJub/BabyJubUtility';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { InvalidContextError } from 'library/interfaces/InvalidContextError';
import { Secp256k1Utility } from 'library/Secp256k1/Secp256k1Utility';
import { BasePoint } from '../interfaces/BasePoint';

export class CurvePointBasedUtility {
  private static context: BasePoint<ECCCurvePoint> | null = null;

  static assertContextInitialized(): BasePoint<ECCCurvePoint> {
    if (!CurvePointBasedUtility.context) {
      throw new Error('Utility context is not initialized yet');
    }
    return CurvePointBasedUtility.context;
  }

  static initialize<P extends ECCCurvePoint>(context: BasePoint<P>) {
    CurvePointBasedUtility.context = context;
  }

  static init(curveName: string) {
    curveName = curveName.toLowerCase().trim();
    if (curveName == 'secp256k1') {
      CurvePointBasedUtility.context = Secp256k1Utility.getGenerator();
    } else if (curveName == 'babyjub') {
      CurvePointBasedUtility.context = BabyJubUtility.getGenerator();
    } else {
      throw new InvalidContextError(
        `${curveName} is not a supported ECC curve`,
      );
    }
  }
}
