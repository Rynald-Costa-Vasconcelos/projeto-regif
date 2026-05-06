import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Loader2, Network, Users } from "lucide-react";
import clsx from "clsx";

import {
  campusLabel,
  listPublicBoard,
  type BoardAssignmentStatus,
  type BoardPublicMandateInfo,
  type BoardRoleType,
  type IfrnCampus,
} from "../../services/boardService";
import { toApiError } from "../../shared/api/contracts";

const panelClass =
  "rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-sm shadow-gray-200/40";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700">
      {children}
    </span>
  );
}

function formatBoardDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "long" });
  } catch {
    return String(iso).slice(0, 10);
  }
}

/** Posse é opcional no cadastro; backend pode enviar epoch (null SQL → 1969/1970 no BR). */
function hasMeaningfulBoardDate(iso?: string | null) {
  if (iso == null || !String(iso).trim()) return false;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t) || t <= 0) return false;
  return true;
}

function TextBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2 pt-6 first:pt-0 border-t border-gray-100 first:border-0">
      <h3 className="text-sm font-extrabold uppercase tracking-wide text-regif-dark">{title}</h3>
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  );
}

function MemberCard({
  roleTitle,
  roleType,
  campus,
  status,
  name,
  photoUrl,
  bio,
  competenciesText,
}: {
  roleTitle: string;
  roleType: BoardRoleType;
  campus?: IfrnCampus | null;
  status: BoardAssignmentStatus;
  name: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  competenciesText?: string | null;
}) {
  const vacant = status === "VACANTE" || !name;
  return (
    <div className={clsx(panelClass, "p-4 sm:p-5")}>
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          {photoUrl && !vacant ? (
            <img src={photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full grid place-items-center text-gray-300">
              <Users size={22} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-regif-dark">{roleTitle}</p>
            <Badge>{roleType === "EXECUTIVE" ? "Executiva" : "Plena"}</Badge>
            {campus ? <Badge>{campusLabel(campus)}</Badge> : null}
            <Badge>{vacant ? "Cargo vacante" : "Em exercício"}</Badge>
          </div>
          <p className={clsx("mt-1 text-base font-bold", vacant ? "text-gray-500" : "text-gray-900")}>
            {vacant ? "Vacante" : name}
          </p>
          {bio && !vacant ? <p className="mt-1 text-sm text-gray-600 line-clamp-3">{bio}</p> : null}
          {competenciesText ? (
            <p className="mt-3 text-xs text-gray-500 leading-relaxed line-clamp-4">{competenciesText}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function QuemSomos() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type PublicBoardItem = {
    id: string;
    status: BoardAssignmentStatus;
    campus?: IfrnCampus | null;
    role: {
      id: string;
      title: string;
      type: BoardRoleType;
      hierarchyLevel: number;
      competenciesText?: string | null;
    };
    member?: { name: string; photoUrl?: string | null; publicBio?: string | null; campus: IfrnCampus } | null;
  };

  const [items, setItems] = useState<PublicBoardItem[]>([]);
  const [mandateInfo, setMandateInfo] = useState<BoardPublicMandateInfo | null>(null);

  const [campus, setCampus] = useState<IfrnCampus | "ALL">("ALL");
  const [type, setType] = useState<BoardRoleType | "ALL">("ALL");
  const [status, setStatus] = useState<BoardAssignmentStatus | "ALL">("ALL");

  const loadOnce = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const out = await listPublicBoard();
      setItems(out.items as PublicBoardItem[]);
      setMandateInfo(out.mandate ?? null);
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOnce();

    const url = new URL("/api/board/public/stream", window.location.origin);
    const es = new EventSource(url.toString());
    es.addEventListener("board_update", () => {
      void loadOnce();
    });
    es.onerror = () => {};
    return () => {
      es.close();
    };
  }, [loadOnce]);

  const filtered = useMemo(() => {
    return items
      .filter((x) => (type === "ALL" ? true : x.role.type === type))
      .filter((x) => (status === "ALL" ? true : x.status === status))
      .filter((x) => {
        if (campus === "ALL") return true;
        const c = x.campus ?? x.member?.campus ?? null;
        return c === campus;
      })
      .sort((a, b) => {
        if (a.role.type !== b.role.type) return a.role.type === "EXECUTIVE" ? -1 : 1;
        return b.role.hierarchyLevel - a.role.hierarchyLevel || a.role.title.localeCompare(b.role.title);
      });
  }, [items, campus, type, status]);

  const allCampi = useMemo(() => {
    const set = new Set<IfrnCampus>();
    for (const it of items) {
      if (it.campus) set.add(it.campus);
      if (it.member?.campus) set.add(it.member.campus);
    }
    return Array.from(set).sort((a, b) => campusLabel(a).localeCompare(campusLabel(b)));
  }, [items]);

  const aboutBlocks =
    mandateInfo &&
    (mandateInfo.publicIntro ||
      mandateInfo.publicMission ||
      mandateInfo.publicActivities ||
      mandateInfo.publicContact ||
      mandateInfo.publicClosingNote);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 space-y-6 animate-in fade-in duration-300">
      {/* Gestão: um único painel — título, mandato e textos institucionais — sem cartões internos */}
      <section className={clsx(panelClass, "space-y-0")}>
        <div className="flex flex-col gap-2 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-regif-blue">
            <Network size={18} />
            <p className="text-sm font-extrabold uppercase tracking-wide">Transparência</p>
          </div>
          <h1 className="text-3xl font-extrabold text-regif-dark tracking-tight">Quem Somos</h1>
          <p className="text-lg font-bold text-regif-blue">{mandateInfo?.label?.trim() || "Gestão"}</p>
          <p className="text-sm text-gray-600 max-w-3xl pt-1">
            {mandateInfo?.publicTagline?.trim() ||
              "Organograma e composição das Diretorias Executiva e Plena, com status do mandato e competências estatutárias."}
          </p>
        </div>

        {mandateInfo ? (
          <div className="py-6 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Mandato</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-800">
                <time dateTime={mandateInfo.startsAt}>{formatBoardDate(mandateInfo.startsAt)}</time>
                {mandateInfo.endsAt ? (
                  <>
                    {" "}
                    <span className="font-normal text-gray-400">—</span>{" "}
                    <time dateTime={mandateInfo.endsAt}>{formatBoardDate(mandateInfo.endsAt)}</time>
                  </>
                ) : null}
              </span>
              {hasMeaningfulBoardDate(mandateInfo.inaugurationAt) ? (
                <span className="text-gray-500">
                  {" "}
                  <span className="text-gray-300 mx-1">·</span> Posse:{" "}
                  <time dateTime={String(mandateInfo.inaugurationAt)} className="font-semibold text-gray-800">
                    {formatBoardDate(mandateInfo.inaugurationAt)}
                  </time>
                </span>
              ) : null}
            </p>
          </div>
        ) : null}

        {aboutBlocks ? (
          <div className="pt-2">
            <div className="flex items-center gap-2 text-regif-dark pb-2">
              <Users size={18} />
              <p className="text-sm font-extrabold">Sobre esta gestão</p>
            </div>
            <div>
              {mandateInfo.publicIntro?.trim() ? <TextBlock title="Apresentação" body={mandateInfo.publicIntro.trim()} /> : null}
              {mandateInfo.publicMission?.trim() ? <TextBlock title="Missão e objetivos" body={mandateInfo.publicMission.trim()} /> : null}
              {mandateInfo.publicActivities?.trim() ? (
                <TextBlock title="Atividades e eixos" body={mandateInfo.publicActivities.trim()} />
              ) : null}
              {mandateInfo.publicContact?.trim() ? <TextBlock title="Contato e redes" body={mandateInfo.publicContact.trim()} /> : null}
              {mandateInfo.publicClosingNote?.trim() ? (
                <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap border-t border-gray-100 pt-6 mt-6">
                  {mandateInfo.publicClosingNote.trim()}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className={clsx(panelClass, "space-y-4")}>
        <div className="flex items-center gap-2 text-regif-dark">
          <Filter size={18} />
          <p className="text-sm font-extrabold">Filtros</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Campus</label>
            <select
              value={campus}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "ALL") return setCampus("ALL");
                setCampus(v as IfrnCampus);
              }}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            >
              <option value="ALL">Todos</option>
              {allCampi.map((c) => (
                <option key={c} value={c}>
                  {campusLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Diretoria</label>
            <select
              value={type}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "ALL") return setType("ALL");
                setType(v as BoardRoleType);
              }}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            >
              <option value="ALL">Todas</option>
              <option value="EXECUTIVE">Executiva</option>
              <option value="PLENA">Plena</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "ALL") return setStatus("ALL");
                setStatus(v as BoardAssignmentStatus);
              }}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-regif-blue focus:outline-none focus:ring-2 focus:ring-regif-blue/20"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Ativo</option>
              <option value="VACANTE">Vacante</option>
              <option value="RENUNCIA">Renúncia</option>
              <option value="EGRESSO">Egresso</option>
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-regif-blue">
          <Loader2 className="animate-spin" size={36} />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900" role="alert">
          {error}
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {filtered.map((it) => (
            <MemberCard
              key={it.id}
              roleTitle={it.role.title}
              roleType={it.role.type}
              campus={it.campus ?? null}
              status={it.status}
              name={it.member?.name ?? null}
              photoUrl={it.member?.photoUrl ?? null}
              bio={it.member?.publicBio ?? null}
              competenciesText={it.role.competenciesText ?? null}
            />
          ))}
        </section>
      )}
    </div>
  );
}
