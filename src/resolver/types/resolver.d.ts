type VerificationMethod = {
  id: string;
  controller: string;
  type: string;
  publicKeyMultibase: string;
};

type DIDDocumentView = {
  id: string;
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertion: string[];
  keyAgreement: string[];
};
