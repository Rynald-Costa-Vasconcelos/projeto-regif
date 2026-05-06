-- Constraints
SELECT conname AS name, pg_get_constraintdef(c.oid) AS def
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'board_assignments'
ORDER BY contype, conname;

-- Unique indexes (incl. partial)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'board_assignments'
ORDER BY indexname;
