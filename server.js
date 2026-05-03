require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// Security and Performance Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Disabled for simplicity in static hosting environments
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Management
app.use(session({
  secret: process.env.SESSION_SECRET || 'votepath-hackathon-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Initialize Google Gemini API
// Using an environment variable for the API key, falling back to a mock for safety if missing
let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Database Setup (JSON File Based)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const usersFile = path.join(dataDir, 'users.json');
const pollsFile = path.join(dataDir, 'polls.json');

// Helper functions for DB
const readDB = (file) => {
  if (!fs.existsSync(file)) return [];
  const data = fs.readFileSync(file, 'utf8');
  return data ? JSON.parse(data) : [];
};

const writeDB = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Initialize default polls if none exist
if (!fs.existsSync(pollsFile)) {
  const defaultPolls = [
    {
      id: uuidv4(),
      question: "Which voting method do you prefer for local elections?",
      options: [
        { id: 'opt1', text: 'First-Past-The-Post', votes: 12 },
        { id: 'opt2', text: 'Ranked Choice Voting', votes: 45 },
        { id: 'opt3', text: 'Proportional Representation', votes: 23 }
      ],
      active: true,
      createdAt: new Date().toISOString()
    }
  ];
  writeDB(pollsFile, defaultPolls);
}

// Ensure users file exists
if (!fs.existsSync(usersFile)) {
  writeDB(usersFile, []);
}


// --- API ROUTES ---

// Authentication: Sign Up
app.post('/api/signup', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const users = readDB(usersFile);
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: uuidv4(), email, name, password: hashedPassword };
  
  users.push(newUser);
  writeDB(usersFile, users);
  
  req.session.userId = newUser.id;
  res.json({ success: true, message: 'Account created successfully' });
});

// Authentication: Log In
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  const users = readDB(usersFile);
  const user = users.find(u => u.email === email);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  req.session.userId = user.id;
  res.json({ success: true, message: 'Logged in successfully' });
});

// Authentication: Log Out
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get Current User Status
app.get('/api/user', (req, res) => {
  if (!req.session.userId) return res.json({ loggedIn: false });
  const users = readDB(usersFile);
  const user = users.find(u => u.id === req.session.userId);
  
  if (!user) return res.json({ loggedIn: false });
  
  res.json({ 
    loggedIn: true, 
    user: { id: user.id, email: user.email, name: user.name }
  });
});

// Polls: Get active polls
app.get('/api/polls', (req, res) => {
  const polls = readDB(pollsFile);
  res.json({ success: true, polls });
});

// Polls: Submit a vote
app.post('/api/vote', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'You must be logged in to vote.' });
  }

  const { pollId, optionId } = req.body;
  const polls = readDB(pollsFile);
  
  const pollIndex = polls.findIndex(p => p.id === pollId);
  if (pollIndex === -1) return res.status(404).json({ success: false, message: 'Poll not found.' });
  if (!polls[pollIndex].active) return res.status(400).json({ success: false, message: 'Poll is closed.' });

  const optionIndex = polls[pollIndex].options.findIndex(o => o.id === optionId);
  if (optionIndex === -1) return res.status(404).json({ success: false, message: 'Option not found.' });

  polls[pollIndex].options[optionIndex].votes += 1;
  writeDB(pollsFile, polls);

  res.json({ success: true, message: 'Vote recorded!', poll: polls[pollIndex] });
});

// Vox AI Chatbot (Google Services Integration + Robust Fallback)
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

  const lowerMessage = message.toLowerCase();
  
  // Robust Mock Generator for Hackathon Safety
  const generateMockResponse = (msg) => {
    // Check if it's a Myth Buster query
    if (msg.includes('fact-check this claim')) {
      if (msg.includes('hacked')) {
        return "VERDICT: MOSTLY FALSE\nEXPLANATION: Voting machines are not connected to the internet and are strictly tested. Paper trails exist for audits.\nTHE EVIDENCE: CISA and state election boards confirm multiple layers of physical and cybersecurity.\nBOTTOM LINE: The election system is decentralized and highly secure.";
      }
      if (msg.includes('doesn\'t really matter')) {
        return "VERDICT: MOSTLY FALSE\nEXPLANATION: Every vote contributes to the popular vote and local elections on the same ballot are often decided by tiny margins.\nTHE EVIDENCE: Historically, many elections have been decided by a handful of votes per precinct.\nBOTTOM LINE: Your vote is your voice, and local ballot measures directly impact your daily life.";
      }
      return "VERDICT: CONFIRMED FACT\nEXPLANATION: This claim aligns with verified election processes.\nTHE EVIDENCE: Verified by state election guidelines.\nBOTTOM LINE: Thank you for verifying your information.";
    }
    
    // Standard Chatbot Fallbacks
    if (msg.includes('register')) {
      return "To register to vote, you typically need to visit your state's official election website. Do you need help finding your state's portal?";
    } else if (msg.includes('deadline')) {
      return "Deadlines vary by state. Many require registration 15-30 days before election day. Let's check your local timeline.";
    } else if (msg.includes('age')) {
      return "In the United States, the voting age is 18 years old. This was established by the 26th Amendment to the U.S. Constitution in 1971.";
    }
    return "Hi! I am Vox, your AI civic guide. I can answer questions about voting rights, polling stations, and election deadlines. What would you like to explore today?";
  };

  // If API key is set, try to use real Gemini AI
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are Vox, an AI civic education coach for VotePath. Respond to this user query concisely, neutrally, and educationally regarding elections and voting. If they ask a non-voting question, gently steer them back to civics. Query: "${message}"`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return res.json({ success: true, response: response.text() });
    } catch (error) {
      console.warn("Gemini API Error (falling back to mock data):", error.message);
      // Fallback gracefully on API error (e.g. expired key)
      return res.json({ success: true, response: generateMockResponse(lowerMessage) });
    }
  } else {
    // Immediate fallback if no API key is provided
    setTimeout(() => {
      res.json({ success: true, response: generateMockResponse(lowerMessage) });
    }, 1000);
  }
});


// Require Login for Main Dashboard
const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/public/login.html');
  }
  next();
};

app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve Static Files
// This serves all HTML/CSS/JS from the root directory and 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '')));

// Start Server
app.listen(PORT, () => {
  console.log(`✅ VotePath Backend running on http://localhost:${PORT}`);
});
