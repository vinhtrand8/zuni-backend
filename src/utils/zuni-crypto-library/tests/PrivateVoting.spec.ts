import { assert } from 'chai';
import * as fs from 'fs';
import { BabyJubCurvePoint } from 'library/BabyJub/BabyJubBasePoint';
import { FFMathUtility } from 'library/BabyJub/FFMathUtility';
import { MAX_NUMBER_OF_VOTE_OPTIONS } from 'library/constants/VotingConstants';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { ZKEngine, ZKProof } from 'library/interfaces/ZKEngine';
import { VotingPowerSMTBuilder } from 'library/private_voting/VotingPowerSMTBuilder';
import { VotingTicketBuilder } from 'library/private_voting/VotingTicketBuilder';
import { ECCUtility } from 'library/utility/ECCUtility';
import { VotingUtility } from 'library/utility/VotingUtility';
import seedrandom from 'seedrandom';
import * as snarkjs from 'snarkjs';
type Groth16Proof = snarkjs.Groth16Proof;

describe('PrivateVoting tests', function () {
  this.timeout(15000);

  before(async () => {
    await FFMathUtility.initialize(); // for babyjub math
    seedrandom('this_is_seed_for_randomness', { global: true }); // seed random
  });

  async function testPrivateVoting<P extends ECCCurvePoint, ZP extends ZKProof>(
    zkEngine: ZKEngine<ZP>,
    voteVerifierCircuitWasmPath: string,
    voteVerifierCitcuitZkeyPath: string,
    voteVerifierCitcuitVKeyPath: string,
  ) {
    // Step 1: initialize the voting
    const numberOfVoters = 3;
    const numberOfVoteOptions = MAX_NUMBER_OF_VOTE_OPTIONS;
    const { voters, votingPowers } =
      VotingUtility.generateSampleVotingPowers<P>(numberOfVoters);
    const votingPowerSMT = await VotingPowerSMTBuilder.buildVotingPowerSMT(
      votingPowers,
    );
    const committeePublicKey = ECCUtility.getDefaultPublicKey();
    const _committeePrivateKey = ECCUtility.getDefaultPrivateKey();

    // Step 2: each user submits a vote
    for (let i = 0; i < voters.length; ++i) {
      const validVotePowerAllocation =
        VotingUtility.generateRandomVotePowerAllocation(
          votingPowers[i].votingPower,
          numberOfVoteOptions,
        );
      const validVotingTicket = await VotingTicketBuilder.buildVotingTicket(
        validVotePowerAllocation,
        numberOfVoteOptions,
        voters[i],
        votingPowerSMT,
        committeePublicKey,
      );
      // simulate ticket submission
      const input = validVotingTicket.toCircuitInputs(
        votingPowerSMT.merkleTree.root,
      );
      const {
        proof: proof,
        publicSignals: publicSignals,
      }: { proof: ZP; publicSignals: snarkjs.PublicSignals } =
        await zkEngine.fullProve(
          input.toCircuitSignals(),
          voteVerifierCircuitWasmPath,
          voteVerifierCitcuitZkeyPath,
        );

      // console.log(`Proof = `, proof);
      console.log(
        `Proof generated for voter ${i}: `,
        JSON.stringify(proof, null, 2),
      );
      console.log(`Public signals =  `, JSON.stringify(publicSignals, null, 2));

      // verification:
      const result = await zkEngine.verify(
        JSON.parse(fs.readFileSync(voteVerifierCitcuitVKeyPath, 'utf8')),
        publicSignals,
        proof,
      );
      assert.equal(result, true);
      console.log('Proof verification result: ', result);
    }

    // Step 3: Vote tally and reveal result
    return true;
  }

  it('build private voting', () => {
    (async () => {
      ECCUtility.init('babyjub');
      await testPrivateVoting<BabyJubCurvePoint, Groth16Proof>(
        snarkjs.groth16,
        'circuits/voting/vote_verifier/vote_verifier_js/vote_verifier.wasm',
        'circuits/voting/vote_verifier/vote_verifier_circuit_final.zkey',
        'circuits/voting/vote_verifier/vote_verifier_verification_key.json',
      )
        .then(() => {
          console.log('Test passed!');
        })
        .catch((err) => console.log(err));
      process.exit(0);
    })();
  });
});
