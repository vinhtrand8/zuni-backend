import { BN } from 'bn.js';
import { assert } from 'chai';
import { Point } from 'circomlibjs';
import { BabyJubCurvePoint } from 'library/BabyJub/BabyJubBasePoint';
import { FFMathUtility } from 'library/BabyJub/FFMathUtility';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';

describe('BabyJubKeyStringPair class tests', function () {
  before(async () => {
    await FFMathUtility.initialize();
  });
  it('create new key string pair objects', () => {
    (async <_P extends ECCCurvePoint>() => {
      const sk = BigInt(
        '12062235059128150724140304935969637827082776004512811357721318686093323707',
      );

      const pk = FFMathUtility.mulPointEscalar(FFMathUtility.babyJub.Base8, sk);

      const expectedResult = [
        FFMathUtility.F.e(
          '16615746963028696677018428614198711496571701930924944283712342977161475370589',
        ),
        FFMathUtility.F.e(
          '17352060016259064550698589367725650417374780253567961166772033417671818251070',
        ),
      ];

      //  12062235059128150724140304935969637827082776004512811357721318686093323707  * G =  16615746963028696677018428614198711496571701930924944283712342977161475370589 / 17352060016259064550698589367725650417374780253567961166772033417671818251070
      assert.equal(pk.toString(), expectedResult.toString());
    })<BabyJubCurvePoint>();
  });

  it('add two points', () => {
    (async <_P extends ECCCurvePoint>() => {
      const p1: Point = [
        FFMathUtility.F.e(
          '17777552123799933955779906779655732241715742912184938656739573121738514868268',
        ),
        FFMathUtility.F.e(
          '2626589144620713026669568689430873010625803728049924121243784502389097019475',
        ),
      ];
      const p2: Point = [
        FFMathUtility.F.e(
          '16540640123574156134436876038791482806971768689494387082833631921987005038935',
        ),
        FFMathUtility.F.e(
          '20819045374670962167435360035096875258406992893633759881276124905556507972311',
        ),
      ];

      // 0x11805510440a3488b3b811eaacd0ec7c72dded51978190e19067a2afaebaf361
      // 0x1f07aa1b3c598e2ff9ff77744a39298a0a89a9027777af9fa100dd448e072c13
      const res = FFMathUtility.addPoint(p1, p2);
      const babyjubjubRsPrimeFieldReprOutput = [
        FFMathUtility.F.e(
          new BN(
            '11805510440a3488b3b811eaacd0ec7c72dded51978190e19067a2afaebaf361',
            16,
          ).toString(10),
        ),
        FFMathUtility.F.e(
          new BN(
            '1f07aa1b3c598e2ff9ff77744a39298a0a89a9027777af9fa100dd448e072c13',
            16,
          ).toString(10),
        ),
      ];
      const expectedResult: Point = [
        FFMathUtility.F.e(
          '7916061937171219682591368294088513039687205273691143098332585753343424131937',
        ),
        FFMathUtility.F.e(
          '14035240266687799601661095864649209771790948434046947201833777492504781204499',
        ),
      ];

      assert.equal(res.toString(), babyjubjubRsPrimeFieldReprOutput.toString());
      assert.equal(expectedResult.toString(), res.toString());
    })<BabyJubCurvePoint>().catch((err) => console.log(err));
  });
});
