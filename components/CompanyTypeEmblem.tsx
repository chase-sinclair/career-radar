type EmblemName =
  | 'Startups'
  | 'Startup'
  | 'Healthcare'
  | 'Government Contractors'
  | 'Government Contractor'
  | 'Banks'
  | 'Bank'
  | 'Consulting'
  | 'Enterprise SaaS'
  | 'Top Tech'
  | string;

interface Props {
  type: EmblemName;
  className?: string;
}

function normalizedType(type: string) {
  return type.toLowerCase().replace(/[^a-z]/g, '');
}

export default function CompanyTypeEmblem({ type, className = '' }: Props) {
  const icon = normalizedType(type);
  const wrapperClass = `company-type-emblem ${className}`.trim();

  return (
    <span className={wrapperClass} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {(icon === 'startup' || icon === 'startups') && (
          <>
            <path d="M5 15c-1.2 1.2-1.6 2.6-1.8 4.8 2.2-.2 3.6-.6 4.8-1.8" />
            <path d="M9 15 6 18" />
            <path d="M14 4c2.4-.8 4.4-.6 6 0 .6 1.6.8 3.6 0 6-1 3.1-3.6 5.7-7.5 7.5L6.5 11.5C8.3 7.6 10.9 5 14 4Z" />
            <path d="M14 8h.01" />
          </>
        )}

        {icon === 'healthcare' && (
          <>
            <path d="M20.5 8.8c0 5.3-8.5 10.2-8.5 10.2S3.5 14.1 3.5 8.8A4.3 4.3 0 0 1 11 5.9l1 1 1-1a4.3 4.3 0 0 1 7.5 2.9Z" />
            <path d="M7 12h3l1-2.2 2 4.4 1.2-2.2H17" />
          </>
        )}

        {(icon === 'governmentcontractor' || icon === 'governmentcontractors') && (
          <>
            <path d="M4 10h16" />
            <path d="M5 20h14" />
            <path d="M6 10v8" />
            <path d="M10 10v8" />
            <path d="M14 10v8" />
            <path d="M18 10v8" />
            <path d="M3.5 8 12 3l8.5 5" />
            <path d="m15.4 15.2 1.2 1.2 2.4-2.8" />
          </>
        )}

        {(icon === 'bank' || icon === 'banks') && (
          <>
            <path d="M4 10h16" />
            <path d="M5 20h14" />
            <path d="M6 10v8" />
            <path d="M10 10v8" />
            <path d="M14 10v8" />
            <path d="M18 10v8" />
            <path d="M3.5 8 12 3l8.5 5" />
          </>
        )}

        {icon === 'consulting' && (
          <>
            <path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h1" />
            <path d="M21 20v-1.5A4.5 4.5 0 0 0 16.5 14h-1" />
            <path d="M14 13h4v3h-4z" />
          </>
        )}

        {icon === 'enterprisesaas' && (
          <>
            <path d="M7 17.5a4.5 4.5 0 0 1 .8-8.9A5.8 5.8 0 0 1 19 10.5a3.5 3.5 0 0 1-1 6.9" />
            <path d="M15.8 15.2a3 3 0 1 1-2.6-1.5" />
            <path d="M15 12.4v2.8l2.3 1.3" />
            <path d="M12 18.8h-1.5" />
          </>
        )}

        {icon === 'toptech' && (
          <>
            <rect x="8" y="8" width="8" height="8" rx="1.5" />
            <rect x="10.5" y="10.5" width="3" height="3" rx=".5" />
            <path d="M4 10h3" />
            <path d="M4 14h3" />
            <path d="M17 10h3" />
            <path d="M17 14h3" />
            <path d="M10 4v3" />
            <path d="M14 4v3" />
            <path d="M10 17v3" />
            <path d="M14 17v3" />
          </>
        )}

        {!['startup', 'startups', 'healthcare', 'governmentcontractor', 'governmentcontractors', 'bank', 'banks', 'consulting', 'enterprisesaas', 'toptech'].includes(icon) && (
          <>
            <circle cx="12" cy="12" r="7" />
            <path d="M12 8v4l2.5 2.5" />
          </>
        )}
      </svg>
    </span>
  );
}
