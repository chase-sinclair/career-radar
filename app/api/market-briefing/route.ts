import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { computeIntentScore, computeScoreComponents, computeSeniorityLabel } from '@/lib/scoring';
import { buildWeeklyMarketBriefing, resolveLensFromValue } from '@/lib/marketAggregations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { searchParams } = new URL(request.url);
    const lens = resolveLensFromValue(searchParams.get('lens'));

    const { data, error } = await supabase
      .from('signals_with_tags')
      .select('*')
      .gte('intent_score', 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[market-briefing/route] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const signals = (data ?? []).map((signal) => {
      const components = computeScoreComponents({
        job_title: signal.job_title,
        raw_description: signal.raw_description,
        tech_stack: signal.tech_stack as string[],
        created_at: signal.created_at,
      });

      return {
        ...signal,
        score_components: components,
        computed_score: computeIntentScore(components),
        seniority_label: computeSeniorityLabel(signal.job_title),
      };
    });

    return NextResponse.json(buildWeeklyMarketBriefing(signals, lens));
  } catch (error) {
    console.error('[market-briefing/route] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
