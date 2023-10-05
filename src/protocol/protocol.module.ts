import { Module } from '@nestjs/common';
import { ProtocolController } from './protocol.controller';
import { SolanaService } from './solana.service';

@Module({
  controllers: [ProtocolController],
  providers: [SolanaService],
  exports: [SolanaService],
})
export class ProtocolModule {}
