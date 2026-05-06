import type { AxiosRequestConfig } from "axios";

import { api } from "../lib/api";

type GetConfig = Pick<AxiosRequestConfig, "signal" | "headers" | "timeout">;

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export type IfrnCampus =
  | "AVANCADO_LAJES"
  | "PAU_DOS_FERROS"
  | "MACAU"
  | "NATAL_CENTRO_HISTORICO"
  | "NATAL_CENTRAL"
  | "JOAO_CAMARA"
  | "CANGUARETAMA"
  | "APODI"
  | "PARELHAS"
  | "CEARA_MIRIM"
  | "IPANGUACU"
  | "SAO_PAULO_DO_POTENGI"
  | "PARNAMIRIM"
  | "NOVA_CRUZ"
  | "NATAL_ZONA_NORTE"
  | "CURRAIS_NOVOS"
  | "SANTA_CRUZ"
  | "CAICO"
  | "SAO_GONCALO_DO_AMARANTE"
  | "MOSSORO";

export type BoardRoleType = "EXECUTIVE" | "PLENA";
export type BoardAssignmentStatus = "ACTIVE" | "EGRESSO" | "RENUNCIA" | "VACANTE";

export type BoardRole = {
  id: string;
  title: string;
  type: BoardRoleType;
  hierarchyLevel: number;
  competenciesText?: string | null;
};

export type BoardMember = {
  id: string;
  name: string;
  campus: IfrnCampus;
  course?: string | null;
  suapRegistration?: string | null;
  academicAttendancePct: number;
  birthDate: string;
  isEmancipated: boolean;
  photoUrl?: string | null;
  publicBio?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // cpf nunca é usado no frontend público; no admin não precisamos exibir
  cpf?: never;
};

export type BoardMandate = {
  id: string;
  label: string;
  startsAt: string;
  endsAt?: string | null;
  inaugurationAt?: string | null;
  status: "ACTIVE" | "ARCHIVED";
  /** Textos opcionais exibidos em Quem somos */
  publicTagline?: string | null;
  publicIntro?: string | null;
  publicMission?: string | null;
  publicActivities?: string | null;
  publicContact?: string | null;
  publicClosingNote?: string | null;
};

/** Payload público da gestão (sem status interno). */
export type BoardPublicMandateInfo = Pick<
  BoardMandate,
  | "id"
  | "label"
  | "startsAt"
  | "endsAt"
  | "inaugurationAt"
  | "publicTagline"
  | "publicIntro"
  | "publicMission"
  | "publicActivities"
  | "publicContact"
  | "publicClosingNote"
>;

export type BoardAssignment = {
  id: string;
  mandateId: string;
  roleId: string;
  memberId?: string | null;
  campus?: IfrnCampus | null;
  status: BoardAssignmentStatus;
  isCurrent: boolean;
  assignedAt: string;
  endedAt?: string | null;
  role: BoardRole;
  member?: BoardMember | null;
};

export async function getBoardAdminSnapshot(config?: GetConfig) {
  const { data } = await api.get("/board/admin/snapshot", { ...config });
  return unwrapData<{
    mandate: BoardMandate;
    roles: BoardRole[];
    assignments: BoardAssignment[];
    members: BoardMember[];
  }>(data);
}

export async function listBoardRolesAdmin(config?: GetConfig) {
  const { data } = await api.get("/board/admin/roles", { ...config });
  return (data?.items ?? []) as BoardRole[];
}

export async function listBoardMembersAdmin(
  params?: { q?: string; campus?: IfrnCampus; isActive?: boolean },
  config?: GetConfig
) {
  const { data } = await api.get("/board/admin/members", { params, ...config });
  return (data?.items ?? []) as BoardMember[];
}

export async function createBoardMember(
  body: {
    name: string;
    cpf: string;
    email?: string | null;
    phone?: string | null;
    campus: IfrnCampus;
    course?: string | null;
    suapRegistration?: string | null;
    academicAttendancePct?: number;
    birthDate: Date | string;
    isEmancipated?: boolean;
    photoUrl?: string | null;
    publicBio?: string | null;
    isActive?: boolean;
  },
  config?: GetConfig
) {
  const { data } = await api.post("/board/admin/members", body, { ...config });
  return unwrapData<BoardMember>(data);
}

export async function getBoardMemberAdmin(id: string, config?: GetConfig) {
  const { data } = await api.get(`/board/admin/members/${encodeURIComponent(id)}`, { ...config });
  return unwrapData<BoardMember>(data);
}

export async function updateBoardMember(
  id: string,
  body: Partial<{
    name: string;
    email: string | null;
    phone: string | null;
    campus: IfrnCampus;
    course: string | null;
    suapRegistration: string | null;
    academicAttendancePct: number;
    birthDate: Date | string;
    isEmancipated: boolean;
    photoUrl: string | null;
    publicBio: string | null;
    isActive: boolean;
  }>,
  config?: GetConfig
) {
  const { data } = await api.patch(`/board/admin/members/${encodeURIComponent(id)}`, body, { ...config });
  return unwrapData<BoardMember>(data);
}

export async function deleteBoardMember(id: string, config?: GetConfig) {
  const { data } = await api.delete(`/board/admin/members/${encodeURIComponent(id)}`, { ...config });
  return unwrapData<{ ok: boolean }>(data);
}

export async function getCurrentBoardManagement(config?: GetConfig) {
  const { data } = await api.get("/board/admin/mandates/current", { ...config });
  return unwrapData<BoardMandate>(data);
}

export async function updateBoardManagement(
  id: string,
  body: Partial<{
    label: string;
    startsAt: Date | string;
    endsAt: Date | string | null;
    inaugurationAt: Date | string | null;
    publicTagline: string | null;
    publicIntro: string | null;
    publicMission: string | null;
    publicActivities: string | null;
    publicContact: string | null;
    publicClosingNote: string | null;
  }>,
  config?: GetConfig
) {
  const { data } = await api.patch(`/board/admin/mandates/${encodeURIComponent(id)}`, body, { ...config });
  return unwrapData<BoardMandate>(data);
}

export async function assignBoardRole(
  body: { roleId: string; memberId?: string | null; campus?: IfrnCampus | null; assignedAt?: Date | string },
  config?: GetConfig
) {
  const { data } = await api.post("/board/admin/assign", body, { ...config });
  return unwrapData<BoardAssignment>(data);
}

export type BoardExtraordinaryComposition = {
  campus: IfrnCampus;
  activeCount: number;
  members: Array<{ id: string; name: string }>;
};

export async function getBoardVacancyAlerts(config?: GetConfig) {
  const { data } = await api.get("/board/admin/vacancy-alerts", { ...config });
  const raw = unwrapData<{
    mandateId: string;
    missingCampi: IfrnCampus[];
    extraordinaryComposition?: BoardExtraordinaryComposition[];
  }>(data);
  const extraordinaryComposition = (raw.extraordinaryComposition ?? []).map((row) => ({
    ...row,
    members: row.members ?? [],
  }));
  return {
    mandateId: raw.mandateId,
    missingCampi: raw.missingCampi ?? [],
    extraordinaryComposition,
  };
}

export async function listPublicBoard(
  params?: { campus?: IfrnCampus; type?: BoardRoleType; status?: BoardAssignmentStatus },
  config?: GetConfig
) {
  const { data } = await api.get("/board/public", { params, ...config });
  return unwrapData<{
    mandate: BoardPublicMandateInfo;
    items: Array<{
      id: string;
      status: BoardAssignmentStatus;
      campus?: IfrnCampus | null;
      assignedAt: string;
      role: BoardRole;
      member?: Omit<BoardMember, "cpf"> | null;
    }>;
  }>(data);
}

export function campusLabel(c: IfrnCampus) {
  const map: Record<IfrnCampus, string> = {
    AVANCADO_LAJES: "Avançado Lajes",
    PAU_DOS_FERROS: "Pau dos Ferros",
    MACAU: "Macau",
    NATAL_CENTRO_HISTORICO: "Natal Centro-Histórico",
    NATAL_CENTRAL: "Natal Central",
    JOAO_CAMARA: "João Câmara",
    CANGUARETAMA: "Canguaretama",
    APODI: "Apodi",
    PARELHAS: "Parelhas",
    CEARA_MIRIM: "Ceará-Mirim",
    IPANGUACU: "Ipanguaçu",
    SAO_PAULO_DO_POTENGI: "São Paulo do Potengi",
    PARNAMIRIM: "Parnamirim",
    NOVA_CRUZ: "Nova Cruz",
    NATAL_ZONA_NORTE: "Natal Zona Norte",
    CURRAIS_NOVOS: "Currais Novos",
    SANTA_CRUZ: "Santa Cruz",
    CAICO: "Caicó",
    SAO_GONCALO_DO_AMARANTE: "São Gonçalo do Amarante",
    MOSSORO: "Mossoró",
  };
  return map[c] ?? c;
}

