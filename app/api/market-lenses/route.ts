import { NextResponse } from 'next/server';
import { DEFAULT_MARKET_LENS_ID, MARKET_LENSES } from '@/lib/marketLenses';

export function GET() {
  return NextResponse.json({
    defaultLensId: DEFAULT_MARKET_LENS_ID,
    lenses: MARKET_LENSES,
  });
}
