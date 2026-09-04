import re

with open('src/components/ac_manager/EmployeeUtilization.tsx', 'r') as f:
    content = f.read()

# Replace from the end of the table
pattern = re.compile(r'                  \}\)\}\n                </tbody>\n              </table>\n            \}\)\n          </div>\n        \}\)[\s\S]*', re.MULTILINE)
new_content = """                  ))}
                </tbody>
              </table>
            )}
          </div>
      </div>
    </div>
  );
};
"""
content = pattern.sub(new_content, content)

with open('src/components/ac_manager/EmployeeUtilization.tsx', 'w') as f:
    f.write(content)
print("Updated EmployeeUtilization fixed")
