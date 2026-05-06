import { AlertTriangle, Building2, Briefcase, Loader2, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { BoardModuleNav } from "./BoardModuleNav";
import { toApiError } from "../../../shared/api/contracts";
import {
  assignBoardRole,
  campusLabel,
  getBoardAdminSnapshot,
  getBoardVacancyAlerts,
  listBoardMembersAdmin,
  listBoardRolesAdmin,
  type BoardAssignment,
  type BoardMember,
  type BoardRole,
  type BoardExtraordinaryComposition,
  type IfrnCampus,
} from "../../../services/boardService";

const panelClass =
  "rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-sm shadow-gray-200/40";

const roleCardClass =
  "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow";

function Pill({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "red" | "blue" | "green" | "amber" }) {
  const styles =
    tone === "red"
      ? "bg-red-50 border-red-200 text-red-800"
      : tone === "blue"
        ? "bg-blue-50 border-blue-200 text-blue-800"
        : tone === "green"
          ? "bg-green-50 border-green-200 text-green-800"
          : tone === "amber"
            ? "bg-amber-50 border-amber-200 text-amber-900"
            : "bg-gray-50 border-gray-200 text-gray-700";
  return <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold", styles)}>{children}</span>;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function RoleAssignmentCard({
  role,
  assignment,
  members,
  assignedMemberIds,
  saving,
  onAssign,
}: {
  role: BoardRole;
  assignment?: BoardAssignment;
  members: BoardMember[];
  assignedMemberIds: Set<string>;
  saving: boolean;
  onAssign: (role: BoardRole, memberId: string | null) => void;
}) {
  const currentId = assignment?.memberId ?? "";
  const status = assignment?.status ?? "VACANTE";

  const selectOptions = useMemo(() => {
    const eligible = members.filter(
      (m) => m.isActive && (!assignedMemberIds.has(m.id) || m.id === currentId)
    );
    return [...eligible].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [members, assignedMemberIds, currentId]);

  const member = assignment?.member ?? null;

  return (
    <div className={roleCardClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-5">
        <div className="sm:w-44 md:w-52 shrink-0">
          {member ? (
            member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name}
                className="w-full h-28 sm:h-full min-h-[7rem] sm:min-h-[9rem] rounded-2xl object-cover ring-1 ring-black/[0.06]"
              />
            ) : (
              <div className="w-full h-28 sm:h-full min-h-[7rem] sm:min-h-[9rem] rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center text-2xl font-black ring-1 ring-black/[0.06]">
                {initials(member.name)}
              </div>
            )
          ) : (
            <div
              className={clsx(
                "w-full h-28 sm:h-full min-h-[7rem] sm:min-h-[9rem] rounded-2xl flex items-center justify-center ring-1 ring-black/[0.06]",
                "bg-gray-100 text-gray-500"
              )}
            >
              <Briefcase size={40} strokeWidth={1.5} className="opacity-90" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-extrabold text-regif-dark">{role.title}</p>
              <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{role.competenciesText ?? "—"}</p>
            </div>
            <Pill tone={status === "VACANTE" ? "red" : "green"}>{status === "VACANTE" ? "Vacante" : "Ocupado"}</Pill>
          </div>

          {member ? (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-black/[0.06]"
                />
              ) : (
                <div className="h-11 w-11 shrink-0 rounded-xl bg-white text-gray-700 flex items-center justify-center text-sm font-black ring-1 ring-black/[0.06]">
                  {initials(member.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                <p className="text-xs text-gray-500 truncate">{campusLabel(member.campus)}</p>
              </div>
              <Link
                to={`/admin/board/members/${encodeURIComponent(member.id)}/edit`}
                className="shrink-0 text-xs font-extrabold text-regif-blue hover:text-regif-blue/80 underline underline-offset-2"
              >
                Editar
              </Link>
            </div>
          ) : null}

          <div className="min-w-0">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Nomear membro</label>
            <select
              disabled={saving}
              value={currentId}
              onChange={(e) => {
                const v = e.target.value;
                onAssign(role, v || null);
              }}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20 disabled:opacity-60"
            >
              <option value="">— Vago —</option>
              {selectOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {campusLabel(m.campus)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BoardAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [roles, setRoles] = useState<BoardRole[]>([]);
  const [assignments, setAssignments] = useState<BoardAssignment[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [missingCampi, setMissingCampi] = useState<IfrnCampus[]>([]);
  const [extraordinaryComposition, setExtraordinaryComposition] = useState<BoardExtraordinaryComposition[]>([]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [r, mem, snap, alerts] = await Promise.all([
        listBoardRolesAdmin(),
        listBoardMembersAdmin(),
        getBoardAdminSnapshot(),
        getBoardVacancyAlerts(),
      ]);
      setRoles(r);
      setMembers(mem);
      setAssignments(snap.assignments);
      setMissingCampi(alerts.missingCampi);
      setExtraordinaryComposition(alerts.extraordinaryComposition);
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const execRoles = useMemo(
    () => roles.filter((r) => r.type === "EXECUTIVE").sort((a, b) => b.hierarchyLevel - a.hierarchyLevel),
    [roles]
  );
  const plenaRoles = useMemo(
    () => roles.filter((r) => r.type === "PLENA").sort((a, b) => b.hierarchyLevel - a.hierarchyLevel),
    [roles]
  );

  const assignmentByRoleId = useMemo(() => {
    const map = new Map<string, BoardAssignment>();
    for (const a of assignments) {
      if (!a.isCurrent) continue;
      map.set(a.roleId, a);
    }
    return map;
  }, [assignments]);

  const assignedMemberIds = useMemo(() => {
    const s = new Set<string>();
    for (const a of assignments) if (a.isCurrent && a.memberId) s.add(a.memberId);
    return s;
  }, [assignments]);

  async function assignToRole(role: BoardRole, memberId: string | null) {
    setSavingRoleId(role.id);
    setError(null);
    try {
      const campus =
        role.type === "PLENA"
          ? memberId
            ? (members.find((m) => m.id === memberId)?.campus ?? null)
            : (assignmentByRoleId.get(role.id)?.campus ?? null)
          : null;

      const updated = await assignBoardRole({ roleId: role.id, memberId, campus });
      setAssignments((prev) => {
        const next = prev.filter((a) => a.roleId !== role.id || !a.isCurrent);
        return [updated, ...next];
      });

      const alerts = await getBoardVacancyAlerts();
      setMissingCampi(alerts.missingCampi);
      setExtraordinaryComposition(alerts.extraordinaryComposition);
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setSavingRoleId(null);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
        <BoardModuleNav />
        <div className="flex min-h-[40vh] items-center justify-center text-regif-blue">
          <Loader2 className="animate-spin" size={36} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <BoardModuleNav />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-regif-dark">Nomear membros aos cargos</h1>
          <p className="text-sm text-gray-500">
            Escolha o membro em cada cargo. As alterações são salvas ao mudar a seleção.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savingRoleId ? <Pill tone="blue">Salvando…</Pill> : <Pill tone="gray">Pronto</Pill>}
          <Link
            to="/admin/board/members/new"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
          >
            Novo membro
          </Link>
          <Link
            to="/admin/board/management"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
            title="Textos e período exibidos em Quem somos"
          >
            Informações da gestão
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900" role="alert">
          {error}
        </div>
      )}

      <section className={clsx(panelClass, "space-y-4")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-regif-dark">
            <AlertTriangle className="text-regif-red" size={18} />
            <p className="text-sm font-extrabold">Alerta de vacância (Diretoria Plena)</p>
          </div>
          <Pill tone={missingCampi.length ? "red" : "green"}>
            {missingCampi.length ? `${missingCampi.length} campi sem representante` : "Todos representados"}
          </Pill>
        </div>
        {missingCampi.length ? (
          <div className="flex flex-wrap gap-2">
            {missingCampi.map((c) => (
              <Pill key={c} tone="red">
                <Building2 size={14} className="mr-1" /> {campusLabel(c)}
              </Pill>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Nenhum campus em falta nesta gestão (considerando os registros com campus informado).</p>
        )}
      </section>

      <section className={clsx(panelClass, "space-y-4")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-regif-dark">
            <Sparkles className="text-amber-600" size={18} />
            <p className="text-sm font-extrabold">Composição extraordinária</p>
          </div>
          <Pill tone={extraordinaryComposition.length ? "amber" : "green"}>
            {extraordinaryComposition.length
              ? `${extraordinaryComposition.length} campus com multi-representação`
              : "Sem multi-representação"}
          </Pill>
        </div>
        <p className="text-sm text-gray-600">
          O <b className="text-gray-800">primeiro membro nomeado</b> de cada campus nesta gestão conta como indicação oficial. A partir do{" "}
          <b className="text-gray-800">segundo</b> membro do mesmo campus, trata-se de <b className="text-gray-800">multi-representação</b>{" "}
          (composição extraordinária da REGIF).
        </p>
        {extraordinaryComposition.length ? (
          <ul className="space-y-3">
            {extraordinaryComposition.map((row) => (
              <li
                key={row.campus}
                className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-3 sm:px-4 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="amber">
                    <Building2 size={14} className="mr-1 shrink-0" />
                    {campusLabel(row.campus)} · {row.activeCount} na diretoria
                  </Pill>
                </div>
                {row.members.length ? (
                  <p className="text-sm text-amber-950/90">
                    <span className="font-extrabold text-amber-950">Membros neste campus: </span>
                    {row.members.map((m) => m.name).join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">Nenhum campus com mais de um representante ativo ao mesmo tempo nesta gestão.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-regif-dark px-1">Diretoria Executiva</h2>
        <div className="grid gap-4">
          {execRoles.map((r) => (
            <RoleAssignmentCard
              key={r.id}
              role={r}
              assignment={assignmentByRoleId.get(r.id)}
              members={members}
              assignedMemberIds={assignedMemberIds}
              saving={savingRoleId === r.id}
              onAssign={assignToRole}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="px-1">
          <h2 className="text-base font-bold text-regif-dark">Diretoria Plena</h2>
          <p className="mt-1 text-sm text-gray-500">
            A Plena exige 1 representante por campus no mandato (Art. 43, §1º). O campus do assento segue o campus do membro nomeado.
          </p>
        </div>
        <div className="grid gap-4">
          {plenaRoles.map((r) => (
            <RoleAssignmentCard
              key={r.id}
              role={r}
              assignment={assignmentByRoleId.get(r.id)}
              members={members}
              assignedMemberIds={assignedMemberIds}
              saving={savingRoleId === r.id}
              onAssign={assignToRole}
            />
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => void refresh()}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
      >
        Recarregar
      </button>
    </div>
  );
}
