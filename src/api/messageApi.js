import { request } from './httpClient';

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
