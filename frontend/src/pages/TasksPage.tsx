import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Sparkles, 
  CheckCircle, 
  FileText, 
  ChevronRight, 
  AlertTriangle,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import { TaskModal } from '../components/TaskModal';
import { EvidenceDrawer } from '../components/EvidenceDrawer';
import { ProfileModal } from '../components/ProfileModal';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  
  // Drawers & Modals
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [inspectedProfileId, setInspectedProfileId] = useState<string | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.tasks.list();
      setTasks(res.tasks || []);
      if (res.tasks && res.tasks.length > 0) {
        // Load details for first task
        await selectTask(res.tasks[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTask = async (taskId: string) => {
    try {
      const res = await api.tasks.getById(taskId);
      setSelectedTask(res.task);
      setCandidates(res.task.latestRun?.candidates || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleRunRecommendation = async () => {
    if (!selectedTask) return;
    setIsRecommending(true);
    try {
      const res = await api.tasks.recommend(selectedTask.id);
      setCandidates(res.candidates || []);
      // Update selected task latest run status
      setSelectedTask((prev: any) => ({
        ...prev,
        status: 'RECOMMENDED',
        latestRun: {
          candidates: res.candidates,
        },
      }));
    } catch (err: any) {
      alert(err.message || 'Recommendation run failed.');
    } finally {
      setIsRecommending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <span>Opportunities & Recommendation Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            "Given a specific task or opportunity, who is the most suitable person for it, and why?"
          </p>
        </div>

        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Main Layout: Task Selector on Left, Recommendation Explorer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tasks List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Active Tasks & Events ({tasks.length})
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
                Loading tasks...
              </div>
            ) : tasks.length > 0 ? (
              tasks.map((t) => {
                const isSelected = selectedTask?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => selectTask(t.id)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10'
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                        {t.category}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        t.status === 'RECOMMENDED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <h3 className={`text-sm font-bold mt-2 ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {t.description}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{t.requirementsCount} weighted criteria</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                No tasks created yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Task Details & Recommendation Results */}
        <div className="lg:col-span-8 space-y-6">
          {selectedTask ? (
            <>
              {/* Task Details Card */}
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                      {selectedTask.category}
                    </span>
                    <h2 className="text-lg font-extrabold text-white mt-1">
                      {selectedTask.title}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      {selectedTask.description}
                    </p>
                  </div>

                  <button
                    onClick={handleRunRecommendation}
                    disabled={isRecommending}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isRecommending ? 'Computing Alignment...' : 'Run Recommendation Engine'}</span>
                  </button>
                </div>

                {/* Requirements Pill Grid */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Configured Matching Requirements:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.requirements?.map((req: any, idx: number) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-center space-x-2"
                      >
                        <span className="text-slate-300 font-medium">{req.targetName}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                          {req.weight}x
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          ≥{req.minScore}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Candidates Results Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>Ranked Candidates ({candidates.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Task-specific evidence-backed suitability
                  </span>
                </div>

                {candidates.length > 0 ? (
                  <div className="space-y-3">
                    {candidates.map((c) => (
                      <div
                        key={c.id}
                        className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 shadow-xl transition-all space-y-3"
                      >
                        {/* Candidate Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${
                              c.rank === 1
                                ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-amber-500/20 border border-amber-400/30'
                                : c.rank === 2
                                ? 'bg-gradient-to-tr from-slate-400 to-slate-500 text-white'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              #{c.rank}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3
                                  onClick={() => setInspectedProfileId(c.profile.id)}
                                  className="text-sm font-bold text-white hover:text-indigo-400 cursor-pointer transition-colors"
                                >
                                  {c.profile.fullName}
                                </h3>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {c.profile.titleRole}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {c.profile.department} • {c.profile.hierarchyNode?.name}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xl font-black text-indigo-400">
                              {c.suitabilityScore}%
                            </div>
                            <span className="text-[10px] text-slate-500">Suitability Score</span>
                          </div>
                        </div>

                        {/* Top Evidence preview */}
                        {c.evidence && c.evidence.length > 0 && (
                          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1">
                            {c.evidence.slice(0, 2).map((ev: any, idx: number) => (
                              <div key={idx} className="flex items-start space-x-2 text-slate-300 text-[11px]">
                                <span className="text-indigo-400 font-bold shrink-0">•</span>
                                <span className="font-semibold text-slate-200">{ev.factorName}:</span>
                                <span className="text-slate-400 truncate">{ev.rawEvidenceSummary}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Missing Data Warning callout */}
                        {c.missingDataNotes && c.missingDataNotes.length > 0 && (
                          <div className="flex items-center space-x-1.5 text-[11px] text-amber-400/90 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{c.missingDataNotes[0]}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <button
                            onClick={() => setInspectedProfileId(c.profile.id)}
                            className="text-xs text-slate-400 hover:text-slate-200"
                          >
                            View Full 360° Profile
                          </button>

                          <button
                            onClick={() => setSelectedCandidate(c)}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Inspect Evidence & AI Synthesis</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
                    <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-bounce" />
                    <h4 className="text-sm font-bold text-slate-200">Recommendation run pending</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Click "Run Recommendation Engine" above to compute evidence-based candidate suitability for this task.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">Select a task</h3>
              <p className="text-xs text-slate-500 mt-1">Choose an opportunity from the left panel to inspect matching candidates.</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onTaskCreated={loadTasks}
      />

      {/* Evidence Drawer */}
      {selectedCandidate && (
        <EvidenceDrawer
          candidate={selectedCandidate}
          taskTitle={selectedTask?.title || 'Selected Task'}
          onClose={() => setSelectedCandidate(null)}
        />
      )}

      {/* 360 Profile Modal */}
      {inspectedProfileId && (
        <ProfileModal
          profileId={inspectedProfileId}
          onClose={() => setInspectedProfileId(null)}
        />
      )}
    </div>
  );
};
