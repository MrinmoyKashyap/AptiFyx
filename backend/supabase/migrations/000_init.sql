-- 000_init.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- We use the default database 'aptifyx' created by docker-compose environment vars.
-- Set timezone to UTC
SET TIME ZONE 'UTC';
