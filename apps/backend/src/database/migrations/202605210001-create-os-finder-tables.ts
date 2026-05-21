import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOsFinderTables1779200000000 implements MigrationInterface {
  name = 'CreateOsFinderTables1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "saved_repos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "github_repo_id" bigint NOT NULL,
        "owner" character varying NOT NULL,
        "name" character varying NOT NULL,
        "full_name" character varying NOT NULL,
        "description" text,
        "language" character varying,
        "stars" integer NOT NULL DEFAULT 0,
        "forks" integer NOT NULL DEFAULT 0,
        "open_issues" integer NOT NULL DEFAULT 0,
        "ncf_score" double precision,
        "lang_match_score" double precision,
        "last_commit_at" TIMESTAMP,
        "has_contributing" boolean DEFAULT false,
        "license_type" character varying,
        "html_url" character varying NOT NULL,
        "saved_at" TIMESTAMP NOT NULL DEFAULT now(),
        "notes" text,
        "status" character varying NOT NULL DEFAULT 'saved',
        CONSTRAINT "PK_saved_repos_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_saved_repos_user_github" UNIQUE ("user_id", "github_repo_id"),
        CONSTRAINT "FK_saved_repos_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_saved_repos_user" ON "saved_repos" ("user_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "os_finder_searches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "query_text" text,
        "filters_applied" jsonb NOT NULL,
        "result_count" integer,
        "ai_query_used" boolean NOT NULL DEFAULT false,
        "github_query" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_os_finder_searches_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_os_finder_searches_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_os_finder_searches_user" ON "os_finder_searches" ("user_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_os_finder_searches_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "os_finder_searches"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_saved_repos_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "saved_repos"`);
  }
}
