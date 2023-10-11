import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IResolverService } from '../resolver/interface.resolver.service';
import { decodeMultibase } from '../utils/multibase';
import { FFMathUtility } from '../utils/zuni-crypto-library/BabyJub/FFMathUtility';
import { ECCUtility } from '../utils/zuni-crypto-library/utility/ECCUtility';
import {
  PublicCredential,
  Schema,
  VCPresentation,
  VCSynthesisError,
} from '../utils/zuni-crypto-library/verifiable_credential/VCInterfaces';
import {
  verifyValidPublicCredential,
  verifyValidSchema,
  verifyVCPresentationFormat,
} from '../utils/zuni-crypto-library/verifiable_credential/VCUtility';
import {
  P,
  PublicCredentialModel,
  SchemaModel,
  VCPresentationModel,
  ZP,
} from './schemas/VCModels';

export enum SubmissionStatus {
  VERIFIED = 'VERIFIED',
  NOT_VERIFIED = 'NOT_VERIFIED',
  REJECTED = 'REJECTED',
}
@Injectable()
export class VCService {
  constructor(
    @InjectModel(PublicCredentialModel.name)
    private readonly publicCredentialModel: Model<PublicCredentialModel<P>>,
    @InjectModel(SchemaModel.name)
    private readonly schemaModel: Model<SchemaModel<P>>,
    @InjectModel(VCPresentationModel.name)
    private readonly vcPresentationModel: Model<VCPresentationModel<P, ZP>>,
    @Inject(IResolverService)
    private readonly resolverService: IResolverService,
  ) {
    this.initVCUtilities();
  }
  async initVCUtilities() {
    await FFMathUtility.initialize();
    ECCUtility.init('secp256k1');
  }

  async storeNewIssuedVC(
    did: string,
    credentialData: PublicCredential<P>,
  ): Promise<PublicCredential<P>> {
    const didDocument: DIDDocumentView =
      await this.resolverService.fetchDIDDocument(did);
    const { verificationMethod } = didDocument;
    const publicKey =
      '04' +
      decodeMultibase(verificationMethod[0].publicKeyMultibase).toString('hex');
    // const uncompressedPrefix = ''; // 04
    // const formattedPublicKey = uncompressedPrefix + publicKey;

    if (credentialData.signatureProof.verificationMethod !== publicKey) {
      throw new Error('Invalid DID key');
    }

    if (!verifyValidPublicCredential(credentialData)) {
      throw new Error(VCSynthesisError.InvalidCredential);
    }

    const vc = await this.publicCredentialModel.findOne({
      id: credentialData.id,
    });

    // okay valid VC
    if (vc) {
      Object.assign(vc, { ...credentialData });
      const vcModelObject = await vc.save();
      return new PublicCredential<P>(vcModelObject.toObject());
    } else {
      const newVC = new this.publicCredentialModel({
        ...credentialData,
      });
      const vcModelObject = await newVC.save();
      return new PublicCredential<P>(vcModelObject.toObject());
    }
  }

  async fetchCreatedVCsByIssuerDID(
    // for issuer
    did: string,
  ): Promise<Array<PublicCredential<P>>> {
    return this.publicCredentialModel.find({ issuer: did });
  }

  async getCreatedVCsByWallet(
    // for holder
    wallet: string,
  ): Promise<Array<PublicCredential<P>>> {
    try {
      const dids = await this.resolverService.fetchDIDsByWallet(wallet);
      const issuedVCs = await this.publicCredentialModel.find({
        holder: { $in: dids },
      });

      return issuedVCs.map((x) => new PublicCredential(x.toObject()));
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async storeNewSchema(did: string, schemaData: Schema<P>): Promise<Schema<P>> {
    const didDocument: DIDDocumentView =
      await this.resolverService.fetchDIDDocument(did);

    const { verificationMethod } = didDocument;

    const publicKey = decodeMultibase(
      verificationMethod[0].publicKeyMultibase,
    ).toString('hex');

    if (schemaData.signatureProof.verificationMethod !== publicKey) {
      throw new Error('Invalid DID key');
    }

    if (!verifyValidSchema(schemaData)) {
      throw new Error(VCSynthesisError.InvalidCredential);
    }

    const sc = await this.schemaModel.findOne({ id: schemaData.id });

    // okay valid VC
    if (sc) {
      Object.assign(sc, { ...schemaData });
      return sc.save().then((data) => new Schema(data.toObject()));
    } else {
      const newSC = new this.schemaModel({
        ...schemaData,
      });
      return newSC.save().then((data) => new Schema(data.toObject()));
    }
  }

  async fetchSchemaById(schemaId: string): Promise<Schema<P>> {
    const res = await this.schemaModel.findOne({ id: schemaId });
    if (!res) throw new Error('Schema Id not found');
    return new Schema(res.toObject());
  }

  async fetchCreatedSchemasByVerifierDID(
    // for issuer
    did: string,
  ): Promise<Array<Schema<P>>> {
    return this.schemaModel.find({ verifier: did });
  }

  async storeNewVCPresentation(
    vcPresentationData: VCPresentation<P, ZP>,
  ): Promise<VCPresentation<P, ZP>> {
    //
    verifyVCPresentationFormat(vcPresentationData);

    const presentation = await this.vcPresentationModel.findOne({
      id: vcPresentationData.id,
    });

    // okay valid VC
    if (presentation) {
      Object.assign(presentation, { ...vcPresentationData });

      return presentation.save().then((x) => new VCPresentation(x.toObject()));
    } else {
      const newPresentation = new this.vcPresentationModel({
        ...vcPresentationData,
      });
      return newPresentation
        .save()
        .then((x) => new VCPresentation(x.toObject()));
    }
  }

  async fetchSchemaSubmissions(
    // for issuer
    did: string,
    schemaId: string,
  ): Promise<Array<VCPresentation<P, ZP>>> {
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
  ): Promise<Array<VCPresentation<P, ZP>>> {
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

    const foundSubmissions = {};

    for (let i = 0; i < submissions.length; ++i) {
      foundSubmissions[submissions[i].id] = true;
      if (submissions[i].schema.verifier !== did) {
        throw new Error(
          `${did} is not verifier of submission ${submissions[i].id}`,
        );
      }
    }
    // validate correct submission Ids
    for (let i = 0; i < submissionIds.length; ++i) {
      if (!foundSubmissions.hasOwnProperty(submissionIds[i])) {
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
