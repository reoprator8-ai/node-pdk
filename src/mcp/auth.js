import { clientauth, userauth } from '../authenticators/index.js';

export function createAuthStrategy(config) {
  const options = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    issuer: config.issuer,
  };

  if (config.strategy === 'userauth') {
    return userauth({ ...options, scope: config.scope, refresh_token: config.refreshToken });
  }
  return clientauth(options);
}
