import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePullRequestsTable1715900400003 implements MigrationInterface {
  name = 'CreatePullRequestsTable1715900400003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "pull_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "repository_id" uuid NOT NULL,
        "github_pr_id" bigint NOT NULL,
        "title" character varying NOT NULL,
        "body" text,
        "state" character varying NOT NULL,
        "author" character varying,
        "created_at" TIMESTAMP NOT NULL,
        "merged_at" TIMESTAMP,
        "closed_at" TIMESTAMP,
        "additions" integer DEFAULT '0',
        "deletions" integer DEFAULT '0',
        "changed_files" integer DEFAULT '0',
        "comments_count" integer DEFAULT '0',
        "commits_count" integer DEFAULT '0',
        "pr_score" float,
        "synced_at" TIMESTAMP DEFAULT now(),
        CONSTRAINT "PK_pull_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pull_requests_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pull_requests_repository_id" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_pull_requests_github_pr_id" UNIQUE ("user_id", "github_pr_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_pull_requests_user_id" ON "pull_requests" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pull_requests_repository_id" ON "pull_requests" ("repository_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pull_requests_state" ON "pull_requests" ("state")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pull_requests_created_at" ON "pull_requests" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pull_requests"`);
  }
}
