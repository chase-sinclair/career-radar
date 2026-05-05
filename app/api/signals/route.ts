import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import type { JobFamily } from '@/lib/types';
import { computeIntentScore, computeScoreComponents, computeSeniorityLabel } from '@/lib/scoring';
import { filterSignalsForLens, getMarketLens, resolveMarketLensId } from '@/lib/marketLenses';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { searchParams } = new URL(request.url);
    const minScore = Math.max(1, Math.min(10, parseInt(searchParams.get('min_score') ?? '1')));
    const families = searchParams.getAll('family') as JobFamily[];
    const hotOnly = searchParams.get('hot') === 'true';
    const search = searchParams.get('search')?.trim() ?? '';
    const tags = searchParams.getAll('tag');
    const lens = getMarketLens(resolveMarketLensId(searchParams.get('lens')));

    let query = supabase
      .from('signals_with_tags')
      .select('*')
      .gte('intent_score', minScore)
      .order('created_at', { ascending: false });

    if (families.length > 0) query = query.in('job_family', families);
    if (hotOnly) query = query.eq('is_hot_lead', true);
    if (search) query = query.ilike('company_name', `%${search}%`);

    const [{ data, error }, { count: hotLeadsTotal }] = await Promise.all([
      query,
      supabase
        .from('job_signals')
        .select('*', { count: 'exact', head: true })
        .eq('is_hot_lead', true),
    ]);

    if (error) {
      console.error('[signals/route] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const tagFiltered = tags.length > 0
      ? (data ?? []).filter((row) =>
          tags.some((tag) => (row.tech_stack as string[])?.includes(tag)),
        )
      : (data ?? []);

    const enriched = tagFiltered.map((signal) => {
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
    const lensFiltered = filterSignalsForLens(enriched, lens);

    return NextResponse.json({
      signals: lensFiltered,
      count: lensFiltered.length,
      hot_leads_total: hotLeadsTotal ?? 0,
      lens: lens.id,
    });
  } catch (error) {
    console.error('[signals/route] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
