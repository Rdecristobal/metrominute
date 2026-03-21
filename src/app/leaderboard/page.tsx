import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </header>

      <main className="flex-1 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Scores</CardTitle>
            <CardDescription>Best players across all modes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
              <p>Leaderboard coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
