import { Button } from "@/components/ui/button";

export function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">demands-pls</h1>
      <p className="text-muted-foreground">A game is coming soon.</p>
      <Button disabled>Play</Button>
    </main>
  );
}
