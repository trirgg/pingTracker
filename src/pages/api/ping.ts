import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const url = 'https://www.google.com/generate_204';
  const start = Date.now();
  try {
    await fetch(url);
    const latency = Date.now() - start;
    res.status(200).json({ latency });
  } catch {
    res.status(500).json({ error: 'Ping failed' });
  }
}
