import * as migration_20260922_173634_init_sites_media_users from './20260922_173634_init_sites_media_users';
import * as migration_20260923_053127 from './20260923_053127';
import * as migration_20260923_162124_t9_blocks from './20260923_162124_t9_blocks';
import * as migration_20260923_180309_t10_blocks from './20260923_180309_t10_blocks';
import * as migration_20260923_185801_t11_blocks from './20260923_185801_t11_blocks';
import * as migration_20260924_025145 from './20260924_025145';
import * as migration_20260924_035646 from './20260924_035646';
import * as migration_20260924_070111 from './20260924_070111';
import * as migration_20260926_085712 from './20260926_085712';
import * as migration_20260926_105237 from './20260926_105237';

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
    name: '20260923_162124_t9_blocks',
  },
  {
    up: migration_20260923_180309_t10_blocks.up,
    down: migration_20260923_180309_t10_blocks.down,
    name: '20260923_180309_t10_blocks',
  },
  {
    up: migration_20260923_185801_t11_blocks.up,
    down: migration_20260923_185801_t11_blocks.down,
    name: '20260923_185801_t11_blocks',
  },
  {
    up: migration_20260924_025145.up,
    down: migration_20260924_025145.down,
    name: '20260924_025145',
  },
  {
    up: migration_20260924_035646.up,
    down: migration_20260924_035646.down,
    name: '20260924_035646',
  },
  {
    up: migration_20260924_070111.up,
    down: migration_20260924_070111.down,
    name: '20260924_070111',
  },
  {
    up: migration_20260926_085712.up,
    down: migration_20260926_085712.down,
    name: '20260926_085712',
  },
  {
    up: migration_20260926_105237.up,
    down: migration_20260926_105237.down,
    name: '20260926_105237'
  },
];
