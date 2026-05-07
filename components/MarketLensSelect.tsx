'use client';

import { MARKET_LENSES, resolveMarketLensId, type MarketLensId } from '@/lib/marketLenses';

interface Props {
  value: MarketLensId;
  onChange: (lensId: MarketLensId) => void;
  label?: string;
}

export default function MarketLensSelect({ value, onChange, label = 'Job Family' }: Props) {
  return (
    <label className="lens-select">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(resolveMarketLensId(event.target.value))}
      >
        {MARKET_LENSES.map((lens) => (
          <option key={lens.id} value={lens.id}>
            {lens.label}
          </option>
        ))}
      </select>
    </label>
  );
}
