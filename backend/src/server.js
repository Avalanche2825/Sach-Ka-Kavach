import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const ALLOWED_ORIGINS = [
  'https://sach-ka-kavach.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

// ── HTTP server + Socket.io ───────────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Make io accessible from controllers via app.locals
app.locals.io = io;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'Sach Ka Kavach — Bharat Trust Grid',
    status: 'Operational',
    module_1: 'Behavioral Trust Engine (Active)',
    module_2: 'Device & Access Intelligence Engine (Active)',
    port: PORT,
    version: '2.1.0',
    ml_service: ML_SERVICE_URL,
    socket_io: 'enabled',
    timestamp: new Date().toISOString(),
  });
});

// ── Socket.io Event Handlers ──────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('subscribe_alerts', (data) => {
    console.log(`[Socket.io] ${socket.id} subscribed to alerts for: ${data?.cif || 'all'}`);
    socket.join('alerts');
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ── Startup ───────────────────────────────────────────────────────────────────
const start = async () => {
  const isMongoConnected = await connectDB();

  if (process.env.VERCEL !== '1') {
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('\n╔══════════════════════════════════════════════════════╗');
      console.log('║     Sach Ka Kavach — Bharat Trust Grid v2.0.0        ║');
      console.log('║     Continuous Identity Trust Engine (CITE)          ║');
      console.log('╚══════════════════════════════════════════════════════╝\n');
      console.log(`✓ Express API server:    http://0.0.0.0:${PORT}`);
      console.log(`✓ Socket.io realtime:   ws://0.0.0.0:${PORT}`);
      console.log(
        isMongoConnected
          ? '✓ MongoDB Atlas:         Connected'
          : '✓ Identity Memory Engine: Active (in-memory fallback)'
      );
      console.log(
        process.env.GROK_API_KEY
          ? '✓ Grok AI (xAI):         Armed'
          : '⚠ Grok API key missing — Groq fallback active'
      );
      console.log(
        process.env.GROQ_API_KEY
          ? '✓ Groq LLM:              Armed'
          : '⚠ Groq API key missing — heuristic engine active'
      );
      console.log(`  Python ML service:     ${ML_SERVICE_URL}`);
      console.log('\n  Start ML service with: cd ml_service && python app.py\n');
    });
  } else {
    console.log('✓ Express running on Vercel Serverless environment.');
  }
};

start();

export default app;
// Server reloaded at 2026-08-02T22:18:00Z
