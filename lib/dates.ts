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

function parseParts(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function nextOccurrence(isoDate: string, from = new Date()) {
  const parts = parseParts(isoDate);
  if (!parts) {
    return null;
  }

  const today = startOfLocalDay(from);
  const thisYear = new Date(today.getFullYear(), parts.month - 1, parts.day);
  if (Number.isNaN(thisYear.getTime())) {
    return null;
  }

  if (thisYear >= today) {
    return thisYear;
  }

  return new Date(today.getFullYear() + 1, parts.month - 1, parts.day);
}

export function daysUntil(date: Date, from = new Date()) {
  const start = startOfLocalDay(from).getTime();
  const target = startOfLocalDay(date).getTime();
  return Math.round((target - start) / 86_400_000);
}

export function untilLabel(days: number) {
  if (days === 0) {
    return "Bugün";
  }

  if (days === 1) {
    return "Yarın";
  }

  return `${days} gün sonra`;
}

export function formatShortDate(isoDate: string) {
  const parts = parseParts(isoDate);
  if (!parts) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  }).format(new Date(parts.year, parts.month - 1, parts.day));
}
