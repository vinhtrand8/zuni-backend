type VerificationMethod = {
  id: string;
  controller: string;
  type: string;
  publicKey: string;
};

type DIDDocumentView = {
  id: string;
  controller: string;
  alsoKnownAs: string[];
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  keyAgreement: string[];
};
