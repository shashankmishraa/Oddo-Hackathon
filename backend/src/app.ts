import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import apiRouter from './routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global request logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TransitOps API Gateway is operational.',
    health: '/api/health'
  });
});

// Mount Base Routers
app.use('/api', apiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TransitOps Core', env: config.env });
});

// Resource not found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.url}`,
  });
});

// Global Error Handler
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`[TransitOps] Architecture Server listening on http://localhost:${config.port}`);
});

export default app;
