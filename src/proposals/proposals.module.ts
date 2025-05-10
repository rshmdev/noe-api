import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalsService } from './proposals.service';
import { ProposalsController } from './proposals.controller';
import { Proposal } from './entities/proposal.entity';
import { User } from '../users/entities/user.entity';
import { Route } from '../routes/entities/route.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Message } from 'src/chat/entities/message.entity';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposal, User, Route, Chat, Message]),
    ChatModule,
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService, ChatGateway],
})
export class ProposalsModule {}
