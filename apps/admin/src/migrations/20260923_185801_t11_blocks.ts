import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_team_variant" AS ENUM('default');
  CREATE TYPE "public"."enum_pages_blocks_portfolio_grid_variant" AS ENUM('default');
  CREATE TYPE "public"."enum_pages_blocks_cta_variant" AS ENUM('default', 'banner');
  CREATE TYPE "public"."enum_pages_blocks_contact_variant" AS ENUM('default');
  CREATE TYPE "public"."enum_pages_blocks_post_list_variant" AS ENUM('default');
  CREATE TYPE "public"."enum_pages_blocks_post_grid_variant" AS ENUM('default');
  CREATE TYPE "public"."enum__pages_v_blocks_team_variant" AS ENUM('default');
  CREATE TYPE "public"."enum__pages_v_blocks_portfolio_grid_variant" AS ENUM('default');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_variant" AS ENUM('default', 'banner');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_variant" AS ENUM('default');
  CREATE TYPE "public"."enum__pages_v_blocks_post_list_variant" AS ENUM('default');
  CREATE TYPE "public"."enum__pages_v_blocks_post_grid_variant" AS ENUM('default');
  CREATE TABLE "pages_blocks_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"photo_id" integer,
  	"link" varchar
  );
  
  CREATE TABLE "pages_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_team_variant" DEFAULT 'default',
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_portfolio_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"link" varchar
  );
  
  CREATE TABLE "pages_blocks_portfolio_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_portfolio_grid_variant" DEFAULT 'default',
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_cta_variant" DEFAULT 'default',
  	"title" varchar,
  	"body" jsonb,
  	"button_text" varchar,
  	"button_link" varchar,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_contact_variant" DEFAULT 'default',
  	"title" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"address" varchar,
  	"work_hours" varchar,
  	"map_link" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_post_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_post_list_variant" DEFAULT 'default',
  	"title" varchar,
  	"limit" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_post_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_post_grid_variant" DEFAULT 'default',
  	"title" varchar,
  	"limit" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"photo_id" integer,
  	"link" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_team_variant" DEFAULT 'default',
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_portfolio_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"link" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_portfolio_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_portfolio_grid_variant" DEFAULT 'default',
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_cta_variant" DEFAULT 'default',
  	"title" varchar,
  	"body" jsonb,
  	"button_text" varchar,
  	"button_link" varchar,
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_contact_variant" DEFAULT 'default',
  	"title" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"address" varchar,
  	"work_hours" varchar,
  	"map_link" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_post_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_post_list_variant" DEFAULT 'default',
  	"title" varchar,
  	"limit" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_post_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_post_grid_variant" DEFAULT 'default',
  	"title" varchar,
  	"limit" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_team_members" ADD CONSTRAINT "pages_blocks_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_members" ADD CONSTRAINT "pages_blocks_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_portfolio_grid_items" ADD CONSTRAINT "pages_blocks_portfolio_grid_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_portfolio_grid_items" ADD CONSTRAINT "pages_blocks_portfolio_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_portfolio_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_portfolio_grid" ADD CONSTRAINT "pages_blocks_portfolio_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact" ADD CONSTRAINT "pages_blocks_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_post_list" ADD CONSTRAINT "pages_blocks_post_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_post_grid" ADD CONSTRAINT "pages_blocks_post_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_members" ADD CONSTRAINT "_pages_v_blocks_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_members" ADD CONSTRAINT "_pages_v_blocks_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_portfolio_grid_items" ADD CONSTRAINT "_pages_v_blocks_portfolio_grid_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_portfolio_grid_items" ADD CONSTRAINT "_pages_v_blocks_portfolio_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_portfolio_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_portfolio_grid" ADD CONSTRAINT "_pages_v_blocks_portfolio_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact" ADD CONSTRAINT "_pages_v_blocks_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_post_list" ADD CONSTRAINT "_pages_v_blocks_post_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_post_grid" ADD CONSTRAINT "_pages_v_blocks_post_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_team_members_order_idx" ON "pages_blocks_team_members" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_members_parent_id_idx" ON "pages_blocks_team_members" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_members_photo_idx" ON "pages_blocks_team_members" USING btree ("photo_id");
  CREATE INDEX "pages_blocks_team_order_idx" ON "pages_blocks_team" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_parent_id_idx" ON "pages_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_path_idx" ON "pages_blocks_team" USING btree ("_path");
  CREATE INDEX "pages_blocks_portfolio_grid_items_order_idx" ON "pages_blocks_portfolio_grid_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_portfolio_grid_items_parent_id_idx" ON "pages_blocks_portfolio_grid_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_portfolio_grid_items_image_idx" ON "pages_blocks_portfolio_grid_items" USING btree ("image_id");
  CREATE INDEX "pages_blocks_portfolio_grid_order_idx" ON "pages_blocks_portfolio_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_portfolio_grid_parent_id_idx" ON "pages_blocks_portfolio_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_portfolio_grid_path_idx" ON "pages_blocks_portfolio_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_image_idx" ON "pages_blocks_cta" USING btree ("image_id");
  CREATE INDEX "pages_blocks_contact_order_idx" ON "pages_blocks_contact" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_parent_id_idx" ON "pages_blocks_contact" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_path_idx" ON "pages_blocks_contact" USING btree ("_path");
  CREATE INDEX "pages_blocks_post_list_order_idx" ON "pages_blocks_post_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_post_list_parent_id_idx" ON "pages_blocks_post_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_post_list_path_idx" ON "pages_blocks_post_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_post_grid_order_idx" ON "pages_blocks_post_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_post_grid_parent_id_idx" ON "pages_blocks_post_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_post_grid_path_idx" ON "pages_blocks_post_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_team_members_order_idx" ON "_pages_v_blocks_team_members" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_members_parent_id_idx" ON "_pages_v_blocks_team_members" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_members_photo_idx" ON "_pages_v_blocks_team_members" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_team_order_idx" ON "_pages_v_blocks_team" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_parent_id_idx" ON "_pages_v_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_path_idx" ON "_pages_v_blocks_team" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_portfolio_grid_items_order_idx" ON "_pages_v_blocks_portfolio_grid_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_portfolio_grid_items_parent_id_idx" ON "_pages_v_blocks_portfolio_grid_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_portfolio_grid_items_image_idx" ON "_pages_v_blocks_portfolio_grid_items" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_portfolio_grid_order_idx" ON "_pages_v_blocks_portfolio_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_portfolio_grid_parent_id_idx" ON "_pages_v_blocks_portfolio_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_portfolio_grid_path_idx" ON "_pages_v_blocks_portfolio_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_image_idx" ON "_pages_v_blocks_cta" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_contact_order_idx" ON "_pages_v_blocks_contact" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_parent_id_idx" ON "_pages_v_blocks_contact" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_path_idx" ON "_pages_v_blocks_contact" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_post_list_order_idx" ON "_pages_v_blocks_post_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_post_list_parent_id_idx" ON "_pages_v_blocks_post_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_post_list_path_idx" ON "_pages_v_blocks_post_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_post_grid_order_idx" ON "_pages_v_blocks_post_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_post_grid_parent_id_idx" ON "_pages_v_blocks_post_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_post_grid_path_idx" ON "_pages_v_blocks_post_grid" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_team_members" CASCADE;
  DROP TABLE "pages_blocks_team" CASCADE;
  DROP TABLE "pages_blocks_portfolio_grid_items" CASCADE;
  DROP TABLE "pages_blocks_portfolio_grid" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_contact" CASCADE;
  DROP TABLE "pages_blocks_post_list" CASCADE;
  DROP TABLE "pages_blocks_post_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_team_members" CASCADE;
  DROP TABLE "_pages_v_blocks_team" CASCADE;
  DROP TABLE "_pages_v_blocks_portfolio_grid_items" CASCADE;
  DROP TABLE "_pages_v_blocks_portfolio_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_contact" CASCADE;
  DROP TABLE "_pages_v_blocks_post_list" CASCADE;
  DROP TABLE "_pages_v_blocks_post_grid" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_team_variant";
  DROP TYPE "public"."enum_pages_blocks_portfolio_grid_variant";
  DROP TYPE "public"."enum_pages_blocks_cta_variant";
  DROP TYPE "public"."enum_pages_blocks_contact_variant";
  DROP TYPE "public"."enum_pages_blocks_post_list_variant";
  DROP TYPE "public"."enum_pages_blocks_post_grid_variant";
  DROP TYPE "public"."enum__pages_v_blocks_team_variant";
  DROP TYPE "public"."enum__pages_v_blocks_portfolio_grid_variant";
  DROP TYPE "public"."enum__pages_v_blocks_cta_variant";
  DROP TYPE "public"."enum__pages_v_blocks_contact_variant";
  DROP TYPE "public"."enum__pages_v_blocks_post_list_variant";
  DROP TYPE "public"."enum__pages_v_blocks_post_grid_variant";`)
}
