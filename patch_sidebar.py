import re

with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# 1. Update ACManagerTab type
pattern_tab_type = re.compile(r'export type ACManagerTab =[\s\S]*?\| \'ac_reports\';')
new_tab_type = """export type ACManagerTab =
  | 'ac_dashboard'
  | 'project_financials'
  | 'tool_utilization'
  | 'employee_utilization';"""
content = pattern_tab_type.sub(new_tab_type, content)

# 2. Update acNavItems array
pattern_nav_items = re.compile(r'  const acNavItems: Array<\{[\s\S]*?  const adminNavItems: Array<\{')
new_nav_items = """  const acNavItems: Array<{
    id: ACManagerTab;
    label: string;
    icon: any;
    desc: string;
    badge?: string | number;
  }> = [
    {
      id: 'ac_dashboard',
      label: 'Portfolio Dashboard',
      icon: LayoutDashboard,
      desc: 'High-Level KPIs & Trends',
    },
    {
      id: 'project_financials',
      label: 'Project Financials',
      icon: DollarSign,
      desc: 'Milestones & Budgets',
    },
    {
      id: 'employee_utilization',
      label: 'Resource Utilization',
      icon: Users,
      desc: 'Capacity & Labor Cost',
    },
    {
      id: 'tool_utilization',
      label: 'Tool Utilization',
      icon: Wrench,
      desc: 'SaaS & Cloud Spend',
    },
  ];

  const adminNavItems: Array<{"""
content = pattern_nav_items.sub(new_nav_items, content)

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)
print("Updated Sidebar")
