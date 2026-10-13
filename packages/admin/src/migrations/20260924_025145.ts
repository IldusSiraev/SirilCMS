import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_sites_theme" ADD VALUE 'mono';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sites" ALTER COLUMN "theme" SET DATA TYPE text;
  ALTER TABLE "sites" ALTER COLUMN "theme" SET DEFAULT 'default'::text;
  DROP TYPE "public"."enum_sites_theme";
  CREATE TYPE "public"."enum_sites_theme" AS ENUM('default');
  ALTER TABLE "sites" ALTER COLUMN "theme" SET DEFAULT 'default'::"public"."enum_sites_theme";
  ALTER TABLE "sites" ALTER COLUMN "theme" SET DATA TYPE "public"."enum_sites_theme" USING "theme"::"public"."enum_sites_theme";`)
}
