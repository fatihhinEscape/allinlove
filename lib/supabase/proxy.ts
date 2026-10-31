import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeInviteCode } from "@/lib/invite";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const redirectTo = (pathname: string, search = "") => {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = pathname;
    nextUrl.search = search;
    const redirectResponse = NextResponse.redirect(nextUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  };

  if (!user && path.startsWith("/davet/")) {
    const code = safeInviteCode(path.split("/")[2] ?? "");
    const search = code ? `?davet=${code}` : "";
    return redirectTo("/kayit", search);
  }

  const isPublic =
    path === "/giris" ||
    path === "/kayit" ||
    path.startsWith("/auth/");

  if (!user && !isPublic) {
    return redirectTo("/giris");
  }

  if (user && (path === "/giris" || path === "/kayit")) {
    const invite = safeInviteCode(request.nextUrl.searchParams.get("davet") ?? "");
    if (invite) {
      return redirectTo(`/davet/${invite}`);
    }
    return redirectTo("/");
  }

  return supabaseResponse;
}
