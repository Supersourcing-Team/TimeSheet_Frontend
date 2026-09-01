import React from 'react';
import { Project } from '../../types';
import { formatINR } from '../../utils/formatters';

interface ProjectFinancialsProps {
  projects: Project[];
  totalBudget: number;
  totalRevenue: number;
  totalProfit: number;
  setEditingProject: (p: Project | null) => void;
  setEditBudget: (b: number) => void;
  }

export const ProjectFinancials: React.FC<ProjectFinancialsProps> = ({
  projects,
  totalBudget,
  totalRevenue,
  totalProfit,
  setEditingProject,
  setEditBudget,
  }) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Project Financials</h1>
          <p className="text-xs text-slate-500 font-medium">
            Detailed contract budget allocations, client billing rates, and labor expenditure.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-semibold">Total Client Contracts</span>
          <p className="text-2xl font-black text-slate-900">{formatCr(totalBudget)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-semibold">Recognized Revenue</span>
          <p className="text-2xl font-black text-emerald-600">{formatCr(totalRevenue)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-semibold">Net Operating Profit</span>
          <p className="text-2xl font-black text-blue-600">{formatCr(totalProfit)}</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Contract & Billing Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Contract Budget</th>
                <th className="py-3 px-4">Completion (%)</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeProjects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                  <td className="py-3 px-4 text-slate-600">{p.client}</td>
                  <td className="py-3 px-4 font-bold text-slate-700 capitalize">{p.status}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{formatINR(p.budget)}</td>
                  <td className="py-3 px-4 text-slate-700">{p.completion_percentage || 0}%</td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(p);
                        setEditBudget(p.budget);
                        }}
                      className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold"
                    >
                      Update Budget
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
