"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "@/lib/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  inviteCode,
  notice,
}: {
  inviteCode?: string;
  notice?: string;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerHref = inviteCode ? `/kayit?davet=${inviteCode}` : "/kayit";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Giriş yap</CardTitle>
        <CardDescription>İkinizin yerine e-posta ve parolanla gir.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            setFormError(null);
            const result = await signIn(values, inviteCode);
            if (result?.error) {
              setFormError(result.error);
            }
          })}
        >
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
              autoComplete="current-password"
              className="h-11 text-base"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
          </div>
          {notice ? <p className="text-sm text-foreground">{notice}</p> : null}
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Giriş yapılıyor…" : "Giriş yap"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hesabın yok mu?{" "}
          <Link href={registerHref} className="text-primary underline-offset-4 hover:underline">
            Kayıt ol
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
