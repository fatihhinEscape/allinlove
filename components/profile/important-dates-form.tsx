"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { addImportantDate, deleteImportantDate } from "@/lib/actions/profile";
import { daysUntil, formatTurkishDate, nextOccurrence, untilLabel } from "@/lib/dates";
import { importantDateSchema, type ImportantDateInput, type ImportantDateValues } from "@/lib/validations/profile";
import { DATE_KINDS, type ImportantDateRow } from "@/types/couple";
import { dateKindLabel } from "@/components/profile/person-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";

export function ImportantDatesForm({ dates }: { dates: ImportantDateRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const form = useForm<ImportantDateInput, unknown, ImportantDateValues>({
    resolver: zodResolver(importantDateSchema),
    defaultValues: { title: "", occursOn: "", kind: "other", notes: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Önemli tarihler</CardTitle>
        <CardDescription>Yıl dönümü, doğum günü veya ikiniz için önemli bir gün ekleyin.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {dates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz kayıtlı bir tarih yok.</p>
        ) : (
          <ul className="grid gap-3">
            {dates.map((item) => {
              const next = nextOccurrence(item.occurs_on);
              return (
                <li key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {dateKindLabel(item.kind)} · {formatTurkishDate(item.occurs_on)}
                      {next ? ` · ${untilLabel(daysUntil(next))}` : ""}
                    </p>
                    {item.notes ? <p className="mt-1 text-sm">{item.notes}</p> : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pendingId === item.id}
                    onClick={async () => {
                      setError(null);
                      setPendingId(item.id);
                      const result = await deleteImportantDate(item.id);
                      setPendingId(null);
                      if (result.error) {
                        setError(result.error);
                      }
                    }}
                  >
                    Sil
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            setError(null);
            const result = await addImportantDate(values);
            if (result.error) {
              setError(result.error);
              return;
            }
            form.reset({ title: "", occursOn: "", kind: "other", notes: "" });
          })}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="date-title">Başlık</Label>
            <Input id="date-title" className="h-11 text-base" {...form.register("title")} />
            {form.formState.errors.title ? (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="date-on">Tarih</Label>
            <Input id="date-on" type="date" className="h-11 text-base" {...form.register("occursOn")} />
            {form.formState.errors.occursOn ? (
              <p className="text-sm text-destructive">{form.formState.errors.occursOn.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="date-kind">Tür</Label>
            <SelectField id="date-kind" {...form.register("kind")}>
              {DATE_KINDS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="date-notes">Not</Label>
            <Textarea id="date-notes" {...form.register("notes")} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" variant="secondary" className="h-11" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Ekleniyor…" : "Tarih ekle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
