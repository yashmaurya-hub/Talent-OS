import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  Award, 
  Sparkles,
  X 
} from 'lucide-react';
import { api } from '../api/client';
import { ProfileModal } from '../components/ProfileModal';

export const PeoplePage: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [trajectoryTrend, setTrajectoryTrend] = useState('');
  const [minPerformance, setMinPerformance] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newRole, setNewRole] = useState('MEMBER');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [hierarchyNodes, setHierarchyNodes] = useState<any[]>([]);

  const loadProfiles = () => {
    setIsLoading(true);
    api.profiles.list({
      search,
      trajectoryTrend: trajectoryTrend || undefined,
      minPerformance: minPerformance || undefined,
    })
      .then((res) => setProfiles(res.profiles || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProfiles();
  }, [search, trajectoryTrend, minPerformance]);

  useEffect(() => {
    api.hierarchy.getTree()
      .then((res) => setHierarchyNodes(res.allNodes || []))
      .catch((err) => console.error(err));
  }, []);

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName || !newEmail || !targetNodeId || !newTitle) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      await api.profiles.createPerson({
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        titleRole: newTitle,
        role: newRole,
        hierarchyNodeId: targetNodeId,
      });
      setShowAddModal(false);
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewTitle('');
      loadProfiles();
    } catch (err: any) {
      alert(err.message || 'Failed to create member.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>People & Talent Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect 360° potential capability profiles
          </p>
        </div>

        <button
          onClick={() => {
            if (hierarchyNodes.length > 0 && !targetNodeId) {
              setTargetNodeId(hierarchyNodes[0].id);
            }
            setShowAddModal(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, role, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Trajectory Filter */}
          <div className="md:col-span-3">
            <select
              value={trajectoryTrend}
              onChange={(e) => setTrajectoryTrend(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Trajectory Trends</option>
              <option value="SURGING">🚀 Surging Growth (+Slope)</option>
              <option value="STEADY_IMPROVEMENT">📈 Steady Improvement</option>
              <option value="CONSISTENT">🛡️ Highly Consistent</option>
              <option value="FLUCTUATING">⚡ Fluctuating</option>
              <option value="DECLINING">📉 Declining</option>
            </select>
          </div>

          {/* Min Performance Filter */}
          <div className="md:col-span-3">
            <select
              value={minPerformance}
              onChange={(e) => setMinPerformance(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Any Performance Benchmark</option>
              <option value="90">Top Tier (≥ 90% Avg)</option>
              <option value="80">High Performer (≥ 80% Avg)</option>
              <option value="70">Competent (≥ 70% Avg)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 animate-pulse">
            Loading candidate profiles and trajectory data...
          </div>
        ) : profiles.length > 0 ? (
          profiles.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProfileId(p.id)}
              className="group p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-indigo-500/10">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                        {p.fullName}
                      </h3>
                      <div className="text-xs text-slate-400 font-medium">
                        {p.titleRole}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {p.userRole}
                  </span>
                </div>

                <div className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                  <span className="text-indigo-400 font-semibold">{p.department}</span>
                  <span>•</span>
                  <span>{p.hierarchyNode?.name}</span>
                </div>

                {/* Trajectory Metrics */}
                <div className="my-4 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Trajectory:</span>
                    <span className="font-bold text-emerald-400">
                      {p.trajectory.growthRateSlope >= 0 ? `+${p.trajectory.growthRateSlope}` : p.trajectory.growthRateSlope} slope
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Consistency:</span>
                    <span className="font-mono font-bold text-indigo-400">
                      {p.trajectory.consistencyScore}%
                    </span>
                  </div>
                </div>

                {/* Evidence Strengths preview */}
                {p.strengths && p.strengths.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {p.strengths.slice(0, 2).map((s: string, idx: number) => (
                      <div key={idx} className="text-[11px] text-slate-300 truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="truncate">{s}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{p.skillsCount} Skills • {p.activitiesCount} Activities</span>
                <span className="text-indigo-400 font-semibold group-hover:underline">360° Profile →</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-xs text-slate-500">
            No profiles match the specified filters.
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register New Organization Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePerson} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">First Name</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Last Name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Title / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Student (Grade 11) / Senior Backend Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Hierarchy Branch</label>
                  <select
                    value={targetNodeId}
                    onChange={(e) => setTargetNodeId(e.target.value)}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    required
                  >
                    {hierarchyNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Access Level</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="MEMBER">Member / Student</option>
                    <option value="MANAGER">Manager / Teacher</option>
                    <option value="HEAD">Head / Director</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360 Profile Modal */}
      {selectedProfileId && (
        <ProfileModal
          profileId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
          onRefresh={loadProfiles}
        />
      )}
    </div>
  );
};
