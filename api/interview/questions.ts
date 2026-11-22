import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  handleQuestionsRequest,
  readJsonBody,
  sendJson,
} from '../../server/interviewHandlers.ts';

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await handleQuestionsRequest(body);
    sendJson(res, result.status, result.payload);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON request body.' });
  }
}
