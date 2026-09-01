import React, { useState } from 'react';
import { User, Project } from '../../types';
import {
  FolderKanban,
  Users,
  Calendar,
  Clock,
  ExternalLink,
  X,
  Layers,
  Wrench,
  CheckCircle2,
  DollarSign,
  Briefcase,
} from 'lucide-react';

interface MyProjectsProps {
  currentUser: User;
  projects: Project[];
  allUsers: User[];
}

export const MyProjects: React.FC<MyProjectsProps> = ({
  currentUser,
  projects = [],
  allUsers = [],
}) => {
  const [selectedProjectModal, setSelectedProjectModal] = useState<Project | null>(null);

  const myProjects = (projects || []).filter((p) => p.assignedUserIds?.includes(currentUser.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>My Assigned Projects</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            View project scopes, allocated sprint hours, software tools, and PM contacts.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold">
          {myProjects.length} Active Assignments
        </span>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myProjects.map((project) => {
          return (
            <div
              key={project.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    {project.code}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${project.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : project.status === 'completed'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                  >
                    {project.status}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Client: {project.client}</p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                <div className="flex justify-between items-center text-slate-600 text-[11px] font-bold">
                  <span>Logged Hours</span>
                  <span className="text-indigo-700 font-extrabold">
                    {project.loggedHours || 0} hrs
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>PM: {project.pmName}</span>
                  </div>
                  <span className="text-slate-600">Ends {project.endDate}</span>
                </div>

                <button
                  onClick={() => setSelectedProjectModal(project)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>View Details & Software Tools</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PROJECT DETAILS & TOOLS MODAL */}
      {selectedProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedProjectModal.code}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {selectedProjectModal.name}
                </h3>
                <p className="text-xs text-slate-500">Client: {selectedProjectModal.client}</p>
              </div>
              <button
                onClick={() => setSelectedProjectModal(null)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-1">
                  Project Description & Objective
                </h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-200">
                  {selectedProjectModal.description}
                </p>
              </div>

              {/* Tools Allocated */}
              <div>
                <h4 className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2">
                  Software Licenses & Cloud Tools Allocated ({selectedProjectModal.tools.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedProjectModal.tools.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl bg-slate-50/60 border border-slate-300/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold">
                          {t.category[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{t.name}</p>
                          <p className="text-[10px] text-slate-500">{t.category}</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600">${t.monthlyCost}/mo</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h4 className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2">
                  Assigned Team Members
                </h4>
                <div className="flex flex-wrap gap-2">
                  {allUsers
                    .filter((u) => (selectedProjectModal.assignedUserIds || []).includes(u.id))
                    .map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300"
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-800 text-[11px]">{u.name}</p>
                          <p className="text-[9px] text-slate-500">{u.title}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedProjectModal(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
