import { Loader2, Mail, Pencil, Phone, Plus, Search, Trash2, UserRound } from "lucide-react";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { BoardModuleNav } from "./BoardModuleNav";
import { toApiError } from "../../../shared/api/contracts";
import {
  campusLabel,
  deleteBoardMember,
  listBoardMembersAdmin,
  updateBoardMember,
  type BoardMember,
  type IfrnCampus,
} from "../../../services/boardService";

const panelClass =
  "rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-sm shadow-gray-200/40";

function Pill({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "red" | "blue" | "green" }) {
  const styles =
    tone === "red"
      ? "bg-red-50 border-red-200 text-red-800"
      : tone === "blue"
        ? "bg-blue-50 border-blue-200 text-blue-800"
        : tone === "green"
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-gray-50 border-gray-200 text-gray-700";
  return <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold", styles)}>{children}</span>;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPhone(s?: string | null) {
  if (!s) return "";
  const digits = s.replace(/[^\d]/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits[2]} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return s;
}

export function BoardMembersPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [campus, setCampus] = useState<IfrnCampus | "">("");
  const [onlyActive, setOnlyActive] = useState(true);

  const [items, setItems] = useState<BoardMember[]>([]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await listBoardMembersAdmin({
        q: q.trim() || undefined,
        campus: campus || undefined,
        isActive: onlyActive ? true : undefined,
      });
      setItems(res);
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [items]);

  async function toggleActive(m: BoardMember) {
    setSavingId(m.id);
    setError(null);
    try {
      const updated = await updateBoardMember(m.id, { isActive: !m.isActive });
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setSavingId(null);
    }
  }

  async function removeMember(m: BoardMember) {
    const ok = window.confirm(`Excluir o membro "${m.name}"?\n\nEssa ação não pode ser desfeita.`);
    if (!ok) return;
    setSavingId(m.id);
    setError(null);
    try {
      await deleteBoardMember(m.id);
      setItems((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setSavingId(null);
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
          <h1 className="text-2xl font-bold text-regif-dark">Membros</h1>
          <p className="text-sm text-gray-500">Cards rápidos para visualizar, editar e trocar informações.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/board/members/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-regif-green px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-green-600"
          >
            <Plus size={18} /> Novo membro
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900" role="alert">
          {error}
        </div>
      )}

      <section className={clsx(panelClass, "space-y-4")}>
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome…"
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            />
          </div>

          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value as any)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
          >
            <option value="">Todos os campi</option>
            {(
              [
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
              ] as IfrnCampus[]
            ).map((c) => (
              <option key={c} value={c}>
                {campusLabel(c)}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-800 shadow-sm">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            Só ativos
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <Pill tone="gray">{sorted.length} membros</Pill>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
          >
            Aplicar filtros
          </button>
        </div>
      </section>

      {sorted.length === 0 ? (
        <div className={clsx(panelClass, "text-center py-12")}>
          <UserRound className="mx-auto mb-3 h-12 w-12 text-gray-300" strokeWidth={1.25} />
          <p className="font-bold text-gray-800">Nenhum membro encontrado</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">Ajuste os filtros ou cadastre um novo membro.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sorted.map((m) => {
            const busy = savingId === m.id;
            return (
              <div
                key={m.id}
                className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-5">
                  <div className="sm:w-44 md:w-52 shrink-0">
                    {m.photoUrl ? (
                      <img
                        src={m.photoUrl}
                        alt={m.name}
                        className="w-full h-28 sm:h-full rounded-2xl object-cover ring-1 ring-black/[0.06]"
                      />
                    ) : (
                      <div className="w-full h-28 sm:h-full rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center font-black text-2xl ring-1 ring-black/[0.04]">
                        {initials(m.name)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-extrabold text-regif-dark truncate max-w-[52ch]">{m.name}</p>
                        {!m.isActive ? <Pill tone="red">Inativo</Pill> : null}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500 truncate">{campusLabel(m.campus)}</p>

                      <div className="mt-2 flex flex-col gap-1.5 text-sm text-gray-600">
                        {m.email ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail size={16} className="text-gray-400 shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </div>
                        ) : null}
                        {m.phone ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <Phone size={16} className="text-gray-400 shrink-0" />
                            <span className="truncate">{formatPhone(m.phone)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {m.publicBio ? <p className="text-sm text-gray-600 line-clamp-3">{m.publicBio}</p> : null}
                    <div className={clsx("mt-3 flex flex-wrap items-center gap-2", !m.publicBio && "mt-0")}>
                      <Link
                        to={`/admin/board/members/${encodeURIComponent(m.id)}/edit`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50"
                        title="Editar membro"
                      >
                        <Pencil size={16} /> Editar
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleActive(m)}
                        className={clsx(
                          "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold border",
                          m.isActive
                            ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                            : "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
                          busy && "opacity-60"
                        )}
                        title={m.isActive ? "Desativar" : "Ativar"}
                      >
                        {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                        {m.isActive ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void removeMember(m)}
                        className={clsx(
                          "inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-800 hover:bg-red-100",
                          busy && "opacity-60"
                        )}
                        title="Excluir membro"
                      >
                        {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

