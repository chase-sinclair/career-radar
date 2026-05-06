const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'src',
  'tracking',
  'campaign',
  'fbclid',
  'gclid',
  'xkcb',
  'atk',
  'jrtk',
  'from',
]);

const REDIRECT_HOSTS = new Set([
  'to.indeed.com',
  'www.google.com',
  'google.com',
]);

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function lowercaseHost(url) {
  return url.hostname.toLowerCase();
}

function stripTrackingParams(url) {
  for (const param of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(param.toLowerCase())) {
      url.searchParams.delete(param);
    }
  }
  return url;
}

function decodeGoogleRedirect(url) {
  const target =
    url.searchParams.get('q') ||
    url.searchParams.get('url') ||
    url.searchParams.get('imgurl');

  if (!target) return url;
  const parsedTarget = parseUrl(target);
  if (!parsedTarget) return url;
  return stripTrackingParams(parsedTarget);
}

function canonicalizeIndeedUrl(url) {
  const jk = url.searchParams.get('jk');
  const vjk = url.searchParams.get('vjk');

  if (jk) {
    return new URL(`https://www.indeed.com/viewjob?jk=${encodeURIComponent(jk)}`);
  }

  if (vjk) {
    return new URL(`https://www.indeed.com/viewjob?jk=${encodeURIComponent(vjk)}`);
  }

  return stripTrackingParams(url);
}

export function normalizeJobUrl(rawUrl) {
  const text = (rawUrl ?? '').trim();
  if (!text) return null;

  const parsed = parseUrl(text);
  if (!parsed) return text;

  const host = lowercaseHost(parsed);

  if (host === 'www.google.com' || host === 'google.com') {
    if (parsed.pathname === '/url') {
      return decodeGoogleRedirect(parsed).toString();
    }
    return stripTrackingParams(parsed).toString();
  }

  if (host.endsWith('indeed.com')) {
    return canonicalizeIndeedUrl(parsed).toString();
  }

  return stripTrackingParams(parsed).toString();
}

export async function resolveJobUrl(rawUrl, options = {}) {
  const normalized = normalizeJobUrl(rawUrl);
  if (!normalized) return null;

  const parsed = parseUrl(normalized);
  if (!parsed) return normalized;

  if (!REDIRECT_HOSTS.has(lowercaseHost(parsed))) {
    return normalized;
  }

  try {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 12000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(normalized, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 Career Radar URL Resolver',
      },
    });

    clearTimeout(timer);
    return normalizeJobUrl(response.url) ?? normalized;
  } catch {
    return normalized;
  }
}
