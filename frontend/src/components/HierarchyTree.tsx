import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Users, 
  Plus, 
  FolderTree, 
  Layers, 
  Building,
  School,
  Briefcase
} from 'lucide-react';

interface TreeNodeData {
  id: string;
  name: string;
  nodeType: string;
  depth: number;
  parentId: string | null;
  path: string;
  memberCount: number;
  children: TreeNodeData[];
}

interface HierarchyTreeProps {
  tree: TreeNodeData | null;
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string;
  onAddChild?: (parentNode: TreeNodeData) => void;
}

const TreeNodeItem: React.FC<{
  node: TreeNodeData;
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string;
  onAddChild?: (parentNode: TreeNodeData) => void;
}> = ({ node, onSelectNode, selectedNodeId, onAddChild }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;

  const getNodeIcon = (type: string, depth: number) => {
    if (depth === 0) return <School className="w-4 h-4 text-indigo-400" />;
    if (depth === 1) return <Building className="w-4 h-4 text-emerald-400" />;
    if (depth === 2) return <Layers className="w-4 h-4 text-amber-400" />;
    return <Briefcase className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="relative pl-6">
      {/* Branch connecting lines */}
      {node.parentId && (
        <div className="absolute left-0 top-5 w-5 h-px bg-slate-700/80" />
      )}
      {node.parentId && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-700/80" />
      )}

      {/* Node Card */}
      <div
        className={`group my-2 flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
          isSelected
            ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10'
            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
        }`}
        onClick={() => onSelectNode && onSelectNode(node.id)}
      >
        <div className="flex items-center space-x-3">
          {/* Expand/Collapse Toggle */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/60"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Type Icon */}
          <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center border border-slate-600/40">
            {getNodeIcon(node.nodeType, node.depth)}
          </div>

          {/* Node Details */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                {node.name}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600/40">
                {node.nodeType}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>{node.memberCount} members</span>
              </span>
              <span>•</span>
              <span className="font-mono text-[10px] text-slate-400">Level {node.depth}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onAddChild && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node);
            }}
            title="Add Child Branch"
            className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Child</span>
          </button>
        )}
      </div>

      {/* Recursive Children */}
      {hasChildren && isExpanded && (
        <div className="border-l-2 border-slate-700/60 ml-3">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  tree,
  onSelectNode,
  selectedNodeId,
  onAddChild,
}) => {
  if (!tree) {
    return (
      <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800">
        <FolderTree className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No hierarchy initialized</h3>
        <p className="text-sm text-slate-500 mt-1">Create the root organization node to begin.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-x-auto">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <FolderTree className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-slate-100">Organizational Hierarchy Tree</h2>
        </div>
        <span className="text-xs text-slate-400">
          Click any branch to view members and filter analytics
        </span>
      </div>

      <div className="max-w-4xl">
        <TreeNodeItem
          node={tree}
          onSelectNode={onSelectNode}
          selectedNodeId={selectedNodeId}
          onAddChild={onAddChild}
        />
      </div>
    </div>
  );
};
