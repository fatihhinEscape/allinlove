import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Geçerli bir e-posta yaz."),
  password: z.string().min(6, "Parola en az 6 karakter olsun.").max(72, "Parola en fazla 72 karakter olsun."),
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Ad en az 2 karakter olsun.").max(40, "Ad en fazla 40 karakter olsun."),
  email: z.email("Geçerli bir e-posta yaz."),
  password: z.string().min(6, "Parola en az 6 karakter olsun.").max(72, "Parola en fazla 72 karakter olsun."),
});

export const createCoupleSchema = z.object({
  name: z.string().trim().max(80, "Ad en fazla 80 karakter olsun."),
  startDate: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Tarihi kontrol et."),
});

export const joinCoupleSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9]{8}$/, "Davet kodu 8 karakter olmalı."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateCoupleInput = z.infer<typeof createCoupleSchema>;
export type JoinCoupleInput = z.infer<typeof joinCoupleSchema>;
