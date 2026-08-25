import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import inventoryRoutes from './routes/inventory.routes';
import saleRoutes from './routes/sale.routes';
import userRoutes from './routes/user.routes';
import settingsRoutes from './routes/settings.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

const allowedOrigins = new Set(
  [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin) and configured local frontends.
      if (!origin || allowedOrigins.has(origin) || env.NODE_ENV === 'development') {
        callback(null, origin || env.FRONTEND_URL);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
