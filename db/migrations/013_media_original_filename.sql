alter table media_asset
  add column if not exists original_filename text;
