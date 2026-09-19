import { z } from 'zod';
import { errorResult } from './errors.js';

const ENTITY_PATHS = new Set(['persons', 'people', 'doors', 'sites', 'groups', 'credentials']);

export function registerTools(server, sessions, config, log = () => {}) {
  server.tool('getPanel', 'Fetch panel details by panel ID.', {
    panelId: z.string().min(1),
  }, async ({ panelId }) => run(log, 'getPanel', () => sessions.getPanel(panelId)));

  server.tool('listEntities', 'List panel entities with optional pagination.', {
    entityType: z.enum([...ENTITY_PATHS]),
    panelId: z.string().min(1),
    page: z.number().int().min(1).default(1),
    perPage: z.number().int().min(1).max(100).default(25),
    cursor: z.string().optional(),
    search: z.string().optional(),
    filters: z.record(z.string(), z.unknown()).default({}),
  }, async ({ entityType, panelId, page = 1, perPage = 25, cursor, search, filters = {} }) =>
    run(log, 'listEntities', async () => {
      const session = await sessions.panelSession(panelId);
      const searchParams = { page, perPage, ...filters };
      if (cursor) searchParams.cursor = cursor;
      if (search) searchParams.search = search;
      const result = await session(entityType, { searchParams });
      return {
        items: Array.isArray(result) ? [...result] : result,
        count: result?.count,
        links: result?.link || null,
        page,
        perPage,
      };
    }));

  server.tool('getEntity', 'Fetch one entity from a panel.', {
    entityType: z.enum([...ENTITY_PATHS]),
    entityId: z.string().min(1),
    panelId: z.string().min(1),
  }, async ({ entityType, entityId, panelId }) =>
    run(log, 'getEntity', async () => {
      const session = await sessions.panelSession(panelId);
      return session(`${entityType}/${encodeURIComponent(entityId)}`);
    }));

  server.tool('getGroupMembers', 'List the people currently assigned to a panel group.', {
    panelId: z.string().min(1),
    groupId: z.string().min(1),
  }, async ({ panelId, groupId }) =>
    run(log, 'getGroupMembers', async () => {
      const session = await sessions.panelSession(panelId);
      return session(`groups/${encodeURIComponent(groupId)}/persons`);
    }));

  server.tool('listPersonCards', 'List cards assigned to a panel person.', {
    panelId: z.string().min(1),
    personId: z.string().min(1),
  }, async ({ panelId, personId }) =>
    run(log, 'listPersonCards', async () => {
      const session = await sessions.panelSession(panelId);
      return session(`persons/${encodeURIComponent(personId)}/cards`);
    }));

  server.tool('getEventStream', 'Collect live panel events for a bounded period.', {
    panelId: z.string().min(1),
    durationMs: z.number().int().min(100).max(60000).optional(),
  }, async ({ panelId, durationMs = config.streamTimeoutMs }) =>
    run(log, 'getEventStream', async () => {
      const session = await sessions.panelSession(panelId);
      const stream = session.createEventStream();
      const events = [];
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          stream.close();
          resolve({ events, durationMs });
        }, durationMs);
        stream.on('liveEvent', event => events.push(event));
        stream.once('connect_error', error => {
          clearTimeout(timer);
          stream.close();
          reject(error);
        });
      });
    }));
}

async function run(log, tool, action) {
  try {
    log(`${tool} request`);
    const value = await action();
    return { content: [{ type: 'text', text: JSON.stringify(value ?? null) }] };
  } catch (error) {
    log(`${tool} failed: ${error.message}`);
    return errorResult(error);
  }
}
