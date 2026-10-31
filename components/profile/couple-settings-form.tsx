"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateCoupleSettings } from "@/lib/actions/profile";
import { coupleSettingsSchema, type CoupleSettingsInput, type CoupleSettingsValues } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CoupleSettingsForm({ name, startDate }: { name: string; startDate: string }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<CoupleSettingsInput, unknown, CoupleSettingsValues>({
    resolver: zodResolver(coupleSettingsSchema),
    defaultValues: { name, startDate },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Çiftiniz</CardTitle>
        <CardDescription>Adı ve birlikte olduğunuz günü ikiniz de değiştirebilir.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            setError(null);
            setSaved(false);
            const result = await updateCoupleSettings(values);
            if (result.error) {
              setError(result.error);
              return;
            }
            setSaved(true);
          })}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="couple-name">Çiftinizin adı</Label>
            <Input id="couple-name" className="h-11 text-base" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="start-date">Birlikte olduğunuz gün</Label>
            <Input id="start-date" type="date" className="h-11 text-base" {...form.register("startDate")} />
            {form.formState.errors.startDate ? (
              <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saved ? <p className="text-sm">Kaydedildi.</p> : null}
          <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Kaydediliyor…" : "Çifti kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
