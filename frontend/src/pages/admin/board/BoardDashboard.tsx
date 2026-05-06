import { BadgeCheck, Calendar, LayoutGrid, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";

import { BoardModuleNav } from "./BoardModuleNav";

const cardClass =
  "rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow";

function Tile({
  title,
  subtitle,
  to,
  icon: Icon,
  iconWrapClass,
}: {
  title: string;
  subtitle: string;
  to: string;
  icon: typeof Users;
  iconWrapClass: string;
}) {
  return (
    <Link to={to} className={clsx(cardClass, "group")}>
      <div className="flex items-start gap-4">
        <div className={clsx("rounded-2xl p-3 ring-1 ring-black/[0.04]", iconWrapClass)}>
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-regif-dark group-hover:text-regif-blue transition-colors">{title}</h2>
          <p className="mt-1 text-sm text-gray-500 leading-snug">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

export function BoardDashboard() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      <BoardModuleNav />

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-regif-green">Diretoria</p>
            <h1 className="mt-1 text-2xl font-extrabold text-regif-dark">Gestão de Pessoal e Transparência</h1>
            <p className="mt-2 text-sm text-gray-500">
              Membros, nomeação por cargos e painel de informações da gestão (textos da página Quem somos), cada um em sua área.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-regif-blue">
            <BadgeCheck size={22} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          title="Membros (cards)"
          subtitle="Visualize, edite e exclua membros com rapidez."
          to="/admin/board/members"
          icon={Users}
          iconWrapClass="bg-teal-50 text-teal-700"
        />
        <Tile
          title="Novo membro"
          subtitle="Página dedicada para cadastrar um novo membro."
          to="/admin/board/members/new"
          icon={UserPlus}
          iconWrapClass="bg-green-50 text-regif-green"
        />
        <Tile
          title="Informações da gestão"
          subtitle="Textos e período exibidos na página Quem somos."
          to="/admin/board/management"
          icon={Calendar}
          iconWrapClass="bg-blue-50 text-regif-blue"
        />
        <Tile
          title="Nomear cargos"
          subtitle="Escolha o membro em cada cargo (Executiva e Plena)."
          to="/admin/board/assignments"
          icon={LayoutGrid}
          iconWrapClass="bg-slate-50 text-slate-700"
        />
      </div>
    </div>
  );
}

