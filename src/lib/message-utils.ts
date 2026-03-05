/** Format phone for WhatsApp: strip non-digits, add US country code if needed */
export function formatPhoneForWhatsApp(phone: string): string | null {
  if (!phone || phone.trim() === '') return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) digits = '1' + digits;
  if (digits.length < 10) return null;
  return digits;
}

/** Parse multiple emails from a semicolon/comma-separated string */
export function parseEmails(emailStr: string): string[] {
  if (!emailStr || emailStr.trim() === '') return [];
  return emailStr.split(/[;,]/).map(e => e.trim()).filter(e => e.includes('@'));
}

/** Build a follow-up WhatsApp URL with pre-filled message */
export function buildWhatsAppFollowUp(
  phone: string,
  childName: string,
  missedCount: number,
): string | null {
  const digits = formatPhoneForWhatsApp(phone);
  if (!digits) return null;

  const message = encodeURIComponent(
    `Hello! This is Maccabi Tzair Miami. We've noticed that ${childName} ` +
    `has been absent from the past ${missedCount} session${missedCount > 1 ? 's' : ''} ` +
    `and we want to make sure everything is ok. ` +
    `Please let us know if there's anything we can help with. Thank you!`
  );
  return `https://wa.me/${digits}?text=${message}`;
}

/** Build a follow-up mailto URL with pre-filled subject and body */
export function buildEmailFollowUp(
  email: string,
  childName: string,
  missedCount: number,
): string {
  const subject = encodeURIComponent(`Maccabi Tzair Miami — ${childName} Attendance`);
  const body = encodeURIComponent(
    `Hello,\n\n` +
    `This is Maccabi Tzair Miami. We've noticed that ${childName} ` +
    `has been absent from the past ${missedCount} session${missedCount > 1 ? 's' : ''} ` +
    `and we want to make sure everything is ok.\n\n` +
    `Please let us know if there's anything we can help with.\n\n` +
    `Thank you,\nMaccabi Tzair Miami`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

/** Count recent consecutive absences from the most recent date backwards */
export function countRecentAbsences(
  records: Record<string, boolean | 'late' | null | undefined>,
  dates: string[],
): number {
  let count = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const val = records[dates[i]];
    if (val === false) count++;
    else if (val === true || val === 'late') break;
    // null/undefined = no data, skip
  }
  return count;
}
