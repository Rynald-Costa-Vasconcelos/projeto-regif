-- Remove qualquer UNIQUE (constraint ou índice) em board_assignments que envolva a coluna campus.
-- O Prisma às vezes cria UNIQUE INDEX em vez de CONSTRAINT; o migrate anterior pode não ter removido.

-- 1) Constraints UNIQUE cuja definição menciona campus
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = current_schema()
      AND t.relname = 'board_assignments'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%campus%'
  LOOP
    EXECUTE format('ALTER TABLE board_assignments DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- 2) Índices UNIQUE (não PK) cuja definição menciona campus — ex.: partial unique index
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schemaname, c.relname AS idx_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indexrelid = c.oid
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace tn ON tn.oid = t.relnamespace
    WHERE tn.nspname = current_schema()
      AND t.relname = 'board_assignments'
      AND i.indisunique
      AND NOT i.indisprimary
      AND pg_get_indexdef(i.indexrelid) ILIKE '%campus%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', r.schemaname, r.idx_name);
  END LOOP;
END $$;
