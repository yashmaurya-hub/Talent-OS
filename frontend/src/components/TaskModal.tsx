import React, { useState } from 'react';
import { X, Plus, Trash2, Sliders, Target } from 'lucide-react';
import { api } from '../api/client';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

interface RequirementItem {
  requirementType: string;
  targetName: string;
  minScore: number;
  weight: number;
  importance: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('COMPETITION');
  const [targetDate, setTargetDate] = useState('');
  const [requirements, setRequirements] = useState<RequirementItem[]>([
    { requirementType: 'SKILL', targetName: 'Mathematics', minScore: 80, weight: 8, importance: 'REQUIRED' },
    { requirementType: 'EXPERIENCE', targetName: 'COMPETITION', minScore: 70, weight: 7, importance: 'REQUIRED' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddRequirement = () => {
    setRequirements([
      ...requirements,
      { requirementType: 'SKILL', targetName: '', minScore: 75, weight: 5, importance: 'REQUIRED' },
    ]);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleUpdateRequirement = (index: number, field: keyof RequirementItem, value: any) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || requirements.length === 0) {
      alert('Please fill out task title, description, and at least one requirement.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.tasks.create({
        title,
        description,
        category,
        targetDate: targetDate || null,
        requirements,
      });
      onTaskCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-800/80 p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create Task or Opportunity</h2>
              <p className="text-xs text-slate-400">Define weighted requirements for intelligent candidate matching</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Task / Opportunity Title</label>
            <input
              type="text"
              placeholder="e.g. National Science Olympiad Lead / Q3 Architecture Presentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                <option value="COMPETITION">Competition / Quiz</option>
                <option value="PRESENTATION">Public / Client Presentation</option>
                <option value="PROJECT_LEAD">Team / Project Leadership</option>
                <option value="EVENT_REPRESENTATION">Event Representative</option>
                <option value="SPORTS_MATCH">Sports Match / Role</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Target Event Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Context & Objectives</label>
            <textarea
              placeholder="Describe the opportunity context, specific criteria, and expectations..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Dynamic Requirement Builder */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Weighted Matching Requirements</span>
              </label>
              <button
                type="button"
                onClick={handleAddRequirement}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Requirement</span>
              </button>
            </div>

            <div className="space-y-3">
              {requirements.map((req, idx) => (
                <div key={idx} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-4">
                      <select
                        value={req.requirementType}
                        onChange={(e) => handleUpdateRequirement(idx, 'requirementType', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                      >
                        <option value="SKILL">Verified Skill</option>
                        <option value="EXPERIENCE">Activity / Experience</option>
                        <option value="MIN_PERFORMANCE">Overall Benchmark</option>
                      </select>
                    </div>

                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="e.g. Physics & Mechanics"
                        value={req.targetName}
                        onChange={(e) => handleUpdateRequirement(idx, 'targetName', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <select
                        value={req.importance}
                        onChange={(e) => handleUpdateRequirement(idx, 'importance', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                      >
                        <option value="REQUIRED">Required</option>
                        <option value="PREFERRED">Preferred</option>
                      </select>
                    </div>

                    <div className="sm:col-span-1 text-right">
                      {requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(idx)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Weight & Min Score Sliders */}
                  <div className="grid grid-cols-2 gap-4 pt-1 text-[11px] text-slate-400">
                    <div>
                      <div className="flex justify-between">
                        <span>Relative Weight:</span>
                        <span className="font-bold text-indigo-400">{req.weight}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={req.weight}
                        onChange={(e) => handleUpdateRequirement(idx, 'weight', Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <span>Min Threshold:</span>
                        <span className="font-bold text-emerald-400">{req.minScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={req.minScore}
                        onChange={(e) => handleUpdateRequirement(idx, 'minScore', Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create & Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
