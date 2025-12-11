-- 修复 events 表的 tags 和 images 列类型
-- 执行方法：PGPASSWORD='Qq1477959747!' psql -h 106.13.230.26 -U postgres -d linetime -f fix_event_columns.sql

-- 删除旧的 text[] 类型列
ALTER TABLE events DROP COLUMN IF EXISTS tags;
ALTER TABLE events DROP COLUMN IF EXISTS image_urls;

-- 添加新的 jsonb 类型列
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS images jsonb;

-- 验证修改
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN ('tags', 'images');
