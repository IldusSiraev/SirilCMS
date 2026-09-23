import * as migration_20260922_173634_init_sites_media_users from './20260922_173634_init_sites_media_users';
import * as migration_20260923_053127 from './20260923_053127';
import * as migration_20260923_162124_t9_blocks from './20260923_162124_t9_blocks';

export const migrations = [
  {
    up: migration_20260922_173634_init_sites_media_users.up,
    down: migration_20260922_173634_init_sites_media_users.down,
    name: '20260922_173634_init_sites_media_users',
  },
  {
    up: migration_20260923_053127.up,
    down: migration_20260923_053127.down,
    name: '20260923_053127',
  },
  {
    up: migration_20260923_162124_t9_blocks.up,
    down: migration_20260923_162124_t9_blocks.down,
    name: '20260923_162124_t9_blocks'
  },
];
