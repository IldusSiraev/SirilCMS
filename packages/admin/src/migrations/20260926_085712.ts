import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_form_submissions_notifications_channel" AS ENUM('email', 'telegram');
  CREATE TYPE "public"."enum_form_submissions_notifications_status" AS ENUM('sent', 'failed');
  CREATE TABLE "forms_notify_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );
  
  CREATE TABLE "form_submissions_notifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"channel" "enum_form_submissions_notifications_channel" NOT NULL,
  	"recipient" varchar NOT NULL,
  	"status" "enum_form_submissions_notifications_status" NOT NULL,
  	"error" varchar
  );
  
  ALTER TABLE "forms_notify_emails" ADD CONSTRAINT "forms_notify_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions_notifications" ADD CONSTRAINT "form_submissions_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "forms_notify_emails_order_idx" ON "forms_notify_emails" USING btree ("_order");
  CREATE INDEX "forms_notify_emails_parent_id_idx" ON "forms_notify_emails" USING btree ("_parent_id");
  CREATE INDEX "form_submissions_notifications_order_idx" ON "form_submissions_notifications" USING btree ("_order");
  CREATE INDEX "form_submissions_notifications_parent_id_idx" ON "form_submissions_notifications" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "forms_notify_emails" CASCADE;
  DROP TABLE "form_submissions_notifications" CASCADE;
  DROP TYPE "public"."enum_form_submissions_notifications_channel";
  DROP TYPE "public"."enum_form_submissions_notifications_status";`)
}
