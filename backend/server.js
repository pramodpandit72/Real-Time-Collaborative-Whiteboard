import dns from 'node:dns';
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';

// Import routes
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/room.js';
import whiteboardRoutes from './routes/whiteboard.js';

// Import socket handler
import socketHandler from './socket/socketHandler.js';

// Import passport config
import './config/passport.js';

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'collaborative-whiteboard-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// DNS servers to try in order: system default, Google, Cloudflare
const DNS_SERVERS = [
  null, // system default
  ['8.8.8.8', '8.8.4.4'],       // Google
  ['1.1.1.1', '1.0.0.1'],       // Cloudflare
  ['208.67.222.222', '208.67.220.220'], // OpenDNS
];

const systemDns = dns.getServers();

// Connect to MongoDB with DNS fallback + retry logic
const connectWithRetry = async (maxRetries = 3, delay = 5000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const dnsServers of DNS_SERVERS) {
      try {
        // Switch DNS server
        if (dnsServers) {
          dns.setServers(dnsServers);
          console.log(`Trying DNS: ${dnsServers[0]}...`);
        } else {
          dns.setServers(systemDns);
          console.log('Trying system DNS...');
        }

        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 15000,
          socketTimeoutMS: 45000,
          family: 4, // Force IPv4
        });
        console.log('Connected to MongoDB successfully');
        return;
      } catch (err) {
        // Disconnect any partial connection before retrying
        try { await mongoose.disconnect(); } catch (_) { }
        console.error(`DNS ${dnsServers ? dnsServers[0] : 'system'} failed:`, err.message);
      }
    }
    if (attempt < maxRetries) {
      console.log(`All DNS servers failed. Retry ${attempt}/${maxRetries} in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('All MongoDB connection attempts exhausted. Server running without DB — will auto-reconnect when available.');
};

// Mongoose connection event listeners
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected. Reconnecting...'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

connectWithRetry();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/whiteboard', whiteboardRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Collaborative Whiteboard API is running' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Socket.io connection handling
socketHandler(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server, io };
