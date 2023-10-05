import { ApiResponseProperty } from '@nestjs/swagger';
import { DID } from '../schemas/did.schema';

export class TrustedDIDInfo {
  @ApiResponseProperty()
  did: string;

  @ApiResponseProperty()
  name: string;

  @ApiResponseProperty()
  symbol: string;

  @ApiResponseProperty()
  description: string;

  @ApiResponseProperty()
  logo: string;

  constructor(didInfo: DID) {
    this.did = didInfo.did;
    this.name = didInfo.name;
    this.symbol = didInfo.symbol;
    this.description = didInfo.description;
    this.logo = didInfo.logo;
  }
}
