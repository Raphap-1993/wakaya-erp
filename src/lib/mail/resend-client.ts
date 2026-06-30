import type { OutboundEmailMessage } from "@/lib/mail/types";

export async function sendTransactionalEmail(message: OutboundEmailMessage) {
  if (!process.env.RESEND_API_KEY) {
    return { status: "queued_without_provider" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "reservas@wakayaecolodge.com",
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    }),
  });

  if (!response.ok) {
    throw new Error("initial_email_failed");
  }

  return { status: "sent" as const };
}
