import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get total games played
    const { count: totalGames, error: gamesError } = await supabase
      .from("scores")
      .select("*", { count: "exact", head: true });

    if (gamesError) throw gamesError;

    // Get average score
    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select("score");

    if (scoresError) throw scoresError;

    const averageScore = scores && scores.length > 0
      ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      : 0;

    return NextResponse.json({
      totalGames: totalGames || 0,
      averageScore: Math.round(averageScore),
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
