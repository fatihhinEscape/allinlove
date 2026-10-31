"use client";

import { useState } from "react";
import { saveBook, saveBookNote } from "@/lib/actions/modules";
import { DeleteButton } from "@/components/modules/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";

type Note = { id: string; book_id: string; quote: string | null; note: string | null };
type Book = {
  id: string;
  title: string;
  author: string | null;
  status: string;
  pages_read: number;
  page_count: number | null;
  score_a: number | null;
  score_b: number | null;
};

const statusLabel: Record<string, string> = { planned: "Okunacak", reading: "Okunuyor", finished: "Bitti" };

export function BooksBoard({ books, notes }: { books: Book[]; notes: Note[] }) {
  const [bookId, setBookId] = useState(books[0]?.id ?? "");

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader><CardTitle>Kitap ekle</CardTitle></CardHeader>
        <CardContent>
          <form
            className="grid gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = await saveBook({
                title: String(form.get("title") ?? ""),
                author: String(form.get("author") ?? ""),
                status: String(form.get("status") ?? ""),
                pagesRead: String(form.get("pagesRead") ?? ""),
                pageCount: String(form.get("pageCount") ?? ""),
                scoreA: String(form.get("scoreA") ?? ""),
                scoreB: String(form.get("scoreB") ?? ""),
                notes: "",
              });
              if (!result.error) event.currentTarget.reset();
            }}
          >
            <Input name="title" placeholder="Kitap" className="h-11" required />
            <Input name="author" placeholder="Yazar" className="h-11" />
            <SelectField name="status" defaultValue="planned">
              <option value="planned">Okunacak</option>
              <option value="reading">Okunuyor</option>
              <option value="finished">Bitti</option>
            </SelectField>
            <div className="grid grid-cols-2 gap-2">
              <Input name="pagesRead" placeholder="Okunan sayfa" className="h-11" />
              <Input name="pageCount" placeholder="Toplam sayfa" className="h-11" />
              <Input name="scoreA" placeholder="Senin puanın" className="h-11" />
              <Input name="scoreB" placeholder="Partnerinin puanı" className="h-11" />
            </div>
            <Button type="submit" className="h-11">Kaydet</Button>
          </form>
        </CardContent>
      </Card>

      {books.length === 0 ? <p className="text-sm text-muted-foreground">Henüz kitap yok.</p> : null}
      {books.map((book) => {
        const ratio = book.page_count ? Math.min(100, Math.round((book.pages_read / book.page_count) * 100)) : 0;
        return (
          <Card key={book.id}>
            <CardHeader>
              <CardTitle>{book.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <p className="text-muted-foreground">
                {book.author ? `${book.author} · ` : ""}
                {statusLabel[book.status] ?? book.status}
                {book.page_count ? ` · ${book.pages_read}/${book.page_count}` : ""}
              </p>
              {book.page_count ? (
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${ratio}%` }} />
                </div>
              ) : null}
              {(book.score_a || book.score_b) ? <p>Puan {book.score_a ?? "-"} / {book.score_b ?? "-"}</p> : null}
              {notes.filter((note) => note.book_id === book.id).map((note) => (
                <blockquote key={note.id} className="border-l-2 border-primary pl-3">
                  {note.quote ? <p>“{note.quote}”</p> : null}
                  {note.note ? <p>{note.note}</p> : null}
                </blockquote>
              ))}
              <DeleteButton table="books" id={book.id} />
            </CardContent>
          </Card>
        );
      })}

      {books.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Alıntı veya not</CardTitle></CardHeader>
          <CardContent>
            <form
              className="grid gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const result = await saveBookNote({
                  bookId,
                  quote: String(form.get("quote") ?? ""),
                  note: String(form.get("note") ?? ""),
                });
                if (!result.error) event.currentTarget.reset();
              }}
            >
              <SelectField value={bookId} onChange={(event) => setBookId(event.target.value)}>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>{book.title}</option>
                ))}
              </SelectField>
              <Textarea name="quote" placeholder="Alıntı" />
              <Textarea name="note" placeholder="Not" />
              <Button type="submit" variant="secondary" className="h-11">Ekle</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
