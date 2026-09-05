import baseWorker, { GameRoomDO } from './pass-entry.js';
import { handlePasswordResetRequest } from './password-reset-backend.js';
import { ensurePasswordResetSchema } from './password-reset-schema.js';

export { GameRoomDO };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/auth/forgot-password' || url.pathname === '/auth/reset-password') {
      await ensurePasswordResetSchema(env);
    }

    const passwordResetResponse = await handlePasswordResetRequest(request, env);
    if (passwordResetResponse) return passwordResetResponse;
    return baseWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    if (typeof baseWorker.scheduled === 'function') {
      return baseWorker.scheduled(controller, env, ctx);
    }
  }
};
