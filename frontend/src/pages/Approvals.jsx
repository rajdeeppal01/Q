import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, X, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { api } from '../api/client';

export const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
    
    // Poll for new requests every 3 seconds for MVP
    const interval = setInterval(fetchApprovals, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchApprovals = async () => {
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (err) {
      console.error("Failed to load approvals", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (id, action) => {
    try {
      // Optimistic UI update
      setApprovals(prev => prev.filter(app => app.id !== id));
      
      await api.reviewApproval(id, action);
    } catch (err) {
      console.error("Failed to review approval", err);
      fetchApprovals(); // Revert on failure
    }
  };

  if (isLoading) {
    return <div className="p-8 text-q-muted animate-pulse">Loading HITL inbox...</div>;
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-amber-400 flex items-center gap-2">
            <ShieldAlert size={28} />
            HITL Gateway
          </h1>
          <p className="text-q-muted mt-1">Review and authorize high-risk agent actions.</p>
        </div>
        <div className="bg-q-base border border-q-border px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-q-muted">
          <Clock size={16} className="animate-spin-slow" />
          Auto-refreshing
        </div>
      </div>

      <div className="space-y-4">
        {approvals.length === 0 ? (
          <div className="bg-q-panel border border-q-border rounded-xl p-12 text-center text-q-muted flex flex-col items-center justify-center">
            <ShieldAlert className="h-16 w-16 opacity-10 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Inbox Zero</h3>
            <p>No agents are currently blocked waiting for approval.</p>
          </div>
        ) : (
          approvals.map(approval => (
            <div key={approval.id} className="bg-q-panel border border-amber-500/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.1)] relative transition-all hover:border-amber-500/50">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Action Blocked
                      </span>
                      <span className="text-xs text-q-muted">Agent ID: {approval.agent_id.slice(0, 8)}...</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-2">
                      {approval.action_description || 'Unknown Action'}
                    </h3>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleReview(approval.id, 'reject')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                    >
                      <X size={16} />
                      Deny
                    </button>
                    <button 
                      onClick={() => handleReview(approval.id, 'approve')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 rounded-lg text-sm font-medium transition-colors border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    >
                      <Check size={16} />
                      Approve Action
                    </button>
                  </div>
                </div>
                
                <div className="bg-q-base/50 rounded-lg p-4 border border-q-border text-sm">
                  <div className="mb-2">
                    <strong className="text-q-muted uppercase tracking-wider text-[10px]">Justification / Reason</strong>
                    <p className="text-gray-300 mt-1">{approval.reason}</p>
                  </div>
                  
                  {approval.context && Object.keys(approval.context).length > 0 && (
                    <div className="mt-4">
                      <strong className="text-q-muted uppercase tracking-wider text-[10px]">Execution Context</strong>
                      <pre className="mt-2 text-xs font-mono text-emerald-400 bg-[#0a0a0f] p-3 rounded border border-q-border overflow-x-auto">
                        {JSON.stringify(approval.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
