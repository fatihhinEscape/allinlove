import { BooksBoard } from "@/components/modules/books-board";
import { StatusCard } from "@/components/status-card";
import { requireMembership } from "@/lib/membership";

export default async function BooksPage() {
  const context = await requireMembership();
  if (!context.ok) return <StatusCard title="Henüz hazır değil" description={context.error} />;

  const [{ data: books, error }, { data: notes }] = await Promise.all([
    context.supabase.from("books").select("id, title, author, status, pages_read, page_count, score_a, score_b").eq("couple_id", context.coupleId).order("title"),
    context.supabase.from("book_notes").select("id, book_id, quote, note").eq("couple_id", context.coupleId),
  ]);

  if (error) return <StatusCard title="Henüz hazır değil" description="Kitap tablosu yok. Son SQL betiğini çalıştır." />;
  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Kitaplar</h1>
      <BooksBoard books={books ?? []} notes={notes ?? []} />
    </div>
  );
}
