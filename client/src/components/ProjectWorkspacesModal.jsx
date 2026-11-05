import React, { useState, useEffect } from 'react';
import { FolderGit2, Plus, FileCode, Trash2, Save, FileText, Check, AlertCircle } from 'lucide-react';

export function ProjectWorkspacesModal({ isOpen, onClose, onSelectProject, activeProjectId }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingInstructions, setEditingInstructions] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        if (!selectedProject && data.projects.length > 0) {
          const current = data.projects.find(p => p.id === activeProjectId) || data.projects[0];
          loadProjectDetails(current.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadProjectDetails = async (projectId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSelectedProject(data);
        setEditingInstructions(data.project.system_instructions || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleSaveInstructions = async () => {
    if (!selectedProject) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstructions: editingInstructions }),
        credentials: 'include'
      });
      if (res.ok) {
        setStatusMsg('System instructions updated successfully!');
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim(),
          systemInstructions: 'You are an AI engineering assistant for this project workspace.'
        }),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setNewProjectName('');
        setNewProjectDesc('');
        setIsCreating(false);
        fetchProjects();
        loadProjectDetails(data.project.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!selectedProject) return;
    try {
      await fetch(`/api/projects/${selectedProject.project.id}/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      loadProjectDetails(selectedProject.project.id);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-nexora-dark border border-nexora-border w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-nexora-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-nexora-accent/10 border border-nexora-accent/30 text-nexora-accent">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Project Workspaces</h3>
              <p className="text-xs text-nexora-muted">Manage isolated project contexts, system prompts, and source files.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-nexora-muted hover:text-white p-1.5 rounded-lg hover:bg-nexora-card">✕</button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Projects Sidebar */}
          <div className="w-64 border-r border-nexora-border p-3 flex flex-col bg-nexora-darkest/40">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-nexora-muted uppercase tracking-wider">Your Workspaces</span>
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 rounded-md bg-nexora-card hover:bg-nexora-accent/20 text-nexora-muted hover:text-white text-xs flex items-center gap-1 transition-colors"
                title="Create workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto flex-1">
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setIsCreating(false);
                    loadProjectDetails(p.id);
                  }}
                  className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                    selectedProject?.project?.id === p.id && !isCreating
                      ? 'bg-nexora-accent/15 border border-nexora-accent/40 text-white font-medium'
                      : 'hover:bg-nexora-card text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-nexora-muted font-mono">{p.file_count || 0} files</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Details Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-nexora-dark">
            {isCreating ? (
              <form onSubmit={handleCreateProject} className="max-w-md space-y-4">
                <h4 className="text-base font-semibold text-white">Create New Workspace</h4>
                <div>
                  <label className="text-xs text-nexora-muted block mb-1">Workspace Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Quantitative Risk Engine"
                    className="w-full px-3 py-2 bg-nexora-card border border-nexora-border rounded-lg text-sm text-white focus:outline-none focus:border-nexora-accent"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-nexora-muted block mb-1">Description</label>
                  <input
                    type="text"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Brief description of this project workspace"
                    className="w-full px-3 py-2 bg-nexora-card border border-nexora-border rounded-lg text-sm text-white focus:outline-none focus:border-nexora-accent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-lg text-xs text-nexora-muted hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-nexora-accent hover:bg-blue-600 text-white text-xs font-medium"
                  >
                    Create Workspace
                  </button>
                </div>
              </form>
            ) : selectedProject ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{selectedProject.project.name}</h4>
                    <p className="text-xs text-nexora-muted mt-0.5">{selectedProject.project.description || 'No description provided.'}</p>
                  </div>
                  <button
                    onClick={() => {
                      onSelectProject(selectedProject.project);
                      onClose();
                    }}
                    className="px-4 py-1.5 rounded-lg bg-nexora-cyan/15 border border-nexora-cyan/30 text-nexora-cyan hover:bg-nexora-cyan/25 text-xs font-medium transition-colors"
                  >
                    Set as Active Chat Workspace
                  </button>
                </div>

                {statusMsg && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4" /> {statusMsg}
                  </div>
                )}

                {/* System Prompt / Instructions Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Workspace System Instructions
                    </label>
                    <button
                      onClick={handleSaveInstructions}
                      disabled={saving}
                      className="px-3 py-1 rounded-lg bg-nexora-accent hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving...' : 'Save Instructions'}
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={editingInstructions}
                    onChange={(e) => setEditingInstructions(e.target.value)}
                    className="w-full p-3 bg-nexora-card border border-nexora-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-nexora-accent leading-relaxed"
                  />
                </div>

                {/* Attached Workspace Files */}
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Associated Project Files ({selectedProject.files?.length || 0})
                  </h5>
                  {selectedProject.files?.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-nexora-border text-center text-xs text-nexora-muted">
                      No files associated with this workspace yet. You can attach source files (.py, .mql5, .csv, .json, .pdf) in the chat composer to bind them to this project.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProject.files.map(f => (
                        <div key={f.id} className="p-3 rounded-xl bg-nexora-card border border-nexora-border flex items-start justify-between">
                          <div className="space-y-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <FileCode className="w-4 h-4 text-nexora-accent shrink-0" />
                              <span className="text-xs font-medium text-white truncate">{f.filename}</span>
                            </div>
                            <span className="text-[10px] text-nexora-muted font-mono block">
                              {(f.file_size / 1024).toFixed(1)} KB &bull; .{f.file_type}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteFile(f.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
