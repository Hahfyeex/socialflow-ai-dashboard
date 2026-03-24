import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import { corsOptions } from './config/cors';
import statusRoutes from './routes/status';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle pre-flight for all routes
app.use(express.json());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // allow base64 image payloads
app.use(morgan('dev'));

// Routes
app.use('/api/health', healthRoutes);
app.use('/status', statusRoutes);

export default app;
