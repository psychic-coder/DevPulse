import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrScoreReasonToPullRequests1779158400000
  implements MigrationInterface
{
  name = 'AddPrScoreReasonToPullRequests1779158400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pull_requests" ADD COLUMN IF NOT EXISTS "pr_score_reason" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pull_requests" DROP COLUMN IF EXISTS "pr_score_reason"`,
    );
  }
}