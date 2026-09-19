import { makePanelSession } from '../panelApi.js';
import { makeSession } from '../session.js';
import { createAuthStrategy } from './auth.js';

export class SessionManager {
  constructor(config) {
    this.config = config;
    this.authSessionValue = undefined;
    this.panelSessions = new Map();
  }

  async authSession() {
    if (!this.authSessionValue) {
      this.authSessionValue = await makeSession(
        createAuthStrategy(this.config),
        this.config.apiBaseUrl
      );
    }
    return this.authSessionValue;
  }

  async getPanel(panelId) {
    assertId(panelId, 'panelId');
    return (await this.authSession())(`panels/${encodeURIComponent(panelId)}`);
  }

  async panelSession(panelId) {
    assertId(panelId, 'panelId');
    if (!this.panelSessions.has(panelId)) {
      const panel = await this.getPanel(panelId);
      this.panelSessions.set(panelId, makePanelSession(await this.authSession(), panel));
    }
    return this.panelSessions.get(panelId);
  }

  async close() {
    for (const sessionPromise of this.panelSessions.values()) {
      const session = await sessionPromise;
      if (session.closeEventStreams) session.closeEventStreams();
    }
    const strategy = this.authSessionValue;
    if (strategy?.revoke) await strategy.revoke();
    this.panelSessions.clear();
    this.authSessionValue = undefined;
  }
}

function assertId(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}
