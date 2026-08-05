const API_BASE = (process.env.REACT_APP_CHAT_ENDPOINT || 'http://localhost:8000').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
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

export async function sendChatMessage({ userId, chatId, prompt, title, history }) {
  return request('/api/v1/chat/message', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, chat_id: chatId, prompt, title, history }),
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
