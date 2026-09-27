import React, { useState, useEffect } from 'react';
import { Network, Plus, Users, Layers, ShieldCheck, X } from 'lucide-react';
import { api } from '../api/client';
import { HierarchyTree } from '../components/HierarchyTree';
import { ProfileModal } from '../components/ProfileModal';

export const HierarchyPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [nodeMembers, setNodeMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Add Node Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [targetParent, setTargetParent] = useState<any | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState('DEPARTMENT');

  const loadHierarchy = () => {
    api.hierarchy.getTree()
      .then((res) => {
        setTreeData(res.tree);
        if (res.tree && !selectedNodeId) {
          setSelectedNodeId(res.tree.id);
        }
      })
      .catch((err) => console.error('Failed to load hierarchy:', err));
  };

  useEffect(() => {
    loadHierarchy();
  }, []);

  useEffect(() => {
    if (!selectedNodeId) return;
    setIsLoadingMembers(true);
    api.profiles.list({ nodeId: selectedNodeId })
      .then((res) => setNodeMembers(res.profiles || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingMembers(false));
  }, [selectedNodeId]);

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName) return;
    try {
      await api.hierarchy.createNode({
        name: newNodeName,
        nodeType: newNodeType,
        parentId: targetParent ? targetParent.id : null,
      });
      setShowAddModal(false);
      setNewNodeName('');
      loadHierarchy();
    } catch (err: any) {
      alert(err.message || 'Failed to create hierarchy node.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <span>Organizational Hierarchy & Subtree Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Polymorphic Parent $\rightarrow$ Child trees with dynamic subtree role inheritance
          </p>
        </div>

        <button
          onClick={() => {
            setTargetParent(treeData);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hierarchy Branch</span>
        </button>
      </div>

      {/* Main Grid: Tree Explorer + Node Members */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tree Column */}
        <div className="lg:col-span-7">
          <HierarchyTree
            tree={treeData}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => setSelectedNodeId(id)}
            onAddChild={(node) => {
              setTargetParent(node);
              setShowAddModal(true);
            }}
          />
        </div>

        {/* Selected Node Details & Members Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Branch Members</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {nodeMembers.length} Person(s) Assigned
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 mt-2 max-h-[500px] overflow-y-auto">
              {isLoadingMembers ? (
                <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
                  Querying subtree members...
                </div>
              ) : nodeMembers.length > 0 ? (
                nodeMembers.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedProfileId(m.id)}
                    className="py-3 flex items-center justify-between hover:bg-slate-800/40 p-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white hover:text-indigo-400 transition-colors">
                        {m.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {m.titleRole} • <span className="font-mono text-[10px] text-slate-500">{m.userRole}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        Avg: {m.trajectory.averageScore}%
                      </span>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        {m.trajectory.trendDirection}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  No direct profiles registered under this branch yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Child Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create New Hierarchy Node</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Parent Branch</label>
                <div className="mt-1 p-2.5 rounded-xl bg-slate-800 text-xs text-white border border-slate-700 font-semibold">
                  {targetParent ? targetParent.name : 'Root Organization Node'}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Node Name</label>
                <input
                  type="text"
                  placeholder="e.g. Department of Robotics / Grade 12-A / Backend Core"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Branch Type</label>
                <select
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value)}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="DEPARTMENT">Department / Division</option>
                  <option value="CLASS">Class / Grade Cohort</option>
                  <option value="TEAM">Team / Squad</option>
                  <option value="CLUB">Specialized Club / Lab</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
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
                  Create Node
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
        />
      )}
    </div>
  );
};
