import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "pages_slug_idx";
  DROP INDEX "_pages_v_version_version_slug_idx";
  DROP INDEX "posts_slug_idx";
  DROP INDEX "_posts_v_version_version_slug_idx";
  DROP INDEX "categories_slug_idx";
  DROP INDEX "forms_slug_idx";
  CREATE UNIQUE INDEX "site_slug_idx" ON "pages" USING btree ("site_id","slug");
  CREATE INDEX "version_site_version_slug_idx" ON "_pages_v" USING btree ("version_site_id","version_slug");
  CREATE UNIQUE INDEX "site_slug_1_idx" ON "posts" USING btree ("site_id","slug");
  CREATE INDEX "version_site_version_slug_1_idx" ON "_posts_v" USING btree ("version_site_id","version_slug");
  CREATE UNIQUE INDEX "site_slug_2_idx" ON "categories" USING btree ("site_id","slug");
  CREATE UNIQUE INDEX "site_slug_3_idx" ON "forms" USING btree ("site_id","slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "site_slug_idx";
  DROP INDEX "version_site_version_slug_idx";
  DROP INDEX "site_slug_1_idx";
  DROP INDEX "version_site_version_slug_1_idx";
  DROP INDEX "site_slug_2_idx";
  DROP INDEX "site_slug_3_idx";
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE UNIQUE INDEX "forms_slug_idx" ON "forms" USING btree ("slug");`)
}
