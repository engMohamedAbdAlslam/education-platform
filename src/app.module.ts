import { Module } from '@nestjs/common';
import { CoreModule } from './core.module'; 
import { AdminsModule } from './admins/admins.module';
import { StudentsModule } from './students/students.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [
    CoreModule,

    AdminsModule,
    StudentsModule,
    CoursesModule,
    EnrollmentsModule,
  ],
})
export class AppModule {}