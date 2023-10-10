import { BigNumberish } from 'circomlibjs';
import { ArrayMaxSize, ArrayMinSize, IsArray } from 'class-validator';
import { SMT_LEVEL } from 'library/constants/SMTConstants';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { VotingOptionChange } from './VotingOptionChange';

export class VotingTicket<P extends ECCCurvePoint> extends BaseClassValidator<
  VotingTicket<P>
> {
  @IsArray()
  votingOptionChanges: Array<VotingOptionChange<P>>;

  @IsArray()
  @ArrayMinSize(SMT_LEVEL + 1)
  @ArrayMaxSize(SMT_LEVEL + 1)
  votingPowerMerkleProof: Array<BigNumberish>;

  validVoterMerkleProof: Array<BigNumberish>;

  constructor(data: {
    votingOptionChanges: Array<VotingOptionChange<P>>;
    votingPowerMerkleProof: Array<BigNumberish>;
    validVoterMerkleProof: Array<BigNumberish>;
  }) {
    super(data);
    this.votingOptionChanges = data.votingOptionChanges;
    this.votingPowerMerkleProof = data.votingPowerMerkleProof;
    this.validVoterMerkleProof = data.validVoterMerkleProof;
  }

  clone(): VotingTicket<P> {
    return new VotingTicket({
      votingOptionChanges: this.votingOptionChanges,
      votingPowerMerkleProof: this.votingPowerMerkleProof.map((x) => x),
      validVoterMerkleProof: this.validVoterMerkleProof.map((x) => x),
    });
  }
}
