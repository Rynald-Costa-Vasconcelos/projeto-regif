export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

export type InviteEmailInput = {
  toEmail: string;
  inviteLink: string;
  roleName: string;
  expiresAt: Date;
};

export type ShopGuestOtpEmailInput = {
  toEmail: string;
  code: string;
  expiresAt: Date;
};
