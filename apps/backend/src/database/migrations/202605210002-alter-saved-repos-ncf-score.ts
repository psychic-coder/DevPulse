import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterSavedReposNcfScore1779200000001 implements MigrationInterface {
  name = 'AlterSavedReposNcfScore1779200000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "saved_repos" 
      ALTER COLUMN "ncf_score" TYPE jsonb 
      USING CASE 
        WHEN ncf_score IS NULL THEN NULL 
        ELSE jsonb_build_object('total', ncf_score) 
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "saved_repos" 
      ALTER COLUMN "ncf_score" TYPE double precision 
      USING (ncf_score->>'total')::double precision
    `);
  }
}
