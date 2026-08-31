import { renderHook, act, waitFor } from '@testing-library/react';
import { useClaraChat } from './useClaraChat';

const mockUser = { id: 'user-1', first_name: 'Test' };
const mockChat = { id: 'chat-1', title: 'New chat' };

function jsonResponse(body) {
  return Promise.resolve({
    ok: true,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body),
  });
}

describe('repro action queue bug', () => {
  beforeEach(() => {
    localStorage.setItem('clara_user', JSON.stringify(mockUser));
    let call = 0;
    global.fetch = jest.fn((url, options) => {
      const path = String(url);
      if (path.endsWith('/users/user-1/chats')) {
        return jsonResponse([mockChat]); // listUserChats
      }
      if (path.includes('pending-actions')) {
        return jsonResponse([]); // GET pending actions fallback
      }
      if (path.endsWith('/chats/chat-1/messages')) {
        return jsonResponse([]); // listMessages
      }
      if (path.endsWith('/users/user-1')) {
        return jsonResponse(mockUser); // validateSavedSession getUser
      }
      if (path.includes('context-documents') || path.includes('documents')) {
        return jsonResponse([]);
      }
      if (path.includes('/message') && options?.method === 'POST') {
        call += 1;
        return jsonResponse({
          message_id: `m-${call}`,
          user_message_id: `um-${call}`,
          user_id: 'user-1',
          chat_id: 'chat-1',
          response: `assistant reply ${call}`,
          content: `assistant reply ${call}`,
          pending_actions: [{ id: `action-${call}`, action_type: 'draft_email', authority_tier: 'binding', status: 'pending', reasoning: 'test' }],
        });
      }
      return jsonResponse({});
    });
  });

  it('shows a new pending action card for each interaction', async () => {
    const { result } = renderHook(() => useClaraChat());

    await waitFor(() => expect(result.current.isSessionValidating).toBe(false));
    await waitFor(() => expect(result.current.chats.length).toBe(1));
    await waitFor(() => expect(result.current.activeChatId).toBe('chat-1'));

    act(() => result.current.setInput('first message'));
    await act(async () => { await result.current.handleSend(); });

    await waitFor(() => expect(result.current.pendingActions.length).toBe(1));
    expect(result.current.pendingActions[0].id).toBe('action-1');

    act(() => result.current.setInput('second message'));
    await act(async () => { await result.current.handleSend(); });

    await waitFor(() => expect(result.current.pendingActions.some((a) => a.id === 'action-2')).toBe(true));
  });
});
