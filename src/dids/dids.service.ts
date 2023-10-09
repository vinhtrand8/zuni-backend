import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateWriteOpResult } from 'mongoose';
import { CreateDIDInfoDto } from './dto/create-did-info.dto';
import { TrustedDIDInfo } from './dto/trusted-did-info-dto';
import { DID } from './schemas/did.schema';

@Injectable()
export class DIDsService {
  constructor(@InjectModel(DID.name) private readonly didModel: Model<DID>) {}

  async storeDID(
    did: string,
    createDidProfileDto: CreateDIDInfoDto,
    logo: string,
  ): Promise<DID> {
    const newDID = new this.didModel({
      did,
      logo,
      ...createDidProfileDto,
    });
    return newDID.save();
  }

  getDID(did: string): Promise<DID> {
    return this.didModel.findOne({ did });
  }

  async searchTrustedDIDInfo(did: string): Promise<TrustedDIDInfo> {
    const didInfo = await this.didModel.findOne({ did });
    if (!didInfo) {
      throw new Error('DID not found');
    }
    return new TrustedDIDInfo(didInfo);
  }

  async getTrustedDIDInfos(did: string): Promise<TrustedDIDInfo[]> {
    const didInfo = await this.didModel.findOne({ did });
    if (!didInfo) {
      throw new Error('DID not found');
    }
    const trustedDIDs = didInfo.trustedDIDs;
    const didInfos = await this.didModel.find({ did: { $in: trustedDIDs } });
    return trustedDIDs.map((trustedDID) => {
      const didInfo = didInfos.find((didInfo) => didInfo.did === trustedDID);
      if (didInfo) {
        return new TrustedDIDInfo(didInfo);
      }
      const noDIDInfo: TrustedDIDInfo = {
        did: trustedDID,
        name: '',
        symbol: '',
        description: '',
        logo: '',
      };
      return noDIDInfo;
    });
  }

  addTrustedDID(did: string, trustedDID: string): Promise<UpdateWriteOpResult> {
    return this.didModel.updateOne(
      { did },
      { $addToSet: { trustedDIDs: trustedDID } },
    );
  }

  removeTrustedDID(
    did: string,
    trustedDID: string,
  ): Promise<UpdateWriteOpResult> {
    return this.didModel.updateOne(
      { did },
      { $pull: { trustedDIDs: trustedDID } },
    );
  }
}
