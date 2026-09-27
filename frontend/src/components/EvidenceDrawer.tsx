import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, Sparkles, FileText } from 'lucide-react';

interface EvidenceDrawerProps {
  candidate: any | null;
  taskTitle: string;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ candidate, taskTitle, onClose }) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
            Recommendation Justification
          </span>
          <h2 className="text-lg font-extrabold text-white mt-1">
            {candidate.profile.fullName}
          </h2>
          <p className="text-xs text-slate-400">
            Rank #{candidate.rank} for "{taskTitle}"
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suitability Metric */}
      <div className="my-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Overall Match Suitability</div>
          <div className="text-3xl font-black text-indigo-400 mt-0.5">
            {candidate.suitabilityScore}%
          </div>
          <div className="text-[11px] text-slate-400">
            Multi-factor weighted alignment score
          </div>
        </div>
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 flex items-center justify-center font-bold text-white text-xs">
          #{candidate.rank}
        </div>
      </div>

      {/* AI Explanation / Natural Language Synthesis */}
      <div className="mb-6 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Explainable AI Synthesis</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-medium">
          {candidate.aiExplanation}
        </p>
        <div className="text-[10px] text-indigo-400/80 italic pt-1">
          * Strictly synthesized from stored database records. Zero simulated or fabricated traits.
        </div>
      </div>

      {/* Evidence Citations */}
      <div className="space-y-4 mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Verified Database Evidence Citations</span>
        </h3>

        <div className="space-y-2.5">
          {candidate.evidence?.map((ev: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{ev.factorName}</span>
                <span className="font-mono text-xs font-bold text-indigo-400">{ev.factorScore}%</span>
              </div>
              <p className="text-xs text-slate-300">
                {ev.rawEvidenceSummary}
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                Weight: {ev.weight}x {ev.recordSource ? `• Ref: ${ev.recordSource}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Data Warnings */}
      {candidate.missingDataNotes && candidate.missingDataNotes.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Missing Data Transparency</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1">
            {candidate.missingDataNotes.map((note: string, idx: number) => (
              <li key={idx} className="flex items-start space-x-1.5">
                <span className="text-amber-400">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
      >
        Close Drawer
      </button>
    </div>
  );
};
