import { z } from "zod";

const cuid = z.string().min(20).max(64);

export const ifrnCampusEnum = z.enum([
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
]);

export const boardRoleTypeEnum = z.enum(["EXECUTIVE", "PLENA"]);

export const createBoardMemberSchema = z.object({
  name: z.string().min(2).max(200),
  cpf: z
    .string()
    .min(11)
    .max(14)
    .transform((s) => s.replace(/\D/g, ""))
    .refine((s) => s.length === 11, { message: "CPF deve ter 11 dígitos." }),
  email: z.string().email().max(320).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  campus: ifrnCampusEnum,
  course: z.string().max(160).optional().nullable(),
  suapRegistration: z.string().max(64).optional().nullable(),
  academicAttendancePct: z.number().int().min(0).max(100).optional(),
  birthDate: z.coerce.date(),
  isEmancipated: z.boolean().optional(),
  photoUrl: z.string().max(2000).optional().nullable(),
  publicBio: z.string().max(4000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateBoardMemberSchema = createBoardMemberSchema.partial();

const mandatePublicFieldsSchema = {
  publicTagline: z.union([z.string().max(2000), z.null()]).optional(),
  publicIntro: z.union([z.string().max(20000), z.null()]).optional(),
  publicMission: z.union([z.string().max(20000), z.null()]).optional(),
  publicActivities: z.union([z.string().max(20000), z.null()]).optional(),
  publicContact: z.union([z.string().max(20000), z.null()]).optional(),
  publicClosingNote: z.union([z.string().max(20000), z.null()]).optional(),
};

export const updateBoardMandateSchema = z
  .object({
    label: z.string().min(2).max(80).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.union([z.coerce.date(), z.null()]).optional(),
    inaugurationAt: z.union([z.coerce.date(), z.null()]).optional(),
    ...mandatePublicFieldsSchema,
  })
  .superRefine((v, ctx) => {
    if (v.startsAt && v.endsAt && v.endsAt <= v.startsAt) {
      ctx.addIssue({ code: "custom", message: "endsAt deve ser maior que startsAt.", path: ["endsAt"] });
    }
  });

export const assignBoardRoleSchema = z.object({
  roleId: cuid,
  memberId: cuid.optional().nullable(),
  // Campus é recomendado para transparência, mas não é obrigatório (gestões flexíveis)
  campus: ifrnCampusEnum.optional().nullable(),
  assignedAt: z.coerce.date().optional(),
});

export const declareVacancySchema = z.object({
  reason: z.enum([
    "MORTE",
    "ABANDONO",
    "RENUNCIA",
    "TRANCAMENTO_OU_JUBILAMENTO",
    "CONCLUSAO_DE_CURSO",
    "OUTRO",
  ]),
  note: z.string().max(4000).optional().nullable(),
  portariaNumber: z.string().max(80).optional().nullable(),
});

export const listPublicBoardSchema = z.object({
  campus: ifrnCampusEnum.optional(),
  type: boardRoleTypeEnum.optional(),
  status: z.enum(["ACTIVE", "EGRESSO", "RENUNCIA", "VACANTE"]).optional(),
});

