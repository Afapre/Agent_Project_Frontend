export function addContextDocumentForChat(currentState, chatId, document) {
  if (!chatId || !document) return currentState;

  const existing = currentState?.[chatId] || [];
  const documentKey = typeof document === 'string' ? document : document?.id;
  if (!documentKey) {
    return currentState;
  }

  const alreadyExists = existing.some((entry) => {
    const entryKey = typeof entry === 'string' ? entry : entry?.id;
    return entryKey === documentKey;
  });

  if (alreadyExists) {
    return currentState;
  }

  return {
    ...currentState,
    [chatId]: [...existing, document],
  };
}

export function clearContextDocumentsForChat(currentState, chatId) {
  if (!chatId) return currentState;

  const nextState = { ...(currentState || {}) };
  delete nextState[chatId];
  return nextState;
}
