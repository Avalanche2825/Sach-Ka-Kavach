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

// ── HTTP server + Socket.io ───────────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
});

// Make io accessible from controllers via app.locals
app.locals.io = io;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'SACH Kavach — Bharat Trust Grid',
    status: 'Operational',
    port: PORT,
    version: '2.0.0',
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
      console.log('║     SACH Kavach — Bharat Trust Grid v2.0.0           ║');
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
