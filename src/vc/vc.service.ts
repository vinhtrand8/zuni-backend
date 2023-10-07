import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  Credential,
  Schema,
  SubmissionStatus,
  VCPresentation,
} from './schemas/vc.schema';
import { CredentialDto } from './dto/issue-vc-info.dto';
import {
  verifyVCPresentationSignatures,
  verifyValidSchema,
  verifyValidVC,
} from './lib/vc_protocol';
import { CredentialInterface } from './lib/credential';
import { SchemaInterface, VCSynthesisError } from './lib/schema';
import { SchemaDto } from './dto/create-schema.dto';
import { VCPresentationDto } from './dto/create-vc-presentation.dto';
import { VCPresentationInterface } from './lib/presentation';
import { IResolverService } from 'src/resolver/resolver.interface.service';

@Injectable()
export class VCService {
  constructor(
    @InjectModel(Credential.name)
    private readonly credentialModel: Model<Credential>,
    @InjectModel(Schema.name)
    private readonly schemaModel: Model<Schema>,
    @InjectModel(VCPresentation.name)
    private readonly vcPresentationModel: Model<VCPresentation>,
    @Inject(IResolverService)
    private readonly resolverService: IResolverService,
  ) {}

  async storeNewIssuedVC(
    did: string,
    credentialData: CredentialDto,
  ): Promise<Credential> {
    const didDocument: DIDDocumentView =
      await this.resolverService.fetchDIDDocument(did);
    const { verificationMethod } = didDocument;
    const assertion = verificationMethod.find((method) =>
      method.id.endsWith('#client'),
    );
    if (!assertion) {
      throw new Error('Invalid DID key');
    }
    const publicKey = assertion.publicKey;

    const uncompressedPrefix = ''; // 04
    const formattedPublicKey = uncompressedPrefix + publicKey;

    if (credentialData.proof.verificationMethod !== formattedPublicKey) {
      throw new Error('Invalid DID key');
    }

    if (!verifyValidVC(credentialData as CredentialInterface)) {
      throw new Error(VCSynthesisError.InvalidCredential);
    }

    const vc = await this.credentialModel.findOne({ id: credentialData.id });

    // okay valid VC
    if (vc) {
      Object.assign(vc, { ...credentialData });

      return vc.save();
    } else {
      const newVC = new this.credentialModel({
        ...credentialData,
      });
      return newVC.save();
    }
  }

  async fetchCreatedVCsByIssuerDID(
    // for issuer
    did: string,
  ): Promise<Array<Credential>> {
    return this.credentialModel.find({ issuer: did });
  }

  async getCreatedVCsByWallet(
    // for holder
    wallet: string,
  ): Promise<Array<Credential>> {
    try {
      const dids = await this.resolverService.fetchDIDsByWallet(wallet);
      const issuedVCs = await this.credentialModel.find({
        holder: { $in: dids },
      });
      return issuedVCs;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async storeNewSchema(did: string, schemaData: SchemaDto): Promise<Schema> {
    const didDocument: DIDDocumentView =
      await this.resolverService.fetchDIDDocument(did);
    const { verificationMethod } = didDocument;
    const assertion = verificationMethod.find((method) =>
      method.id.endsWith('#client'),
    );
    if (!assertion) {
      throw new Error('Invalid DID key');
    }
    const publicKey = assertion.publicKey;

    console.log(publicKey, ' ', schemaData);

    if (schemaData.proof.verificationMethod !== publicKey) {
      throw new Error('Invalid DID key');
    }

    if (!verifyValidSchema(schemaData as SchemaInterface)) {
      throw new Error(VCSynthesisError.InvalidCredential);
    }

    const sc = await this.schemaModel.findOne({ id: schemaData.id });

    // okay valid VC
    if (sc) {
      Object.assign(sc, { ...schemaData });

      return sc.save();
    } else {
      const newSC = new this.schemaModel({
        ...schemaData,
      });
      return newSC.save();
    }
  }

  async fetchSchemaById(schemaId: string): Promise<Schema> {
    const res = await this.schemaModel.findOne({ id: schemaId });
    if (!res) throw new Error('Schema Id not found');
    return res;
  }

  async fetchCreatedSchemasByVerifierDID(
    // for issuer
    did: string,
  ): Promise<Array<Schema>> {
    return this.schemaModel.find({ verifier: did });
  }

  async storeNewVCPresentation(
    vcPresentationData: VCPresentationDto,
  ): Promise<VCPresentation> {
    if (
      !verifyVCPresentationSignatures(
        vcPresentationData as VCPresentationInterface,
      )
    ) {
      throw new Error(VCSynthesisError.InvalidCredential);
    }

    const presentation = await this.vcPresentationModel.findOne({
      id: vcPresentationData.id,
    });

    // okay valid VC
    if (presentation) {
      Object.assign(presentation, { ...vcPresentationData });

      return presentation.save();
    } else {
      const newPresentation = new this.vcPresentationModel({
        ...vcPresentationData,
      });
      return newPresentation.save();
    }
  }

  async fetchSchemaSubmissions(
    // for issuer
    did: string,
    schemaId: string,
  ): Promise<Array<VCPresentation>> {
    console.log(schemaId, did);
    return this.vcPresentationModel.find({
      'schema.verifier': did,
      'schema.id': schemaId,
    });
  }

  async fetchHolderSubmissions(
    // for issuer
    did: string,
    schemaIds: string[],
  ): Promise<Array<VCPresentation>> {
    if (schemaIds.length <= 0) {
      return this.vcPresentationModel.find({
        holder: did,
      });
    } else {
      return this.vcPresentationModel.find({
        holder: did,
        'schema.id': {
          $in: schemaIds,
        },
      });
    }
  }

  async changeSubmissionStatus(
    // this is for verifier
    did: string,
    submissionIds: Array<string>,
    newStatus: SubmissionStatus,
  ) {
    const submissions = await this.vcPresentationModel.find({
      id: {
        $in: submissionIds,
      },
    });

    const foundSumissions = {};

    for (let i = 0; i < submissions.length; ++i) {
      foundSumissions[submissions[i].id] = true;
      if (submissions[i].schema.verifier !== did) {
        throw new Error(
          `${did} is not verifier of submission ${submissions[i].id}`,
        );
      }
    }
    // validate correct submission Ids
    for (let i = 0; i < submissionIds.length; ++i) {
      if (!foundSumissions.hasOwnProperty(submissionIds[i])) {
        throw new Error(
          `Submission #${submissionIds[i]} not exists or not accessible`,
        );
      }
    }

    return this.vcPresentationModel.updateMany(
      {
        'schema.verifier': did,
        id: {
          $in: submissionIds,
        },
      },
      {
        status: newStatus,
      },
    );
  }
}
