export function daysSince(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const start = Date.UTC(year, month - 1, day);
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((todayUtc - start) / 86_400_000));
}

export function formatTurkishDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function togetherLabel(days: number) {
  if (days <= 0) {
    return "Bugün başladık.";
  }

  return `${days} gündür birlikteyiz.`;
}
