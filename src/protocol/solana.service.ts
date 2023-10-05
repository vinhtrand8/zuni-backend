import { Injectable, Logger } from '@nestjs/common';
import { ProtocolInterface } from './protocol.interface';

@Injectable()
export class SolanaService implements ProtocolInterface {
  async getDIDDocument(did: string): Promise<DIDDocumentView | null> {
    // TODO: Implement this method
    Logger.log(did);
    const didDocument: DIDDocumentView | null = null;
    return didDocument;
  }

  async getDIDsByWallet(wallet: string): Promise<string[]> {
    Logger.log(wallet);
    const dids: string[] = [];
    return dids;
  }
}
