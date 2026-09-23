import * as migration_20260922_173634_init_sites_media_users from './20260922_173634_init_sites_media_users';

export const migrations = [
  {
    up: migration_20260922_173634_init_sites_media_users.up,
    down: migration_20260922_173634_init_sites_media_users.down,
    name: '20260922_173634_init_sites_media_users'
  },
];
