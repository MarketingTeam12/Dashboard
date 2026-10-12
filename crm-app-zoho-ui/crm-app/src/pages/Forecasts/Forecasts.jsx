import { useMemo } from 'react';
import { useCRM } from '../../context/crmContextInstance';
import { STAGE_PROBABILITY, fmtINR } from '../../utils/calculations';

/** Forecast = open + won deal value per owner, weighted by stage probability */
export default function Forecasts() {
  const { deals = [], userName } = useCRM();

  const rows = useMemo(() => {
    const by = {};
    deals.forEach((d) => {
      if (d.stage === 'Closed Lost') return;
      const r = (by[d.ownerId] ||= { owner: d.ownerId, won: 0, pipeline: 0, weighted: 0, count: 0 });
      const amt = Number(d.amount) || 0;
      r.count += 1;
      if (d.stage === 'Closed Won') r.won += amt;
      else { r.pipeline += amt; r.weighted += (amt * (STAGE_PROBABILITY[d.stage] ?? 0)) / 100; }
    });
    return Object.values(by).sort((a, b) => b.weighted + b.won - (a.weighted + a.won));
  }, [deals]);

  const tot = rows.reduce((a, r) => ({ won: a.won + r.won, pipeline: a.pipeline + r.pipeline, weighted: a.weighted + r.weighted }), { won: 0, pipeline: 0, weighted: 0 });

  return (
    <div className="bg-white border border-[#E3E8F2] rounded">
      <div className="px-4 h-12 flex items-center border-b border-[#E3E8F2]"><h1 className="text-[15px] font-semibold text-[#1F2A44]">Forecasts</h1></div>
      <div className="grid sm:grid-cols-3 gap-3 p-4">
        {[['Closed Won', tot.won], ['Open Pipeline', tot.pipeline], ['Weighted Forecast', tot.weighted]].map(([l, v]) => (
          <div key={l} className="border border-[#E3E8F2] rounded px-4 py-3"><div className="text-[12px] text-[#6B7696]">{l}</div><div className="text-[20px] font-semibold text-[#1F2A44]">{fmtINR(Math.round(v))}</div></div>
        ))}
      </div>
      <table className="w-full text-[12.5px]">
        <thead><tr className="text-left text-[#1F2A44]">{['Deal Owner', 'Deals', 'Closed Won', 'Open Pipeline', 'Weighted Forecast'].map((h) => <th key={h} className="px-4 h-9 font-medium border-y border-[#E3E8F2]">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.owner} className="border-b border-[#EEF1F7]">
              <td className="px-4 py-2 font-medium text-[#1F2A44]">{userName(r.owner)}</td>
              <td className="px-4 py-2">{r.count}</td>
              <td className="px-4 py-2">{fmtINR(Math.round(r.won))}</td>
              <td className="px-4 py-2">{fmtINR(Math.round(r.pipeline))}</td>
              <td className="px-4 py-2">{fmtINR(Math.round(r.weighted))}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5} className="text-center py-14 text-[#8B95AE]">No records found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
