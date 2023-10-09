import { BigNumberish } from 'circomlibjs';
import { ArrayMaxSize, ArrayMinSize, IsInt, Max, Min } from 'class-validator';
import { FFMathUtility } from 'library/BabyJub/FFMathUtility';
import {
  MAX_NUMBER_OF_VOTERS,
  MAX_NUMBER_OF_VOTE_OPTIONS,
  SMT_LEVEL,
} from 'library/constants/VotingConstants';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { CircuitSignals } from 'snarkjs';

type CircomPoint = [BigNumberish, BigNumberish];

export class CastVoteInput extends BaseClassValidator<CastVoteInput> {
  committeePublicKey: CircomPoint;

  @ArrayMinSize(MAX_NUMBER_OF_VOTE_OPTIONS)
  @ArrayMaxSize(MAX_NUMBER_OF_VOTE_OPTIONS)
  encryptedRandomness: Array<CircomPoint>;

  @ArrayMinSize(MAX_NUMBER_OF_VOTE_OPTIONS)
  @ArrayMaxSize(MAX_NUMBER_OF_VOTE_OPTIONS)
  encryptedMaskedVotingPowerAllocated: Array<CircomPoint>;

  votingPowerMerkleTreeRoot: BigNumberish;

  @ArrayMinSize(MAX_NUMBER_OF_VOTE_OPTIONS)
  @ArrayMaxSize(MAX_NUMBER_OF_VOTE_OPTIONS)
  votedPowerAmount: Array<BigNumberish>;

  @ArrayMinSize(MAX_NUMBER_OF_VOTE_OPTIONS)
  @ArrayMaxSize(MAX_NUMBER_OF_VOTE_OPTIONS)
  randomness: Array<BigNumberish>;

  voterPK: CircomPoint;

  @IsInt()
  @Min(0)
  @Max(MAX_NUMBER_OF_VOTERS - 1)
  voterIndex: number;

  @ArrayMinSize(SMT_LEVEL)
  @ArrayMaxSize(SMT_LEVEL)
  proofOfVoterId: Array<BigNumberish>;

  @ArrayMinSize(SMT_LEVEL)
  @ArrayMaxSize(SMT_LEVEL)
  proofOfVotingPower: Array<BigNumberish>;

  constructor(data: {
    committeePublicKey: CircomPoint;
    encryptedRandomness: Array<CircomPoint>;
    encryptedMaskedVotingPowerAllocated: Array<CircomPoint>;
    votingPowerMerkleTreeRoot: BigNumberish;
    votedPowerAmount: Array<BigNumberish>;
    randomness: Array<BigNumberish>;
    voterPK: CircomPoint;
    voterIndex: number;
    proofOfVoterId: Array<BigNumberish>;
    proofOfVotingPower: Array<BigNumberish>;
  }) {
    super(data);
    this.committeePublicKey = data.committeePublicKey;
    this.encryptedRandomness = data.encryptedRandomness;
    this.encryptedMaskedVotingPowerAllocated =
      data.encryptedMaskedVotingPowerAllocated;
    this.votingPowerMerkleTreeRoot = data.votingPowerMerkleTreeRoot;
    this.votedPowerAmount = data.votedPowerAmount;
    this.randomness = data.randomness;
    this.voterPK = data.voterPK;
    this.voterIndex = data.voterIndex;
    this.proofOfVoterId = data.proofOfVoterId;
    this.proofOfVotingPower = data.proofOfVotingPower;
  }

  static toCircomFieldNumString(x: BigNumberish): string {
    return FFMathUtility.F.toString(FFMathUtility.F.e(x));
  }
  toCircuitSignals(): CircuitSignals {
    return {
      committeePublicKey: this.committeePublicKey.map((x) =>
        CastVoteInput.toCircomFieldNumString(x),
      ),
      encryptedRandomness: this.encryptedRandomness.map((x) =>
        x.map((y) => CastVoteInput.toCircomFieldNumString(y)),
      ),
      encryptedMaskedVotingPowerAllocated:
        this.encryptedMaskedVotingPowerAllocated.map((x) =>
          x.map((y) => CastVoteInput.toCircomFieldNumString(y)),
        ),
      votingPowerMerkleTreeRoot: CastVoteInput.toCircomFieldNumString(
        this.votingPowerMerkleTreeRoot,
      ),
      votedPowerAmount: this.votedPowerAmount.map((x) =>
        CastVoteInput.toCircomFieldNumString(x),
      ),
      randomness: this.randomness.map((x) =>
        CastVoteInput.toCircomFieldNumString(x),
      ),
      voterPK: this.voterPK.map((x) => CastVoteInput.toCircomFieldNumString(x)),
      voterIndex: this.voterIndex,
      proofOfVoterId: this.proofOfVoterId.map((x) =>
        CastVoteInput.toCircomFieldNumString(x),
      ),
      proofOfVotingPower: this.proofOfVotingPower.map((x) =>
        CastVoteInput.toCircomFieldNumString(x),
      ),
    };
  }

  clone(): CastVoteInput {
    return new CastVoteInput({
      committeePublicKey: [...this.committeePublicKey],
      encryptedRandomness: [...this.encryptedRandomness],
      encryptedMaskedVotingPowerAllocated: [
        ...this.encryptedMaskedVotingPowerAllocated,
      ],
      votingPowerMerkleTreeRoot: this.votingPowerMerkleTreeRoot,
      votedPowerAmount: [...this.votedPowerAmount],
      randomness: [...this.randomness],
      voterPK: [...this.voterPK],
      voterIndex: this.voterIndex,
      proofOfVoterId: [...this.proofOfVoterId],
      proofOfVotingPower: [...this.proofOfVotingPower],
    });
  }
}
