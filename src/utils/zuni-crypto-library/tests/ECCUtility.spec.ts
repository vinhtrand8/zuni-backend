import { assert } from 'chai';
import { BabyJubCurvePoint } from 'library/BabyJub/BabyJubBasePoint';
import { FFMathUtility } from 'library/BabyJub/FFMathUtility';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { Secp256k1CurvePoint } from 'library/Secp256k1/Secp256k1BasePoint';
import { ECCUtility } from 'library/utility/ECCUtility';

describe('ECCUtility lib', function () {
  this.timeout(100000);

  before(async () => {
    await FFMathUtility.initialize(); // BabyJub math
  });

  it('ECDH test', () => {
    const testRunner = <_P extends ECCCurvePoint>() => {
      const sender = ECCUtility.genKeyPair();
      const receiver = ECCUtility.genKeyPair();

      const plainText =
        '{"degree":{"type":"BachelorDegree","name":"Bachelor of Science and Arts"},"class":2025,"year":2024,"school_name":"HCMUS"}';
      const cipherText: string = ECCUtility.ecdhEncrypt(
        sender.getPrivateKey(),
        receiver.getPublicKey(),
        plainText,
      );
      const decryptedPlaintext: string = ECCUtility.ecdhDecrypt(
        receiver.getPrivateKey(),
        sender.getPublicKey(),
        cipherText,
      );

      assert.equal(plainText.trim(), decryptedPlaintext.trim());
    };

    ECCUtility.init('secp256k1');
    testRunner<Secp256k1CurvePoint>();
    //
    ECCUtility.init('babyjub');
    testRunner<BabyJubCurvePoint>();
  });

  it('ECDSA test', async () => {
    const testRunner = <_P extends ECCCurvePoint>() => {
      // Generate keys
      const signer = ECCUtility.genKeyPair();
      const plainText = 'Hello World, this is ECDSA!';
      const signature: string = ECCUtility.ecdsaSign(
        signer.getPrivateKey(),
        plainText,
      );
      const result: boolean = ECCUtility.ecdsaVerify(
        signer.getPublicKey(),
        plainText,
        signature,
      );

      assert.equal(result, true);
    };

    ECCUtility.init('secp256k1');
    testRunner<Secp256k1CurvePoint>();
    //
    ECCUtility.init('babyjub');
    testRunner<BabyJubCurvePoint>();
  });
});
