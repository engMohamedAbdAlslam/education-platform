import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Relation } from 'typeorm';
import { Enrollment } from '@/enrollments/entities/enrollment.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Relation<Enrollment>[];
}