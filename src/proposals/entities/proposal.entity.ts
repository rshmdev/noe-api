import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Route } from '../../routes/entities/route.entity';

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Route)
  route: Route;

  @ManyToOne(() => User) // usuário que vai aceitar ou recusar
  user: User;

  @ManyToOne(() => User) // transportador que enviou
  transportador: User;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'accepted' | 'rejected' | 'paid';

  @CreateDateColumn()
  createdAt: Date;
}
