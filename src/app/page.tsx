import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
                <Link 
                  href="/game?mode=classic"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 h-10 px-4 py-2 w-full"
                >
                  Classic Mode
                </Link>
                <Link 
                  href="/game?mode=timed"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 h-10 px-4 py-2 w-full"
                >
                  Timed Mode
                </Link>
                <Link 
                  href="/game?mode=endless"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 h-10 px-4 py-2 w-full"
                >
                  Endless Mode
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🏆 Leaderboard</CardTitle>
                <CardDescription>See the top scores</CardDescription>
              </CardHeader>
              <CardContent>
                <Link 
                  href="/leaderboard"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 h-10 px-4 py-2 w-full"
                >
                  View Leaderboard
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
