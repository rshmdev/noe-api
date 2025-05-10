import { Review } from 'src/reviews/entities/review.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: ['NORMAL', 'TRANSPORTER'], type: 'enum' })
  role: 'NORMAL' | 'TRANSPORTER';

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  cnh: string;

  @Column({ nullable: true })
  vehicleInfo: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: 0 })
  totalTrips: number;

  @Column({ default: 0 })
  totalKm: number;

  @Column({ default: 0 })
  animalsTransported: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Review, (review) => review.targetUser)
  reviews: Review[];

  @Column({ nullable: true })
  cpf: string;

  @Column({ nullable: true })
  cnpj: string;

  @Column({ nullable: true })
  vehicleType: string;

  @Column({ nullable: true })
  vehiclePlate: string;

  @Column({ nullable: true })
  documentFrontUrl: string;

  @Column({ nullable: true })
  documentBackUrl: string;

  @Column({ nullable: true })
  cnhUrl: string;

  @Column({ nullable: true })
  selfieUrl: string;

  @Column({ nullable: true })
  vehicleDocumentUrl: string; // <- novo campo
}
