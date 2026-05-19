import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastSyncedToUsers1715626920002 implements MigrationInterface {
  name = 'AddLastSyncedToUsers1715626920002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "last_synced_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_synced_at"`);
  }
}
