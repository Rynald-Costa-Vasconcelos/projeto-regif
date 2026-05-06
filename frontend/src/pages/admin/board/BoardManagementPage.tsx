import { Loader2, Save } from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";

import { BoardModuleNav } from "./BoardModuleNav";
import { toApiError } from "../../../shared/api/contracts";
import { getCurrentBoardManagement, updateBoardManagement, type BoardMandate } from "../../../services/boardService";

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">{children}</label>;
}

type Draft = {
  label: string;
  startsAt: string;
  endsAt: string;
  inaugurationAt: string;
  publicTagline: string;
  publicIntro: string;
  publicMission: string;
  publicActivities: string;
  publicContact: string;
  publicClosingNote: string;
};

function mandateToDraft(m: BoardMandate): Draft {
  return {
    label: m.label ?? "",
    startsAt: String(m.startsAt ?? "").slice(0, 10),
    endsAt: m.endsAt ? String(m.endsAt).slice(0, 10) : "",
    inaugurationAt: m.inaugurationAt ? String(m.inaugurationAt).slice(0, 10) : "",
    publicTagline: m.publicTagline ?? "",
    publicIntro: m.publicIntro ?? "",
    publicMission: m.publicMission ?? "",
    publicActivities: m.publicActivities ?? "",
    publicContact: m.publicContact ?? "",
    publicClosingNote: m.publicClosingNote ?? "",
  };
}

export function BoardManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mandateId, setMandateId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const current = await getCurrentBoardManagement();
      setMandateId(current.id);
      setDraft(mandateToDraft(current));
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function saveMain() {
    if (!mandateId || !draft) return;
    setSaving(true);
    setError(null);
    try {
      await updateBoardManagement(mandateId, {
        label: draft.label.trim(),
        startsAt: draft.startsAt,
        endsAt: draft.endsAt.trim() ? draft.endsAt : null,
        inaugurationAt: draft.inaugurationAt.trim() ? draft.inaugurationAt : null,
        publicTagline: draft.publicTagline.trim() || null,
        publicIntro: draft.publicIntro.trim() || null,
        publicMission: draft.publicMission.trim() || null,
        publicActivities: draft.publicActivities.trim() || null,
        publicContact: draft.publicContact.trim() || null,
        publicClosingNote: draft.publicClosingNote.trim() || null,
      });
      await refresh();
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setSaving(false);
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

  if (!draft || !mandateId) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
        <BoardModuleNav />
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900" role="alert">
            {error}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <BoardModuleNav />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-bold text-regif-dark">Informações da gestão</h1>
          <p className="text-sm text-gray-600 max-w-3xl leading-relaxed">
            Controle dos textos e do período que aparecem na página <b className="text-gray-800">Quem somos</b>. Cadastro de membros e nomeação de cargos{" "}
            <b className="text-gray-800">não dependem</b> deste painel: existe um único registro de gestão no sistema, criado automaticamente se necessário,
            e você o mantém atualizado aqui.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          {saving ? <Pill tone="blue">Salvando…</Pill> : <Pill tone="gray">Pronto</Pill>}
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveMain()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-regif-green px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-green-600 disabled:opacity-60"
          >
            <Save size={18} /> Salvar tudo
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900" role="alert">
          {error}
        </div>
      )}

      <section className={clsx(panelClass, "space-y-5")}>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-black uppercase tracking-widest text-regif-green">Identificação e período</p>
          <p className="text-sm text-gray-500">
            Título e datas aparecem na área institucional da página pública. Atualize quando houver mudança de mandato ou de comunicação oficial.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <FieldLabel>Título da gestão</FieldLabel>
            <input
              value={draft.label}
              onChange={(e) => setDraft((p) => (p ? { ...p, label: e.target.value } : p))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder='Ex.: "Gestão 2026 · Diretoria REGIF"'
            />
          </div>
          <div>
            <FieldLabel>Início do mandato</FieldLabel>
            <input
              type="date"
              value={draft.startsAt}
              onChange={(e) => setDraft((p) => (p ? { ...p, startsAt: e.target.value } : p))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            />
          </div>
          <div>
            <FieldLabel>Término (opcional)</FieldLabel>
            <input
              type="date"
              value={draft.endsAt}
              onChange={(e) => setDraft((p) => (p ? { ...p, endsAt: e.target.value } : p))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            />
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Data de posse (opcional)</FieldLabel>
            <input
              type="date"
              value={draft.inaugurationAt}
              onChange={(e) => setDraft((p) => (p ? { ...p, inaugurationAt: e.target.value } : p))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            />
          </div>
        </div>
      </section>

      <section className={clsx(panelClass, "space-y-5")}>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-black uppercase tracking-widest text-regif-blue">Textos para o site (Quem somos)</p>
          <p className="text-sm text-gray-500">
            Campos opcionais. Use quebras de linha para parágrafos. Deixe em branco para ocultar cada bloco na página pública.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <FieldLabel>Subtítulo / chamada (uma linha ou curta)</FieldLabel>
            <input
              value={draft.publicTagline}
              onChange={(e) => setDraft((p) => (p ? { ...p, publicTagline: e.target.value } : p))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder="Frase que aparece logo abaixo do título na página pública"
            />
          </div>
          <div>
            <FieldLabel>Apresentação</FieldLabel>
            <textarea
              value={draft.publicIntro}
              onChange={(e) => setDraft((p) => (p ? { ...p, publicIntro: e.target.value } : p))}
              rows={5}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder="Quem é a REGIF, contexto do mandato, mensagem de boas-vindas…"
            />
          </div>
          <div>
            <FieldLabel>Missão e objetivos</FieldLabel>
            <textarea
              value={draft.publicMission}
              onChange={(e) => setDraft((p) => (p ? { ...p, publicMission: e.target.value } : p))}
              rows={5}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder="Propósito da gestão, foco do trabalho da diretoria…"
            />
          </div>
          <div>
            <FieldLabel>Atividades e eixos de atuação</FieldLabel>
            <textarea
              value={draft.publicActivities}
              onChange={(e) => setDraft((p) => (p ? { ...p, publicActivities: e.target.value } : p))}
              rows={5}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder="Projetos, frentes de trabalho, calendário simbólico…"
            />
          </div>
          <div>
            <FieldLabel>Contato e redes</FieldLabel>
            <textarea
              value={draft.publicContact}
              onChange={(e) => setDraft((p) => (p ? { ...p, publicContact: e.target.value } : p))}
              rows={4}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder="E-mail institucional, Instagram, link da secre…"
            />
          </div>
          <div>
            <FieldLabel>Nota final / rodapé (opcional)</FieldLabel>
            <textarea
              value={draft.publicClosingNote}
              onChange={(e) => setDraft((p) => (p ? { ...p, publicClosingNote: e.target.value } : p))}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
              placeholder="Observações legais, transparência, última atualização…"
            />
          </div>
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
