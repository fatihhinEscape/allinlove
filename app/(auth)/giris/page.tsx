import { LoginForm } from "@/components/auth/login-form";
import { safeInviteCode } from "@/lib/invite";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ davet?: string; durum?: string }>;
}) {
  const params = await searchParams;
  const inviteCode = safeInviteCode(params.davet ?? "") ?? undefined;
  const notice = params.durum === "onaylandi" ? "E-postan onaylandı. Şimdi giriş yap." : undefined;

  return <LoginForm inviteCode={inviteCode} notice={notice} />;
}
