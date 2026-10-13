import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_cases_variant" AS ENUM('card');
  CREATE TYPE "public"."enum__pages_v_blocks_cases_variant" AS ENUM('card');
  ALTER TYPE "public"."enum_sites_theme" ADD VALUE 'client';
  CREATE TABLE "pages_blocks_cases_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_cases_variant" DEFAULT 'card',
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cases_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_cases_variant" DEFAULT 'card',
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cases" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"site_id" integer NOT NULL,
  	"page_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cases_id" integer;
  ALTER TABLE "pages_blocks_cases_items" ADD CONSTRAINT "pages_blocks_cases_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cases" ADD CONSTRAINT "pages_blocks_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cases_items" ADD CONSTRAINT "_pages_v_blocks_cases_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cases" ADD CONSTRAINT "_pages_v_blocks_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_cases_items_order_idx" ON "pages_blocks_cases_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_cases_items_parent_id_idx" ON "pages_blocks_cases_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cases_order_idx" ON "pages_blocks_cases" USING btree ("_order");
  CREATE INDEX "pages_blocks_cases_parent_id_idx" ON "pages_blocks_cases" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cases_path_idx" ON "pages_blocks_cases" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cases_items_order_idx" ON "_pages_v_blocks_cases_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cases_items_parent_id_idx" ON "_pages_v_blocks_cases_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cases_order_idx" ON "_pages_v_blocks_cases" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cases_parent_id_idx" ON "_pages_v_blocks_cases" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cases_path_idx" ON "_pages_v_blocks_cases" USING btree ("_path");
  CREATE INDEX "cases_site_idx" ON "cases" USING btree ("site_id");
  CREATE INDEX "cases_page_idx" ON "cases" USING btree ("page_id");
  CREATE INDEX "cases_updated_at_idx" ON "cases" USING btree ("updated_at");
  CREATE INDEX "cases_created_at_idx" ON "cases" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cases_fk" FOREIGN KEY ("cases_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_cases_id_idx" ON "payload_locked_documents_rels" USING btree ("cases_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_cases_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cases_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_cases_items" CASCADE;
  DROP TABLE "pages_blocks_cases" CASCADE;
  DROP TABLE "_pages_v_blocks_cases_items" CASCADE;
  DROP TABLE "_pages_v_blocks_cases" CASCADE;
  DROP TABLE "cases" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cases_fk";
  
  ALTER TABLE "sites" ALTER COLUMN "theme" SET DATA TYPE text;
  ALTER TABLE "sites" ALTER COLUMN "theme" SET DEFAULT 'default'::text;
  DROP TYPE "public"."enum_sites_theme";
  CREATE TYPE "public"."enum_sites_theme" AS ENUM('default', 'mono');
  ALTER TABLE "sites" ALTER COLUMN "theme" SET DEFAULT 'default'::"public"."enum_sites_theme";
  ALTER TABLE "sites" ALTER COLUMN "theme" SET DATA TYPE "public"."enum_sites_theme" USING "theme"::"public"."enum_sites_theme";
  DROP INDEX "payload_locked_documents_rels_cases_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cases_id";
  DROP TYPE "public"."enum_pages_blocks_cases_variant";
  DROP TYPE "public"."enum__pages_v_blocks_cases_variant";`)
}
