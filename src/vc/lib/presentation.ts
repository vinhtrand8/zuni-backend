import { CredentialInterface, DataSignatureInterface } from './credential';
import { SchemaInterface } from './schema';

export interface VCPresentationInterface {
  id: string;
  holder: string;
  credentials: CredentialInterface[];
  schema: SchemaInterface;
  requestedRawValues?: any[];
  encryptedData: string;
  snarkProof: any;
  proof: DataSignatureInterface;
}

export function getPublicPresentation(
  pres: VCPresentationInterface,
): VCPresentationInterface {
  delete pres.requestedRawValues;
  return pres;
}
