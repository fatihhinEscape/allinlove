import { z } from "zod";
import { LOVE_LANGUAGES } from "@/types/couple";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null);

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Tarihi kontrol et.")
  .transform((value) => value || null);

export const coupleSettingsSchema = z.object({
  name: z.string().trim().min(1, "Çift adı boş olmasın.").max(80, "Ad en fazla 80 karakter olsun."),
  startDate: optionalDate,
});

export const partnerDetailsSchema = z.object({
  displayName: z.string().trim().min(2, "Ad en az 2 karakter olsun.").max(40, "Ad en fazla 40 karakter olsun."),
  nickname: optionalText(40, "Takma ad en fazla 40 karakter olsun."),
  birthday: optionalDate,
  favoriteFood: optionalText(80, "Favori yiyecek en fazla 80 karakter olsun."),
  favoriteDrink: optionalText(80, "Favori içecek en fazla 80 karakter olsun."),
  favoriteColor: optionalText(40, "Favori renk en fazla 40 karakter olsun."),
  favoriteMusic: optionalText(80, "Favori müzik en fazla 80 karakter olsun."),
  loveLanguage: z
    .string()
    .refine(
      (value) => value === "" || LOVE_LANGUAGES.some((item) => item.value === value),
      "Sevgi dilini listeden seç.",
    )
    .transform((value) => (value === "" ? null : value)),
  dislikes: optionalText(500, "Hoşlanmadıkların en fazla 500 karakter olsun."),
  notes: optionalText(1000, "Not en fazla 1000 karakter olsun."),
});

export const importantDateSchema = z.object({
  title: z.string().trim().min(1, "Başlık yaz.").max(80, "Başlık en fazla 80 karakter olsun."),
  occursOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tarihi kontrol et."),
  kind: z.enum(["anniversary", "birthday", "other"]),
  notes: optionalText(500, "Not en fazla 500 karakter olsun."),
});

export type CoupleSettingsInput = z.input<typeof coupleSettingsSchema>;
export type CoupleSettingsValues = z.output<typeof coupleSettingsSchema>;
export type PartnerDetailsInput = z.input<typeof partnerDetailsSchema>;
export type PartnerDetailsValues = z.output<typeof partnerDetailsSchema>;
export type ImportantDateInput = z.input<typeof importantDateSchema>;
export type ImportantDateValues = z.output<typeof importantDateSchema>;
