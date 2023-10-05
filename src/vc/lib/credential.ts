export enum ProofPurpose {
  ASSERTION = 'ASSERTION',
  AUTHENTICATION = 'AUTHENTICATION',
}

export interface DataSignatureInterface {
  type: string;
  created: string;
  proofPurpose: ProofPurpose;
  value: string;
  verificationMethod: string;
}

export interface FieldIndexInterface {
  fieldName: string;
  fieldIndex: number;
}

export interface CredentialInterface {
  id: string;
  types: string[];
  issuer: string;
  issuerPublicKey: string;
  holderPublicKey: string;
  holder: string;
  issuanceDate: string;
  expirationDate?: string;
  fieldIndexes: Array<FieldIndexInterface>;
  fieldMerkleRoot: string;
  credentialSubject?: any;
  encryptedData: string;
  proof: DataSignatureInterface;
}

export function getPublicCredential(
  cred: CredentialInterface,
): CredentialInterface {
  const publicFields = {
    ...(cred.id && { id: cred.id }),
    ...(cred.issuer && { issuer: cred.issuer }),
    ...(cred.holder && { holder: cred.holder }),
    ...(cred.issuerPublicKey && { issuerPublicKey: cred.issuerPublicKey }),
    ...(cred.holderPublicKey && { holderPublicKey: cred.holderPublicKey }),
    ...(cred.types && { types: cred.types }),
    ...(cred.issuanceDate && { issuanceDate: cred.issuanceDate }),
    ...(cred.expirationDate && { expirationDate: cred.expirationDate }),
    ...(cred.encryptedData && { encryptedData: cred.encryptedData }),
    ...(cred.fieldIndexes && { fieldIndexes: cred.fieldIndexes }),
    ...(cred.fieldMerkleRoot && { fieldMerkleRoot: cred.fieldMerkleRoot }),
    ...(cred.proof && { proof: cred.proof }),
  } as CredentialInterface;

  return publicFields;
}
