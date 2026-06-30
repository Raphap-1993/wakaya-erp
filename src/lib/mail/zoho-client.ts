export async function listThreadMessages(providerThreadId: string) {
  if (!process.env.ZOHO_MAIL_ACCOUNT_ID || !process.env.ZOHO_MAIL_ACCESS_TOKEN) {
    return [];
  }

  const response = await fetch(
    `https://mail.zoho.com/api/accounts/${process.env.ZOHO_MAIL_ACCOUNT_ID}/messages/view?threadId=${providerThreadId}`,
    {
      headers: {
        authorization: `Zoho-oauthtoken ${process.env.ZOHO_MAIL_ACCESS_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("zoho_sync_failed");
  }

  const json = await response.json() as { data?: unknown[] };
  return json.data ?? [];
}
