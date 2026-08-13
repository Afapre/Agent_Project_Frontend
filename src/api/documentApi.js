import { request } from './httpClient';

export async function uploadChatContext({ file, userId, chatId }) {
  const body = new FormData();
  body.append('file', file);
  body.append('user_id', userId);
  body.append('chat_id', chatId);

  return request('/api/v1/chat/documents/upload-context', {
    method: 'POST',
    body,
  });
}

export async function listChatContextDocuments({ chatId, userId }) {
  const query = new URLSearchParams();
  if (userId) {
    query.set('user_id', userId);
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/api/v1/chat/chats/${chatId}/documents${suffix}`);
}

export async function deleteChatContextDocument({ chatId, documentId, userId }) {
  const query = new URLSearchParams();
  if (userId) {
    query.set('user_id', userId);
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/api/v1/chat/chats/${chatId}/documents/${documentId}${suffix}`, {
    method: 'DELETE',
  });
}

export async function uploadKnowledgeFiles({ files, userId }) {
  const body = new FormData();
  files.forEach((file) => body.append('files', file));
  body.append('user_id', userId);

  return request('/api/v1/documents/upload-knowledge', {
    method: 'POST',
    body,
  });
}

export async function listKnowledgeDocuments({ userId }) {
  const query = new URLSearchParams();
  query.set('user_id', userId);
  return request(`/api/v1/documents/knowledge?${query.toString()}`);
}

export async function deleteKnowledgeDocument({ userId, documentId }) {
  const query = new URLSearchParams();
  query.set('user_id', userId);
  return request(`/api/v1/documents/knowledge/${documentId}?${query.toString()}`, {
    method: 'DELETE',
  });
}
