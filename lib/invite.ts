export function safeInviteCode(value: string) {
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9]{8}$/.test(code) ? code : null;
}
