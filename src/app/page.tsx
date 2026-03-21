import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-16 px-4">
        <div className="flex flex-col items-center gap-8 text-center w-full">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-black dark:text-zinc-50 mb-4">
              Metro Minute
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Test your reflexes! Click the targets as fast as you can.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>🎮 Play Now</CardTitle>
                <CardDescription>Choose a game mode and start playing</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/game?mode=classic">Classic Mode</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/game?mode=timed">Timed Mode</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/game?mode=endless">Endless Mode</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🏆 Leaderboard</CardTitle>
                <CardDescription>See the top scores</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/leaderboard">View Leaderboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
