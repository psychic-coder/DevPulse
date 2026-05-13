import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { User } from '../users/entities/user.entity';

export const createTypeOrmOptions = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],
  migrationsRun: true,
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
});
