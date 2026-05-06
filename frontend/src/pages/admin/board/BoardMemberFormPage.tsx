import { Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { BoardModuleNav } from "./BoardModuleNav";
import { toApiError } from "../../../shared/api/contracts";
import {
  campusLabel,
  createBoardMember,
  listBoardMembersAdmin,
  updateBoardMember,
  type IfrnCampus,
} from "../../../services/boardService";

const campusOptions: IfrnCampus[] = [
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
];

export function BoardMemberFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    campus: "NATAL_CENTRAL" as IfrnCampus,
    course: "",
    suapRegistration: "",
    birthDate: "",
    isEmancipated: false,
    photoUrl: "",
    publicBio: "",
    isActive: true,
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Backend pode não expor GET /members/:id; então carregamos via listagem e filtramos localmente.
        const all = await listBoardMembersAdmin({ isActive: undefined });
        const m = all.find((x) => x.id === id);
        if (!m) throw new Error("Membro não encontrado.");
        if (cancelled) return;
        setDraft((p) => ({
          ...p,
          name: m.name ?? "",
          cpf: "",
          email: m.email ?? "",
          phone: m.phone ?? "",
          campus: m.campus,
          course: m.course ?? "",
          suapRegistration: m.suapRegistration ?? "",
          birthDate: String(m.birthDate ?? "").slice(0, 10),
          isEmancipated: Boolean(m.isEmancipated),
          photoUrl: m.photoUrl ?? "",
          publicBio: m.publicBio ?? "",
          isActive: Boolean(m.isActive),
        }));
      } catch (e) {
        if (!cancelled) setError(toApiError(e).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
        <BoardModuleNav />
        <div className="flex min-h-[40vh] items-center justify-center text-regif-blue">
          <Loader2 className="animate-spin" size={36} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <BoardModuleNav />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-regif-dark">{isEdit ? "Editar membro" : "Novo membro"}</h1>
          <p className="text-sm text-gray-500">
            {isEdit ? "Atualize os dados do membro." : "Página dedicada para cadastrar um novo membro."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/board/members"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
          >
            Voltar para membros
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900" role="alert">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Nome *</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder="Nome completo"
            />
          </div>

          {!isEdit ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">CPF (interno) *</label>
              <input
                value={draft.cpf}
                onChange={(e) => setDraft((p) => ({ ...p, cpf: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
                placeholder="000.000.000-00"
              />
            </div>
          ) : (
            <div />
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Nascimento *</label>
            <input
              type="date"
              value={draft.birthDate}
              onChange={(e) => setDraft((p) => ({ ...p, birthDate: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Campus *</label>
            <select
              value={draft.campus}
              onChange={(e) => setDraft((p) => ({ ...p, campus: e.target.value as IfrnCampus }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            >
              {campusOptions.map((c) => (
                <option key={c} value={c}>
                  {campusLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">E-mail</label>
            <input
              value={draft.email}
              onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Telefone</label>
            <input
              value={draft.phone}
              onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder="(84) 9xxxx-xxxx"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Curso</label>
            <input
              value={draft.course}
              onChange={(e) => setDraft((p) => ({ ...p, course: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Matrícula (SUAP)</label>
            <input
              value={draft.suapRegistration}
              onChange={(e) => setDraft((p) => ({ ...p, suapRegistration: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Foto (URL)</label>
            <input
              value={draft.photoUrl}
              onChange={(e) => setDraft((p) => ({ ...p, photoUrl: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder="https://..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Mini-bio pública</label>
            <textarea
              value={draft.publicBio}
              onChange={(e) => setDraft((p) => ({ ...p, publicBio: e.target.value }))}
              rows={5}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            />
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-2">
            <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-700">
              <input
                type="checkbox"
                checked={draft.isEmancipated}
                onChange={(e) => setDraft((p) => ({ ...p, isEmancipated: e.target.checked }))}
              />
              Emancipado
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-700">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Ativo
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setError(null);
              try {
                if (!draft.name.trim()) throw new Error("Informe o nome.");
                if (!draft.birthDate) throw new Error("Informe a data de nascimento.");
                if (!isEdit && !draft.cpf.trim()) throw new Error("Informe o CPF.");

                if (!isEdit) {
                  await createBoardMember({
                    name: draft.name.trim(),
                    cpf: draft.cpf.trim(),
                    email: draft.email.trim() || null,
                    phone: draft.phone.trim() || null,
                    campus: draft.campus,
                    course: draft.course.trim() || null,
                    suapRegistration: draft.suapRegistration.trim() || null,
                    birthDate: draft.birthDate,
                    isEmancipated: draft.isEmancipated,
                    photoUrl: draft.photoUrl.trim() || null,
                    publicBio: draft.publicBio.trim() || null,
                    isActive: draft.isActive,
                  });
                } else {
                  await updateBoardMember(id!, {
                    name: draft.name.trim(),
                    email: draft.email.trim() || null,
                    phone: draft.phone.trim() || null,
                    campus: draft.campus,
                    course: draft.course.trim() || null,
                    suapRegistration: draft.suapRegistration.trim() || null,
                    birthDate: draft.birthDate,
                    isEmancipated: draft.isEmancipated,
                    photoUrl: draft.photoUrl.trim() || null,
                    publicBio: draft.publicBio.trim() || null,
                    isActive: draft.isActive,
                  });
                }

                navigate("/admin/board/members");
              } catch (e) {
                setError(toApiError(e).message);
              } finally {
                setSaving(false);
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-regif-green px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-green-600 disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : isEdit ? <Pencil size={18} /> : <Plus size={18} />}
            {isEdit ? "Salvar alterações" : "Cadastrar membro"}
          </button>

          <Link
            to="/admin/board/members"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-50 text-center"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}

