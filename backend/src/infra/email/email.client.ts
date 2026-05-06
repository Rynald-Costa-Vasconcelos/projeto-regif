import nodemailer from "nodemailer";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

const host = mustEnv("SMTP_HOST");
const port = Number(mustEnv("SMTP_PORT"));
const user = mustEnv("SMTP_USER");
const pass = mustEnv("SMTP_PASS");
const secure = port === 465;

export const emailTransporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});
