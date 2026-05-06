-- Permite mais de um vínculo atual com o mesmo campus (composição extraordinária).
-- Remove qualquer UNIQUE em board_assignments que envolva a coluna campus junto ao mandato;
-- o nome da constraint pode variar conforme versão do Prisma / ordem das colunas.

-- Nome típico gerado pelo Prisma:
ALTER TABLE "board_assignments" DROP CONSTRAINT IF EXISTS "board_assignments_mandate_id_campus_is_current_key";

-- Fallback: localiza e remove constraints UNIQUE na tabela que mencionam campus na definição
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
