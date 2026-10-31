import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const publicNames = new Set(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

function add(name, value) {
  const args = [
    "vercel",
    "env",
    "add",
    name,
    "--environment",
    "production,preview",
    "--value",
    value,
    "--yes",
    "--force",
    publicNames.has(name) ? "--no-sensitive" : "--sensitive",
  ];
  return new Promise((resolve, reject) => {
    const child = spawn("npx", args, { stdio: "inherit", shell: true });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${name} could not be saved`));
    });
  });
}

for (const [name, value] of Object.entries(env)) {
  if (!value || name.startsWith("VERCEL_")) continue;
  await add(name, value);
  console.log(`saved ${name}`);
}
