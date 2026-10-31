"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateMyDetails } from "@/lib/actions/profile";
import { partnerDetailsSchema, type PartnerDetailsInput, type PartnerDetailsValues } from "@/lib/validations/profile";
import { LOVE_LANGUAGES, type PartnerDetailsRow } from "@/types/couple";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";

export function MyDetailsForm({
  displayName,
  details,
}: {
  displayName: string;
  details: PartnerDetailsRow | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<PartnerDetailsInput, unknown, PartnerDetailsValues>({
    resolver: zodResolver(partnerDetailsSchema),
    defaultValues: {
      displayName,
      nickname: details?.nickname ?? "",
      birthday: details?.birthday ?? "",
      favoriteFood: details?.favorite_food ?? "",
      favoriteDrink: details?.favorite_drink ?? "",
      favoriteColor: details?.favorite_color ?? "",
      favoriteMusic: details?.favorite_music ?? "",
      loveLanguage: details?.love_language ?? "",
      dislikes: details?.dislikes ?? "",
      notes: details?.notes ?? "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Senin bilgilerin</CardTitle>
        <CardDescription>Bunları yalnızca sen düzenlersin. Partnerin görür.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            setError(null);
            setSaved(false);
            const result = await updateMyDetails(values);
            if (result.error) {
              setError(result.error);
              return;
            }
            setSaved(true);
          })}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="display-name">Adın</Label>
            <Input id="display-name" className="h-11 text-base" {...form.register("displayName")} />
            {form.formState.errors.displayName ? (
              <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="nickname">Takma adın</Label>
            <Input id="nickname" className="h-11 text-base" {...form.register("nickname")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="birthday">Doğum günün</Label>
            <Input id="birthday" type="date" className="h-11 text-base" {...form.register("birthday")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="favorite-food">Favori yiyeceğin</Label>
            <Input id="favorite-food" className="h-11 text-base" {...form.register("favoriteFood")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="favorite-drink">Favori içeceğin</Label>
            <Input id="favorite-drink" className="h-11 text-base" {...form.register("favoriteDrink")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="favorite-color">Favori rengin</Label>
            <Input id="favorite-color" className="h-11 text-base" {...form.register("favoriteColor")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="favorite-music">Favori müziğin</Label>
            <Input id="favorite-music" className="h-11 text-base" {...form.register("favoriteMusic")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="love-language">Sevgi dilin</Label>
            <SelectField id="love-language" {...form.register("loveLanguage")}>
              <option value="">Seçilmedi</option>
              {LOVE_LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dislikes">Hoşlanmadıkların</Label>
            <Textarea id="dislikes" {...form.register("dislikes")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saved ? <p className="text-sm">Kaydedildi.</p> : null}
          <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Kaydediliyor…" : "Profilini kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
