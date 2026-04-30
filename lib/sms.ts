import twilio from "twilio";

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
}

interface SmsParams {
  to: string;
  clientName: string;
  debtTitle: string;
  amount: number;
  amountPaid: number;
  currency: string;
  dueDate?: Date | null;
  senderName: string;
  mode: "FRIENDLY" | "PROFESSIONAL" | "FINAL";
  channel: "SMS" | "WHATSAPP";
}

function buildMessage(params: SmsParams): string {
  const outstanding = params.amount - params.amountPaid;
  const sym = params.currency === "GBP" ? "£" : params.currency === "USD" ? "$" : params.currency === "EUR" ? "€" : params.currency;
  const amt = `${sym}${outstanding.toFixed(2)}`;
  const due = params.dueDate ? ` (due ${new Date(params.dueDate).toLocaleDateString("en-GB")})` : "";

  if (params.mode === "FRIENDLY") {
    return `Hi ${params.clientName}, friendly reminder: ${amt} outstanding for "${params.debtTitle}"${due}. Reply if you have questions. – ${params.senderName}`;
  }
  if (params.mode === "FINAL") {
    return `FINAL NOTICE – ${params.clientName}: ${amt} is overdue for "${params.debtTitle}"${due}. Immediate payment required to avoid further action. – ${params.senderName}`;
  }
  return `Hi ${params.clientName}, payment reminder: ${amt} outstanding for "${params.debtTitle}"${due}. Please arrange payment at your earliest convenience. – ${params.senderName}`;
}

export async function sendReminderSms(params: SmsParams) {
  const client = getClient();
  const body = buildMessage(params);

  const isWhatsApp = params.channel === "WHATSAPP";
  const toNum = params.to.startsWith("+") ? params.to : `+${params.to}`;
  const to = isWhatsApp ? `whatsapp:${toNum}` : toNum;
  const from = isWhatsApp
    ? `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER ?? process.env.TWILIO_PHONE_NUMBER}`
    : process.env.TWILIO_PHONE_NUMBER!;

  await client.messages.create({ body, from, to });
}
