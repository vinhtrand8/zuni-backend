import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Res,
  Sse,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { EmitEventDto } from './dto/emit-event.dto';
import { SSEService } from './sse.service';

@Controller('sse')
export class SSEController {
  constructor(private sseService: SSEService) {}

  @Sse(':uuid')
  sse(
    @Param('uuid') uuid: string,
    @Res() response: Response,
  ): Observable<MessageEvent> {
    if (!uuid) {
      throw new BadRequestException('uuid is required');
    }
    response.on('close', () => this.sseService.deleteEvent('uuid'));
    return this.sseService.sse(uuid);
  }

  @ApiResponse({ type: EmitEventDto })
  @Post('emit')
  post(@Body() body: EmitEventDto) {
    const { uuid, data } = body;
    this.sseService.emitEvent(uuid, data);
  }
}
