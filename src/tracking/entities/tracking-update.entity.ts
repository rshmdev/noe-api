import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Route } from '../../routes/entities/route.entity';

@Entity('tracking_updates')
export class TrackingUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Route)
  route: Route;

  @Column('decimal')
  lat: number;

  @Column('decimal')
  lng: number;

  @Column({
    type: 'enum',
    enum: ['waiting_pickup', 'in_transit', 'delivered'],
    default: 'in_transit',
  })
  status: 'waiting_pickup' | 'in_transit' | 'delivered';

  @CreateDateColumn()
  createdAt: Date;
}
