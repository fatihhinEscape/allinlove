export const LOVE_LANGUAGES = [
  { value: "words", label: "Sözel onay" },
  { value: "time", label: "Kaliteli zaman" },
  { value: "gifts", label: "Hediyeler" },
  { value: "service", label: "Hizmet davranışları" },
  { value: "touch", label: "Fiziksel temas" },
] as const;

export type LoveLanguage = (typeof LOVE_LANGUAGES)[number]["value"];

export const DATE_KINDS = [
  { value: "anniversary", label: "Yıl dönümü" },
  { value: "birthday", label: "Doğum günü" },
  { value: "other", label: "Önemli gün" },
] as const;

export type DateKind = (typeof DATE_KINDS)[number]["value"];

export type ProfileRow = {
  id: string;
  display_name: string;
  couple_id: string | null;
};

export type PartnerDetailsRow = {
  id: string;
  couple_id: string;
  user_id: string;
  nickname: string | null;
  birthday: string | null;
  favorite_food: string | null;
  favorite_drink: string | null;
  favorite_color: string | null;
  favorite_music: string | null;
  love_language: LoveLanguage | null;
  dislikes: string | null;
  notes: string | null;
};

export type ImportantDateRow = {
  id: string;
  couple_id: string;
  title: string;
  occurs_on: string;
  kind: DateKind;
  notes: string | null;
};

export type CoupleRow = {
  id: string;
  name: string;
  invite_code: string | null;
  relationship_start: string | null;
};
