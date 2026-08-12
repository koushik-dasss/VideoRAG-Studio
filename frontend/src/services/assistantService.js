import api from './api';

export const sendAssistantMessage = async (message, history = []) => {
  return api.post('/assistant/chat', {
    message,
    history,
  });
};
