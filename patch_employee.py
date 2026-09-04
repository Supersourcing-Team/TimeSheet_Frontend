import re

with open('src/components/ac_manager/EmployeeUtilization.tsx', 'r') as f:
    content = f.read()

# 1. Remove useGetMilestoneUtilizationQuery import
content = re.sub(r"  useGetMilestoneUtilizationQuery,\n", "", content)

# 2. Remove activeSubTab
content = re.sub(r"  const \[activeSubTab, setActiveSubTab\] = useState<'employees' \| 'milestones'>\('employees'\);\n", "", content)

# 3. Remove milestoneData query
pattern_milestone_query = re.compile(r"  const \{\n    data: milestoneData,\n    isLoading: isMilestonesLoading,\n    isFetching: isMilestonesFetching,\n    refetch: refetchMilestones,\n  \} = useGetMilestoneUtilizationQuery\(queryParams\);\n")
content = pattern_milestone_query.sub("", content)

# 4. Remove refetchMilestones
content = content.replace(" || isMilestonesFetching", "")
content = content.replace("    refetchMilestones();\n", "")

# 5. Remove milestones and filteredMilestones
content = re.sub(r"  const milestones = milestoneData\?.milestones \|\| \[\];\n", "", content)

pattern_filtered_milestones = re.compile(r"  // Filtered milestone rows\n  const filteredMilestones = useMemo\(\(\) => \{\n[\s\S]*?  \}, \[milestones, searchQuery\]\);\n")
content = pattern_filtered_milestones.sub("", content)

# 6. Simplify handleExportCSV
pattern_export = re.compile(r"  const handleExportCSV = \(\) => \{\n    if \(activeSubTab === 'employees'\) \{\n([\s\S]*?)    \} else \{\n[\s\S]*?    \}\n  \};")
new_export = r"""  const handleExportCSV = () => {
\1  };"""
content = pattern_export.sub(new_export, content)

# 7. Remove Sub Tab Switcher
pattern_sub_tabs = re.compile(r"          \{/\* Sub Tab Switcher \*/\}\n          <div className=\"flex items-center gap-1 bg-slate-100 p-1 rounded-xl\">\n[\s\S]*?          </div>\n")
content = pattern_sub_tabs.sub("", content)

# 8. Simplify Search Input placeholder
content = content.replace("placeholder={activeSubTab === 'employees' ? 'Search employee name...' : 'Search milestone or project...'}", "placeholder='Search employee name...'")

# 9. Remove {activeSubTab === 'employees' && ( and matching closing brace for employee table
content = content.replace("{/* ── Tab Content: Employee Breakdown Table ─────────────────────── */}\n        {activeSubTab === 'employees' && (\n          <div className=\"overflow-x-auto\">", "{/* ── Tab Content: Employee Breakdown Table ─────────────────────── */}\n          <div className=\"overflow-x-auto\">")
# This is tricky without a proper parser, I'll do a regex block replacement for the tables.

pattern_tables = re.compile(r"        \{/\* ── Tab Content: Employee Breakdown Table ─────────────────────── \*/\}\n        \{activeSubTab === 'employees' && \([\s\S]*?            \)\}\n          </div>\n        \)\}\n\n        \{/\* ── Tab Content: Milestones & Schedule Table ─────────────────── \*/\}[\s\S]*?        \)\}")

# Wait, let's extract the employee table first.
# Instead of complex regex, I can replace the milestones table and the activeSubTab checks.
with open('src/components/ac_manager/EmployeeUtilization.tsx', 'w') as f:
    f.write(content)
print("Updated EmployeeUtilization part 1")
