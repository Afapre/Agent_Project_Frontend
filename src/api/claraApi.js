const API_BASE = (process.env.REACT_APP_CHAT_ENDPOINT).replace(/\/$/, '');

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : data.detail || 'Request failed');
  }

  return data;
}

// export async function createUser(name, email) {
//   return request('/api/v1/chat/users', {
//     method: 'POST',
//     body: JSON.stringify({ name, email }),
//   });
// }

export async function createUser(firstName, lastName, email, password, dateOfBirth) {
  return request('/api/v1/chat/users', {
    method: 'POST',
    body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password, date_of_birth: dateOfBirth }),
  });
}

export async function loginUser(email, password) {
  return request('/api/v1/chat/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getUser(userId) {
  return request(`/api/v1/chat/users/${userId}`);
}

export async function createChat(userId, title) {
  return request('/api/v1/chat/chats', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, title }),
  });
}

export async function listUserChats(userId) {
  return request(`/api/v1/chat/users/${userId}/chats`);
}

export async function getChat(chatId) {
  return request(`/api/v1/chat/chats/${chatId}`);
}

export async function deleteChat(chatId) {
  return request(`/api/v1/chat/chats/${chatId}`, { method: 'DELETE' });
}

export async function sendChatMessage({ userId, chatId, prompt, title, history, documentIds }) {
  return request('/api/v1/chat/message', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      chat_id: chatId,
      prompt,
      title,
      history,
      document_ids: documentIds,
    }),
  });
}

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

export async function listMessages(chatId) {
  return request(`/api/v1/chat/chats/${chatId}/messages`);
}

export async function createMessage(chatId, content, role = 'user') {
  return request(`/api/v1/chat/chats/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, role }),
  });
}

export async function updateMessageFeedback(messageId, isLiked) {
  return request(`/api/v1/chat/messages/${messageId}/like`, {
    method: 'PATCH',
    body: JSON.stringify({ is_liked: isLiked }),
  });
}

export async function deleteUser(userId) {
  return request(`/api/v1/chat/users/${userId}`, { method: 'DELETE' });
}

export async function updateChatTitle(chatId, title) {
  return request(`/api/v1/chat/chats/${chatId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}
