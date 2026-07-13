import { Buffer } from "node:buffer";

import type { OutboundEmailDeliveryResult, OutboundEmailMessage } from "@/lib/mail/types";
import { guessAttachmentContentType } from "@/lib/mail/attachment-media";
import type { ProviderAttachment, ProviderThreadMessage } from "@/lib/mail/thread-sync";
import { RESERVATIONS_MAILBOX_ADDRESS } from "@/lib/reservations/booking-request-workbench";

type ZohoRuntimeConfig = {
  accountId: string;
  accessToken: string;
};

type ZohoTokenCacheState = {
  accessToken: string | null;
  expiresAt: number;
  refreshPromise: Promise<string> | null;
};

const tokenCache: ZohoTokenCacheState = {
  accessToken: null,
  expiresAt: 0,
  refreshPromise: null,
};

function getZohoAccountsBaseUrl() {
  return (process.env.ZOHO_ACCOUNTS_BASE_URL?.trim() || "https://accounts.zoho.com").replace(/\/+$/, "");
}

function getZohoAccountId() {
  const accountId = process.env.ZOHO_MAIL_ACCOUNT_ID?.trim();
  if (!accountId) {
    throw new Error("zoho_sync_failed");
  }
  return accountId;
}

function getStaticAccessToken() {
  return process.env.ZOHO_MAIL_ACCESS_TOKEN?.trim() || null;
}

function hasRefreshCredentials() {
  return Boolean(
    process.env.ZOHO_CLIENT_ID?.trim() &&
      process.env.ZOHO_CLIENT_SECRET?.trim() &&
      process.env.ZOHO_REFRESH_TOKEN?.trim(),
  );
}

async function refreshZohoAccessToken(): Promise<string> {
  if (tokenCache.refreshPromise) {
    return tokenCache.refreshPromise;
  }

  if (!hasRefreshCredentials()) {
    const staticAccessToken = getStaticAccessToken();
    if (!staticAccessToken) {
      throw new Error("zoho_sync_failed");
    }
    tokenCache.accessToken = staticAccessToken;
    tokenCache.expiresAt = Date.now() + 55 * 60 * 1000;
    return staticAccessToken;
  }

  tokenCache.refreshPromise = (async () => {
    const response = await fetch(`${getZohoAccountsBaseUrl()}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN!.trim(),
        client_id: process.env.ZOHO_CLIENT_ID!.trim(),
        client_secret: process.env.ZOHO_CLIENT_SECRET!.trim(),
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("zoho_sync_failed");
    }

    const json = (await response.json()) as {
      access_token?: string;
      expires_in?: number | string;
    };
    const accessToken = typeof json.access_token === "string" && json.access_token.trim() ? json.access_token : null;
    if (!accessToken) {
      throw new Error("zoho_sync_failed");
    }

    const expiresInSeconds = Number(json.expires_in ?? 3600);
    tokenCache.accessToken = accessToken;
    tokenCache.expiresAt = Date.now() + Math.max(60, expiresInSeconds - 120) * 1000;
    return accessToken;
  })();

  try {
    return await tokenCache.refreshPromise;
  } finally {
    tokenCache.refreshPromise = null;
  }
}

async function getZohoConfig(): Promise<ZohoRuntimeConfig> {
  const accountId = getZohoAccountId();
  const staticAccessToken = getStaticAccessToken();

  if (staticAccessToken && !hasRefreshCredentials()) {
    return {
      accountId,
      accessToken: staticAccessToken,
    };
  }

  if (tokenCache.accessToken && tokenCache.expiresAt > Date.now()) {
    return {
      accountId,
      accessToken: tokenCache.accessToken,
    };
  }

  return {
    accountId,
    accessToken: await refreshZohoAccessToken(),
  };
}

function getZohoHeaders(accessToken: string, accept = "application/json") {
  return {
    accept,
    authorization: `Zoho-oauthtoken ${accessToken}`,
  };
}

function normalizeString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function normalizeAddresses(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    if (/^\d+$/.test(value)) {
      return new Date(Number(value)).toISOString();
    }
    return value;
  }

  return null;
}

function hasAttachmentsFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function inferContentType(fileName: string): string {
  if (fileName.toLowerCase().endsWith(".pdf")) return "application/pdf";
  return guessAttachmentContentType(fileName) ?? "application/octet-stream";
}

function escapeSearchValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

async function fetchZohoJson<T>(
  url: string,
  accessToken: string,
  init?: Omit<RequestInit, "headers"> & { headers?: Record<string, string> },
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...getZohoHeaders(accessToken),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error("zoho_sync_failed");
  }

  return (await response.json()) as T;
}

async function fetchAttachmentContent(input: {
  accountId: string;
  accessToken: string;
  folderId: string;
  messageId: string;
  attachmentId: string;
}): Promise<string | null> {
  const response = await fetch(
    `https://mail.zoho.com/api/accounts/${input.accountId}/folders/${input.folderId}/messages/${input.messageId}/attachments/${input.attachmentId}`,
    {
      headers: getZohoHeaders(input.accessToken, "application/octet-stream"),
    },
  );

  if (!response.ok) {
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.length > 0 ? buffer.toString("base64") : null;
}

async function fetchMessageContent(input: {
  accountId: string;
  accessToken: string;
  folderId: string;
  messageId: string;
}): Promise<string | null> {
  const response = await fetch(
    `https://mail.zoho.com/api/accounts/${input.accountId}/folders/${input.folderId}/messages/${input.messageId}/content?includeBlockContent=true`,
    {
      headers: getZohoHeaders(input.accessToken),
    },
  );

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    data?: {
      content?: unknown;
    };
  };

  return normalizeString(json.data?.content);
}

async function fetchAttachmentDescriptors(input: {
  accountId: string;
  accessToken: string;
  folderId: string;
  messageId: string;
  inlineAttachments?: Array<Record<string, unknown>>;
}): Promise<Array<Record<string, unknown>>> {
  const descriptors = new Map<string, Record<string, unknown>>();

  if (Array.isArray(input.inlineAttachments)) {
    for (const attachment of input.inlineAttachments) {
      const providerAttachmentId = normalizeString(attachment.attachmentId);
      if (providerAttachmentId) {
        descriptors.set(providerAttachmentId, attachment);
      }
    }
  }

  const attachmentInfo = await fetchZohoJson<{
    data?: {
      attachments?: Array<Record<string, unknown>>;
      inline?: Array<Record<string, unknown>>;
    };
  }>(
    `https://mail.zoho.com/api/accounts/${input.accountId}/folders/${input.folderId}/messages/${input.messageId}/attachmentinfo?includeInline=true`,
    input.accessToken,
  );

  for (const attachment of attachmentInfo.data?.attachments ?? []) {
    const providerAttachmentId = normalizeString(attachment.attachmentId);
    if (providerAttachmentId) {
      descriptors.set(providerAttachmentId, attachment);
    }
  }

  for (const attachment of attachmentInfo.data?.inline ?? []) {
    const providerAttachmentId = normalizeString(attachment.attachmentId);
    if (providerAttachmentId) {
      descriptors.set(providerAttachmentId, attachment);
    }
  }

  return [...descriptors.values()];
}

async function fetchMessageAttachments(input: {
  accountId: string;
  accessToken: string;
  folderId: string;
  messageId: string;
  inlineAttachments?: Array<Record<string, unknown>>;
}): Promise<ProviderAttachment[]> {
  const attachments = await fetchAttachmentDescriptors(input);
  return Promise.all(
    attachments.map(async (attachment) => {
      const providerAttachmentId = normalizeString(attachment.attachmentId) ?? "";
      const fileName =
        normalizeString(attachment.fileName) ??
        normalizeString(attachment.attachmentName) ??
        "attachment";

      return {
        providerAttachmentId,
        fileName,
        contentType: normalizeString(attachment.contentType) ?? inferContentType(fileName),
        fileSizeBytes: Number(
          normalizeString(attachment.size) ??
            normalizeString(attachment.attachmentSize) ??
            0,
        ),
        contentBase64:
          normalizeString(attachment.contentBase64) ??
          (providerAttachmentId
            ? await fetchAttachmentContent({
                accountId: input.accountId,
                accessToken: input.accessToken,
                folderId: input.folderId,
                messageId: input.messageId,
                attachmentId: providerAttachmentId,
              })
            : null),
      };
    }),
  );
}

export async function searchThreadIdByBookingRequest(input: {
  publicRef: string;
}): Promise<string | null> {
  const { accountId, accessToken } = await getZohoConfig();
  const searchKey = [
    `subject:"${escapeSearchValue(input.publicRef)}"`,
    `entire:"${escapeSearchValue(input.publicRef)}"`,
  ].join("::or:");

  const result = await fetchZohoJson<{
    data?: Array<Record<string, unknown>>;
  }>(
    `https://mail.zoho.com/api/accounts/${accountId}/messages/search?searchKey=${encodeURIComponent(searchKey)}&receivedTime=${Date.now() + 60_000}&start=1&limit=10&includeto=true`,
    accessToken,
  );

  for (const item of result.data ?? []) {
    const threadId = normalizeString(item.threadId);
    if (threadId) {
      return threadId;
    }
  }

  return null;
}

export async function listThreadMessages(providerThreadId: string): Promise<ProviderThreadMessage[]> {
  const { accountId, accessToken } = await getZohoConfig();
  const json = await fetchZohoJson<{ data?: Array<Record<string, unknown>> }>(
    `https://mail.zoho.com/api/accounts/${accountId}/messages/view?threadId=${providerThreadId}&includeto=true&includesent=true`,
    accessToken,
  );

  return Promise.all(
    (json.data ?? []).map(async (item) => {
      const messageId = normalizeString(item.messageId) ?? normalizeString(item.providerMessageId) ?? "";
      const folderId = normalizeString(item.folderId);
      const bodyHtml =
        folderId && messageId
          ? await fetchMessageContent({
              accountId,
              accessToken,
              folderId,
              messageId,
            })
          : normalizeString(item.content);
      const inlineAttachments =
        Array.isArray(item.attachments)
          ? item.attachments.filter(
              (attachment): attachment is Record<string, unknown> =>
                typeof attachment === "object" && attachment !== null,
            )
          : undefined;

      return {
        providerMessageId: messageId,
        providerThreadId: normalizeString(item.threadId) ?? providerThreadId,
        fromAddress: normalizeString(item.fromAddress) ?? "",
        toAddresses: normalizeAddresses(item.toAddress),
        ccAddresses: normalizeAddresses(item.ccAddress),
        subject: normalizeString(item.subject) ?? "",
        bodyText: normalizeString(item.summary) ?? normalizeString(item.content),
        bodyHtml,
        sentAt: normalizeTimestamp(item.sentTime) ?? normalizeTimestamp(item.sentDateInGMT),
        receivedAt: normalizeTimestamp(item.receivedTime) ?? normalizeTimestamp(item.receivedtime),
        attachments:
          folderId && messageId
            ? await fetchMessageAttachments({
                accountId,
                accessToken,
                folderId,
                messageId,
                inlineAttachments,
              })
            : [],
      };
    }),
  );
}

export async function sendTransactionalZohoEmail(
  message: OutboundEmailMessage,
): Promise<OutboundEmailDeliveryResult> {
  let config: ZohoRuntimeConfig;
  try {
    config = await getZohoConfig();
  } catch {
    return {
      status: "queued_without_provider",
      provider: "none",
      providerMessageId: null,
      providerThreadId: null,
      sentAt: null,
    };
  }

  const { accountId, accessToken } = config;
  const response = await fetch(`https://mail.zoho.com/api/accounts/${accountId}/messages`, {
    method: "POST",
    headers: {
      ...getZohoHeaders(accessToken),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      fromAddress: RESERVATIONS_MAILBOX_ADDRESS,
      toAddress: message.to.join(","),
      subject: message.subject,
      content: message.html || message.text,
      mailFormat: message.html ? "html" : "plaintext",
    }),
  });

  if (!response.ok) {
    throw new Error("initial_email_failed");
  }

  const json = (await response.json()) as {
    data?: {
      messageId?: string | number;
      threadId?: string | number;
      sentTime?: string | number;
    };
  };
  const data = json.data ?? {};
  return {
    status: "sent",
    provider: "zoho_mail",
    providerMessageId:
      typeof data.messageId === "string"
        ? data.messageId
        : typeof data.messageId === "number"
          ? String(data.messageId)
          : null,
    providerThreadId:
      typeof data.threadId === "string"
        ? data.threadId
        : typeof data.threadId === "number"
          ? String(data.threadId)
          : null,
    sentAt: normalizeTimestamp(data.sentTime) ?? new Date().toISOString(),
  };
}

export async function sendThreadReply(input: {
  providerMessageId: string;
  toAddress: string;
  subject: string;
  bodyText: string;
}) {
  const { accountId, accessToken } = await getZohoConfig();
  const response = await fetch(
    `https://mail.zoho.com/api/accounts/${accountId}/messages/${input.providerMessageId}`,
    {
      method: "POST",
      headers: {
        ...getZohoHeaders(accessToken),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fromAddress: RESERVATIONS_MAILBOX_ADDRESS,
        toAddress: input.toAddress,
        subject: input.subject,
        content: input.bodyText,
        action: "reply",
        mailFormat: "plaintext",
      }),
    },
  );

  if (!response.ok) {
    throw new Error("zoho_sync_failed");
  }

  const json = (await response.json()) as {
    data?: {
      messageId?: string | number;
      threadId?: string | number;
      sentTime?: string | number;
    };
  };
  const data = json.data ?? {};
  return {
    providerMessageId:
      typeof data.messageId === "string"
        ? data.messageId
        : typeof data.messageId === "number"
          ? String(data.messageId)
          : input.providerMessageId,
    providerThreadId:
      typeof data.threadId === "string"
        ? data.threadId
        : typeof data.threadId === "number"
          ? String(data.threadId)
          : null,
    sentAt: normalizeTimestamp(data.sentTime) ?? new Date().toISOString(),
  };
}

export function resetZohoTokenCacheForTests() {
  tokenCache.accessToken = null;
  tokenCache.expiresAt = 0;
  tokenCache.refreshPromise = null;
}
