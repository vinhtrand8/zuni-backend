import { assert } from 'chai';
import { ClassPropertyValidationError } from 'library/interfaces/BaseClassValidator';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { ECCKeyStringPair } from 'library/interfaces/ECCKeyStringPair';
import { Secp256k1CurvePoint } from 'library/Secp256k1/Secp256k1BasePoint';
import { ECCUtility } from 'library/utility/ECCUtility';

describe('Secp256k1KeyStringPair class tests', function () {
  it('create new key string pair objects', () => {
    (<P extends ECCCurvePoint>() => {
      const _good_key_pair: ECCKeyStringPair<P> =
        ECCUtility.newKeyPairFromKeyStrings(
          '208a39787da39e9f78b54aeb2ff38812bbd8ad822485c3a8784adbf84c805725',
          '04a07317ce3131e9aa055d28f68c082a836f72712596c18295b9d7e8d1d9f440da1fd3c39c31dda7925773cf9aae5c3f405148f65713056539317077e1498313fe',
        );
      assert.throws(() => {
        const _bad_key_pair: ECCKeyStringPair<P> =
          ECCUtility.newKeyPairFromKeyStrings('helllo', 'goodbye');
      }, ClassPropertyValidationError);
    })<Secp256k1CurvePoint>();
  });
});
