import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Relation, DeleteDateColumn } from 'typeorm';
import { Enrollment } from '@/enrollments/entities/enrollment.entity';
import { CourseDiscountType } from '../enums/course-discount-type.enum';
@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', nullable: true })
  discountType: CourseDiscountType;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountValue: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Relation<Enrollment>[];
}