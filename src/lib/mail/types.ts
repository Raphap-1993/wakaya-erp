export interface OutboundEmailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo: string;
  idempotencyKey: string;
}
