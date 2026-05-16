import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRepositoriesTable1715900400001 implements MigrationInterface {
  name = 'CreateRepositoriesTable1715900400001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "repositories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "github_repo_id" bigint NOT NULL,
        "name" character varying NOT NULL,
        "full_name" character varying NOT NULL,
        "language" character varying,
        "stars" integer NOT NULL DEFAULT '0',
        "forks" integer NOT NULL DEFAULT '0',
        "is_private" boolean NOT NULL DEFAULT false,
        "description" text,
        "url" character varying,
        "updated_at" TIMESTAMP,
        "synced_at" TIMESTAMP DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_repositories_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_repositories_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_repositories_github_repo_id" UNIQUE ("user_id", "github_repo_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_repositories_user_id" ON "repositories" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "repositories"`);
  }
}
