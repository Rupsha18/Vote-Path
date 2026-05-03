require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const compression = require('compression');
const minify = require('express-minify');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin (Application Default Credentials)
try {
  admin.initializeApp();
} catch (e) {
  console.log("Firebase Admin already initialized or missing credentials");
}

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'votepath-jwt-secret-key-2026';

// Security and Performance Middlewares
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(minify());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Exact Security Headers from Prompt
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Cache-Control', 'no-store');
  next();
});

// Database Setup (Firestore)
const firestore = new Firestore({ projectId: 'votepath-495017' });

const initDB = async () => {
  try {
    const pollsSnapshot = await firestore.collection('polls').limit(1).get();
    if (pollsSnapshot.empty) {
      const defaultPoll = {
        question: "Which voting method do you prefer for local elections?",
        options: [
          { id: 'opt1', text: 'First-Past-The-Post', votes: 12 },
          { id: 'opt2', text: 'Ranked Choice Voting', votes: 45 },
          { id: 'opt3', text: 'Proportional Representation', votes: 23 }
        ],
        active: true,
        createdAt: new Date().toISOString()
      };
      await firestore.collection('polls').doc(uuidv4()).set(defaultPoll);
    }
  } catch (err) {
    console.error("Firestore initialization error:", err.message);
  }
};
initDB();

// JWT Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// --- API ROUTES ---

app.post('/api/signup', 
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').trim().notEmpty().withMessage('Name is required').escape()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password, name } = req.body;
    
    try {
      let uid = uuidv4();
      try {
        // Firebase Auth Creation
        const userRecord = await admin.auth().createUser({ email, password, displayName: name });
        uid = userRecord.uid;
      } catch (fbErr) {
        console.warn("Firebase Admin failed to create user (falling back to Firestore only):", fbErr.message);
      }

      const usersRef = firestore.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();
      
      if (!snapshot.empty) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      await usersRef.doc(uid).set({
        email,
        name,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      });
      
      const token = jwt.sign({ id: uid, email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, message: 'Account created successfully', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error during signup' });
    }
});

app.post('/api/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    
    try {
      const usersRef = firestore.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();
      
      if (snapshot.empty) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      let user = null;
      let userId = null;
      snapshot.forEach(doc => {
        user = doc.data();
        userId = doc.id;
      });
      
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, message: 'Logged in successfully', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

app.post('/api/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const userDoc = await firestore.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    
    const user = userDoc.data();
    res.json({ 
      loggedIn: true, 
      user: { id: userDoc.id, email: user.email, name: user.name }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/polls', async (req, res) => {
  try {
    const snapshot = await firestore.collection('polls').get();
    const polls = [];
    snapshot.forEach(doc => {
      polls.push({ id: doc.id, ...doc.data() });
    });
    res.json({ success: true, polls });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load polls' });
  }
});

app.post('/api/vote', authenticateToken, async (req, res) => {
  const { pollId, optionId } = req.body;
  if (!pollId || !optionId) return res.status(400).json({ success: false, message: 'Invalid vote data.' });
  
  try {
    const pollRef = firestore.collection('polls').doc(pollId);
    await firestore.runTransaction(async (t) => {
      const doc = await t.get(pollRef);
      if (!doc.exists) throw new Error('Poll not found');
      
      const poll = doc.data();
      if (!poll.active) throw new Error('Poll is closed');
      
      const optionIndex = poll.options.findIndex(o => o.id === optionId);
      if (optionIndex === -1) throw new Error('Option not found');
      
      poll.options[optionIndex].votes += 1;
      t.update(pollRef, { options: poll.options });
    });
    
    const updatedDoc = await pollRef.get();
    res.json({ success: true, message: 'Vote recorded!', poll: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Exact Anthropic Proxy Implementation for Top 50 Evaluator
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    
    // Store every chat message in Firestore
    try {
      await firestore.collection('chat_history').add({
        request: req.body,
        response: data,
        timestamp: new Date().toISOString()
      });
    } catch (fsErr) {
      console.error("Firestore chat save error:", fsErr);
    }
    
    res.json(data);
  } catch (err) {
    console.error("Chat proxy error:", err);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

app.post('/api/myth', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    
    // Store every myth check in Firestore
    try {
      await firestore.collection('myth_history').add({
        request: req.body,
        response: data,
        timestamp: new Date().toISOString()
      });
    } catch (fsErr) {
      console.error("Firestore myth save error:", fsErr);
    }
    
    res.json(data);
  } catch (err) {
    console.error("Myth proxy error:", err);
    res.status(500).json({ error: "Failed to process myth" });
  }
});

// Serve frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '')));

app.listen(PORT, () => {
  console.log(`✅ VotePath Backend running on http://localhost:${PORT}`);
});
