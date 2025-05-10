import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Chat } from 'src/chat/entities/chat.entity';
import { Message } from 'src/chat/entities/message.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { Proposal } from 'src/proposals/entities/proposal.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { Route } from 'src/routes/entities/route.entity';
import { Stop } from 'src/routes/entities/stop.entity';
import { TrackingUpdate } from 'src/tracking/entities/tracking-update.entity';
import { User } from 'src/users/entities/user.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'ep-tiny-unit-a235p9j6.eu-central-1.pg.koyeb.app',
  port: 5432,
  username: 'koyeb-adm',
  password: 'npg_NMS02dRaVPoz',
  database: 'koyebdb',
  ssl: true,
  entities: [
    User,
    Review,
    Route,
    Stop,
    Proposal,
    Chat,
    Message,
    Payment,
    TrackingUpdate,
  ],
  synchronize: true, // Apenas para dev
};
