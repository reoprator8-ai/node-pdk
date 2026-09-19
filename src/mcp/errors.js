import { HTTPError } from 'got';
import { InvalidParameterError, TokenRefreshError } from '../errors.js';

export function toMcpError(error) {
  if (error instanceof InvalidParameterError) {
    return { code: 'INVALID_ARGUMENT', message: error.message };
  }
  if (error instanceof TokenRefreshError) {
    return { code: 'AUTHENTICATION_FAILED', message: error.message };
  }
  if (error instanceof HTTPError) {
    const status = error.response?.statusCode;
    const code = status === 401 ? 'UNAUTHENTICATED' :
      status === 403 ? 'PERMISSION_DENIED' :
      status === 404 ? 'NOT_FOUND' :
      status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR';
    const bodyMessage = error.response?.body?.message;
    return { code, message: bodyMessage || `PDK API request failed (${status || 'unknown status'})` };
  }
  return { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : String(error) };
}

export function errorResult(error) {
  const mapped = toMcpError(error);
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify(mapped) }],
  };
}

export function successResult(value) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value ?? null) }],
  };
}
