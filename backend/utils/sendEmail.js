import nodemailer from "nodemailer";

const buildTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
  });
};

export const sendEmail = async (payloadOrTo, maybeFile) => {
  const transporter = buildTransport();
  const from = process.env.SMTP_FROM || process.env.EMAIL || "no-reply@portal.local";

  if (typeof payloadOrTo === "string") {
    return transporter.sendMail({
      from,
      to: payloadOrTo,
      subject: "Your Certificate",
      text: "Congratulations! Your certificate is attached.",
      attachments: maybeFile ? [{ path: maybeFile }] : [],
    });
  }

  const payload = payloadOrTo || {};
  return transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject || "Notification",
    text: payload.text || "",
    html: payload.html || undefined,
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
  });
};

export default sendEmail;
