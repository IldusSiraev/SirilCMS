import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sites_locale" AS ENUM('ru', 'en');
  ALTER TABLE "sites" ALTER COLUMN "locale" SET DEFAULT 'ru'::"public"."enum_sites_locale";
  ALTER TABLE "sites" ALTER COLUMN "locale" SET DATA TYPE "public"."enum_sites_locale" USING "locale"::"public"."enum_sites_locale";
  ALTER TABLE "pages" DROP COLUMN "locale";
  ALTER TABLE "_pages_v" DROP COLUMN "version_locale";
  ALTER TABLE "posts" DROP COLUMN "locale";
  ALTER TABLE "_posts_v" DROP COLUMN "version_locale";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sites" ALTER COLUMN "locale" SET DATA TYPE varchar;
  ALTER TABLE "sites" ALTER COLUMN "locale" SET DEFAULT 'ru';
  ALTER TABLE "pages" ADD COLUMN "locale" varchar DEFAULT 'ru';
  ALTER TABLE "_pages_v" ADD COLUMN "version_locale" varchar DEFAULT 'ru';
  ALTER TABLE "posts" ADD COLUMN "locale" varchar DEFAULT 'ru';
  ALTER TABLE "_posts_v" ADD COLUMN "version_locale" varchar DEFAULT 'ru';
  DROP TYPE "public"."enum_sites_locale";`)
}
