import BN from 'bn.js';
import { assert } from 'chai';
import { generateRandomBN } from 'library/common/Math';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { ECCKeyStringPair } from 'library/interfaces/ECCKeyStringPair';
import { ECCPublicKeyInterface } from 'library/interfaces/ECCPublicKey';
import { MAX_TOTAL_VOTING_POWER } from '../constants/VotingConstants';
import { VotingOptionChange } from './VotingOptionChange';
import { VotingPowerSMT } from './VotingPowerSMT';
import { VotingTicket } from './VotingTicket';

export class InvalidVotingTicketError extends Error {
  constructor(errorMessage: string) {
    super(errorMessage);
  }
}

export class VotingTicketBuilder {
  static async buildVotingTicket<P extends ECCCurvePoint>(
    votingPowerAllocation: Array<number>,
    numberOfVoteOptions: number,
    voter: ECCKeyStringPair<P>,
    votingPowerSMT: VotingPowerSMT<P>,
    committeePublicKey: ECCPublicKeyInterface<P>,
  ) {
    try {
      assert(numberOfVoteOptions == votingPowerAllocation.length);

      let userTotalVotingPower = 0;
      for (let i = 0; i < votingPowerAllocation.length; ++i) {
        const votingPowerAllocatedToCurrentOption = votingPowerAllocation[i];
        if (
          votingPowerAllocatedToCurrentOption > votingPowerSMT.totalVotingPower
        ) {
          throw new InvalidVotingTicketError(
            `You cannot vote more than ${MAX_TOTAL_VOTING_POWER} power!`,
          );
        }
        userTotalVotingPower += votingPowerAllocatedToCurrentOption;
      }

      // console.log('ok voter is ', voter.getPublicKey());
      // console.log(
      //   votingPowerSMT.individualVotingPowers?.map(
      //     (x) => x.voterPublicSigningKey,
      //   ),
      // );

      // verify valid ticket
      const individualVotingPower = votingPowerSMT.individualVotingPowers?.find(
        (x) =>
          x.voterPublicSigningKey
            .toBasePoint()
            .eq(voter.getPublicKey().toBasePoint()),
      );

      assert(individualVotingPower?.votingPower === userTotalVotingPower);

      if (
        !individualVotingPower ||
        individualVotingPower.votingPower != userTotalVotingPower
      ) {
        throw new InvalidVotingTicketError(
          'User does not have the right to vote.',
        );
      }

      await votingPowerSMT.verifyTotalVotingPowerOfUser(individualVotingPower);
      // generate proofs of total voting power changes for each options
      const votingOptionChanges: Array<VotingOptionChange<P>> = [];

      for (let i = 0; i < votingPowerAllocation.length; ++i) {
        votingOptionChanges.push(
          new VotingOptionChange({
            randomness: generateRandomBN(),
            votedPowerAmount: new BN(votingPowerAllocation[i]),
            optionIndex: i,
            committeePublicKey,
          }),
        );
      }

      const validVoterMerkleProof = await votingPowerSMT.getSiblings(
        votingPowerSMT.F.e(individualVotingPower.voterOrder * 2 - 1), // voteOrder = index + 1
      );
      const votingPowerMerkleProof = await votingPowerSMT.getSiblings(
        votingPowerSMT.F.e(individualVotingPower.voterOrder * 2),
      );

      const votingTicket = new VotingTicket({
        votingOptionChanges: votingOptionChanges,
        validVoterMerkleProof,
        votingPowerMerkleProof,
        voterKeyPair: voter.clone(),
        committeePublicKey,
        voterIndex: individualVotingPower.voterOrder - 1,
      });
      return votingTicket;
    } catch (err) {
      console.log(err);
      if (err instanceof InvalidVotingTicketError) {
        throw err;
      } else {
        throw new InvalidVotingTicketError(
          err?.message ?? 'Voting power allocation is invalid',
        );
      }
    }
  }
}
