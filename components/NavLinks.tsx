'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/',               label: 'Market Briefing'       },
  { href: '/signals',        label: 'Signals'                },
  { href: '/emerging-roles', label: 'Emerging Roles'         },
  { href: '/skills-tools',   label: 'Rising Skills & Tools'  },
  { href: '/industries',     label: 'Market Segments'        },
  { href: '/companies',      label: 'Companies'              },
  { href: '/methodology',    label: 'About / Methodology'    },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="main-nav">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`nav-link${active ? ' is-active' : ''}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
