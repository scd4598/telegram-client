import { Request, Response, NextFunction } from 'express';

const SAFE_ERRORS = ['Invalid credentials', 'Daily limit reached', 'Chat not found', 'Account not found', 'Limit exceeded'];

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (SAFE_ERRORS.includes(err.message)) {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: 'Internal server error' });
}
