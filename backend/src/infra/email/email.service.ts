import { emailTransporter } from "./email.client";
import { inviteEmailTemplate } from "./email.templates";
import type { InviteEmailInput, SendEmailInput, ShopGuestOtpEmailInput } from "./email.types";
import fs from "fs";
import path from "path";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

const FROM_EMAIL = () => mustEnv("FROM_EMAIL");

function resolveInviteBrandLogoPath() {
  const envPath = process.env.INVITE_BRAND_LOGO_PATH?.trim();
  const candidates = [
    envPath ? path.resolve(envPath) : null,
    path.resolve(process.cwd(), "..", "frontend", "src", "assets", "brand", "logo_horizontal.png"),
    path.resolve(process.cwd(), "..", "frontend", "src", "assets", "brand", "logo_horizontal_branca.png"),
  ].filter((v): v is string => !!v);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

export const emailService = {
  async send({ to, subject, html }: SendEmailInput) {
    await emailTransporter.sendMail({
      from: FROM_EMAIL(),
      to,
      subject,
      html,
    });
  },

  /**
   * 📩 Envia convite de acesso ao REGIF
   */
  async sendInvite({ toEmail, inviteLink, roleName, expiresAt }: InviteEmailInput) {
    const logoPath = resolveInviteBrandLogoPath();
    const brandLogoCid = logoPath ? "regif-brand-logo" : undefined;

    const html = inviteEmailTemplate(inviteLink, {
      roleName,
      expiresAt,
      brandLogoCid,
    });

    await emailTransporter.sendMail({
      from: FROM_EMAIL(),
      to: toEmail,
      subject: "Convite de acesso ao painel REGIF",
      html,
      attachments: logoPath
        ? [
            {
              filename: path.basename(logoPath),
              path: logoPath,
              cid: "regif-brand-logo",
            },
          ]
        : undefined,
    });
  },

  /** Código de 6 dígitos para acessar “Meus pedidos” na Lojinha REGIF (uso único). */
  async sendShopGuestOrderOtp({ toEmail, code, expiresAt }: ShopGuestOtpEmailInput) {
    const until = expiresAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    const html = `
      <div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#111827;max-width:520px;line-height:1.5">
        <p style="margin:0 0 12px">Olá,</p>
        <p style="margin:0 0 12px">Use o código abaixo para ver seus pedidos na <strong>Lojinha da REGIF</strong>. Ele é válido por poucos minutos e pode ser usado <strong>apenas uma vez</strong>.</p>
        <p style="margin:16px 0;font-size:28px;font-weight:800;letter-spacing:0.35em;font-family:ui-monospace,monospace">${code}</p>
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px">Expira em: ${until}</p>
        <p style="margin:16px 0 0;font-size:13px;color:#6b7280">Se você não solicitou este código, ignore este e-mail.</p>
      </div>
    `;
    await emailTransporter.sendMail({
      from: FROM_EMAIL(),
      to: toEmail,
      subject: "Código para acompanhar seus pedidos — Lojinha REGIF",
      html,
    });
  },
};
