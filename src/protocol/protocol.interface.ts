export interface ProtocolInterface {
  getDIDDocument(did: string): Promise<DIDDocumentView | null>;
  getDIDsByWallet(wallet: string): Promise<string[]>;
}
