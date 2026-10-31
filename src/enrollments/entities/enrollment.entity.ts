import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Student } from '@/students/entities/student.entity';
import { Course } from '@/courses/entities/course.entity';

@Entity('enrollments')
@Unique(['student', 'course']) 
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @Column()
  courseId: string;

  @ManyToOne(() => Student, (student) => student.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @ManyToOne(() => Course, (course) => course.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column('decimal', { precision: 10, scale: 2 })
  priceAtEnrollment: number;

  @Column({ default: 'active' })
  status: string; // active, cancelled, etc.

  @CreateDateColumn()
  enrolledAt: Date;
}