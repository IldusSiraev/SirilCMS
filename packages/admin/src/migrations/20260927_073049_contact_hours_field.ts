import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Пример из docs/developer.md §«Версионирование контрактов блоков»: contact.workHours → contact.hours.
// Схема (ADD COLUMN) — сгенерировано migrate:create; перенос данных (UPDATE) — дописан вручную,
// т.к. Payload диффует только схему, не значения. workHours НЕ удаляется — остаётся deprecated
// (см. packages/blocks-definitions/src/registry.ts), старые клиентские инсталляции не теряют данные.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_contact" ADD COLUMN "hours" varchar;
  ALTER TABLE "_pages_v_blocks_contact" ADD COLUMN "hours" varchar;
  UPDATE "pages_blocks_contact" SET "hours" = "work_hours" WHERE "hours" IS NULL AND "work_hours" IS NOT NULL;
  UPDATE "_pages_v_blocks_contact" SET "hours" = "work_hours" WHERE "hours" IS NULL AND "work_hours" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_contact" DROP COLUMN "hours";
  ALTER TABLE "_pages_v_blocks_contact" DROP COLUMN "hours";`)
}
