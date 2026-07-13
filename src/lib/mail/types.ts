export interface MailAttachmentInput {
  filename: string;
  content: string;
  contentType: string;
}

export type OutboundEmailProvider = "zoho_mail" | "resend" | "none";

export interface OutboundEmailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo: string;
  idempotencyKey: string;
  threadKey: string;
  attachments?: MailAttachmentInput[];
}

export interface OutboundEmailDeliveryResult {
  status: "queued_without_provider" | "sent";
  provider: OutboundEmailProvider;
  providerMessageId: string | null;
  providerThreadId?: string | null;
  sentAt?: string | null;
}
