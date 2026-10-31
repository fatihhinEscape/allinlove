"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createCouple, joinCouple } from "@/lib/actions/couple";
import {
  createCoupleSchema,
  joinCoupleSchema,
  type CreateCoupleInput,
  type JoinCoupleInput,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CoupleSetup({ initialError }: { initialError?: string }) {
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(initialError ?? null);

  const createForm = useForm<CreateCoupleInput>({
    resolver: zodResolver(createCoupleSchema),
    defaultValues: { name: "", startDate: "" },
  });

  const joinForm = useForm<JoinCoupleInput>({
    resolver: zodResolver(joinCoupleSchema),
    defaultValues: { code: "" },
  });

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Çift oluştur</CardTitle>
          <CardDescription>Bir davet kodu üretilir. Partnerin bu kodla katılır.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={createForm.handleSubmit(async (values) => {
              setCreateError(null);
              const result = await createCouple(values);
              if (result?.error) {
                setCreateError(result.error);
              }
            })}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="couple-name">Çiftinizin adı</Label>
              <Input
                id="couple-name"
                placeholder="Bizim çiftimiz"
                className="h-11 text-base"
                aria-invalid={Boolean(createForm.formState.errors.name)}
                {...createForm.register("name")}
              />
              {createForm.formState.errors.name ? (
                <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="start-date">Birlikte olduğunuz gün</Label>
              <Input
                id="start-date"
                type="date"
                className="h-11 text-base"
                aria-invalid={Boolean(createForm.formState.errors.startDate)}
                {...createForm.register("startDate")}
              />
              {createForm.formState.errors.startDate ? (
                <p className="text-sm text-destructive">{createForm.formState.errors.startDate.message}</p>
              ) : null}
            </div>
            {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
            <Button type="submit" className="h-11 w-full" disabled={createForm.formState.isSubmitting}>
              {createForm.formState.isSubmitting ? "Oluşturuluyor…" : "Çifti oluştur"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Davet koduyla katıl</CardTitle>
          <CardDescription>Partnerinin gönderdiği 8 karakterlik kodu yaz.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={joinForm.handleSubmit(async (values) => {
              setJoinError(null);
              const result = await joinCouple(values);
              if (result?.error) {
                setJoinError(result.error);
              }
            })}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="invite-code">Davet kodu</Label>
              <Input
                id="invite-code"
                autoCapitalize="characters"
                autoComplete="off"
                className="h-11 text-base tracking-widest uppercase"
                aria-invalid={Boolean(joinForm.formState.errors.code)}
                {...joinForm.register("code")}
              />
              {joinForm.formState.errors.code ? (
                <p className="text-sm text-destructive">{joinForm.formState.errors.code.message}</p>
              ) : null}
            </div>
            {joinError ? <p className="text-sm text-destructive">{joinError}</p> : null}
            <Button type="submit" variant="secondary" className="h-11 w-full" disabled={joinForm.formState.isSubmitting}>
              {joinForm.formState.isSubmitting ? "Katılınıyor…" : "Çifte katıl"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
