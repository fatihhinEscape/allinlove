import Link from "next/link";

const links = [
  { href: "/", label: "Ana" },
  { href: "/profil", label: "Profil" },
];

export function AppNav({ current }: { current: "/" | "/profil" }) {
  return (
    <nav className="mb-6 flex gap-2" aria-label="Uygulama">
      {links.map((link) => {
        const active = current === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                : "rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
