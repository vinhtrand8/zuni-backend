import {
  BigNumberish,
  buildPoseidon,
  newMemEmptyTrie,
  SMT,
  SMTMemDb,
} from 'circomlibjs';
import { getCurveFromName } from 'ffjavascript';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { WasmField1Interface } from 'library/interfaces/WasmFieldInterface';
import { SMT_LEVEL } from '../constants/SMTConstants';
import { IndividualVotingPower } from './IndividualVotingPower';
import { VotingPowerSMT } from './VotingPowerSMT';

export type hashFn = (left: BigNumberish, right: BigNumberish) => Uint8Array;

export class VotingPowerSMTBuilder {
  // private methods
  private static async _getHashes(): Promise<{
    hash0: hashFn;
    hash1: hashFn;
    F: WasmField1Interface;
  }> {
    const bn128 = await getCurveFromName('bn128', true);
    const poseidon = await buildPoseidon();
    return {
      hash0: function (left, right) {
        return poseidon([left, right]);
      },
      hash1: function (key, value) {
        return poseidon([key, value, bn128.Fr.one]);
      },
      F: bn128.Fr,
    };
  }
  private static async _createSMT(
    hash0: hashFn,
    hash1: hashFn,
    F: WasmField1Interface,
    initialRoot: BigNumberish = 0,
  ) {
    const db = new SMTMemDb(F);
    const smt = new SMT(db, initialRoot, hash0, hash1, F);
    return smt;
  }
  private async _getSMTSiblings(
    tree: SMT,
    key: number,
  ): Promise<Array<BigNumberish>> {
    const siblings: Array<BigNumberish> = await tree.find(key).siblings;
    while (siblings.length < SMT_LEVEL) siblings.push(0);
    return siblings;
  }

  // public methods
  static getSortedVotingPowers<P extends ECCCurvePoint>(
    votingPowers: Array<IndividualVotingPower<P>>,
  ): Array<IndividualVotingPower<P>> {
    const sortedVotingPowers = votingPowers
      .map((x) => x.clone())
      .sort((v1, v2) => {
        const isDiff =
          v1.voterPublicSigningKey.toHexString() !=
          v2.voterPublicSigningKey.toHexString();
        return isDiff
          ? v1.voterPublicSigningKey.toHexString() <
            v2.voterPublicSigningKey.toHexString()
            ? -1
            : 1
          : 0;
      })
      .map((value, index) => {
        value.voterOrder = index + 1;
        return value;
      });
    return sortedVotingPowers;
  }

  static async buildVotingPowerSMT<P extends ECCCurvePoint>(
    votingPowers: Array<IndividualVotingPower<P>>,
  ): Promise<VotingPowerSMT<P>> {
    const sortedVotingPowers =
      VotingPowerSMTBuilder.getSortedVotingPowers<P>(votingPowers);

    const smt: SMT = await newMemEmptyTrie(); //
    const Fr: WasmField1Interface = smt.F; // WasmField1
    let totalVotingPower = 0;

    for (let i = 0; i < sortedVotingPowers.length; ++i) {
      totalVotingPower += sortedVotingPowers[i].votingPower;
      // TODO: @galin-chung-nguyen make sure there is no duplicated key
      await smt.insert(
        Fr.e(i * 2 + 1),
        sortedVotingPowers[i].voterPublicSigningKey.toVoterId(),
      );
      await smt.insert(
        Fr.e(i * 2 + 2),
        Fr.e(sortedVotingPowers[i].votingPower),
      );
    }

    const smtContainer = new VotingPowerSMT({
      totalVotingPower,
      merkleTree: smt,
      individualVotingPowers: sortedVotingPowers,
    });

    return smtContainer;
  }
}
