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
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AuthGuard } from 'src/auth/auth.guard';
import { Account } from 'src/auth/decorators/account.decorators';
import {
  PublicCredential,
  Schema,
  VCPresentation,
} from '../utils/zuni-crypto-library/verifiable_credential/VCInterfaces';
import { P, VCSubmissionStatus, ZP } from './schemas/VCModels';
import { VCService } from './vc.service';

class SimpleInputDTO<T> {
  @ApiProperty()
  data: T;
}

@ApiTags('vc')
@Controller('vc')
export class VCController {
  constructor(private readonly vcService: VCService) {}

  @Post('log')
  async log(@Body() bodyData: any): Promise<void> {
    try {
      console.log('NEw log request ...');
      console.log(bodyData);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

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
    console.log('new traffic ', wallet);
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
      console.log(error);
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
      console.log('Fetch schema by id ', schemaIdInput.data);
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
        new VCPresentation(vcPresentationData.data),
      );
      return new VCPresentation(newVCPresentation);
    } catch (error) {
      console.log(error);
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
    console.log('Getting did ', did);
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
  @ApiOkResponse({
    type: VCPresentation<P, ZP>,
  })
  @Post('change-submission-status')
  async updateSubmissionsStatus(
    // for verifier
    @Account('did') did: string,
    @Body()
    changeSubmissionStatusData: SimpleInputDTO<ChangeVCPresentationStatusInputDto>,
  ): Promise<VCPresentation<P, ZP>> {
    try {
      return await this.vcService.changeSubmissionStatus(
        did,
        changeSubmissionStatusData.data.submissionId,
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
  submissionId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(VCSubmissionStatus)
  newStatus: VCSubmissionStatus;
}
