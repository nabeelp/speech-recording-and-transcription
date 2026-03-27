import { Router } from 'express';
import { getClientInfo, getAllClientNames } from '../services/clientDatabase';

export const clientLookupRouter = Router();

/**
 * GET /api/client/:name
 * Look up client information by name
 */
clientLookupRouter.get('/client/:name', (req, res) => {
  const { name } = req.params;
  
  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Client name required (minimum 2 characters)' });
  }

  const clientInfo = getClientInfo(name);
  
  if (!clientInfo) {
    return res.status(404).json({ error: 'Client not found' });
  }

  res.json(clientInfo);
});

/**
 * GET /api/clients
 * Get all client names for autocomplete
 */
clientLookupRouter.get('/clients', (_req, res) => {
  const names = getAllClientNames();
  res.json({ clients: names });
});
