import baseWorker, { GameRoomDO } from './worker-auth.index.js';
import { handlePasswordResetRequest } from './password-reset-backend.js';

export { GameRoomDO };

export default {
  async fetch(request, env, ctx) {
    const passwordResetResponse = await handlePasswordResetRequest(request, env);
    if (passwordResetResponse) return passwordResetResponse;
    return baseWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    return baseWorker.scheduled(controller, env, ctx);
  }
};
