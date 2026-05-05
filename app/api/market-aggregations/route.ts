import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import { computeIntentScore, computeScoreComponents, computeSeniorityLabel } from '@/lib/scoring';
import { buildAllLensAggregations } from '@/lib/marketAggregations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();

    const { data, error } = await supabase
      .from('signals_with_tags')
      .select('*')
      .gte('intent_score', 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[market-aggregations/route] Supabase error:', error.message);
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

    return NextResponse.json({
      aggregations: buildAllLensAggregations(signals),
    });
  } catch (error) {
    console.error('[market-aggregations/route] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
