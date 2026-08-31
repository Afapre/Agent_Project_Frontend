import { request } from './httpClient';

export function listPendingActions({ userId, chatId }) {
  const params = chatId ? `?user_id=${encodeURIComponent(userId)}` : '';
  const path = chatId
    ? `/api/v1/chat/chats/${chatId}/pending-actions${params}`
    : `/api/v1/chat/users/${userId}/pending-actions`;
  return request(path);
}

export function approveAction({ actionId, userId, editPayload = null }) {
  return request(`/api/v1/chat/actions/${actionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, edit_payload: editPayload }),
  });
}

export function rejectAction({ actionId, userId, reason = null }) {
  return request(`/api/v1/chat/actions/${actionId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, reason }),
  });
}

export function listAllActions({ userId, status = null, limit = 200 }) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (status) params.set('status', status);
  return request(`/api/v1/chat/users/${userId}/actions?${params}`);
}

export function getAuditLog({ userId, chatId = null, limit = 50 }) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (chatId) params.set('chat_id', chatId);
  return request(`/api/v1/chat/users/${userId}/audit-log?${params}`);
}
