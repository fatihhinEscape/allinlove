import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <div className="flex justify-center">
          <Wordmark />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">İkinizin ortak yeri</p>
      </div>
      {children}
    </div>
  );
}
