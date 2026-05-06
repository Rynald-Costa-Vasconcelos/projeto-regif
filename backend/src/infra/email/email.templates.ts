function emailWrapper(content: string) {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>REGIF</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f6f8;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
              style="
                background:#ffffff;
                border-radius:14px;
                overflow:hidden;
                box-shadow:0 8px 24px rgba(0,0,0,0.05);
                font-family: Arial, Helvetica, sans-serif;
                color:#1f2937;
              ">
              ${content}
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

function formatPtDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function roleBadgeColor(roleName: string) {
  if (roleName === "ADMIN") return "#ef4444";
  if (roleName === "EDITOR") return "#2563eb";
  return "#64748b";
}

export function inviteEmailTemplate(
  inviteLink: string,
  meta: { roleName: string; expiresAt: Date; brandLogoCid?: string }
) {
  const roleColor = roleBadgeColor(meta.roleName);
  const expiresLabel = formatPtDate(meta.expiresAt);
  const brandBlock = meta.brandLogoCid
    ? `<img src="cid:${meta.brandLogoCid}" alt="REGIF" style="height:44px;width:auto;display:block;" />`
    : `<div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">REGIF</div>`;

  return emailWrapper(`
      <!-- HERO -->
      <tr>
        <td
          style="
            background:linear-gradient(120deg,#0f2f50 0%,#113c64 55%,#10d431 170%);
            padding:28px 32px;
          "
        >
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="left">
                ${brandBlock}
                <div style="margin-top:6px;font-size:13px;color:#dbeafe;">
                  Rede de Gremios do IFRN
                </div>
              </td>
              <td align="right" style="vertical-align:top;">
                <span
                  style="
                    display:inline-block;
                    background:${roleColor};
                    color:#ffffff;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:0.8px;
                    padding:8px 10px;
                    border-radius:999px;
                  "
                >
                  ${meta.roleName}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:24px;line-height:1.3;color:#0f172a;">
            Convite para o painel do REGIF
          </h2>

          <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#334155;">
            Seu acesso foi liberado para o ambiente administrativo. Clique no botão abaixo para
            ativar sua conta com segurança e começar a colaborar no portal.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
              <td
                style="
                  border:1px solid #e2e8f0;
                  border-radius:12px;
                  padding:14px 16px;
                  background:#f8fafc;
                  font-size:13px;
                  color:#334155;
                "
              >
                <div style="margin-bottom:6px;"><strong>Cargo:</strong> ${meta.roleName}</div>
                <div><strong>Validade:</strong> ${expiresLabel}</div>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="text-align:center;margin:30px 0;">
            <a href="${inviteLink}"
              style="
                display:inline-block;
                background:linear-gradient(120deg,#10d431 0%,#0bbf5f 100%);
                color:#ffffff;
                padding:14px 30px;
                border-radius:12px;
                font-size:14px;
                font-weight:800;
                letter-spacing:0.3px;
                text-decoration:none;
                box-shadow:0 8px 22px rgba(16,212,49,0.35);
              ">
              ATIVAR MINHA CONTA
            </a>
          </div>

          <!-- FALLBACK LINK -->
          <p style="
            margin:0;
            font-size:12px;
            color:#6b7280;
            word-break:break-all;
            line-height:1.6;
          ">
            Se o botão não funcionar, copie e cole este link no navegador:
            <br />
            <a href="${inviteLink}" style="color:#2563eb;text-decoration:none;">
              ${inviteLink}
            </a>
          </p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="
          background:#f9fafb;
          padding:20px 32px;
          font-size:11px;
          color:#9ca3af;
          text-align:center;
          line-height:1.6;
        ">
          Este convite é pessoal e possui prazo de validade.<br />
          Se você não esperava este e-mail, pode ignorá-lo com segurança.
        </td>
      </tr>
  `);
}
