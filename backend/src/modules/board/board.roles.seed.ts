import { prisma } from "../../lib/prismaClient";

export type BoardRoleSeedRow = {
  title: string;
  type: "EXECUTIVE" | "PLENA";
  hierarchyLevel: number;
  competenciesText: string;
};

// Baseado nos Arts. 58 e 62–80 do Estatuto (competências resumidas para exibição pública).
export const BOARD_ROLES_SEED: BoardRoleSeedRow[] = [
  // -------------------------
  // Diretoria Executiva (Art. 58, I)
  // -------------------------
  {
    title: "Presidente",
    type: "EXECUTIVE",
    hierarchyLevel: 10,
    competenciesText:
      "Planeja e coordena as atividades administrativas e políticas da entidade; preside o CODAG; representa a REGIF perante autoridades; confecciona/assina correspondência oficial; emite resoluções e assegura o cumprimento do Estatuto e das deliberações. (Art. 62)",
  },
  {
    title: "Vice-presidente",
    type: "EXECUTIVE",
    hierarchyLevel: 9,
    competenciesText:
      "Apoia a Presidência no planejamento e coordenação da gestão e a substitui em ausências/impedimentos, garantindo continuidade administrativa e representativa. (Baseado nas atribuições gerais da Diretoria e na lógica de substituição do Estatuto)",
  },
  {
    title: "Secretário-Geral",
    type: "EXECUTIVE",
    hierarchyLevel: 8,
    competenciesText:
      "Secretaria reuniões e plenárias; elabora e publica atas e documentos da gestão; organiza arquivos (preferencialmente virtuais) e a consulta; assessora diretorias em trâmites técnicos; substitui Presidência/Vice em faltas e impedimentos e, havendo vacância, convoca novas eleições conforme previsão estatutária. (Art. 63)",
  },
  {
    title: "Diretor de Apoio aos Grêmios",
    type: "EXECUTIVE",
    hierarchyLevel: 7,
    competenciesText:
      "Apoia a formação e o fortalecimento de grêmios; acompanha a situação dos grêmios e informa à Diretoria; coleta dados de funcionamento; estabelece relações institucionais e acompanha trocas de gestão nos campi. (Art. 66)",
  },
  {
    title: "Diretor de Comunicação Social",
    type: "EXECUTIVE",
    hierarchyLevel: 6,
    competenciesText:
      "Planeja e executa ações de comunicação; divulga reuniões, calendários e deliberações; produz materiais e campanhas; coordena informativos e redes sociais; dá publicidade às ações da REGIF e dos grêmios. (Art. 65)",
  },
  {
    title: "Diretor de Finanças",
    type: "EXECUTIVE",
    hierarchyLevel: 5,
    competenciesText:
      "Dá suporte financeiro às diretorias; acompanha aplicação de recursos; assina documentos financeiros com a Presidência; organiza prestação de contas e balancetes; mantém e movimenta contas bancárias; assegura amplo acesso a notas/recibos e registra/cataloga patrimônio. (Art. 64)",
  },

  // -------------------------
  // Diretoria Plena (Art. 58, II)
  // -------------------------
  {
    title: "Secretário-adjunto",
    type: "PLENA",
    hierarchyLevel: 4,
    competenciesText:
      "Presta apoio técnico à Secretaria-Geral na elaboração de documentos e a substitui quando impedida, além de atividades correlatas atribuídas. (Art. 68)",
  },
  {
    title: "Diretoria de Inclusão e Acessibilidade",
    type: "PLENA",
    hierarchyLevel: 4,
    competenciesText:
      "Incentiva o debate sobre acessibilidade e inclusão; promove formações e debates; busca assegurar direitos de pessoas com deficiência; estabelece parcerias (ex.: NAPNE) e viabiliza melhorias de acolhimento e acessibilidade nos campi. (Art. 67)",
  },
  {
    title: "Diretor-adjunto de Apoio aos Grêmios",
    type: "PLENA",
    hierarchyLevel: 4,
    competenciesText:
      "Atua em conjunto com a Diretoria de Apoio aos Grêmios, auxiliando em suas atribuições e mantendo contato com os grêmios para acompanhar situações e demandas. (Art. 71)",
  },
  {
    title: "Diretor-adjunto de Comunicação Social",
    type: "PLENA",
    hierarchyLevel: 4,
    competenciesText:
      "Dá suporte à Comunicação Social na elaboração e divulgação de documentos e eventos; divulga ações e informativos; substitui a Diretoria de Comunicação quando impedida, e realiza atividades correlatas. (Art. 70)",
  },
  {
    title: "Diretor-adjunto de Finanças",
    type: "PLENA",
    hierarchyLevel: 4,
    competenciesText:
      "Apoia tecnicamente a Diretoria de Finanças na fiscalização, registro e organização de políticas financeiras; substitui a Diretoria de Finanças quando impedida e realiza atividades correlatas. (Art. 69)",
  },
  {
    title: "Diretor de Assistência Estudantil",
    type: "PLENA",
    hierarchyLevel: 3,
    competenciesText:
      "Atua pela participação estudantil em reuniões de gestão/assistência; produz relatórios; luta pela ampliação e correto funcionamento de programas de assistência; publiciza e propõe alternativas a problemas institucionais ligados ao ensino e permanência. (Art. 75)",
  },
  {
    title: "Diretor Étnico-racial",
    type: "PLENA",
    hierarchyLevel: 3,
    competenciesText:
      "Cria e orienta políticas e ações de promoção da cidadania e diversidade étnica; forma parcerias (ex.: NEABI); acompanha ocorrências de preconceito e propõe medidas cabíveis, além de atividades correlatas. (Art. 78)",
  },
  {
    title: "Diretor de Arte, Cultura e Eventos",
    type: "PLENA",
    hierarchyLevel: 3,
    competenciesText:
      "Fomenta e promove cultura; incentiva núcleos artísticos; valoriza artistas e ações culturais; articula núcleos de arte; planeja eventos e ações de igualdade de gênero e combate a LGBTfobia e racismo. (Art. 74)",
  },
  {
    title: "Diretor de Esportes e Qualidade de Vida",
    type: "PLENA",
    hierarchyLevel: 3,
    competenciesText:
      "Busca suporte para esportes; cria e gere atividades de lazer e qualidade de vida; estabelece parcerias com entidades esportivas; atua em conjunto com diretorias congêneres dos grêmios. (Art. 73)",
  },
  {
    title: "Diretor de Formação Política",
    type: "PLENA",
    hierarchyLevel: 3,
    competenciesText:
      "Viabiliza cursos, palestras, seminários e debates para formação política e do movimento estudantil; anuncia posicionamentos sobre discussões que envolvam a comunidade; realiza atividades correlatas. (Art. 76)",
  },
  {
    title: "Diretor de Diversidade de Gênero e Sexualidade",
    type: "PLENA",
    hierarchyLevel: 3,
    competenciesText:
      "Elabora projetos para assegurar direitos LGBTQIA+ e combater discriminação; acompanha ocorrências de LGBTfobia; viabiliza programas de respeito e valorização; incentiva núcleos e redes de apoio; promove ambiente acolhedor. (Art. 77)",
  },
  {
    title: "Diretora de Lutas Feministas",
    type: "PLENA",
    hierarchyLevel: 3,
    competenciesText:
      "Elabora projetos para assegurar direitos das mulheres; discute temas de interesse da mulher no âmbito estudantil; promove ações de saúde mental feminina; incentiva participação social e política; incentiva núcleos femininos. (Art. 79)",
  },
  {
    title: "Diretor de Relações com o Mundo do Trabalho",
    type: "PLENA",
    hierarchyLevel: 3,
    competenciesText:
      "Supervisiona, com diretoria correlata, a situação de estágios e temas afins; mantém contato com a Pró-Reitoria de Extensão para acompanhar demandas e possibilidades; realiza atividades correlatas. (Art. 72)",
  },
  {
    title: "Diretoria de Meio Ambiente",
    type: "PLENA",
    hierarchyLevel: 3,
    competenciesText:
      "Promove palestras e debates sobre saúde, meio ambiente e sustentabilidade; incentiva políticas de reciclagem e descarte correto; cria e apoia campanhas; informa direitos de saúde e atua em melhorias relacionadas à qualidade de vida. (Art. 80)",
  },
];

export async function ensureBoardRolesSeed(): Promise<void> {
  for (const r of BOARD_ROLES_SEED) {
    await prisma.boardRole.upsert({
      where: { title: r.title },
      update: {
        type: r.type as any,
        hierarchyLevel: r.hierarchyLevel,
        competenciesText: r.competenciesText,
      },
      create: {
        title: r.title,
        type: r.type as any,
        hierarchyLevel: r.hierarchyLevel,
        competenciesText: r.competenciesText,
      },
    });
  }
}

