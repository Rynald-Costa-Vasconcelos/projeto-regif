-- Remove permissão de auditoria (relação em _PermissionToRole em cascata pelo FK em A -> permissions)
DELETE FROM "permissions" WHERE "slug" = 'system.audit';

-- Remove tabela de logs de auditoria
DROP TABLE IF EXISTS "audit_logs";
