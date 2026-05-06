import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, createSupabaseServer } from '@/lib/supabase';
import type { JobSignal, MarketRoleFamily, MarketSeniority } from '@/lib/types';
import { computeIntentScore, computeScoreComponents, computeSeniorityLabel } from '@/lib/scoring';
import { filterSignalsForLens, getMarketLens, resolveMarketLensId } from '@/lib/marketLenses';

export const dynamic = 'force-dynamic';

interface PublicLaborMarketEnrichmentRow {
  job_signal_id: string;
  role_title_normalized: string | null;
  role_family: MarketRoleFamily | null;
  role_cluster: string | null;
  company_type: string | null;
  seniority: MarketSeniority | null;
  market_insight: string | null;
  evidence_snippets: string[] | null;
  prompt_version: string | null;
  validation_status: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const supabaseAdmin = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const minScore = Math.max(1, Math.min(10, parseInt(searchParams.get('min_score') ?? '1')));
    const families = searchParams.getAll('family');
    const hotOnly = searchParams.get('hot') === 'true';
    const search = searchParams.get('search')?.trim() ?? '';
    const tags = searchParams.getAll('tag');
    const lens = getMarketLens(resolveMarketLensId(searchParams.get('lens')));

    let query = supabase
      .from('signals_with_tags')
      .select('*')
      .gte('intent_score', minScore)
      .order('created_at', { ascending: false });

    if (hotOnly) query = query.eq('is_hot_lead', true);
    if (search) query = query.or(`company_name.ilike.%${search}%,job_title.ilike.%${search}%`);

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

    const signalIds = new Set((data ?? []).map((row) => row.id));
    const { data: enrichmentRows, error: enrichmentError } = signalIds.size > 0
      ? await supabaseAdmin
        .from('public_labor_market_enrichments')
        .select(`
          job_signal_id,
          role_title_normalized,
          role_family,
          role_cluster,
          company_type,
          seniority,
          market_insight,
          evidence_snippets,
          prompt_version,
          validation_status
        `)
      : { data: [], error: null };

    if (enrichmentError) {
      console.error('[signals/route] Enrichment fetch error:', enrichmentError.message);
      return NextResponse.json({ error: enrichmentError.message }, { status: 500 });
    }

    const enrichmentBySignalId = new Map(
      ((enrichmentRows ?? []) as PublicLaborMarketEnrichmentRow[])
        .filter((row) => signalIds.has(row.job_signal_id))
        .map((row) => [row.job_signal_id, row]),
    );

    const mergedSignals = (data ?? []).map((signal) => {
      const enrichment = enrichmentBySignalId.get(signal.id);
      return {
        ...signal,
        market_role_family: enrichment?.role_family ?? null,
        market_seniority: enrichment?.seniority ?? null,
        role_title_normalized: enrichment?.role_title_normalized ?? null,
        role_cluster: enrichment?.role_cluster ?? null,
        company_type: enrichment?.company_type ?? null,
        market_insight: enrichment?.market_insight ?? null,
        evidence_snippets: enrichment?.evidence_snippets ?? [],
        prompt_version: enrichment?.prompt_version ?? null,
        validation_status: enrichment?.validation_status ?? null,
      } satisfies JobSignal;
    });

    const familyFiltered = families.length > 0
      ? mergedSignals.filter((signal) => {
        const marketFamily = signal.market_role_family;
        const legacyFamily = signal.job_family;
        return families.some((family) => family === marketFamily || family === legacyFamily);
      })
      : mergedSignals;

    const tagFiltered = tags.length > 0
      ? familyFiltered.filter((row) =>
          tags.some((tag) => (row.tech_stack as string[])?.includes(tag)),
        )
      : familyFiltered;

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
        seniority_label: computeSeniorityLabel(signal.role_title_normalized ?? signal.job_title),
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
