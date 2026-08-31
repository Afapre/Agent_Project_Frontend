import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ChatWindow from '../components/ChatWindow';

const mockUser = { id: 'user-1', first_name: 'Test' };
const mockChat = { id: 'chat-1', title: 'New chat' };

function jsonResponse(body) {
  return Promise.resolve({
    ok: true,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body),
  });
}

describe('repro action queue bug - full component', () => {
  beforeEach(() => {
    localStorage.setItem('clara_user', JSON.stringify(mockUser));
    const queuedActions = [];
    let call = 0;
    global.fetch = jest.fn((url, options) => {
      const path = String(url);
      if (path.endsWith('/users/user-1/chats')) {
        return jsonResponse([mockChat]);
      }
      if (path.includes('pending-actions')) {
        return jsonResponse(queuedActions);
      }
      if (path.endsWith('/chats/chat-1/messages')) {
        return jsonResponse([]);
      }
      if (path.endsWith('/users/user-1')) {
        return jsonResponse(mockUser);
      }
      if (path.includes('context-documents') || path.includes('documents')) {
        return jsonResponse([]);
      }
      if (path.includes('/message') && options?.method === 'POST') {
        call += 1;
        const newAction = { id: `action-${call}`, action_type: 'draft_email', authority_tier: 'binding', status: 'pending', reasoning: `reasoning ${call}` };
        queuedActions.unshift(newAction);
        return jsonResponse({
          message_id: `m-${call}`,
          user_message_id: `um-${call}`,
          user_id: 'user-1',
          chat_id: 'chat-1',
          response: `assistant reply ${call}`,
          content: `assistant reply ${call}`,
          pending_actions: [...queuedActions],
        });
      }
      return jsonResponse({});
    });
  });

  it('renders a new action card in the DOM for each interaction', async () => {
    render(<ChatWindow />);

    const textarea = await screen.findByPlaceholderText(/type your message to clara/i);

    fireEvent.change(textarea, { target: { value: 'first message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(screen.getAllByText(/draft email/i).length).toBe(1));

    fireEvent.change(textarea, { target: { value: 'second message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(screen.getAllByText(/draft email/i).length).toBe(2));
  });
});
