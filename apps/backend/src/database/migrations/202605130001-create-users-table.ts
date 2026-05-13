import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1715626920001 implements MigrationInterface {
  name = 'CreateUsersTable1715626920001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "github_id" character varying NOT NULL,
        "github_username" character varying NOT NULL,
        "display_name" character varying,
        "avatar_url" character varying,
        "email" character varying,
        "github_token" text NOT NULL,
        "refresh_token" text,
        "locale" character varying NOT NULL DEFAULT 'en',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_github_id" UNIQUE ("github_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
