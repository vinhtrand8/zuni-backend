import {
  ACCOUNT_DISCRIMINATOR_SIZE,
  Program,
  Provider,
  utils,
  web3,
} from '@coral-xyz/anchor';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sha1 } from '@noble/hashes/sha1';
import verifiableDataRegistryIdl from './idl/VerifiableDataRegistry';
import { IResolverService } from './interface.resolver.service';

const VERIFIABLE_DATA_REGISTRY_DISCRIMINATOR = {
  authentication: 'authentication',
  assertion: 'assertion',
  keyAgreement: 'key_agreement',
};

const ZUNI_SOLANA_DID_PREFIX = {
  devnet: 'did:zuni:solana:devnet:',
};

const STRING_LEN_BYTES = 4;

@Injectable()
export class SolanaService implements IResolverService {
  private readonly provider: Provider;
  private readonly verifiableDataRegistryProgram: Program<VerifiableDataRegistry>;

  constructor(private readonly configService: ConfigService) {
    const { verifiableDataRegistryProgramId, clusterApiUrl } =
      this.configService.getOrThrow<SolanaConfig>('solana');

    this.provider = {
      connection: new web3.Connection(clusterApiUrl),
    };
    this.verifiableDataRegistryProgram = new Program<VerifiableDataRegistry>(
      verifiableDataRegistryIdl,
      new web3.PublicKey(verifiableDataRegistryProgramId),
      this.provider,
    );
  }

  async fetchDIDDocument(did: string): Promise<DIDDocumentView | undefined> {
    const [didPda] = this.findDidPDA(
      this.verifiableDataRegistryProgram.programId,
      did,
    );
    const didOverview =
      await this.verifiableDataRegistryProgram.account.didDocument.fetch(
        didPda,
      );

    const didBase58 = utils.bytes.bs58.encode(Buffer.from(did));

    const verificationMethodAccounts =
      await this.verifiableDataRegistryProgram.account.verificationMethod.all([
        {
          memcmp: {
            offset:
              ACCOUNT_DISCRIMINATOR_SIZE +
              web3.PUBLIC_KEY_LENGTH +
              STRING_LEN_BYTES,
            bytes: didBase58,
          },
        },
      ]);
    const authenticationRelationshipAccounts =
      await this.verifiableDataRegistryProgram.account.authentication.all([
        {
          memcmp: {
            offset: ACCOUNT_DISCRIMINATOR_SIZE + STRING_LEN_BYTES,
            bytes: didBase58,
          },
        },
      ]);
    const assertionRelationshipAccounts =
      await this.verifiableDataRegistryProgram.account.assertion.all([
        {
          memcmp: {
            offset: ACCOUNT_DISCRIMINATOR_SIZE + STRING_LEN_BYTES,
            bytes: didBase58,
          },
        },
      ]);
    const keyAgreementRelationshipAccounts =
      await this.verifiableDataRegistryProgram.account.keyAgreement.all([
        {
          memcmp: {
            offset: ACCOUNT_DISCRIMINATOR_SIZE + STRING_LEN_BYTES,
            bytes: didBase58,
          },
        },
      ]);

    const didDocument: DIDDocumentView = {
      id: did,
      controller: didOverview.controller.toBase58(),
      verificationMethod: verificationMethodAccounts.map(({ account }) => {
        return {
          id: account.keyId,
          type: account.rType,
          controller: account.controller.toBase58(),
          publicKeyMultibase: account.publicKeyMultibase,
        };
      }),
      authentication: authenticationRelationshipAccounts.map(
        ({ account }) => account.keyId,
      ),
      assertion: assertionRelationshipAccounts.map(
        ({ account }) => account.keyId,
      ),
      keyAgreement: keyAgreementRelationshipAccounts.map(
        ({ account }) => account.keyId,
      ),
    };

    return didDocument;
  }

  async fetchDIDsByWallet(wallet: string): Promise<string[]> {
    const didAccounts =
      await this.verifiableDataRegistryProgram.account.didDocument.all([
        {
          memcmp: {
            offset: ACCOUNT_DISCRIMINATOR_SIZE,
            bytes: wallet,
          },
        },
      ]);

    return didAccounts.map(({ account }) => account.did);
  }

  getDidSeed(did: string): number[] {
    // const hashed = utils.sha256.hash(did);
    // const didSeed = [...Buffer.from(hashed).subarray(0, 20)];
    // return didSeed;
    const didSeed = sha1(did);
    return [...didSeed];
  }

  findDidPDA(programId: web3.PublicKey, did: string) {
    const didSeed = this.getDidSeed(did);
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from(didSeed)],
      programId,
    );
  }

  getVerificationMethodSeed(did: string, keyId: string): number[] {
    // const data = did + keyId;
    // const hashed = utils.sha256.hash(data);
    // const verificationSeed = [...Buffer.from(hashed).subarray(0, 20)];
    // return verificationSeed;
    const verificationSeed = sha1(did + keyId);
    return [...verificationSeed];
  }

  findVerificationMethodPda(
    programId: web3.PublicKey,
    did: string,
    keyId: string,
  ) {
    const verificationSeed = this.getVerificationMethodSeed(did, keyId);
    return web3.PublicKey.findProgramAddressSync(
      [Buffer.from(verificationSeed)],
      programId,
    );
  }

  getVerificationRelationshipSeeds(did: string, keyId: string) {
    const authenticationSeed = sha1(
      did + keyId + VERIFIABLE_DATA_REGISTRY_DISCRIMINATOR.authentication,
    );
    const assertionSeed = sha1(
      did + keyId + VERIFIABLE_DATA_REGISTRY_DISCRIMINATOR.assertion,
    );
    const keyAgreementSeed = sha1(
      did + keyId + VERIFIABLE_DATA_REGISTRY_DISCRIMINATOR.keyAgreement,
    );

    return {
      authenticationSeed: [...authenticationSeed],
      assertionSeed: [...assertionSeed],
      keyAgreementSeed: [...keyAgreementSeed],
    };
  }

  findVerificationRelationshipPdas(
    programId: web3.PublicKey,
    did: string,
    keyId: string,
  ) {
    const { authenticationSeed, assertionSeed, keyAgreementSeed } =
      this.getVerificationRelationshipSeeds(did, keyId);

    const [authenticationPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(authenticationSeed)],
      programId,
    );
    const [assertionPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(assertionSeed)],
      programId,
    );
    const [keyAgreementPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(keyAgreementSeed)],
      programId,
    );

    return {
      authenticationPda,
      assertionPda,
      keyAgreementPda,
    };
  }

  async getNumberOfDidsOwnedByController(
    controllerPublicKey: web3.PublicKey,
  ): Promise<number> {
    const accounts =
      await this.verifiableDataRegistryProgram.account.didDocument.all([
        {
          memcmp: {
            offset: ACCOUNT_DISCRIMINATOR_SIZE,
            bytes: controllerPublicKey.toBase58(),
          },
        },
      ]);

    return accounts.length;
  }

  deriveDidFromPublicKey(publicKey: web3.PublicKey) {
    const hashed = sha1(publicKey.toBase58());
    const buffer = Buffer.from(hashed);
    const did = ZUNI_SOLANA_DID_PREFIX.devnet + buffer.toString('hex');
    return did;
  }

  getIdOfVerificationMethod(did: string, fragment?: string, query?: string) {
    const fragmentDiscriminator = '#';
    const queryDiscriminator = '?';
    let id: string;

    if (query && fragment) {
      id = did + queryDiscriminator + query + fragmentDiscriminator + fragment;
    } else if (query) {
      id = did + queryDiscriminator + query;
    } else if (fragment) {
      id = did + fragmentDiscriminator + fragment;
    } else {
      id = did;
    }

    return id;
  }
}
