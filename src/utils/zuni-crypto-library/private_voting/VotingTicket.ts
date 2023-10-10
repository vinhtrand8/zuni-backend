import { BigNumberish } from 'circomlibjs';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import {
  MAX_NUMBER_OF_VOTERS,
  MAX_NUMBER_OF_VOTE_OPTIONS,
  SMT_LEVEL,
} from 'library/constants/VotingConstants';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { CastVoteInput } from 'library/interfaces/CastVoteInput';
import { ECCKeyStringPair } from 'library/interfaces/ECCKeyStringPair';
import { ECCPublicKeyInterface } from 'library/interfaces/ECCPublicKey';
import { VotingOptionChange } from './VotingOptionChange';

export class VotingTicket<P extends ECCCurvePoint> extends BaseClassValidator<
  VotingTicket<P>
> {
  @ArrayMinSize(MAX_NUMBER_OF_VOTE_OPTIONS)
  @ArrayMaxSize(MAX_NUMBER_OF_VOTE_OPTIONS)
  @IsArray()
  votingOptionChanges: Array<VotingOptionChange<P>>;

  @IsArray()
  @ArrayMinSize(SMT_LEVEL)
  @ArrayMaxSize(SMT_LEVEL)
  votingPowerMerkleProof: Array<BigNumberish>;

  voterKeyPair: ECCKeyStringPair<P>;

  @ArrayMinSize(SMT_LEVEL)
  @ArrayMaxSize(SMT_LEVEL)
  validVoterMerkleProof: Array<BigNumberish>;

  committeePublicKey: ECCPublicKeyInterface<P>;

  @IsInt()
  @Min(0)
  @Max(MAX_NUMBER_OF_VOTERS - 1)
  voterIndex: number;

  constructor(data: {
    votingOptionChanges: Array<VotingOptionChange<P>>;
    votingPowerMerkleProof: Array<BigNumberish>;
    validVoterMerkleProof: Array<BigNumberish>;
    voterKeyPair: ECCKeyStringPair<P>;
    committeePublicKey: ECCPublicKeyInterface<P>;
    voterIndex: number;
  }) {
    super(data);
    this.votingOptionChanges = data.votingOptionChanges;
    this.votingPowerMerkleProof = data.votingPowerMerkleProof;
    this.validVoterMerkleProof = data.validVoterMerkleProof;
    this.voterKeyPair = data.voterKeyPair;
    this.committeePublicKey = data.committeePublicKey;
    this.voterIndex = data.voterIndex;
  }

  toCircuitInputs(votingPowerMerkleTreeRoot: BigNumberish): CastVoteInput {
    // signal input committeePublicKey[2];
    // signal input encryptedRandomness[MAX_NUM_VOTE_OPTIONS][2];
    // signal input encryptedMaskedVotingPowerAllocated[MAX_NUM_VOTE_OPTIONS][2];
    // signal input votingPowerMerkleTreeRoot;

    // // private inputs
    // signal input votedPowerAmount[MAX_NUM_VOTE_OPTIONS];
    // signal input randomness[MAX_NUM_VOTE_OPTIONS];
    // signal input voterPK[2];
    // signal input voterIndex; // position of voter in the list starts from 0
    // signal input proofOfVoterId[SMT_LEVEL];
    // signal input proofOfVotingPower[SMT_LEVEL];

    return new CastVoteInput({
      committeePublicKey: [
        this.committeePublicKey.getX().toString(),
        this.committeePublicKey.getY().toString(),
      ],
      encryptedRandomness: this.votingOptionChanges
        .map((x) => x.encryptedRandomness)
        .map((x) => [x.getX().toString(), x.getY().toString()]),
      encryptedMaskedVotingPowerAllocated: this.votingOptionChanges
        .map((x) => x.encryptedMaskedVotingPowerAllocated)
        .map((x) => [x.getX().toString(), x.getY().toString()]),
      votingPowerMerkleTreeRoot: votingPowerMerkleTreeRoot,
      votedPowerAmount: this.votingOptionChanges.map((x) =>
        x.votedPowerAmount.toString(),
      ),
      randomness: this.votingOptionChanges.map((x) => x.randomness.toString()),
      voterPK: [
        this.voterKeyPair.getPublicKey().getX().toString(),
        this.voterKeyPair.getPublicKey().getY().toString(),
      ],
      voterIndex: this.voterIndex,
      proofOfVoterId: this.validVoterMerkleProof,
      proofOfVotingPower: this.votingPowerMerkleProof,
    });
  }

  clone(): VotingTicket<P> {
    return new VotingTicket({
      votingOptionChanges: this.votingOptionChanges.map((x) => x.clone()),
      votingPowerMerkleProof: this.votingPowerMerkleProof.map((x) => x),
      validVoterMerkleProof: this.validVoterMerkleProof.map((x) => x),
      voterKeyPair: this.voterKeyPair.clone(),
      committeePublicKey: this.committeePublicKey.clone(),
      voterIndex: this.voterIndex,
    });
  }
}
