import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Res,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SSEService } from './sse.service';
import { Response } from 'express';
import { EmitEventDto } from './dto/emit-event.dto';
import { ApiResponse } from '@nestjs/swagger';

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
