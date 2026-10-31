"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signUp } from "@/lib/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ inviteCode }: { inviteCode?: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  const loginHref = inviteCode ? `/giris?davet=${inviteCode}` : "/giris";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Kayıt ol</CardTitle>
        <CardDescription>
          {inviteCode ? "Davet kodun hazır. Hesabını oluşturunca çifte katılırsın." : "Önce hesabını aç, sonra çiftini kur."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            setFormError(null);
            setFormMessage(null);
            const result = await signUp(values, inviteCode);
            if (result?.error) {
              setFormError(result.error);
            }
            if (result?.message) {
              setFormMessage(result.message);
            }
          })}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="displayName">Adın</Label>
            <Input
              id="displayName"
              autoComplete="name"
              className="h-11 text-base"
              aria-invalid={Boolean(errors.displayName)}
              {...register("displayName")}
            />
            {errors.displayName ? <p className="text-sm text-destructive">{errors.displayName.message}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="h-11 text-base"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Parola</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              className="h-11 text-base"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
          </div>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          {formMessage ? <p className="text-sm text-foreground">{formMessage}</p> : null}
          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Hesap açılıyor…" : "Hesap oluştur"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hesabın var mı?{" "}
          <Link href={loginHref} className="text-primary underline-offset-4 hover:underline">
            Giriş yap
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
