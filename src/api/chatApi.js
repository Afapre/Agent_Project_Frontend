import { request } from './httpClient';

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

export async function updateChatTitle(chatId, title) {
  return request(`/api/v1/chat/chats/${chatId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}
