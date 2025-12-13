-- Migration: Convert legacy roles to new role system
-- 'admin' -> 'master_admin'
-- 'user' -> 'doctor'

UPDATE "users" SET "role" = 'master_admin' WHERE "role" = 'admin';-->statement-breakpoint
UPDATE "users" SET "role" = 'doctor' WHERE "role" = 'user';
