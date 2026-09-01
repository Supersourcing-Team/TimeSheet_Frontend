import React from 'react';
import { Project } from '../../types';
import { formatINR } from '../../utils/formatters';

interface BudgetVsActualProps {
  projects: Project[];
}

export const BudgetVsActual: React.FC<BudgetVsActualProps> = ({ projects }) => {
  const safeProjects = projects || [];

  const formatCr = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    }
    return formatINR(amount);
  };

  return (
    <div className="space-y-6 text-slate-800">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Budget vs Actual Variance</h1>
        <p className="text-xs text-slate-500 font-medium">
          Monitor burn rates, remaining contract allocations, and over-budget risk indicators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safeProjects.map((p) => {
          const consumed = p.budget ? Math.min(100, Math.round((((p.loggedHours || 0) * 1800) / p.budget) * 100)) : 0;
          return (
            <div key={p.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500">{p.client}</p>
                </div>
                <span className="text-xs font-black text-blue-700">{formatCr(p.budget)}</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>Budget Consumed</span>
                  <span className={consumed > 85 ? 'text-rose-600' : 'text-blue-600'}>{consumed}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${consumed > 85 ? 'bg-rose-600' : 'bg-blue-600'}`}
                    style={{ width: `${consumed}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Logged: {p.loggedHours || 0} hrs</span>
                <span>Contract: {formatCr(p.budget)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
