import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Stop } from './stop.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  transportador: User;

  @Column()
  origin: string;

  @Column()
  originDate: Date;

  @Column()
  destination: string;

  @Column()
  destinationDate: Date;

  @Column('int')
  availableSlots: number;

  @Column()
  speciesAccepted: string;

  @Column()
  animalSizeAccepted: string;

  @Column()
  vehicleObservations: string;

  @Column({ nullable: true })
  priceDescription: string; // Ex: "A consultar"

  @Column({ default: 'available' })
  status: 'available' | 'in_progress' | 'completed' | 'cancelled';

  @OneToMany(() => Stop, (stop) => stop.route)
  stops: Stop[];

  @CreateDateColumn()
  createdAt: Date;
}
