import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { AuthGuard } from 'src/auth/auth.guard';
import { Account } from 'src/auth/decorators/account.decorators';
import {
  PublicCredential,
  Schema,
  VCPresentation,
} from '../utils/zuni-crypto-library/verifiable_credential/VCInterfaces';
import { P, ZP } from './schemas/VCModels';
import { SubmissionStatus, VCService } from './vc.service';

class SimpleInputDTO<T> {
  @ApiProperty()
  data: T;
}

@ApiTags('vc')
@Controller('vc')
export class VCController {
  constructor(private readonly vcService: VCService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: PublicCredential<P>,
  })
  @Post('issue-vc')
  async issueVerifiableCredential(
    @Account('did') did: string,
    @Body() bodyData: SimpleInputDTO<PublicCredential<P>>,
  ): Promise<PublicCredential<P>> {
    try {
      const issuedVC = await this.vcService.storeNewIssuedVC(
        did,
        new PublicCredential(bodyData.data),
      );
      return issuedVC;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [PublicCredential<P>],
  })
  @Get('created-vcs')
  async fetchCreatedVCsByIssuerDID(
    @Account('did') did: string,
  ): Promise<Array<PublicCredential<P>>> {
    try {
      const createdVCs = await this.vcService.fetchCreatedVCsByIssuerDID(did);
      return createdVCs;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [PublicCredential<P>],
  })
  @Get('issued-vcs')
  async getCreatedVCsByWallet(
    @Account('wallet') wallet: string,
  ): Promise<Array<PublicCredential<P>>> {
    try {
      const issuedVCs = await this.vcService.getCreatedVCsByWallet(wallet);
      return issuedVCs;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: Schema<P>,
  })
  @Post('create-schema')
  async createShema(
    // for verifier
    @Account('did') did: string,
    @Body() schemaData: SimpleInputDTO<Schema<P>>,
  ): Promise<Schema<P>> {
    try {
      const newSchemaData = await this.vcService.storeNewSchema(
        did,
        new Schema(schemaData.data),
      );
      return newSchemaData;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({
    type: Schema<P>,
  })
  @Post('get-schema')
  async getSchemaById(
    @Body() schemaIdInput: SimpleInputDTO<string>,
  ): Promise<Schema<P>> {
    try {
      const schema = await this.vcService.fetchSchemaById(schemaIdInput.data);
      return schema;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [Schema<P>],
  })
  @Get('created-schemas')
  async fetchCreatedSchemasByVerifierDID(
    @Account('did') did: string,
  ): Promise<Array<Schema<P>>> {
    try {
      return await this.vcService.fetchCreatedSchemasByVerifierDID(did);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({
    type: VCPresentation<P, ZP>,
  })
  @Post('submit-vc-presentation')
  async submitVCPresentation(
    @Body() vcPresentationData: SimpleInputDTO<VCPresentation<P, ZP>>,
  ): Promise<VCPresentation<P, ZP>> {
    try {
      const newVCPresentation = await this.vcService.storeNewVCPresentation(
        vcPresentationData.data,
      );
      return new VCPresentation(newVCPresentation);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [VCPresentation<P, ZP>],
  })
  @Post('schema-submissions')
  async fetchSchemaSubmissions(
    // for verifier
    @Account('did') did: string,
    @Body() schemaIdData: SimpleInputDTO<string>,
  ): Promise<Array<VCPresentation<P, ZP>>> {
    try {
      const schemaSubmissions = await this.vcService.fetchSchemaSubmissions(
        did,
        schemaIdData.data,
      );
      return schemaSubmissions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [VCPresentation<P, ZP>],
  })
  @Post('holder-submissions')
  async fetchHolderSubmissions(
    // fetch the list of submissions of current holder (Did) based on the list of schemaIds
    // for verifier
    @Account('did') did: string,
    @Body() schemaIdsData: SimpleInputDTO<Array<string>>,
  ): Promise<Array<VCPresentation<P, ZP>>> {
    try {
      const holderSubmissions = await this.vcService.fetchHolderSubmissions(
        did,
        schemaIdsData.data,
      );
      return holderSubmissions.map((schema) => new VCPresentation(schema));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('change-submissions-status')
  async changeSubmissionStatus(
    // for verifier
    @Account('did') did: string,
    @Body()
    changeSubmissionStatusData: SimpleInputDTO<ChangeVCPresentationStatusInputDto>,
  ): Promise<void> {
    try {
      await this.vcService.changeSubmissionStatus(
        did,
        changeSubmissionStatusData.data.schemaIds,
        changeSubmissionStatusData.data.newStatus,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
class ChangeVCPresentationStatusInputDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  schemaIds: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(SubmissionStatus)
  newStatus: SubmissionStatus;
}
