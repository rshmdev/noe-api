import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Route } from './route.entity';
import { Exclude } from 'class-transformer';

@Entity('stops')
export class Stop {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Exclude()
  @ManyToOne(() => Route, (route) => route.stops)
  route: Route;

  @Column()
  location: string;

  @Column()
  arrivalTime: Date;

  @Column()
  departureTime: Date;

  @Column({ nullable: true })
  notes: string;
}
