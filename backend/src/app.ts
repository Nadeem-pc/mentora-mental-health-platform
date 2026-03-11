import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/shared/auth.router';
import aiRouter from './routes/client/ai.router';
import notificationRouter from './routes/shared/notification.router';
import { errorHandler } from './middlewares/error-handler.middleware';
import adminRouter from './routes/admin/index.router';
import clientRouter from './routes/client/index.router';
import therapistRouter from './routes/therapist/index.router';
import paymentRouter from './routes/client/payment.router';
import walletRouter from './routes/shared/wallet.router';

export const app = express();

app.use('/api/v1/payment/webhook', express.raw({ type: 'application/json' }), paymentRouter);

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/notifications', notificationRouter);
app.use('/admin', adminRouter);
app.use('/client', clientRouter);
app.use('/therapist', therapistRouter);
app.use('/api/v1/payment', paymentRouter);
app.use('/wallet', walletRouter);

app.use(errorHandler);