import re

with open('src/components/ac_manager/ProjectFinancials.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(r'      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">\n        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">\n[\s\S]*?      </div>\n\n      <div className="space-y-4">', re.MULTILINE)

content = pattern.sub('      <div className="space-y-4">', content)

with open('src/components/ac_manager/ProjectFinancials.tsx', 'w') as f:
    f.write(content)
print("Updated ProjectFinancials")
