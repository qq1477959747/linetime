-- 创建 linetime 数据库
CREATE DATABASE linetime
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- 连接到 linetime 数据库后执行（可选，设置时区）
-- \c linetime
-- SET timezone = 'Asia/Shanghai';
