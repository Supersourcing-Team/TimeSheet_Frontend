with open('src/components/ac_manager/EmployeeUtilization.tsx', 'r') as f:
    lines = f.readlines()

new_lines = lines[:591]
new_lines.append('      </div>\n')
new_lines.append('    </div>\n')
new_lines.append('  );\n')
new_lines.append('};\n')

with open('src/components/ac_manager/EmployeeUtilization.tsx', 'w') as f:
    f.writelines(new_lines)
print("Truncated EmployeeUtilization successfully")
