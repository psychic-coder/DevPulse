import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommitsTable1715900400002 implements MigrationInterface {
  name = 'CreateCommitsTable1715900400002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "commits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "repository_id" uuid NOT NULL,
        "sha" character varying NOT NULL,
        "message" text NOT NULL,
        "author_name" character varying,
        "author_email" character varying,
        "committed_at" TIMESTAMP NOT NULL,
        "additions" integer DEFAULT '0',
        "deletions" integer DEFAULT '0',
        "files_changed" integer DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_commits_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_commits_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_commits_repository_id" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_commits_sha" UNIQUE ("user_id", "sha")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_commits_user_id" ON "commits" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commits_repository_id" ON "commits" ("repository_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commits_committed_at" ON "commits" ("committed_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "commits"`);
  }
}
