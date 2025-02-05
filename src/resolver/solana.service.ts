import {
  ACCOUNT_DISCRIMINATOR_SIZE,
  Program,
  Provider,
  utils,
  web3,
} from '@coral-xyz/anchor';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { keccak_256 } from '@noble/hashes/sha3';
import { IDL as idl } from './idl/VerifiableDataRegistry';
import { IResolverService } from './interface.resolver.service';

export const ZUNI_DID_PREFIX = 'did:zuni:solana:';

export const VERIFICATION_RELATIONSHIP = {
  authentication: {
    discriminator: 'authentication',
    input: { authentication: {} },
  },
  assertion: {
    discriminator: 'assertion',
    input: { assertion: {} },
  },
  keyAgreement: {
    discriminator: 'key_agreement',
    input: { keyAgreement: {} },
  },
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
      idl,
      new web3.PublicKey(verifiableDataRegistryProgramId),
      this.provider,
    );
  }

  async fetchDIDDocument(didUrl: string): Promise<DIDDocumentView | undefined> {
    const rawDid = this.convertDidUrlToRaw(didUrl);

    const [didPda] = this.findDidPDA(
      this.verifiableDataRegistryProgram.programId,
      rawDid,
    );
    const didOverview =
      await this.verifiableDataRegistryProgram.account.didDocument.fetch(
        didPda,
      );
    const verificationMethods = await this.fetchVerificationMethods(rawDid);
    const { authentications, assertions, keyAgreements } =
      await this.fetchVerificationRelationships(rawDid);

    const didDocument: DIDDocumentView = {
      id: didUrl,
      controller: didOverview.controller.toBase58(),
      verificationMethod: verificationMethods.map((verification) => {
        const {
          keyId: rawId,
          rType,
          controller,
          publicKeyMultibase,
        } = verification;
        return {
          id: this.convertRawToDidUrlFormat(rawId),
          type: rType,
          controller: controller.toBase58(),
          publicKeyMultibase: publicKeyMultibase,
        };
      }),
      authentication: authentications.map(({ keyId: rawId }) =>
        this.convertRawToDidUrlFormat(rawId),
      ),
      assertion: assertions.map(({ keyId: rawId }) =>
        this.convertRawToDidUrlFormat(rawId),
      ),
      keyAgreement: keyAgreements.map(({ keyId: rawId }) =>
        this.convertRawToDidUrlFormat(rawId),
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

    return didAccounts.map(({ account }) => {
      const rawId = account.did;
      return this.convertRawToDidUrlFormat(rawId);
    });
  }

  async fetchNumberOfDidsOwnedByController(
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

  async fetchVerificationMethods(did: string) {
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
    return verificationMethodAccounts.map(({ account }) => account);
  }

  async fetchVerificationRelationships(did: string) {
    const didBase58 = utils.bytes.bs58.encode(Buffer.from(did));
    const relationshipAccounts =
      await this.verifiableDataRegistryProgram.account.verificationRelationship.all(
        [
          {
            memcmp: {
              offset: ACCOUNT_DISCRIMINATOR_SIZE + STRING_LEN_BYTES,
              bytes: didBase58,
            },
          },
        ],
      );
    const authenticationAccounts = relationshipAccounts.filter(
      ({ account }) => account.relationship.authentication !== undefined,
    );
    const assertions = relationshipAccounts.filter(
      ({ account }) => account.relationship.assertion !== undefined,
    );
    const keyAgreementAccounts = relationshipAccounts.filter(
      ({ account }) => account.relationship.keyAgreement !== undefined,
    );

    return {
      authentications: authenticationAccounts.map(({ account }) => account),
      assertions: assertions.map(({ account }) => account),
      keyAgreements: keyAgreementAccounts.map(({ account }) => account),
    };
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

  findDidPDA(programId: web3.PublicKey, did: string) {
    return web3.PublicKey.findProgramAddressSync([keccak_256(did)], programId);
  }

  findVerificationMethodPda(
    programId: web3.PublicKey,
    did: string,
    keyId: string,
  ) {
    return web3.PublicKey.findProgramAddressSync(
      [keccak_256(did + keyId)],
      programId,
    );
  }

  findVerificationRelationshipPdas(
    programId: web3.PublicKey,
    did: string,
    keyId: string,
  ) {
    const [authenticationPda] = web3.PublicKey.findProgramAddressSync(
      [
        keccak_256(
          did + VERIFICATION_RELATIONSHIP.authentication.discriminator + keyId,
        ),
      ],
      programId,
    );
    const [assertionPda] = web3.PublicKey.findProgramAddressSync(
      [
        keccak_256(
          did + VERIFICATION_RELATIONSHIP.assertion.discriminator + keyId,
        ),
      ],
      programId,
    );
    const [keyAgreementPda] = web3.PublicKey.findProgramAddressSync(
      [
        keccak_256(
          did + VERIFICATION_RELATIONSHIP.keyAgreement.discriminator + keyId,
        ),
      ],
      programId,
    );

    return {
      authenticationPda,
      assertionPda,
      keyAgreementPda,
    };
  }

  convertRawToDidUrlFormat(rawDid: string) {
    if (rawDid.startsWith(ZUNI_DID_PREFIX)) {
      throw new Error('Raw DID already in DID URL format');
    }

    return ZUNI_DID_PREFIX + rawDid;
  }

  convertDidUrlToRaw(didUrl: string) {
    if (!didUrl.startsWith(ZUNI_DID_PREFIX)) {
      throw new Error('DID URL is not in DID URL format');
    }

    return didUrl.slice(ZUNI_DID_PREFIX.length);
  }
}
