import type { BoardRoleType, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prismaClient";
import { AppError } from "../../core/http/errors";
import { broadcastBoardUpdate } from "./board.sse";

function yearsBetween(birth: Date, at: Date) {
  let age = at.getFullYear() - birth.getFullYear();
  const m = at.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < birth.getDate())) age -= 1;
  return age;
}

function normalizeCpfDigits(cpfDigits: string) {
  return cpfDigits.replace(/\D/g, "");
}

function isExecHardAgeRestrictedRoleTitle(title: string) {
  const t = title.trim().toLowerCase();
  // Estatuto Art. 41: Presidente/Vice >= 16; Finanças >= 18 (não emancipado)
  return {
    isPresidentOrVice: t === "presidente" || t === "vice-presidente" || t === "vice presidente",
    isFinance: t === "diretor de finanças" || t === "diretor de financas",
  };
}

/**
 * Mandato usado em toda a diretoria: sempre o registro ACTIVE (único editável pelo painel).
 * Se não existir nenhum, cria um padrão — nomeações e membros não dependem de configurar o painel antes.
 */
/** Sempre a única gestão vigente (ACTIVE). Não há troca de gestão pelo painel; registros ARCHIVED no banco são ignorados. */
async function resolveWorkingMandate() {
  const active = await prisma.boardMandate.findFirst({
    where: { status: "ACTIVE" },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
  });
  if (active) return active;
  return prisma.boardMandate.create({
    data: {
      label: "Diretoria REGIF",
      startsAt: new Date(),
      endsAt: null,
      inaugurationAt: null,
      status: "ACTIVE",
    },
  });
}

export async function getCurrentResolvedMandate() {
  return resolveWorkingMandate();
}

async function writeAudit(params: {
  actorUserId: string | null;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "ASSIGN"
    | "UNASSIGN"
    | "DECLARE_VACANCY"
    | "SUBSTITUTE"
    | "STATUS_CHANGE"
    | "GENERATE_PORTARIA";
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  meta?: unknown;
}) {
  await prisma.boardAuditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action as any,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before as any,
      after: params.after as any,
      meta: params.meta as any,
    },
  });
}

export async function listBoardRoles() {
  const items = await prisma.boardRole.findMany({
    orderBy: [{ type: "asc" }, { hierarchyLevel: "desc" }, { title: "asc" }],
  });
  return { items };
}

export async function createMember(actorUserId: string, data: Prisma.BoardMemberCreateInput) {
  const cpf = normalizeCpfDigits(String((data as any).cpf ?? ""));
  try {
    const created = await prisma.boardMember.create({
      data: {
        ...data,
        cpf,
      } as any,
    });
    await writeAudit({
      actorUserId,
      action: "CREATE",
      entityType: "BoardMember",
      entityId: created.id,
      after: { id: created.id, name: created.name, campus: created.campus },
    });
    broadcastBoardUpdate({ kind: "member_created", memberId: created.id });
    return created;
  } catch (e: any) {
    if (e?.code === "P2002") {
      throw new AppError({
        code: "cpf_already_exists",
        statusCode: 409,
        message: "Já existe um membro cadastrado com este CPF.",
      });
    }
    throw e;
  }
}

export async function updateMember(actorUserId: string, id: string, patch: Prisma.BoardMemberUpdateInput) {
  const before = await prisma.boardMember.findUnique({ where: { id } });
  if (!before) throw new AppError({ code: "member_not_found", statusCode: 404, message: "Membro não encontrado." });

  const next = await prisma.boardMember.update({
    where: { id },
    data: patch,
  });

  // Campus do assento acompanha o campus do membro (Plena / alertas). Sem isso, edição do membro não atualiza
  // `board_assignments.campus` e a multi-representação fica defasada até uma nova nomeação.
  if (before.campus !== next.campus) {
    const touched = await prisma.boardAssignment.findMany({
      where: { memberId: id, isCurrent: true, status: "ACTIVE" },
      select: { mandateId: true, roleId: true },
    });
    if (touched.length) {
      await prisma.boardAssignment.updateMany({
        where: { memberId: id, isCurrent: true, status: "ACTIVE" },
        data: { campus: next.campus },
      });
      for (const t of touched) {
        broadcastBoardUpdate({
          kind: "assignment_changed",
          mandateId: t.mandateId,
          roleId: t.roleId,
          memberId: id,
        });
      }
    }
  }

  await writeAudit({
    actorUserId,
    action: "UPDATE",
    entityType: "BoardMember",
    entityId: id,
    before,
    after: next,
  });
  broadcastBoardUpdate({ kind: "member_updated", memberId: id });
  return next;
}

export async function listMembers(params: { q?: unknown; campus?: unknown; isActive?: unknown }) {
  const q = String(params.q ?? "").trim();
  const campus = String(params.campus ?? "").trim();
  const isActive =
    params.isActive === undefined ? undefined : String(params.isActive).toLowerCase() === "true";

  const where: Prisma.BoardMemberWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (campus) where.campus = campus as any;
  if (isActive !== undefined) where.isActive = isActive;

  const items = await prisma.boardMember.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  return { items };
}

export async function updateMandate(
  actorUserId: string,
  id: string,
  patch: {
    label?: string;
    startsAt?: Date;
    endsAt?: Date | null;
    inaugurationAt?: Date | null;
    publicTagline?: string | null;
    publicIntro?: string | null;
    publicMission?: string | null;
    publicActivities?: string | null;
    publicContact?: string | null;
    publicClosingNote?: string | null;
  }
) {
  const working = await resolveWorkingMandate();
  if (id !== working.id) {
    throw new AppError({
      code: "mandate_not_found",
      statusCode: 404,
      message: "Só existe uma gestão editável. Recarregue a página.",
    });
  }
  const before = await prisma.boardMandate.findUnique({ where: { id } });
  if (!before) throw new AppError({ code: "mandate_not_found", statusCode: 404, message: "Gestão não encontrada." });

  const next = await prisma.boardMandate.update({
    where: { id },
    data: {
      ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
      ...(patch.startsAt !== undefined ? { startsAt: patch.startsAt } : {}),
      ...(patch.endsAt !== undefined ? { endsAt: patch.endsAt } : {}),
      ...(patch.inaugurationAt !== undefined ? { inaugurationAt: patch.inaugurationAt } : {}),
      ...(patch.publicTagline !== undefined ? { publicTagline: patch.publicTagline?.trim() || null } : {}),
      ...(patch.publicIntro !== undefined ? { publicIntro: patch.publicIntro?.trim() || null } : {}),
      ...(patch.publicMission !== undefined ? { publicMission: patch.publicMission?.trim() || null } : {}),
      ...(patch.publicActivities !== undefined ? { publicActivities: patch.publicActivities?.trim() || null } : {}),
      ...(patch.publicContact !== undefined ? { publicContact: patch.publicContact?.trim() || null } : {}),
      ...(patch.publicClosingNote !== undefined ? { publicClosingNote: patch.publicClosingNote?.trim() || null } : {}),
    },
  });

  await writeAudit({
    actorUserId,
    action: "UPDATE",
    entityType: "BoardMandate",
    entityId: id,
    before,
    after: next,
  });
  broadcastBoardUpdate({ kind: "mandate_updated", mandateId: id });
  return next;
}

export async function getAdminSnapshot() {
  const mandate = await resolveWorkingMandate();

  const [roles, assignments, members] = await Promise.all([
    prisma.boardRole.findMany({ orderBy: [{ type: "asc" }, { hierarchyLevel: "desc" }, { title: "asc" }] }),
    prisma.boardAssignment.findMany({
      where: { mandateId: mandate.id, isCurrent: true },
      include: { role: true, member: true },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.boardMember.findMany({ where: { isActive: true }, orderBy: [{ name: "asc" }] }),
  ]);

  return {
    mandate,
    roles,
    assignments,
    members,
  };
}

async function validateAssignmentRules(params: {
  mandateId: string;
  role: { id: string; title: string; type: BoardRoleType };
  member: { id: string; birthDate: Date; isEmancipated: boolean; academicAttendancePct: number };
  assignedAt: Date;
}) {
  // Art. 58 (vedação de acúmulo) — garantido por unique, mas retornamos erro amigável antes
  const current = await prisma.boardAssignment.findFirst({
    where: { mandateId: params.mandateId, memberId: params.member.id, isCurrent: true },
    select: { id: true, role: { select: { title: true } } },
  });
  if (current) {
    throw new AppError({
      code: "member_already_assigned",
      statusCode: 409,
      message: `Este membro já ocupa um cargo na gestão vigente (atual: ${current.role.title}).`,
    });
  }
  // Regras rígidas (idade/frequência) removidas: gestões podem ser mais flexíveis.
}

export async function assignRole(actorUserId: string, input: {
  mandateId?: string | null;
  roleId: string;
  memberId?: string | null;
  campus?: string | null;
  assignedAt?: Date | null;
}) {
  const mandate = await resolveWorkingMandate();
  const role = await prisma.boardRole.findUnique({ where: { id: input.roleId } });
  if (!role) throw new AppError({ code: "role_not_found", statusCode: 404, message: "Cargo não encontrado." });

  const assignedAt = input.assignedAt ?? new Date();

  // Campus não é obrigatório (mas melhora transparência e alertas).

  // Se está removendo o ocupante (memberId null): marca como VACANTE, mantendo 1 “assento” atual por cargo
  if (!input.memberId) {
    const current = await prisma.boardAssignment.findFirst({
      where: { mandateId: mandate.id, roleId: role.id, isCurrent: true },
    });

    const updated = current
      ? await prisma.boardAssignment.update({
          where: { id: current.id },
          data: {
            memberId: null,
            campus: input.campus ? (input.campus as any) : current.campus,
            status: "VACANTE",
            assignedAt,
            endedAt: null,
            vacancyReason: null,
            vacancyNote: null,
          },
          include: { role: true, member: true },
        })
      : await prisma.boardAssignment.create({
          data: {
            mandateId: mandate.id,
            roleId: role.id,
            memberId: null,
            campus: input.campus ? (input.campus as any) : null,
            status: "VACANTE",
            isCurrent: true,
            assignedAt,
          },
          include: { role: true, member: true },
        });

    await writeAudit({
      actorUserId,
      action: "UNASSIGN",
      entityType: "BoardAssignment",
      entityId: updated.id,
      after: { id: updated.id, roleId: role.id, status: updated.status },
    });
    broadcastBoardUpdate({ kind: "assignment_vacant", mandateId: mandate.id, roleId: role.id });
    return updated;
  }

  const member = await prisma.boardMember.findUnique({ where: { id: input.memberId } });
  if (!member) throw new AppError({ code: "member_not_found", statusCode: 404, message: "Membro não encontrado." });
  if (!member.isActive) {
    throw new AppError({ code: "member_inactive", statusCode: 400, message: "Não é possível atribuir cargo a membro inativo." });
  }

  await validateAssignmentRules({
    mandateId: mandate.id,
    role: { id: role.id, title: role.title, type: role.type },
    member: {
      id: member.id,
      birthDate: member.birthDate,
      isEmancipated: member.isEmancipated,
      academicAttendancePct: member.academicAttendancePct,
    },
    assignedAt,
  });

  // Campus no assento: explícito (ex.: Plena) ou, se omitido, o campus do membro — necessário para alertas e multi-representação.
  const campusForAssignment =
    input.campus != null && String(input.campus).trim() !== "" ? (input.campus as any) : member.campus;

  const current = await prisma.boardAssignment.findFirst({
    where: { mandateId: mandate.id, roleId: role.id, isCurrent: true },
  });

  const before = current ? await prisma.boardAssignment.findUnique({ where: { id: current.id } }) : null;

  let updated;
  try {
    updated = current
      ? await prisma.boardAssignment.update({
          where: { id: current.id },
          data: {
            memberId: member.id,
            campus: campusForAssignment,
            status: "ACTIVE",
            assignedAt,
            endedAt: null,
            vacancyReason: null,
            vacancyNote: null,
          },
          include: { role: true, member: true },
        })
      : await prisma.boardAssignment.create({
          data: {
            mandateId: mandate.id,
            roleId: role.id,
            memberId: member.id,
            campus: campusForAssignment,
            status: "ACTIVE",
            isCurrent: true,
            assignedAt,
          },
          include: { role: true, member: true },
        });
  } catch (e: unknown) {
    const pe = e as { code?: string; meta?: { target?: string[]; constraint?: string } };
    if (pe.code === "P2002") {
      const target = pe.meta?.target?.join(", ") ?? pe.meta?.constraint ?? "desconhecido";
      throw new AppError({
        code: "assignment_unique_conflict",
        statusCode: 409,
        message: `Conflito ao salvar a nomeação (constraint: ${target}). Se o alvo incluir "campus", execute no backend: npx prisma db execute --file prisma/scripts/fix_drop_campus_unique_board_assignments.sql e reinicie a API. Se o alvo for mandateId+memberId+isCurrent, este membro já ocupa outro cargo nesta gestão.`,
      });
    }
    throw e;
  }

  await writeAudit({
    actorUserId,
    action: "ASSIGN",
    entityType: "BoardAssignment",
    entityId: updated.id,
    before,
    after: updated,
    meta: { mandateId: mandate.id },
  });
  broadcastBoardUpdate({ kind: "assignment_changed", mandateId: mandate.id, roleId: role.id, memberId: member.id });
  return updated;
}

export async function declareVacancy(actorUserId: string, input: {
  mandateId?: string | null;
  roleId: string;
  reason:
    | "MORTE"
    | "ABANDONO"
    | "RENUNCIA"
    | "TRANCAMENTO_OU_JUBILAMENTO"
    | "CONCLUSAO_DE_CURSO"
    | "OUTRO";
  note?: string | null;
  portariaNumber?: string | null;
}) {
  const mandate = await resolveWorkingMandate();
  const role = await prisma.boardRole.findUnique({ where: { id: input.roleId } });
  if (!role) throw new AppError({ code: "role_not_found", statusCode: 404, message: "Cargo não encontrado." });

  const current = await prisma.boardAssignment.findFirst({
    where: { mandateId: mandate.id, roleId: role.id, isCurrent: true },
    include: { member: true },
  });

  const before = current ? { ...current } : null;

  const updated = current
    ? await prisma.boardAssignment.update({
        where: { id: current.id },
        data: {
          memberId: null,
          status: "VACANTE",
          vacancyReason: input.reason as any,
          vacancyNote: input.note ?? null,
          portariaNumber: input.portariaNumber ?? null,
          endedAt: new Date(),
        },
        include: { role: true, member: true },
      })
    : await prisma.boardAssignment.create({
        data: {
          mandateId: mandate.id,
          roleId: role.id,
          memberId: null,
          status: "VACANTE",
          isCurrent: true,
          assignedAt: new Date(),
          endedAt: new Date(),
          vacancyReason: input.reason as any,
          vacancyNote: input.note ?? null,
          portariaNumber: input.portariaNumber ?? null,
        },
        include: { role: true, member: true },
      });

  await prisma.boardVacancyEvent.create({
    data: {
      mandateId: mandate.id,
      assignmentId: updated.id,
      roleId: role.id,
      memberId: current?.memberId ?? null,
      reason: input.reason as any,
      note: input.note ?? null,
      portariaNumber: input.portariaNumber ?? null,
    },
  });

  await writeAudit({
    actorUserId,
    action: "DECLARE_VACANCY",
    entityType: "BoardAssignment",
    entityId: updated.id,
    before,
    after: updated,
    meta: { mandateId: mandate.id, reason: input.reason },
  });
  broadcastBoardUpdate({ kind: "vacancy_declared", mandateId: mandate.id, roleId: role.id, reason: input.reason });
  return updated;
}

export async function listVacancyAlerts(params: { mandateId?: unknown }) {
  const mandate = await resolveWorkingMandate();

  // Campi com pelo menos um membro nomeado em cargo ativo nesta gestão.
  // Usa campus do assento quando existir; senão, campus do membro (cargos executivos costumam vir sem campus no assento).
  const currentWithMember = await prisma.boardAssignment.findMany({
    where: {
      mandateId: mandate.id,
      isCurrent: true,
      status: "ACTIVE",
      memberId: { not: null },
    },
    select: {
      campus: true,
      memberId: true,
      member: { select: { campus: true, name: true } },
    },
  });

  /** Campus de representação: membro é fonte de verdade; assento só complementa se o membro não tiver campus. */
  function effectiveCampus(a: (typeof currentWithMember)[number]): string | null {
    const c = a.member?.campus ?? a.campus;
    return c ? String(c) : null;
  }

  const countByCampus = new Map<string, number>();
  const membersByCampus = new Map<string, Array<{ id: string; name: string }>>();
  for (const a of currentWithMember) {
    const key = effectiveCampus(a);
    if (!key) continue;
    countByCampus.set(key, (countByCampus.get(key) ?? 0) + 1);
    const mid = a.memberId;
    const name = a.member?.name?.trim();
    if (!mid || !name) continue;
    const list = membersByCampus.get(key) ?? [];
    if (!list.some((m) => m.id === mid)) list.push({ id: mid, name });
    membersByCampus.set(key, list);
  }
  for (const [, list] of membersByCampus) {
    list.sort((x, y) => x.name.localeCompare(y.name, "pt-BR"));
  }

  const allCampi = [
    "AVANCADO_LAJES",
    "PAU_DOS_FERROS",
    "MACAU",
    "NATAL_CENTRO_HISTORICO",
    "NATAL_CENTRAL",
    "JOAO_CAMARA",
    "CANGUARETAMA",
    "APODI",
    "PARELHAS",
    "CEARA_MIRIM",
    "IPANGUACU",
    "SAO_PAULO_DO_POTENGI",
    "PARNAMIRIM",
    "NOVA_CRUZ",
    "NATAL_ZONA_NORTE",
    "CURRAIS_NOVOS",
    "SANTA_CRUZ",
    "CAICO",
    "SAO_GONCALO_DO_AMARANTE",
    "MOSSORO",
  ] as const;

  const missing = allCampi.filter((c) => (countByCampus.get(c) ?? 0) === 0);

  // Composição extraordinária: mais de um membro ativo “contando” pelo mesmo campus
  // (1º nomeado = indicação oficial; 2º+ = multi-representação — conferência pela diretoria).
  const extraordinaryComposition = allCampi
    .filter((c) => (countByCampus.get(c) ?? 0) >= 2)
    .map((c) => ({
      campus: c,
      activeCount: countByCampus.get(c)!,
      members: membersByCampus.get(c) ?? [],
    }));

  return { mandateId: mandate.id, missingCampi: missing, extraordinaryComposition };
}

// --- Público (não expor cpf) ---

export async function listPublicBoard(params: {
  campus?: unknown;
  type?: unknown;
  status?: unknown;
}) {
  const mandate = await resolveWorkingMandate();

  const campus = params.campus ? String(params.campus) : null;
  const type = params.type ? String(params.type) : null;
  const status = params.status ? String(params.status) : null;

  const where: Prisma.BoardAssignmentWhereInput = {
    mandateId: mandate.id,
    isCurrent: true,
  };
  if (campus) where.campus = campus as any;
  if (status) where.status = status as any;
  if (type) where.role = { type: type as any };

  const rows = await prisma.boardAssignment.findMany({
    where,
    include: {
      role: true,
      member: {
        select: {
          id: true,
          name: true,
          campus: true,
          course: true,
          suapRegistration: true,
          photoUrl: true,
          publicBio: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: [{ role: { type: "asc" } }, { role: { hierarchyLevel: "desc" } }, { role: { title: "asc" } }],
  });

  const items = rows.map((a) => ({
    id: a.id,
    status: a.status,
    campus: a.campus,
    assignedAt: a.assignedAt,
    role: {
      id: a.role.id,
      title: a.role.title,
      type: a.role.type,
      hierarchyLevel: a.role.hierarchyLevel,
      competenciesText: a.role.competenciesText,
    },
    member: a.member,
  }));

  return {
    mandate: {
      id: mandate.id,
      label: mandate.label,
      startsAt: mandate.startsAt,
      endsAt: mandate.endsAt,
      inaugurationAt: mandate.inaugurationAt,
      publicTagline: mandate.publicTagline,
      publicIntro: mandate.publicIntro,
      publicMission: mandate.publicMission,
      publicActivities: mandate.publicActivities,
      publicContact: mandate.publicContact,
      publicClosingNote: mandate.publicClosingNote,
    },
    items,
  };
}

