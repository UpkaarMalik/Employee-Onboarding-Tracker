-- Write your DOWN migration here
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
DROP TABLE IF EXISTS tasks;