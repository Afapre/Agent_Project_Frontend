import React, { useCallback, useEffect, useState } from 'react';
import { Menu, RefreshCw, ShieldAlert, CheckCircle2, XCircle, Clock, PenSquare, Zap } from 'lucide-react';
import { listAllActions, approveAction, rejectAction } from '../api/actionApi';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'edited', label: 'Edited' },
  { value: 'executed', label: 'Executed' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_META = {
  pending: { className: 'status-pending', Icon: Clock, label: 'Pending' },
  approved: { className: 'status-approved', Icon: CheckCircle2, label: 'Approved' },
  edited: { className: 'status-edited', Icon: PenSquare, label: 'Edited' },
  executed: { className: 'status-executed', Icon: Zap, label: 'Executed' },
  rejected: { className: 'status-rejected', Icon: XCircle, label: 'Rejected' },
};

export default function ActionQueueManager({ userId, onOpenNav }) {
  const [actions, setActions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadActions = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await listAllActions({ userId, status: statusFilter === 'all' ? null : statusFilter });
      setActions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load action history.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, statusFilter]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const selectedAction = actions.find((a) => a.id === selectedActionId) || null;

  const handleApprove = async (actionId) => {
    setProcessingId(actionId);
    setError('');
    try {
      await approveAction({ actionId, userId });
      await loadActions();
    } catch (err) {
      setError(err.message || 'Unable to approve action.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (actionId) => {
    setProcessingId(actionId);
    setError('');
    try {
      await rejectAction({ actionId, userId, reason: rejectReason || null });
      setRejectReason('');
      await loadActions();
    } catch (err) {
      setError(err.message || 'Unable to reject action.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="action-queue-manager">
      <header className="chat-header-bar inventory-header-bar">
        <div className="header-title-wrapper">
          <div className="header-brandline">
            <button type="button" className="mobile-nav-toggle-btn" onClick={onOpenNav} aria-label="Open navigation">
              <Menu size={18} />
            </button>
            <h1>Action Queue Manager</h1>
          </div>
          <p>Review the full history of taken and pending actions.</p>
        </div>
        <button type="button" className="inventory-refresh-btn" onClick={loadActions} disabled={isLoading}>
          <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </header>

      {error && (
        <div className="chat-status-wrap">
          <div className="status-banner status-error">
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="action-queue-filter-tabs">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`action-queue-filter-tab ${statusFilter === filter.value ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter(filter.value);
              setSelectedActionId(null);
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="inventory-panel-shell">
        <div className="action-queue-manager-list">
          {isLoading ? (
            <p className="inventory-empty-state">Loading action history...</p>
          ) : actions.length === 0 ? (
            <p className="inventory-empty-state">No actions found for this filter.</p>
          ) : (
            actions.map((action) => {
              const meta = STATUS_META[action.status] || STATUS_META.pending;
              const StatusIcon = meta.Icon;
              return (
                <button
                  type="button"
                  key={action.id}
                  className={`action-queue-card tier-${action.authority_tier} action-history-card ${selectedActionId === action.id ? 'active' : ''}`}
                  onClick={() => setSelectedActionId(action.id)}
                >
                  <div className="action-queue-header">
                    <span className="action-type-label">{action.action_type.replace(/_/g, ' ')}</span>
                    <span className={`action-status-badge ${meta.className}`}>
                      <StatusIcon size={12} />
                      {meta.label}
                    </span>
                  </div>
                  {action.reasoning && <p className="action-reasoning action-reasoning-clamped">{action.reasoning}</p>}
                  <span className="action-queue-id">{action.created_at ? new Date(action.created_at).toLocaleString() : ''}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="action-detail-panel-shell">
          {selectedAction ? (
            <div className="inventory-chart-card action-detail-panel">
              <div className="action-queue-header">
                <h3 className="action-type-label">{selectedAction.action_type.replace(/_/g, ' ')}</h3>
                <span className={`authority-badge ${selectedAction.authority_tier}`}>
                  {selectedAction.authority_tier === 'binding' ? 'Manager sign-off' : selectedAction.authority_tier === 'standard' ? 'Confirmation' : 'Routine'}
                </span>
              </div>

              <div className="action-detail-meta-grid">
                <div>
                  <span className="context-stat-label">Status</span>
                  <span className="context-stat-value">{selectedAction.status}</span>
                </div>
                <div>
                  <span className="context-stat-label">Created</span>
                  <span className="context-stat-value">{selectedAction.created_at ? new Date(selectedAction.created_at).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="context-stat-label">Resolved</span>
                  <span className="context-stat-value">{selectedAction.resolved_at ? new Date(selectedAction.resolved_at).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              {selectedAction.reasoning && <p className="action-reasoning">{selectedAction.reasoning}</p>}

              {selectedAction.rejection_reason && (
                <p className="action-reasoning">Rejection reason: {selectedAction.rejection_reason}</p>
              )}

              {selectedAction.source_documents?.length > 0 && (
                <div className="action-source-docs">
                  {selectedAction.source_documents.map((doc) => (
                    <span key={doc} className="action-doc-chip">{doc}</span>
                  ))}
                </div>
              )}

              <details className="action-payload-details">
                <summary>Payload</summary>
                <pre>{JSON.stringify(selectedAction.edit_payload || selectedAction.payload, null, 2)}</pre>
              </details>

              {selectedAction.execution_result && (
                <details className="action-payload-details">
                  <summary>Execution result</summary>
                  <pre>{JSON.stringify(selectedAction.execution_result, null, 2)}</pre>
                </details>
              )}

              {selectedAction.status === 'pending' && (
                <div className="action-edit-area">
                  <textarea
                    rows={2}
                    placeholder="Optional rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="action-btn-row">
                    <button
                      type="button"
                      className="action-btn approve"
                      disabled={processingId === selectedAction.id}
                      onClick={() => handleApprove(selectedAction.id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="action-btn reject"
                      disabled={processingId === selectedAction.id}
                      onClick={() => handleReject(selectedAction.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="inventory-chart-card action-detail-panel">
              <div className="action-queue-header">
                <ShieldAlert size={16} />
                <span className="action-type-label">Select an action to view details</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
