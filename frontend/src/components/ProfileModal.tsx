import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  Award, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Star,
  Activity,
  User,
  ShieldAlert
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { api } from '../api/client';

interface ProfileModalProps {
  profileId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ profileId, onClose, onRefresh }) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'history' | 'activities'>('overview');
  
  // Quick record addition form
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [recordCategory, setRecordCategory] = useState('ACADEMIC');
  const [recordTitle, setRecordTitle] = useState('');
  const [recordScore, setRecordScore] = useState('85');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!profileId) return;
    setIsLoading(true);
    api.profiles.getById(profileId)
      .then((res) => setProfile(res.profile))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [profileId]);

  if (!profileId) return null;

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !recordTitle) return;
    try {
      await api.profiles.addRecord(profileId, {
        category: recordCategory,
        title: recordTitle,
        scoreValue: Number(recordScore),
        recordedDate: recordDate,
      });
      setShowAddRecord(false);
      setRecordTitle('');
      // Reload profile
      const updated = await api.profiles.getById(profileId);
      setProfile(updated.profile);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to save record.');
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'SURGING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Rapid Surge (+Slope)</span>;
      case 'STEADY_IMPROVEMENT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Steady Growth</span>;
      case 'DECLINING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Declining Trend</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Stable & Consistent</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-slate-800 to-slate-900 p-6 border-b border-slate-700/60 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-xl shadow-indigo-500/20 border border-indigo-400/30">
              {profile ? `${profile.firstName[0]}${profile.lastName[0]}` : <User />}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-extrabold text-white">
                  {profile?.fullName || 'Loading Profile...'}
                </h2>
                {profile?.trajectory && getTrendBadge(profile.trajectory.trendDirection)}
              </div>
              <p className="text-sm text-slate-300 font-medium mt-0.5">
                {profile?.titleRole} • <span className="text-indigo-400">{profile?.department}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Branch: {profile?.hierarchyNode?.name} • Contact: {profile?.contactEmail}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 px-6 pt-3 bg-slate-900/50 border-b border-slate-800 text-sm">
          {[
            { id: 'overview', label: '360° Overview' },
            { id: 'skills', label: `Skills (${profile?.skills?.length || 0})` },
            { id: 'history', label: `Performance History (${profile?.performanceRecords?.length || 0})` },
            { id: 'activities', label: `Activities & Awards (${(profile?.activities?.length || 0) + (profile?.achievements?.length || 0)})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 font-semibold text-xs transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 animate-pulse">
              Loading 360° Human Potential Analytics...
            </div>
          ) : (
            <>
              {/* TAB 1: 360° OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Trajectory Stat Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                      <div className="text-xs text-slate-400 font-medium">Historical Average</div>
                      <div className="text-2xl font-black text-white mt-1">
                        {profile?.trajectory?.averageScore || 0}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Based on {profile?.trajectory?.sampleCount || 0} recorded terms
                      </div>
                    </div>

                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                      <div className="text-xs text-slate-400 font-medium">Trajectory Rate (OLS Slope)</div>
                      <div className="text-2xl font-black text-indigo-400 mt-1">
                        {profile?.trajectory?.growthRateSlope >= 0 ? `+${profile?.trajectory?.growthRateSlope}` : profile?.trajectory?.growthRateSlope}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Linear regression rate of progress
                      </div>
                    </div>

                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                      <div className="text-xs text-slate-400 font-medium">Stability & Consistency</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">
                        {profile?.trajectory?.consistencyScore || 0}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Inverse variance across evaluation cycles
                      </div>
                    </div>
                  </div>

                  {/* Visual Analytics Grid: Radar & Trend Line */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Capability Dimensions Radar */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Multi-Dimensional Capability Radar
                      </h4>
                      {profile?.radarData && profile.radarData.length > 0 ? (
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={profile.radarData}>
                              <PolarGrid stroke="#334155" />
                              <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                              <Radar name="Proficiency" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                          Dimension assessments pending
                        </div>
                      )}
                    </div>

                    {/* Longitudinal Performance History Chart */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Longitudinal Score History & Trajectory
                      </h4>
                      {profile?.performanceRecords && profile.performanceRecords.length > 0 ? (
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={profile.performanceRecords.map((r: any) => ({
                              date: new Date(r.recordedDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
                              score: r.scoreValue,
                              title: r.title,
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                              <YAxis domain={[40, 100]} stroke="#94a3b8" fontSize={11} />
                              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', fontSize: '12px' }} />
                              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                          No performance examinations recorded yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fact-based Strengths & Development Areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4">
                      <h4 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Identified Evidence-Backed Strengths</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        {profile?.strengths && profile.strengths.length > 0 ? (
                          profile.strengths.map((s: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-emerald-400">•</span>
                              <span>{s}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-500">No primary strengths classified yet.</li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4">
                      <h4 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Development & Growth Areas</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        {profile?.developmentAreas && profile.developmentAreas.length > 0 ? (
                          profile.developmentAreas.map((d: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-amber-400">•</span>
                              <span>{d}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-500">No critical development gaps detected.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SKILLS BREAKDOWN */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white">Verified Skill Assessments</h3>
                    <span className="text-xs text-slate-400">Scale: 0 - 100 Proficiency</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile?.skills?.map((s: any) => (
                      <div key={s.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">{s.name}</span>
                          <span className="font-mono text-xs font-bold text-indigo-400">{s.proficiencyScore}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${s.proficiencyScore}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                          <span>{s.dimensionName}</span>
                          <span>Verified: {s.verifiedBy || 'System Verified'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PERFORMANCE HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white">Chronological Assessment Records</h3>
                    <button
                      onClick={() => setShowAddRecord(!showAddRecord)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log New Record</span>
                    </button>
                  </div>

                  {/* Add record form */}
                  {showAddRecord && (
                    <form onSubmit={handleCreateRecord} className="p-4 bg-slate-800 rounded-xl border border-indigo-500/40 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-slate-300">Category</label>
                          <select
                            value={recordCategory}
                            onChange={(e) => setRecordCategory(e.target.value)}
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          >
                            <option value="ACADEMIC">Academic Exam</option>
                            <option value="KPI">KPI / Review</option>
                            <option value="PROJECT">Project Review</option>
                            <option value="TEST">Diagnostic Test</option>
                            <option value="MATCH">Match Performance</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-300">Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Midterm Physics"
                            value={recordTitle}
                            onChange={(e) => setRecordTitle(e.target.value)}
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-300">Score (0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={recordScore}
                            onChange={(e) => setRecordScore(e.target.value)}
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-300">Date</label>
                          <input
                            type="date"
                            value={recordDate}
                            onChange={(e) => setRecordDate(e.target.value)}
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowAddRecord(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg"
                        >
                          Save Record
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="divide-y divide-slate-800">
                    {profile?.performanceRecords?.map((r: any) => (
                      <div key={r.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-slate-200">{r.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {r.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(r.recordedDate).toLocaleDateString()} {r.notes ? `• ${r.notes}` : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-indigo-400">{r.scoreValue}%</span>
                          {r.gradeLetter && (
                            <span className="ml-2 text-xs font-bold text-slate-400">({r.gradeLetter})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ACTIVITIES & ACHIEVEMENTS */}
              {activeTab === 'activities' && (
                <div className="space-y-6">
                  {/* Achievements */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Verified Achievements & Awards</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profile?.achievements?.map((a: any) => (
                        <div key={a.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-amber-300">{a.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {a.level}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{a.description}</p>
                          <div className="text-[10px] text-slate-500 mt-2">
                            {new Date(a.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Extracurricular & Event History</span>
                    </h3>
                    <div className="divide-y divide-slate-800">
                      {profile?.activities?.map((act: any) => (
                        <div key={act.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-xs text-slate-200">{act.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {act.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Role: {act.role} {act.result ? `• Result: ${act.result}` : ''}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(act.date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
