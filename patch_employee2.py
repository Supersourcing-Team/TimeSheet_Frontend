import re

with open('src/components/ac_manager/EmployeeUtilization.tsx', 'r') as f:
    content = f.read()

# Replace the conditional rendering of employees
content = content.replace("{/* ── Tab Content: Employee Breakdown Table ─────────────────────── */}\n        {activeSubTab === 'employees' && (\n          <div className=\"overflow-x-auto\">", "{/* ── Tab Content: Employee Breakdown Table ─────────────────────── */}\n          <div className=\"overflow-x-auto\">")

# Remove the milestones table and the closing brace for employees
pattern = re.compile(r"            \)\}\n          </div>\n        \)\}\n\n        \{/\* ── Tab Content: Milestones & Schedule Table ─────────────────── \*/\}[\s\S]*?        \)\}")

content = pattern.sub(r"            )}\n          </div>", content)


with open('src/components/ac_manager/EmployeeUtilization.tsx', 'w') as f:
    f.write(content)
print("Updated EmployeeUtilization part 2")
