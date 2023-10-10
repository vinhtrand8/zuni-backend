import { assert } from 'chai';
import { BigNumberish, SMT, SMTMemDb } from 'circomlibjs';
import { IsInt, Max, Min } from 'class-validator';
import { MAX_TOTAL_VOTING_POWER } from 'library/constants/IndividualVotingPowerConstants';
import { SMT_LEVEL } from 'library/constants/SMTConstants';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { WasmField1Interface } from '../interfaces/WasmFieldInterface';
import { IndividualVotingPower } from './IndividualVotingPower';
export class VotingPowerSMT<P extends ECCCurvePoint> extends BaseClassValidator<
  VotingPowerSMT<P>
> {
  @IsInt()
  @Min(0)
  @Max(MAX_TOTAL_VOTING_POWER)
  totalVotingPower: number;

  merkleTree: SMT;

  F: WasmField1Interface;

  individualVotingPowers: Array<IndividualVotingPower<P>> | undefined;

  constructor(data: {
    totalVotingPower: number;
    merkleTree: SMT;
    individualVotingPowers?: Array<IndividualVotingPower<P>>;
  }) {
    super(data);
    this.totalVotingPower = data.totalVotingPower;
    this.merkleTree = data.merkleTree;
    this.F = this.merkleTree.F;
    this.individualVotingPowers = data.individualVotingPowers;
  }

  private async verifyKeyValuePairInSMT(
    key: Uint8Array,
    value: Uint8Array,
  ): Promise<boolean> {
    const res = await this.merkleTree.find(key);
    return (
      res.found && res.foundValue && this.F.eq(res.foundValue, this.F.e(value))
    );
  }

  async getSiblings(key: BigNumberish): Promise<Array<BigNumberish>> {
    const res = await this.merkleTree.find(key);
    assert.equal(
      res.found && res.foundValue && res.siblings != undefined,
      true,
    );
    const siblings = res.siblings;
    while (siblings.length < SMT_LEVEL + 1) siblings.push(0);
    return siblings;
  }

  async verifyTotalVotingPowerOfUser(
    voter: IndividualVotingPower<P>,
  ): Promise<boolean> {
    const index = voter.voterOrder - 1;
    const isVoterIdIncluded = await this.verifyKeyValuePairInSMT(
      this.F.e(index * 2 + 1),
      this.merkleTree.F.e(voter.voterPublicSigningKey.toVoterId()),
    );
    const isVotingPowerIncluded = await this.verifyKeyValuePairInSMT(
      this.F.e(index * 2 + 2),
      this.F.e(voter.votingPower),
    );
    return isVoterIdIncluded && isVotingPowerIncluded;
  }

  clone(): VotingPowerSMT<P> {
    // clone mem db
    const newMemDb = new SMTMemDb(this.merkleTree.F);
    newMemDb.setRoot(this.merkleTree.root);
    newMemDb.nodes = {};
    for (const nodeKey in this.merkleTree.F.nodes) {
      newMemDb.nodes[nodeKey] = this.merkleTree.F.nodes[nodeKey];
    }
    // clone the tree
    return new VotingPowerSMT({
      totalVotingPower: this.totalVotingPower,
      merkleTree: new SMT(
        newMemDb,
        this.merkleTree.root,
        this.merkleTree.hash0,
        this.merkleTree.hash1,
        this.merkleTree.F,
      ),
      individualVotingPowers: this.individualVotingPowers?.map((x) =>
        x.clone(),
      ),
    });
  }
}
