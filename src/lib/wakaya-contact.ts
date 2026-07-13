export const WAKAYA_PRIMARY_PHONE_DISPLAY = "+51 961 508 813";
export const WAKAYA_SECONDARY_PHONE_DISPLAY = "+51 977 419 468";
export const WAKAYA_PUBLIC_PHONES = [
  WAKAYA_PRIMARY_PHONE_DISPLAY,
  WAKAYA_SECONDARY_PHONE_DISPLAY,
] as const;
export const WAKAYA_WHATSAPP_DISPLAY = WAKAYA_PRIMARY_PHONE_DISPLAY;
export const WAKAYA_WHATSAPP_E164 = "51961508813";

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}
