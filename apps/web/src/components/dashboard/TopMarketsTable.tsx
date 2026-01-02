'use client';

import useSWR from 'swr';
import Link from 'next/link';
import clsx from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Market {
  id: string;
  venue: string;
  outcome_id_native: string;
  title: string;
  status: string;
}

export function TopMarketsTable() {
  const { data, isLoading } = useSWR(
    `${API_URL}/api/markets?status=open&page_size=10&sort=updated`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const markets: Market[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-12" />
        ))}
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        No markets available
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Market</th>
            <th>Venue</th>
            <th>Bid/Ask</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((market) => (
            <tr key={`${market.venue}-${market.outcome_id_native}`}>
              <td>
                <Link
                  href={`/markets/${market.venue}/${market.outcome_id_native}`}
                  className="hover:text-emerald-400 transition-colors"
                >
                  <span className="line-clamp-1">{market.title}</span>
                </Link>
              </td>
              <td>
                <span className="badge badge-blue">{market.venue}</span>
              </td>
              <td className="tabular-nums text-sm">
                <span className="text-emerald-400">0.52</span>
                <span className="text-zinc-600 mx-1">/</span>
                <span className="text-red-400">0.54</span>
              </td>
              <td>
                <span className={clsx(
                  'badge',
                  market.status === 'open' ? 'badge-green' :
                  market.status === 'closed' ? 'badge-yellow' :
                  'badge-gray'
                )}>
                  {market.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

