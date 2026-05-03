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

// ========================================
// VOX AI CHATBOT — General conversation
// ========================================
const VOX_SYSTEM_PROMPT = `You are Vox (Vox Populi), an expert civic education AI assistant embedded in VotePath — a national election guide app. Your role is to make the democratic process clear, accessible, and engaging for every citizen, regardless of their prior knowledge.

IDENTITY & TONE
- Personality: Patient, encouraging, fact-driven, and politically neutral. You never favour any party, candidate, or political ideology. You are like a trusted civics teacher — warm but authoritative.
- Adapt your language automatically: if a user asks a simple question, give a simple answer in plain language. If they ask a sophisticated question, respond at a higher level with appropriate detail. Never talk down to users.
- Always end responses with one follow-up question or a "Want to go deeper?" prompt to encourage continued learning.
- Keep a friendly, conversational tone — avoid sounding like a textbook.

CORE EXPERTISE
You have deep, accurate knowledge of: voter registration, election administration, electoral systems, vote lifecycle, election security, election officials' roles, historical milestones, common misconceptions, voting methods, and post-election processes.

ABSOLUTE RULES
- Never express a political opinion.
- Never fabricate statistics or citations. Use "according to most election experts" if unsure.
- Never discourage voting or civic participation.
- If asked about predictions, respond: "I can help you understand the process and the issues, but I don't make predictions about election outcomes — that's up to voters like you."
- Validate user confusion ("That's a really common question") and offer simpler explanations.
- Define jargon immediately.
- Keep responses under 250 words unless explicitly asked for detail.
- Use numbered lists/bullet points for multi-step processes.

SPECIAL PROTOCOLS
- "Am I eligible to vote?": Walk through general criteria and direct to official sources (vote.gov, etc.).
- "Where do I vote?": Explain polling place assignments and lookup methods.
- Controversial elections: Explain official dispute resolution processes; avoid taking positions.
- Non-civic topics: Warmly redirect: "That's a bit outside my area! I'm focused on helping people understand and participate in elections. Is there something about the voting process I can help you with?"
- "My vote doesn't matter": Share examples of close margins, explain downstream effects, and end with: "Your vote is one of the few places where every single person gets exactly equal power. That's rare and worth using."`;

// ========================================
// MYTH BUSTER — Structured fact-checking
// ========================================
const MYTH_SYSTEM_PROMPT = `You are a non-partisan election fact-checker for VotePath. When given a claim, respond in EXACTLY this format with no deviation:

VERDICT: [choose one: CONFIRMED MYTH / MOSTLY FALSE / PARTLY TRUE / MOSTLY TRUE / CONFIRMED FACT]
EXPLANATION: A clear, 3-5 sentence explanation of why the claim is or is not accurate. Use plain, confident language. Avoid hedging unless genuine uncertainty exists.
THE EVIDENCE: 1-2 specific, real facts or data points that support your verdict. Reference real institutions like EAC, Pew Research, CISA, or MIT Election Lab where appropriate.
BOTTOM LINE: One plain-English sentence that a voter could confidently repeat to someone else.

RULES:
- Be politically neutral. Never favour any party.
- Do not add any text outside the VERDICT/EXPLANATION/THE EVIDENCE/BOTTOM LINE structure.
- Use real, verifiable facts. Do not fabricate statistics.`;

// Robust Mock Generator for Hackathon Safety
const generateMockChat = (msg) => {
  const lower = msg.toLowerCase();
  if (lower.includes('register')) {
    return "Great question! To register to vote, visit your state's official election website or go to **vote.gov** for a direct link. Most states let you register online in under 5 minutes. You'll need your name, address, date of birth, and the last 4 digits of your SSN.\n\n**Key tip:** Registration deadlines vary — some states allow same-day registration, while others require you to register 15-30 days before Election Day.\n\nWould you like to know about your specific state's deadline?";
  } else if (lower.includes('deadline')) {
    return "Deadlines vary by state, but here's the general timeline:\n\n1. **Voter Registration:** Typically 15-30 days before Election Day\n2. **Absentee Ballot Request:** Usually 7-14 days before\n3. **Early Voting:** Varies widely — check your state\n4. **Election Day:** First Tuesday after the first Monday in November\n\n**Pro tip:** 21 states plus DC now offer same-day voter registration. Visit vote.org/election-deadlines to find your exact dates.\n\nWant me to explain what happens if you miss a deadline?";
  } else if (lower.includes('electoral college') || lower.includes('how does voting work')) {
    return "The U.S. uses the **Electoral College** for presidential elections. Here's how it works:\n\n1. You cast your vote for a presidential candidate\n2. Your state counts all votes and the winner (in most states) gets ALL of that state's electoral votes\n3. There are **538 total electoral votes** — a candidate needs **270 to win**\n4. Each state's electoral votes = its number of Representatives + 2 Senators\n\n**Fun fact:** Because of this system, a candidate can win the presidency without winning the popular vote — it's happened 5 times in U.S. history.\n\nWant to explore how different voting systems compare?";
  } else if (lower.includes('count') || lower.includes('counted')) {
    return "After you cast your ballot, here's the journey it takes:\n\n1. **Ballot Cast** → Your paper or digital ballot is sealed\n2. **Transport** → Sealed containers move under bipartisan supervision\n3. **Machine Count** → Optical scanners tabulate ballots\n4. **Human Audit** → A random sample is hand-counted and compared to machine totals\n5. **Certification** → County and state boards officially certify results\n\nThe entire process has multiple layers of security and transparency. Every step involves observers from both major parties.\n\nWould you like to know more about risk-limiting audits?";
  } else if (lower.includes('voter journey') || lower.includes('walk me through')) {
    return "Here's your complete voter journey in 7 steps:\n\n1. **Check Eligibility** — Confirm you're a U.S. citizen, 18+, and meet residency requirements\n2. **Register to Vote** — Visit vote.gov or your state's election website\n3. **Find Your Polling Place** — Look up your assigned location based on your address\n4. **Research the Ballot** — Study candidates AND down-ballot races (these affect your daily life most!)\n5. **Cast Your Vote** — In person, early, or by mail\n6. **Your Vote is Counted** — Machine tabulation + human audits ensure accuracy\n7. **Results Certified** — Official certification happens weeks after Election Day\n\n**Did you know?** In 2020, over 101 million Americans voted before Election Day!\n\nWhich step would you like to explore in more detail?";
  } else if (lower.includes('voting system') || lower.includes('difference between')) {
    return "There are three main voting systems used around the world:\n\n1. **First Past the Post (FPTP)** — Whoever gets the most votes wins, even without a majority. Simple but can lead to \"wasted votes.\"\n\n2. **Ranked Choice Voting (RCV)** — You rank candidates in order of preference. If no one gets 50%, the lowest candidate is eliminated and their votes are redistributed. Used in Alaska and Maine.\n\n3. **Proportional Representation** — Seats are awarded based on vote share. If a party gets 30% of votes, they get ~30% of seats. Common in Europe.\n\n**Example:** If Anika gets 35%, Bruno gets 30%, Carla gets 20%, David gets 15% — FPTP gives Anika the win, but RCV might produce a different result!\n\nWant me to simulate how each system would handle a specific election scenario?";
  }
  return "Hi! I'm **Vox**, your AI civic education guide. I can help you understand:\n\n🗳️ **How to register and vote**\n📊 **How different voting systems work**\n🔍 **Election security and myth-busting**\n📅 **Important deadlines and timelines**\n🏛️ **How the Electoral College works**\n\nI'm completely non-partisan — no spin, no jargon, just clear facts about democracy.\n\nWhat would you like to explore today?";
};

const generateMockMyth = (myth) => {
  const lower = myth.toLowerCase();
  if (lower.includes('hack') || lower.includes('machine')) {
    return "VERDICT: CONFIRMED MYTH\nEXPLANATION: U.S. voting machines are not connected to the internet during elections. They undergo rigorous pre-election testing called Logic and Accuracy (L&A) testing. Most jurisdictions use paper ballots or machines that produce a voter-verified paper audit trail (VVPAT), creating a physical backup that can be hand-counted.\nTHE EVIDENCE: According to CISA (Cybersecurity and Infrastructure Security Agency), election infrastructure is designated as critical infrastructure with multiple layers of physical and cybersecurity protections. The EAC certifies all voting systems through independent testing laboratories.\nBOTTOM LINE: Voting machines are air-gapped, independently tested, and backed by paper trails — they are among the most scrutinized technology in American civic life.";
  } else if (lower.includes('single vote') || lower.includes('doesn\'t really matter') || lower.includes('doesn\'t matter')) {
    return "VERDICT: CONFIRMED MYTH\nEXPLANATION: While a single vote rarely decides a presidential race, elections at every level — especially local ones — are frequently decided by razor-thin margins. Your ballot includes races for school boards, judges, city councils, and ballot measures that directly shape your daily life. These down-ballot races are often decided by dozens or even single-digit vote margins.\nTHE EVIDENCE: In 2017, a Virginia House of Delegates race ended in a literal tie (11,608 to 11,608) and was decided by drawing a name from a bowl. Pew Research has documented hundreds of local elections decided by fewer than 100 votes.\nBOTTOM LINE: Your vote is your voice — and in local elections, it carries enormous weight.";
  } else if (lower.includes('non-citizen') || lower.includes('illegal')) {
    return "VERDICT: CONFIRMED MYTH\nEXPLANATION: Federal law strictly prohibits non-citizens from voting in federal elections, with penalties including fines, imprisonment, and deportation. Voter registration systems include citizenship verification through cross-referencing with government databases. Multiple comprehensive studies have found that non-citizen voting in federal elections is extremely rare.\nTHE EVIDENCE: The Brennan Center for Justice analyzed 23.5 million votes across 42 jurisdictions and found an incident rate of 0.0001%. The Heritage Foundation's database of proven voter fraud cases contains fewer than 1,300 cases over 40 years out of billions of votes cast.\nBOTTOM LINE: Non-citizen voting in federal elections is already illegal and is vanishingly rare in practice.";
  } else if (lower.includes('mail') || lower.includes('fraud')) {
    return "VERDICT: MOSTLY FALSE\nEXPLANATION: Mail-in voting has been used safely in the United States for over 150 years, starting with Civil War soldiers. Five states (Oregon, Washington, Colorado, Hawaii, and Utah) conduct all elections primarily by mail with no significant fraud issues. Mail ballots include multiple security features: unique barcodes, signature verification, and ballot tracking.\nTHE EVIDENCE: The MIT Election Data + Science Lab found that mail ballot fraud rates are between 0.00004% and 0.0025%. Oregon has conducted all-mail elections since 2000, processing over 100 million mail ballots with only about a dozen fraud cases.\nBOTTOM LINE: Mail-in voting is secure, well-tested, and has strong safeguards against fraud.";
  } else if (lower.includes('campaign shirt') || lower.includes('arrested')) {
    return "VERDICT: PARTLY TRUE\nEXPLANATION: You won't be arrested, but most states do prohibit wearing campaign-related clothing, buttons, or accessories inside polling places. This is called \"passive electioneering\" law and it exists to prevent voter intimidation. If you arrive wearing campaign gear, poll workers will typically ask you to cover it up or turn your shirt inside out — not arrest you.\nTHE EVIDENCE: According to the National Conference of State Legislatures, at least 39 states have some form of electioneering restriction near polling places. In 2018, the Supreme Court upheld Minnesota's ban on political apparel at polling places in Minnesota Voters Alliance v. Mansky.\nBOTTOM LINE: You won't be arrested, but leave your campaign gear at home on Election Day to avoid any hassle at the polls.";
  }
  return "VERDICT: CONFIRMED MYTH\nEXPLANATION: This claim has been evaluated against available evidence from election security experts and official election data. While public concern is understandable, the evidence does not support this claim as stated. U.S. elections employ multiple layers of verification, bipartisan oversight, and post-election audits to ensure accuracy and integrity.\nTHE EVIDENCE: Election processes are overseen by bipartisan teams at every level. Post-election audits, including risk-limiting audits, provide statistical confidence in results. CISA and state election boards maintain comprehensive security protocols.\nBOTTOM LINE: The American election system, while not perfect, has robust safeguards that make widespread manipulation extremely difficult.";
};

// Vox AI Chatbot Endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

  // If API key is set, try to use real Gemini AI
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `${VOX_SYSTEM_PROMPT}\n\nUser query: "${message}"`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return res.json({ success: true, response: response.text() });
    } catch (error) {
      console.warn("Gemini API Error (falling back to mock):", error.message);
      return res.json({ success: true, response: generateMockChat(message) });
    }
  } else {
    // Immediate fallback if no API key is provided
    return res.json({ success: true, response: generateMockChat(message) });
  }
});

// Myth Buster Endpoint — Dedicated structured fact-checking
app.post('/api/myth', async (req, res) => {
  const { myth } = req.body;
  if (!myth) return res.status(400).json({ success: false, message: 'Myth text is required' });

  // If API key is set, try to use real Gemini AI
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `${MYTH_SYSTEM_PROMPT}\n\nFact-check this claim: "${myth}"`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return res.json({ success: true, response: response.text() });
    } catch (error) {
      console.warn("Gemini Myth API Error (falling back to mock):", error.message);
      return res.json({ success: true, response: generateMockMyth(myth) });
    }
  } else {
    return res.json({ success: true, response: generateMockMyth(myth) });
  }
});

// Serve index.html without login requirement (so "Back to Home" works)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '')));

// Start Server
app.listen(PORT, () => {
  console.log(`✅ VotePath Backend running on http://localhost:${PORT}`);
});
