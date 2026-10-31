import { formatShortDate } from "@/lib/dates";
import { DATE_KINDS, LOVE_LANGUAGES, type PartnerDetailsRow, type ProfileRow } from "@/types/couple";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function loveLabel(value: PartnerDetailsRow["love_language"]) {
  return LOVE_LANGUAGES.find((item) => item.value === value)?.label ?? null;
}

export function PersonCard({
  title,
  empty,
  person,
  details,
}: {
  title: string;
  empty: string;
  person: ProfileRow | null;
  details: PartnerDetailsRow | null;
}) {
  if (!person) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{empty}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const name = details?.nickname || person.display_name;
  const items = [
    details?.birthday ? `Doğum günü: ${formatShortDate(details.birthday)}` : null,
    details?.favorite_food ? `Yiyecek: ${details.favorite_food}` : null,
    details?.favorite_drink ? `İçecek: ${details.favorite_drink}` : null,
    details?.favorite_color ? `Renk: ${details.favorite_color}` : null,
    details?.favorite_music ? `Müzik: ${details.favorite_music}` : null,
    loveLabel(details?.love_language ?? null) ? `Sevgi dili: ${loveLabel(details?.love_language ?? null)}` : null,
    details?.dislikes ? `Hoşlanmadıkları: ${details.dislikes}` : null,
    details?.notes ? details.notes : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1.5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz ayrıntı yok.</p>
        ) : (
          items.map((item) => (
            <p key={item} className="text-sm">
              {item}
            </p>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function dateKindLabel(kind: string) {
  return DATE_KINDS.find((item) => item.value === kind)?.label ?? "Önemli gün";
}
