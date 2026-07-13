import type { OutboundEmailDeliveryResult, OutboundEmailMessage } from "@/lib/mail/types";

export async function sendTransactionalEmail(
  message: OutboundEmailMessage,
): Promise<OutboundEmailDeliveryResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      status: "queued_without_provider",
      provider: "none",
      providerMessageId: null,
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Idempotency-Key": message.idempotencyKey,
    },
    body: JSON.stringify({
      from: "reservas@wakayaecolodge.com",
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
      headers: {
        "X-Wakaya-Thread-Key": message.threadKey,
        "X-Wakaya-Idempotency-Key": message.idempotencyKey,
      },
      ...(message.attachments?.length
        ? {
            attachments: message.attachments.map(({ content, filename }) => ({
              content,
              filename,
            })),
          }
        : {}),
    }),
  });

  if (!response.ok) {
    throw new Error("initial_email_failed");
  }

  const data = (await response.json()) as { id?: unknown };
  if (typeof data.id !== "string" || data.id.length === 0) {
    throw new Error("initial_email_failed");
  }

  return {
    status: "sent",
    provider: "resend",
    providerMessageId: data.id,
  };
}
