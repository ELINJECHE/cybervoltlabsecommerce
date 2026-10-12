export interface ParsedMpesaMessage {
  code: string | null;
  amount: number | null;
}

// Picks the transaction code and amount out of a pasted M-Pesa confirmation SMS,
// e.g. "SGH4K9XYZ1 Confirmed. Ksh3,000.00 paid to ...". Anything it can't find
// comes back null so the form can fall back to typing.
export function parseMpesaMessage(text: string): ParsedMpesaMessage {
  const upper = text.toUpperCase();

  let code = upper.match(/^[^A-Z0-9]*([A-Z0-9]{10})\b/)?.[1] ?? null;
  if (!code) {
    const tokens = upper.match(/\b[A-Z0-9]{10}\b/g) ?? [];
    code = tokens.find((t) => /[A-Z]/.test(t) && /\d/.test(t)) ?? null;
  }

  // First "Ksh" figure is the payment; the balance comes later in the message.
  const amountText = text.match(/ksh\.?\s?([\d,]+(?:\.\d{1,2})?)/i)?.[1];
  const parsedAmount = amountText ? Number(amountText.replace(/,/g, "")) : NaN;

  return { code, amount: Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null };
}
