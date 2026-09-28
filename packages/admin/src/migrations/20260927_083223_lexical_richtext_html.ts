import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" ADD COLUMN "subtitle_html" varchar;
  ALTER TABLE "pages_blocks_text_image" ADD COLUMN "body_html" varchar;
  ALTER TABLE "pages_blocks_pricing_plans" ADD COLUMN "description_html" varchar;
  ALTER TABLE "pages_blocks_faq_items" ADD COLUMN "answer_html" varchar;
  ALTER TABLE "pages_blocks_testimonials_items" ADD COLUMN "quote_html" varchar;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "body_html" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "subtitle_html" varchar;
  ALTER TABLE "_pages_v_blocks_text_image" ADD COLUMN "body_html" varchar;
  ALTER TABLE "_pages_v_blocks_pricing_plans" ADD COLUMN "description_html" varchar;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD COLUMN "answer_html" varchar;
  ALTER TABLE "_pages_v_blocks_testimonials_items" ADD COLUMN "quote_html" varchar;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "body_html" varchar;
  ALTER TABLE "posts" ADD COLUMN "body_html" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_body_html" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" DROP COLUMN "subtitle_html";
  ALTER TABLE "pages_blocks_text_image" DROP COLUMN "body_html";
  ALTER TABLE "pages_blocks_pricing_plans" DROP COLUMN "description_html";
  ALTER TABLE "pages_blocks_faq_items" DROP COLUMN "answer_html";
  ALTER TABLE "pages_blocks_testimonials_items" DROP COLUMN "quote_html";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "body_html";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "subtitle_html";
  ALTER TABLE "_pages_v_blocks_text_image" DROP COLUMN "body_html";
  ALTER TABLE "_pages_v_blocks_pricing_plans" DROP COLUMN "description_html";
  ALTER TABLE "_pages_v_blocks_faq_items" DROP COLUMN "answer_html";
  ALTER TABLE "_pages_v_blocks_testimonials_items" DROP COLUMN "quote_html";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "body_html";
  ALTER TABLE "posts" DROP COLUMN "body_html";
  ALTER TABLE "_posts_v" DROP COLUMN "version_body_html";`)
}
