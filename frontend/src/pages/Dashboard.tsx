import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from '../components/ProfileModal';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onSelectTask?: (taskId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { user, organization } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api.analytics.getOverview()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load overview:', err))
      .finally(() => setIsLoading(false));
  }, [organization?.id]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading Organizational Intelligence...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Human Potential Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            {organization?.name || 'TalentOS Hub'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Understanding people through verified records, trajectory velocity, and task-specific suitability.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('tasks')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Match Candidates</span>
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <span>Explore Tree</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Tracked Profiles</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {data?.stats?.totalPeople || 0}
          </div>
          <span className="text-[11px] text-slate-500">Active hierarchical members</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Open Opportunities</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {data?.stats?.openTasks || 0}
          </div>
          <span className="text-[11px] text-slate-500">Tasks requiring matching</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Surging Talent Velocity</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-2">
            {data?.surgingTalent?.length || 0}
          </div>
          <span className="text-[11px] text-slate-500">High positive growth slope</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Consistency Benchmarks</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {data?.consistentTalent?.length || 0}
          </div>
          <span className="text-[11px] text-slate-500">Stability index &gt; 85%</span>
        </div>
      </div>

      {/* Mid Section: Org Radar & Surging Talent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Org Capability Radar */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Collective Organizational Capability Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated proficiency across configured capability dimensions
            </p>
          </div>

          <div className="h-64 w-full my-4">
            {data?.dimensionAverages && data.dimensionAverages.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.dimensionAverages}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                  <Radar name="Org Average" dataKey="averageScore" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Awaiting assessments
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3">
            {data?.dimensionAverages?.slice(0, 4).map((dim: any, idx: number) => (
              <div key={idx} className="flex justify-between text-slate-300">
                <span className="truncate pr-2">{dim.dimension}:</span>
                <span className="font-mono font-bold text-indigo-400">{dim.averageScore}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Surging Talent (Growth Momentum Spotlight) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Surging Potential Spotlight (Highest Growth Slope)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Individuals showing the steepest improvement velocity over recent evaluations
            </p>
          </div>

          <div className="divide-y divide-slate-800/80 my-3">
            {data?.surgingTalent && data.surgingTalent.length > 0 ? (
              data.surgingTalent.map((person: any) => (
                <div
                  key={person.id}
                  onClick={() => setSelectedProfileId(person.id)}
                  className="py-3 flex items-center justify-between hover:bg-slate-800/40 p-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                      {person.fullName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white hover:text-indigo-400 transition-colors">
                        {person.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {person.titleRole} • {person.department}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      +{person.trajectory.growthRateSlope} slope
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Avg: {person.trajectory.averageScore}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Log additional terms to unlock trajectory calculations.
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('people')}
            className="w-full py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl transition-all"
          >
            View Complete Talent Directory →
          </button>
        </div>
      </div>

      {/* Bottom Row: High Consistency & Recent Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Consistency */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>High Stability & Composure Leaders</span>
          </h3>

          <div className="space-y-2">
            {data?.consistentTalent?.map((p: any) => (
              <div
                key={p.id}
                onClick={() => setSelectedProfileId(p.id)}
                className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-xs text-slate-200">{p.fullName}</span>
                  <div className="text-[11px] text-slate-400">{p.department}</div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {p.trajectory.consistencyScore}% Stability
                  </span>
                  <div className="text-[10px] text-slate-500">Score Avg: {p.trajectory.averageScore}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Recent Verified Achievements</span>
          </h3>

          <div className="space-y-2.5">
            {data?.recentAchievements?.map((a: any) => (
              <div key={a.id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-amber-300">{a.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {a.level}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Awarded to <span className="text-white font-medium">{a.personName}</span> ({a.department})
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(a.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 360 Profile Modal */}
      {selectedProfileId && (
        <ProfileModal
          profileId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
        />
      )}
    </div>
  );
};
