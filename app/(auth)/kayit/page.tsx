import { RegisterForm } from "@/components/auth/register-form";
import { safeInviteCode } from "@/lib/invite";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ davet?: string }>;
}) {
  const params = await searchParams;
  const inviteCode = safeInviteCode(params.davet ?? "") ?? undefined;

  return <RegisterForm inviteCode={inviteCode} />;
}
