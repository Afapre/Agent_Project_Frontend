import { addContextDocumentForChat, clearContextDocumentsForChat } from './contextState';

describe('context document state helpers', () => {
  it('adds a document id to the pending selection for a chat without duplicates', () => {
    const initial = { chatA: ['doc-1'] };

    const next = addContextDocumentForChat(initial, 'chatA', 'doc-2');
    expect(next.chatA).toEqual(['doc-1', 'doc-2']);

    const duplicate = addContextDocumentForChat(next, 'chatA', 'doc-2');
    expect(duplicate.chatA).toEqual(['doc-1', 'doc-2']);
  });

  it('clears pending context ids for a chat after the message is sent', () => {
    const initial = { chatA: ['doc-1', 'doc-2'], chatB: ['doc-3'] };

    const next = clearContextDocumentsForChat(initial, 'chatA');
    expect(next).toEqual({ chatB: ['doc-3'] });
  });
});
