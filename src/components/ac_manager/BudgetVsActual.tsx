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
          Monitor burn rates, cost utilization, and over-budget risk indicators based on milestone progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeProjects.map((p) => {
          const budgetUtil = p.budget_utilization_percentage || 0;
          const costUtil = p.cost_utilization_percentage || 0;
          
          const isOverBudget = costUtil > 100;
          const isAtRisk = costUtil > 85 && costUtil > budgetUtil;
          
          const statusColor = isOverBudget ? 'bg-rose-600' : isAtRisk ? 'bg-amber-500' : 'bg-emerald-600';
          const textColor = isOverBudget ? 'text-rose-600' : isAtRisk ? 'text-amber-600' : 'text-emerald-600';

          return (
            <div key={p.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                  <p className="text-[11px] text-slate-500">{p.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Budget</p>
                  <span className="text-sm font-black text-slate-800">{formatCr(p.budget)}</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Cost Utilization */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Cost Utilization (Burn)</span>
                    <span className={textColor}>{costUtil.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${statusColor}`}
                      style={{ width: `${Math.min(100, costUtil)}%` }}
                    />
                  </div>
                </div>
                
                {/* Earned Value / Budget Utilization */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Budget Utilization (Earned)</span>
                    <span className="text-blue-600">{budgetUtil.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${Math.min(100, budgetUtil)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Actual Cost</p>
                  <p className={`text-xs font-black ${textColor}`}>{formatCr(p.actual_cost || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Forecast</p>
                  <p className="text-xs font-black text-slate-700">{formatCr(p.forecast_cost || 0)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
