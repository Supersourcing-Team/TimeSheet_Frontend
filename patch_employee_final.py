import re

with open('src/components/ac_manager/EmployeeUtilization.tsx', 'r') as f:
    content = f.read()

# The file still has the milestones map and the extra closing brace for the employees block!
# I will just write a regex to find the end of the employees table and remove everything after it until the end of the file.

# Find where the employee table ends:
#                     </tr>
#                   ))}
#                 </tbody>
#               </table>
#             )}
#           </div>

# And everything after that should just be:
#       </div>
#     </div>
#   );
# };

# Let's do a strict truncation and append
pattern = re.compile(r'(                    </tr>\n                  \}\)\}\n                </tbody>\n              </table>\n            \}\)\n          </div>)[\s\S]*', re.MULTILINE)
new_content = r"""\1
      </div>
    </div>
  );
};
"""
content = pattern.sub(new_content, content)

# I also need to remove any stray `activeSubTab === 'milestones'` code if there is any, but I think it was stripped.
# Also `getScheduleBadge` might be unused now if it was only in milestones.
content = re.sub(r'  const getScheduleBadge = [\s\S]*?  \};\n\n', '', content)

with open('src/components/ac_manager/EmployeeUtilization.tsx', 'w') as f:
    f.write(content)
print("Updated EmployeeUtilization final")
