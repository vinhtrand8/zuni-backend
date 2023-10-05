import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CredentialDto } from './dto/issue-vc-info.dto';
import { Account } from 'src/auth/decorators/account.decorators';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { VCService } from './vc.service';
import { Credential, Schema, VCPresentation } from './schemas/vc.schema';
import { SchemaDto, SchemaIdInputDto } from './dto/create-schema.dto';
import {
  ChangeVCPresentationStatusInputDto,
  VCPresentationDto,
} from './dto/create-vc-presentation.dto';
import {
  HolderSubmissionsInputDto,
  SchemaSubmissionsInputDto,
} from './dto/get-vc-presentations.dto';

@ApiTags('vc')
@Controller('vc')
export class VCController {
  constructor(private readonly vcService: VCService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: Credential,
  })
  @Post('issue-vc')
  async issueVerifiableCredential(
    @Account('did') did: string,
    @Body() credentialData: CredentialDto,
  ) {
    try {
      const issuedVC = await this.vcService.storeNewIssuedVC(
        did,
        credentialData,
      );
      return new Credential(issuedVC);
    } catch (error) {
      console.log('issue-vc error:', error);
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [Credential],
  })
  @Get('created-vcs')
  async fetchCreatedVCsByIssuerDID(@Account('did') did: string) {
    try {
      const createdVCs = await this.vcService.fetchCreatedVCsByIssuerDID(did);
      return createdVCs.map((vc) => new Credential(vc));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [Credential],
  })
  @Get('issued-vcs')
  async getCreatedVCsByWallet(@Account('wallet') wallet: string) {
    try {
      const issuedVCs = await this.vcService.getCreatedVCsByWallet(wallet);
      return issuedVCs.map((vc) => new Credential(vc));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: Schema,
  })
  @Post('create-schema')
  async createShema(
    // for verifier
    @Account('did') did: string,
    @Body() schemaData: SchemaDto,
  ) {
    try {
      const newSchemaData = await this.vcService.storeNewSchema(
        did,
        schemaData,
      );
      return new Schema(newSchemaData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({
    type: Schema,
  })
  @Post('get-schema')
  async getSchemaById(@Body() schemaIdInput: SchemaIdInputDto) {
    try {
      const schema = await this.vcService.fetchSchemaById(
        schemaIdInput.schemaId,
      );
      return new Schema(schema);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [Schema],
  })
  @Get('created-schemas')
  async fetchCreatedSchemasByVerifierDID(@Account('did') did: string) {
    try {
      return await this.vcService
        .fetchCreatedSchemasByVerifierDID(did)
        .then((arr) => arr.map((x) => new Schema(x)));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({
    type: VCPresentation,
  })
  @Post('submit-vc-presentation')
  async submitVCPresentation(@Body() vcPresentationData: VCPresentationDto) {
    try {
      const newVCPresentation = await this.vcService.storeNewVCPresentation(
        vcPresentationData,
      );
      return new VCPresentation(newVCPresentation);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [VCPresentation],
  })
  @Post('schema-submissions')
  async fetchSchemaSubmissions(
    // for verifier
    @Account('did') did: string,
    @Body() schemaIdData: SchemaSubmissionsInputDto,
  ) {
    try {
      const schemaSubmissions = await this.vcService.fetchSchemaSubmissions(
        did,
        schemaIdData.schemaId,
      );
      return schemaSubmissions.map((schema) => new VCPresentation(schema));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [VCPresentation],
  })
  @Post('holder-submissions')
  async fetchHolderSubmissions(
    // fetch the list of submissions of current holder (Did) based on the list of schemaIds
    // for verifier
    @Account('did') did: string,
    @Body() schemaIdsData: HolderSubmissionsInputDto,
  ) {
    try {
      const holderSubmissions = await this.vcService.fetchHolderSubmissions(
        did,
        schemaIdsData.schemaIds,
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
    @Body() data: ChangeVCPresentationStatusInputDto,
  ) {
    try {
      return await this.vcService.changeSubmissionStatus(
        did,
        data.schemaIds,
        data.newStatus,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
