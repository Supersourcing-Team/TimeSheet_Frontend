import re

with open('src/components/ac_manager/PortfolioOverview.tsx', 'r') as f:
    content = f.read()

# 1. Update the top projects processing to show all active projects (maybe sorted by variance or budget)
# We can just change top3Projects to activeProjectHealth
pattern_top3 = re.compile(r'  const top3Projects = safeProjects[\s\S]*?    \}\);', re.MULTILINE)

new_top3 = """  const activeProjectHealth = safeProjects
    .filter((p) => p.status === 'active')
    .sort((a, b) => (b.budget || 0) - (a.budget || 0))
    .map((p) => {
      const budgetUtil = p.budget_utilization_percentage || 0;
      const costUtil = p.cost_utilization_percentage || 0;
      
      const isOverBudget = costUtil > 100;
      const isAtRisk = costUtil > 85 && costUtil > budgetUtil;
      
      const statusColor = isOverBudget ? 'bg-rose-600' : isAtRisk ? 'bg-amber-500' : 'bg-emerald-600';
      const textColor = isOverBudget ? 'text-rose-600' : isAtRisk ? 'text-amber-600' : 'text-emerald-600';

      return {
        id: p.id,
        name: p.name,
        client: p.client,
        budget: p.budget,
        actual_cost: p.actual_cost,
        forecast_cost: p.forecast_cost,
        budgetUtil,
        costUtil,
        statusColor,
        textColor,
      };
    });"""

content = pattern_top3.sub(new_top3, content)


# 2. Replace the JSX for top 3 projects
pattern_jsx = re.compile(r'        <div className="space-y-6">\n          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">\n            <h3 className="text-sm font-bold text-slate-900">Top 3 Projects Utilization</h3>\n            <div className="space-y-4">\n              \{top3Projects\.map\(\(item, i\) => \([\s\S]*?            </div>\n          </div>\n\n        </div>')

new_jsx = """        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="sticky top-0 bg-[#f8fafc] pb-2 z-10">
            <h3 className="text-sm font-bold text-slate-900">Project Burn Rates</h3>
            <p className="text-[10px] text-slate-500">Active project cost utilization vs earned value</p>
          </div>
          {activeProjectHealth.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{p.name}</h4>
                  <p className="text-[10px] text-slate-500">{p.client}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-800">{formatCr(p.budget || 0)}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600">Cost Utilization (Burn)</span>
                    <span className={p.textColor}>{p.costUtil.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${p.statusColor}`} style={{ width: `${Math.min(100, p.costUtil)}%` }} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600">Budget Utilization (Earned)</span>
                    <span className="text-blue-600">{p.budgetUtil.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, p.budgetUtil)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {activeProjectHealth.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              No active projects to display.
            </div>
          )}
        </div>"""

content = pattern_jsx.sub(new_jsx, content)

with open('src/components/ac_manager/PortfolioOverview.tsx', 'w') as f:
    f.write(content)
print("Updated PortfolioOverview")
