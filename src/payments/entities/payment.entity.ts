import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Proposal } from '../../proposals/entities/proposal.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Proposal)
  proposal: Proposal;

  @Column()
  stripePaymentIntentId: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'paid' | 'confirmed' | 'refunded';

  @Column()
  pickupCode: string;

  @Column()
  deliveryCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  confirmedAt: Date;
}
