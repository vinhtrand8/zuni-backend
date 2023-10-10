import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { ECCKeyStringPair } from 'library/interfaces/ECCKeyStringPair';
import { IndividualVotingPower } from 'library/private_voting/IndividualVotingPower';
import { CurvePointBasedUtility } from './CurvePointBasedUtility';
import { ECCUtility } from './ECCUtility';

export class VotingUtility extends CurvePointBasedUtility {
  static generateSampleVotingPowers<P extends ECCCurvePoint>(
    len: number,
  ): {
    voters: Array<ECCKeyStringPair<P>>;
    votingPowers: Array<IndividualVotingPower<P>>;
  } {
    const voters: Array<ECCKeyStringPair<P>> = [];
    for (let i = 0; i < len; ++i) voters.push(ECCUtility.genKeyPair<P>());
    const votingPowers = voters.map(
      (voterKeyPair) =>
        new IndividualVotingPower({
          votingPower: Math.floor(Math.random() * 1000),
          voterPublicSigningKey: voterKeyPair.getPublicKey().clone(),
          voterOrder: 0,
        }),
    );
    return {
      voters,
      votingPowers,
    };
  }

  static generateRandomVotePowerAllocation(
    userTotalVotingPower: number,
    numberOfVoteOptions: number,
  ): Array<number> {
    const res = new Array(numberOfVoteOptions).fill(0);
    for (let i = 0; i < userTotalVotingPower; ++i) {
      const pos = Math.floor(Math.random() * numberOfVoteOptions);
      res[pos] += 1;
    }
    return res;
  }
}
