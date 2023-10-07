export interface IResolverService {
  fetchDIDDocument(did: string): Promise<DIDDocumentView | null>;
  fetchDIDsByWallet(wallet: string): Promise<string[]>;
}

export const IResolverService = Symbol('IResolverService');
