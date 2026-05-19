import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrUrlToPullRequests1779162000000
  implements MigrationInterface
{
  name = 'AddPrUrlToPullRequests1779162000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pull_requests" ADD COLUMN IF NOT EXISTS "url" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pull_requests" DROP COLUMN IF EXISTS "url"`,
    );
  }
}