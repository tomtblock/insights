'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Activity, Calculator, Code, RefreshCw, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// LaTeX formulas from @arb/math
const FORMULAS = {
  edge: `\\text{Edge}(Q) = P_{\\text{sell}}(Q) - P_{\\text{buy}}(Q) - \\text{Fees} - \\text{RiskBuffer}`,
  clobBuy: `P_{\\text{buy}}(Q) = \\frac{\\sum_{i=1}^{n} p_i \\cdot q_i}{Q} \\text{ where } \\sum_{i=1}^{n} q_i = Q \\text{ walking asks}`,
  clobSell: `P_{\\text{sell}}(Q) = \\frac{\\sum_{i=1}^{n} p_i \\cdot q_i}{Q} \\text{ where } \\sum_{i=1}^{n} q_i = Q \\text{ walking bids}`,
  ammPrice: `P_{\\text{AMM}}(Q) \\approx P_0 \\cdot \\left(1 + \\frac{Q}{2L}\\right) \\text{ (linear approx for small } Q \\text{)}`,
  confidence: `\\text{Score} = \\min(40, \\text{Edge}_{\\text{bps}}) + \\min(25, \\frac{\\text{Depth}}{5000} \\cdot 25) + \\text{Freshness} + (1-\\text{Ambiguity}) \\cdot 10 + \\text{ResolutionBonus}`,
  netEdge: `\\text{NetEdge}(Q) = P_{\\text{sell}}(Q) - P_{\\text{buy}}(Q) - \\frac{\\text{BuyFee}_{\\text{bps}} + \\text{SellFee}_{\\text{bps}}}{10000} - \\frac{\\text{RiskBuffer}_{\\text{bps}}}{10000}`,
};

const VARIABLES = [
  { name: 'P_buy(Q)', unit: 'probability', definition: 'Execution price to buy Q USD worth', source: 'Order book (CLOB) or AMM curve' },
  { name: 'P_sell(Q)', unit: 'probability', definition: 'Execution price to sell Q USD worth', source: 'Order book (CLOB) or AMM curve' },
  { name: 'Edge(Q)', unit: 'decimal', definition: 'Gross edge before fees', source: 'Computed from P_buy and P_sell' },
  { name: 'NetEdge(Q)', unit: 'decimal', definition: 'Net edge after fees and risk buffer', source: 'Computed' },
  { name: 'Fees', unit: 'bps', definition: 'Combined venue fees (buy + sell)', source: 'Venue config' },
  { name: 'RiskBuffer', unit: 'bps', definition: 'Safety margin (default 15 bps)', source: 'Config' },
  { name: 'Depth@1%', unit: 'USD', definition: 'Liquidity within 1% of mid price', source: 'Order book' },
  { name: 'Staleness', unit: 'ms', definition: 'Time since last data update', source: 'last_update_ts' },
  { name: 'TruthAmbiguity', unit: '0-1', definition: 'Resolution uncertainty score', source: 'Market metadata' },
  { name: 'TimeToResolution', unit: 'ms', definition: 'Time until market resolves', source: 'resolve_ts' },
];

const Q_BUCKETS = [100, 250, 500, 1000, 2500, 5000];

function renderLatex(formula: string): string {
  try {
    return katex.renderToString(formula, { throwOnError: false, displayMode: true });
  } catch {
    return formula;
  }
}

export default function AlgorithmPage() {
  const [activeTab, setActiveTab] = useState<'formulas' | 'variables' | 'replay'>('formulas');

  const { data: rulesData } = useSWR(`${API_URL}/api/rules`, fetcher);
  const rules = rulesData?.data || [];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Activity className="w-7 h-7 text-emerald-500" />
            Algorithm Conditions
          </h1>
          <p className="text-zinc-500 mt-1">
            Mathematical specifications for edge calculation and opportunity scoring
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-400">Deterministic & Replayable</p>
            <p className="text-sm text-emerald-400/80 mt-1">
              All computations use the same expressions displayed here. 
              Every trigger event stores snapshot hashes for replay verification.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab('formulas')}
          className={`tab ${activeTab === 'formulas' ? 'tab-active' : 'tab-inactive'}`}
        >
          <Calculator className="w-4 h-4" />
          Formulas
        </button>
        <button
          onClick={() => setActiveTab('variables')}
          className={`tab ${activeTab === 'variables' ? 'tab-active' : 'tab-inactive'}`}
        >
          <Code className="w-4 h-4" />
          Variables
        </button>
        <button
          onClick={() => setActiveTab('replay')}
          className={`tab ${activeTab === 'replay' ? 'tab-active' : 'tab-inactive'}`}
        >
          <RefreshCw className="w-4 h-4" />
          Replay & Verify
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'formulas' && (
        <div className="space-y-6">
          {/* Edge Calculation */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Edge Calculation</h3>
              <p className="text-sm text-zinc-500 mt-1">Core arbitrage edge formula</p>
            </div>
            <div className="p-6 space-y-4">
              <div 
                className="p-4 bg-zinc-800/50 rounded-lg overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: renderLatex(FORMULAS.edge) }}
              />
              <p className="text-sm text-zinc-400">
                For each Q bucket, we compute the execution prices on both sides and subtract fees and risk buffer.
              </p>
            </div>
          </div>

          {/* CLOB Execution */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">CLOB Execution Price</h3>
              <p className="text-sm text-zinc-500 mt-1">Order book integration</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Buy Side (Walk Asks)</p>
                  <div 
                    className="p-4 bg-zinc-800/50 rounded-lg overflow-x-auto text-sm"
                    dangerouslySetInnerHTML={{ __html: renderLatex(FORMULAS.clobBuy) }}
                  />
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Sell Side (Walk Bids)</p>
                  <div 
                    className="p-4 bg-zinc-800/50 rounded-lg overflow-x-auto text-sm"
                    dangerouslySetInnerHTML={{ __html: renderLatex(FORMULAS.clobSell) }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AMM Price */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">AMM Execution Price</h3>
              <p className="text-sm text-zinc-500 mt-1">Constant product approximation</p>
            </div>
            <div className="p-6 space-y-4">
              <div 
                className="p-4 bg-zinc-800/50 rounded-lg overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: renderLatex(FORMULAS.ammPrice) }}
              />
              <p className="text-sm text-zinc-400">
                For small trades relative to pool liquidity, we use a linear approximation of the constant product formula.
              </p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Confidence Score (0-100)</h3>
              <p className="text-sm text-zinc-500 mt-1">Opportunity quality metric</p>
            </div>
            <div className="p-6 space-y-4">
              <div 
                className="p-4 bg-zinc-800/50 rounded-lg overflow-x-auto text-sm"
                dangerouslySetInnerHTML={{ __html: renderLatex(FORMULAS.confidence) }}
              />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                <div className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500">Edge Margin</p>
                  <p className="font-bold text-emerald-400">0-40 pts</p>
                </div>
                <div className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500">Depth Robustness</p>
                  <p className="font-bold text-emerald-400">0-25 pts</p>
                </div>
                <div className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500">Freshness</p>
                  <p className="font-bold text-emerald-400">0-15 pts</p>
                </div>
                <div className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500">Truth Clarity</p>
                  <p className="font-bold text-emerald-400">0-10 pts</p>
                </div>
                <div className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500">Resolution Buffer</p>
                  <p className="font-bold text-emerald-400">0-10 pts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Q Buckets */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Q Size Buckets</h3>
              <p className="text-sm text-zinc-500 mt-1">Standard trade sizes for edge calculation</p>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                {Q_BUCKETS.map((q) => (
                  <div key={q} className="px-4 py-2 bg-zinc-800 rounded-lg">
                    <span className="text-lg font-bold tabular-nums">${q.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-400 mt-4">
                Edge is calculated for each Q bucket. The "best Q" is the size that maximizes net edge × size.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'variables' && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">Variables Reference</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Unit</th>
                  <th>Definition</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {VARIABLES.map((v) => (
                  <tr key={v.name}>
                    <td>
                      <code className="px-2 py-1 bg-zinc-800 rounded text-emerald-400">
                        {v.name}
                      </code>
                    </td>
                    <td className="text-zinc-400">{v.unit}</td>
                    <td>{v.definition}</td>
                    <td className="text-zinc-500 text-sm">{v.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'replay' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Replay & Verify</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Recompute any opportunity from stored snapshot hashes
              </p>
            </div>
            <div className="p-6">
              <p className="text-zinc-400 mb-4">
                Every trigger event and opportunity stores snapshot hashes. 
                Use this tool to verify computations are deterministic.
              </p>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter opportunity ID..."
                  className="input flex-1"
                />
                <button className="btn btn-primary">
                  <RefreshCw className="w-4 h-4" />
                  Replay
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Active Rules with Algorithm Specs</h3>
            </div>
            <div className="divide-y divide-zinc-800">
              {rules.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  No rules configured
                </div>
              ) : (
                rules.slice(0, 5).map((rule: any) => (
                  <div key={rule.rule_id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-zinc-500">{rule.template_type}</p>
                      </div>
                      <span className={`badge ${rule.enabled ? 'badge-green' : 'badge-gray'}`}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {rule.algorithm_spec && (
                      <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-2">Variables used:</p>
                        <div className="flex flex-wrap gap-2">
                          {rule.algorithm_spec.variables?.slice(0, 5).map((v: any) => (
                            <code key={v.name} className="px-2 py-0.5 bg-zinc-700 rounded text-xs">
                              {v.name}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

