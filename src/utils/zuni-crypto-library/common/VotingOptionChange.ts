import BN from 'bn.js';
import { IsInt, Max, Min } from 'class-validator';
import { MAX_NUMBER_OF_VOTE_OPTIONS } from 'library/constants/VotingConstants';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { BasePoint, ECCCurvePoint } from 'library/interfaces/BasePoint';
import { ECCPublicKeyInterface } from 'library/interfaces/ECCPublicKey';
import { ECCUtility } from 'library/utility/ECCUtility';

export class VotingOptionChange<
  P extends ECCCurvePoint,
> extends BaseClassValidator<VotingOptionChange<P>> {
  @IsInt()
  @Min(0)
  @Max(MAX_NUMBER_OF_VOTE_OPTIONS)
  optionIndex: number; // index starts from 0

  randomness: BN;
  votedPowerAmount: BN;
  encryptedRandomness: BasePoint<P>;
  encryptedMaskedVotingPowerAllocated: BasePoint<P>;
  committeePublicKey: ECCPublicKeyInterface<P>;

  constructor(data: {
    randomness: BN;
    votedPowerAmount: BN;
    optionIndex: number;
    committeePublicKey: ECCPublicKeyInterface<P>;
  }) {
    super(data);
    this.randomness = data.randomness;
    this.votedPowerAmount = data.votedPowerAmount;
    this.optionIndex = data.optionIndex;

    this.encryptedRandomness = ECCUtility.getGenerator<P>().mul(
      this.randomness,
    );
    this.committeePublicKey = data.committeePublicKey;
    this.encryptedMaskedVotingPowerAllocated = ECCUtility.getGenerator<P>()
      .mul(this.votedPowerAmount)
      .add(data.committeePublicKey.toBasePoint().mul(this.randomness));
  }

  clone(): VotingOptionChange<P> {
    return new VotingOptionChange({
      randomness: this.randomness,
      votedPowerAmount: this.votedPowerAmount,
      optionIndex: this.optionIndex,
      committeePublicKey: this.committeePublicKey,
    });
  }
}
