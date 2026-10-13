import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "sizes_sm_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_sm_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_sm_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_sm_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_sm_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_sm_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_md_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_md_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_md_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_md_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_md_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_md_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_lg_filename" varchar;
  CREATE INDEX "media_sizes_sm_sizes_sm_filename_idx" ON "media" USING btree ("sizes_sm_filename");
  CREATE INDEX "media_sizes_md_sizes_md_filename_idx" ON "media" USING btree ("sizes_md_filename");
  CREATE INDEX "media_sizes_lg_sizes_lg_filename_idx" ON "media" USING btree ("sizes_lg_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_sizes_sm_sizes_sm_filename_idx";
  DROP INDEX "media_sizes_md_sizes_md_filename_idx";
  DROP INDEX "media_sizes_lg_sizes_lg_filename_idx";
  ALTER TABLE "media" DROP COLUMN "sizes_sm_url";
  ALTER TABLE "media" DROP COLUMN "sizes_sm_width";
  ALTER TABLE "media" DROP COLUMN "sizes_sm_height";
  ALTER TABLE "media" DROP COLUMN "sizes_sm_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_sm_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_sm_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_md_url";
  ALTER TABLE "media" DROP COLUMN "sizes_md_width";
  ALTER TABLE "media" DROP COLUMN "sizes_md_height";
  ALTER TABLE "media" DROP COLUMN "sizes_md_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_md_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_md_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_lg_url";
  ALTER TABLE "media" DROP COLUMN "sizes_lg_width";
  ALTER TABLE "media" DROP COLUMN "sizes_lg_height";
  ALTER TABLE "media" DROP COLUMN "sizes_lg_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_lg_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_lg_filename";`)
}
