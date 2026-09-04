import re

with open('src/components/ac_manager/AccountManagerDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Remove imports for BudgetVsActual and AcReports
content = re.sub(r"import \{ BudgetVsActual \} from '\./BudgetVsActual';\n", "", content)
content = re.sub(r"import \{ AcReports \} from '\./AcReports';\n", "", content)

# 2. Remove rendering blocks
pattern_budget = re.compile(r"      \{activeTab === 'budget_vs_actual' && \([\s\S]*?      \}\)\n\n", re.MULTILINE)
content = pattern_budget.sub("", content)

pattern_reports = re.compile(r"      \{activeTab === 'ac_reports' && \([\s\S]*?      \}\)\n\n", re.MULTILINE)
content = pattern_reports.sub("", content)

with open('src/components/ac_manager/AccountManagerDashboard.tsx', 'w') as f:
    f.write(content)
print("Updated AccountManagerDashboard")
