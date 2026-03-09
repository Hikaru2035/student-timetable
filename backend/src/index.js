import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import timeBlockRoutes from './routes/timeBlocks.js';
import personalInfoRoutes from './routes/personalInfo.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://10.10.25.13:5173"
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/timeblocks', timeBlockRoutes);
app.use('/api/personalinfo', personalInfoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});