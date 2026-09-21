import express, { type Request, type Response } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import healthHandler from '../server-routes/health.js';
import generateHandler from '../server-routes/recipe/generate.js';
import streamHandler from '../server-routes/recipe/stream.js';
import imageHandler from '../server-routes/recipe/image.js';
import rankingHandler from '../server-routes/recipes/ranking.js';
import likeHandler from '../server-routes/recipes/like.js';

const app = express();
app.use(express.json());

const adapt = (handler: (req: VercelRequest, res: VercelResponse) => void | Promise<void>) => {
  return async (req: Request, res: Response) => {
    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
  };
};

// Handle both with and without '/api' prefix
app.all(['/api/health', '/health', '/api', '/'], adapt(healthHandler));
app.all(['/api/recipes/ranking', '/recipes/ranking'], adapt(rankingHandler));
app.all(['/api/recipes/like', '/recipes/like'], adapt(likeHandler));
app.all(['/api/recipe/generate', '/recipe/generate'], adapt(generateHandler));
app.all(['/api/recipe/stream', '/recipe/stream'], adapt(streamHandler));
app.all(['/api/recipe/image', '/recipe/image'], adapt(imageHandler));

export default app;
