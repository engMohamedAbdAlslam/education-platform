import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsModule } from './admins/admins.module';
import { StudentsModule } from './students/students.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [
    // تفعيل ملف الـ .env على مستوى التطبيق بالكامل
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // إعداد اتصال TypeOrm مع PostgreSQL عبر المتغيرات
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'education_db'),
        autoLoadEntities: true, 
        synchronize: true, 
        logging: true, 
      }),
    }),

    AdminsModule,
    StudentsModule,
    CoursesModule,
    EnrollmentsModule,
  ],
})
export class AppModule {}