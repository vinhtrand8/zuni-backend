import {
  CircuitSignals,
  FflonkProof,
  Groth16Proof,
  PlonkProof,
  PublicSignals,
} from 'snarkjs';

export type ZKProof = Groth16Proof | PlonkProof | FflonkProof;
export interface ZKEngine<ZP extends ZKProof> {
  fullProve(
    _input: CircuitSignals,
    wasmFile: string,
    zkeyFileName: string,
    logger?: any,
  ): Promise<{
    proof: ZP;
    publicSignals: PublicSignals;
  }>;
  prove(
    zkeyFileName: string,
    witnessFileName: any,
    logger?: any,
  ): Promise<{
    proof: ZP;
    publicSignals: PublicSignals;
  }>;
  verify(
    _vk_verifier: JSON,
    _publicSignals: PublicSignals,
    _proof: ZP,
    logger?: any,
  ): Promise<boolean>;
}
