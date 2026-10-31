"use client";

import { bumpStudyGoal, saveStudyGoal, saveStudySession } from "@/lib/actions/modules";
import { formatTurkishDate } from "@/lib/dates";
import { DeleteButton } from "@/components/modules/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Session = { id: string; topic: string; duration_minutes: number; studied_on: string };
type Goal = { id: string; title: string; target_count: number; completed_count: number };

export function StudyBoard({ sessions, goals }: { sessions: Session[]; goals: Goal[] }) {
  const max = Math.max(...sessions.map((session) => session.duration_minutes), 1);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Çalışma seansı</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = await saveStudySession({
                topic: String(form.get("topic") ?? ""),
                durationMinutes: String(form.get("minutes") ?? ""),
                studiedOn: String(form.get("date") ?? ""),
                notes: String(form.get("notes") ?? ""),
              });
              if (!result.error) event.currentTarget.reset();
            }}
          >
            <Input name="topic" placeholder="Konu" className="h-11" required />
            <div className="grid grid-cols-2 gap-2">
              <Input name="minutes" placeholder="Dakika" className="h-11" required />
              <Input name="date" type="date" className="h-11" />
            </div>
            <Button type="submit" className="h-11">Seansı kaydet</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Son seanslar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {sessions.length === 0 ? <p className="text-sm text-muted-foreground">Henüz seans yok.</p> : null}
          {sessions.map((session) => (
            <div key={session.id} className="grid gap-1">
              <div className="flex items-center justify-between text-sm">
                <span>{session.topic}</span>
                <span className="text-muted-foreground">{session.duration_minutes} dk · {formatTurkishDate(session.studied_on)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${(session.duration_minutes / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hedefler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {goals.map((goal) => {
            const ratio = Math.min(100, Math.round((goal.completed_count / goal.target_count) * 100));
            return (
              <div key={goal.id} className="grid gap-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>{goal.title}</span>
                  <span>{goal.completed_count}/{goal.target_count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${ratio}%` }} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => bumpStudyGoal(goal.id, goal.completed_count + 1)}>
                    Bir adım
                  </Button>
                  <DeleteButton table="study_goals" id={goal.id} />
                </div>
              </div>
            );
          })}
          <form
            className="grid grid-cols-[1fr_90px_auto] gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = await saveStudyGoal({
                title: String(form.get("title") ?? ""),
                targetCount: String(form.get("target") ?? ""),
              });
              if (!result.error) event.currentTarget.reset();
            }}
          >
            <Input name="title" placeholder="Hedef" className="h-11" />
            <Input name="target" placeholder="Adet" className="h-11" />
            <Button type="submit" className="h-11">Ekle</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
