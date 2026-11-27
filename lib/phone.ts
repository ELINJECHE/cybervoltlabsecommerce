// Kenyan mobile numbers typed by customers: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, +2541XXXXXXXX,
// 2547XXXXXXXX or 2541XXXXXXXX, with or without spaces, dashes or brackets.
// Returns the number stored on the order (2547XXXXXXXX / 2541XXXXXXXX), or null when it isn't one.
export function normalizeKenyanMobile(input: string): string | null {
  const cleaned = input.replace(/[\s\-().]/g, "");
  const m = cleaned.match(/^(?:\+?254|0)([17]\d{8})$/);
  return m ? `254${m[1]}` : null;
}

export const PHONE_ERROR = "Enter a valid Kenyan phone number, e.g. 0712 345 678";
