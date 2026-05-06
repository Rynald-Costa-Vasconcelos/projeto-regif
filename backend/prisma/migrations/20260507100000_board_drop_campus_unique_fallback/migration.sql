-- Caso a migração anterior não tenha removido a constraint (nome diferente no Postgres).
DO $$
DECLARE
  con_name text;
BEGIN
  FOR con_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = current_schema()
      AND t.relname = 'board_assignments'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%campus%'
  LOOP
    EXECUTE format('ALTER TABLE board_assignments DROP CONSTRAINT IF EXISTS %I', con_name);
  END LOOP;
END $$;
