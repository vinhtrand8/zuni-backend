import { assert } from 'chai';
import { MAX_TOTAL_VOTING_POWER } from 'library/constants/VotingConstants';
import { ClassPropertyValidationError } from 'library/interfaces/BaseClassValidator';
import { IndividualVotingPower } from 'library/private_voting/IndividualVotingPower';
import { Secp256k1PublicKey } from 'library/Secp256k1/Secp256k1PublicKey';

describe('IndividualVotingPower class tests', function () {
  it('create new indivisual voting objects', async () => {
    const _goodVotingPower = new IndividualVotingPower({
      votingPower: 20,
      voterPublicSigningKey: new Secp256k1PublicKey(
        '04a07317ce3131e9aa055d28f68c082a836f72712596c18295b9d7e8d1d9f440da1fd3c39c31dda7925773cf9aae5c3f405148f65713056539317077e1498313fe',
      ),
      voterOrder: 0,
    });
    assert.throws(() => {
      const _badVotingPower = new IndividualVotingPower({
        votingPower: -1,
        voterPublicSigningKey: new Secp256k1PublicKey(
          '04a07317ce3131e9aa055d28f68c082a836f72712596c18295b9d7e8d1d9f440da1fd3c39c31dda7925773cf9aae5c3f405148f65713056539317077e1498313fe',
        ),
        voterOrder: 0,
      });
    }, ClassPropertyValidationError);

    assert.throws(() => {
      const _badVotingPower_ = new IndividualVotingPower({
        votingPower: MAX_TOTAL_VOTING_POWER + 1,
        voterPublicSigningKey: new Secp256k1PublicKey(
          '04a07317ce3131e9aa055d28f68c082a836f72712596c18295b9d7e8d1d9f440da1fd3c39c31dda7925773cf9aae5c3f405148f65713056539317077e1498313fe',
        ),
        voterOrder: 0,
      });
    }, ClassPropertyValidationError);
  });
});
