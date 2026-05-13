// APP-X-BRIDGE-01 — GET /api/operator/commands/:id
// Skeleton only.

import type { ApiHandler } from '../../_lib/handler';
import { methodAllowed, notFound, readQueryString } from '../../_lib/handler';
import { requireOperatorAuth } from '../../_lib/auth';
import { getCommand } from '../../_lib/store';

const handler: ApiHandler = async (req, res) => {
  if (!requireOperatorAuth(req, res)) return;
  if (!methodAllowed(req, res, ['GET'])) return;

  const id = readQueryString(req, 'id');
  if (!id) {
    return notFound(res, 'Command id missing in path.');
  }

  const command = getCommand(id);
  if (!command) {
    return notFound(res, `Command '${id}' not found.`);
  }

  res.status(200).json({
    command,
    meta: { skeleton: true, liveExecution: 'locked' },
  });
};

export default handler;
