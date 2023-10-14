import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IResolverService } from '../resolver/interface.resolver.service';
import { convertToDidUrlFormat, decodeMultibase } from '../utils/multibase';
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
  VCSubmissionStatus,
  ZP,
} from './schemas/VCModels';

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
    return this.publicCredentialModel.find({
      issuer: convertToDidUrlFormat(did),
    });
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

    if (!verifyValidSchema(schemaData)) {
      throw new Error('Schema is not valid');
    }

    const { verificationMethod } = didDocument;

    const publicKey =
      '04' +
      decodeMultibase(verificationMethod[0].publicKeyMultibase).toString('hex');

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
    return this.schemaModel.find({ verifier: convertToDidUrlFormat(did) });
  }

  async storeNewVCPresentation(
    vcPresentationData: VCPresentation<P, ZP>,
  ): Promise<VCPresentation<P, ZP>> {
    //
    if (!verifyVCPresentationFormat(vcPresentationData))
      throw new Error('Invalid VC Presentation format');

    const presentation = await this.vcPresentationModel.findOne({
      'schema.id': vcPresentationData.schema.id,
      holder: vcPresentationData.holder,
    });

    // okay valid VC
    if (presentation) {
      return new VCPresentation(presentation.toObject());
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
    const presentations = await this.vcPresentationModel.find({
      'schema.verifier': convertToDidUrlFormat(did),
      'schema.id': schemaId,
    });
    return presentations.map((x) => new VCPresentation(x.toObject()));
  }

  async fetchHolderSubmissions(
    // for issuer
    did: string,
    schemaIds: string[],
  ): Promise<Array<VCPresentation<P, ZP>>> {
    if (schemaIds.length <= 0) {
      return this.vcPresentationModel.find({
        holder: convertToDidUrlFormat(did),
      });
    } else {
      return this.vcPresentationModel.find({
        holder: convertToDidUrlFormat(did),
        'schema.id': {
          $in: schemaIds,
        },
      });
    }
  }

  // API for verifier
  async changeSubmissionStatus(
    did: string,
    submissionId: string,
    newStatus: VCSubmissionStatus,
  ): Promise<VCPresentation<P, ZP>> {
    const submission = await this.vcPresentationModel.findOne({
      id: submissionId,
    });

    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    if (submission.schema.verifier !== convertToDidUrlFormat(did)) {
      throw new Error(`${did} is not verifier of submission ${submissionId}`);
    }

    // if (submission.status !== VCSubmissionStatus.NOT_VERIFIED) {
    //   throw new Error(`Submission ${submissionId} is already verified`);
    // }

    await this.vcPresentationModel.updateOne({
      id: submissionId,
      status: newStatus,
    });

    const newSubmission = await this.vcPresentationModel.findOne({
      id: submissionId,
    });
    return new VCPresentation(newSubmission.toObject());
  }
}
