const REPLACEMENTS: Array<[string, string]> = [
  ["invalid login credentials", "E-posta veya parola hatalı."],
  ["email not confirmed", "E-postandaki bağlantıyı aç, sonra giriş yap."],
  ["user already registered", "Bu e-posta zaten kayıtlı."],
  ["already been registered", "Bu e-posta zaten kayıtlı."],
  ["password should be at least", "Parola en az 6 karakter olsun."],
  ["signup is disabled", "Kayıt şu an kapalı."],
  ["schema cache", "Veritabanı henüz hazır değil. Supabase SQL editöründe ilk migration dosyasını çalıştır."],
  ["could not find the function", "Veritabanı henüz hazır değil. Supabase SQL editöründe ilk migration dosyasını çalıştır."],
  ["does not exist", "Veritabanı henüz hazır değil. Supabase SQL editöründe ilk migration dosyasını çalıştır."],
  ["row-level security", "Bu kayda erişimin yok."],
  ["permission denied", "Bu kayda erişimin yok."],
  ["fetch failed", "Bağlantı kurulamadı. İnterneti kontrol et."],
];

export function toUserMessage(message: string) {
  const lower = message.toLowerCase();

  for (const [needle, text] of REPLACEMENTS) {
    if (lower.includes(needle)) {
      return text;
    }
  }

  if (/[çğıöşüÇĞİÖŞÜ]/.test(message)) {
    const cleaned = message.replace(/^.*ERROR:\s*/i, "").trim();
    return cleaned.length > 180 ? "Bir sorun oluştu. Tekrar dene." : cleaned;
  }

  return "Bir sorun oluştu. Tekrar dene.";
}
