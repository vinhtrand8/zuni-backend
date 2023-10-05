import type { DataSignatureInterface } from './credential';

export enum VCSynthesisError {
  InvalidSchema = 'VCSynthesisError: InvalidSchema',
  InvalidCredential = 'VCSynthesisError: InvalidCredential',
  Unsatisfiable = 'VCSynthesisError: Unsatisfiable',
  BadAssignment = 'VCSynthesisError: BadAssignment',
  InvalidVCPresentation = 'VCSynthesisError: InvalidVCPresentation',
}

export interface SchemaInterface {
  id: string;
  name: string;
  verifier: string;
  checks: Array<any>;
  requests: string[];
  checkMerkleRoots: Array<any>;
  proof: DataSignatureInterface;
  issuanceDate: string;
  verifierPublicKey?: string;
}
