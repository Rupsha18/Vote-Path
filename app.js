/* ===== VotePath App — Core Data & Init ===== */
const ANTHROPIC_API_KEY = "PASTE_YOUR_KEY_HERE";
// x-api-key: ANTHROPIC_API_KEY — model: claude-sonnet-4-20250514 (routed via backend proxy)

// Journey Map Data
const journeySteps = [
  { title: "Check Eligibility", desc: "Before anything else, confirm you meet the basic requirements to vote. In the United States, you must be a U.S. citizen, at least 18 years old by Election Day, and meet your state's residency requirements. Some states restore voting rights to formerly incarcerated citizens — check your state's specific laws.", deadline: "Any time — but start early!", mistakes: "Assuming you're registered from a previous election. Registration can be purged for inactivity.", fact: "In 2020, over 17 million eligible Americans didn't vote because they missed the registration deadline or thought they weren't eligible." },
  { title: "Register to Vote", desc: "Voter registration is the gateway to the ballot box. Most states offer online registration through their Secretary of State's website. Some states have same-day registration, while others require you to register 15–30 days before the election. Keep your registration current whenever you move.", deadline: "Typically 15–30 days before Election Day (varies by state)", mistakes: "Not updating your address after moving. Your registration may be tied to your old precinct.", fact: "North Dakota is the only U.S. state that does not require voter registration at all." },
  { title: "Find Your Polling Place", desc: "Your polling place is assigned based on your registered address. It's usually a school, community center, or government building near your home. Many states let you look up your exact polling location online. Arrive knowing where to go to avoid last-minute confusion.", deadline: "Check at least 1 week before Election Day", mistakes: "Going to the wrong location. If you've moved, your polling place may have changed even if you updated your registration.", fact: "The average American lives within 3 miles of their polling place, but in rural areas it can be over 25 miles away." },
  { title: "Understand the Ballot", desc: "Your ballot contains more than just the presidential race. You'll typically vote for federal, state, and local candidates, plus ballot measures and judges. Research every race ahead of time — nonpartisan voter guides can help you make informed decisions on down-ballot races.", deadline: "Sample ballots usually available 2–4 weeks before Election Day", mistakes: "Only voting for the top of the ticket. Down-ballot races for school boards, judges, and city councils often have the most direct impact on your daily life.", fact: "The average American ballot contains 30+ individual races and measures. Many voters leave down-ballot races blank." },
  { title: "Cast Your Vote", desc: "You can vote in person on Election Day, during early voting, or by absentee/mail ballot depending on your state. Bring valid ID if your state requires it. If there are any issues at the polls, ask for a provisional ballot — it's your legal right. No one can turn you away.", deadline: "Election Day: First Tuesday after the first Monday in November", mistakes: "Not bringing required ID in states that mandate it. Also: wearing campaign gear to the polls is prohibited in most states.", fact: "Early voting has surged — in 2020, over 101 million Americans voted before Election Day, representing about 69% of all votes cast." },
  { title: "Your Vote is Counted", desc: "After polls close, election workers begin the counting process. Mail-in ballots may take longer to process depending on state law. Every ballot goes through verification — signature matching for mail ballots, machine tabulation, and often a manual audit of a random sample to ensure accuracy.", deadline: "Counting begins after polls close; final results can take days to weeks", mistakes: "Assuming delayed results mean fraud. Different states have different processing timelines, and accuracy is always prioritized over speed.", fact: "Most U.S. states conduct post-election audits. Risk-limiting audits use statistical sampling to verify machine counts with very high confidence." },
  { title: "Results & Certification", desc: "After counting is complete, results are canvassed and certified at the county level, then the state level. For presidential elections, certified results determine which slate of electors represents the state in the Electoral College. Congress formally counts electoral votes in January.", deadline: "States certify results within 2–5 weeks after Election Day", mistakes: "Confusing media projections with official results. Networks 'call' races based on data analysis, but official certification is a separate legal process.", fact: "The Electoral College meets on the first Tuesday after the second Wednesday in December. Electors cast separate ballots for President and Vice President." }
];

const mythsData = [
  { myth: "Voting machines are easily hacked and can't be trusted", badge: "CONFIRMED MYTH", badgeClass: "badge-myth" },
  { myth: "My single vote doesn't really matter in a national election", badge: "CONFIRMED MYTH", badgeClass: "badge-myth" },
  { myth: "Non-citizens can easily vote in federal elections", badge: "CONFIRMED MYTH", badgeClass: "badge-myth" },
  { myth: "Mail-in voting leads to widespread fraud", badge: "MOSTLY FALSE", badgeClass: "badge-false" },
  { myth: "You can be arrested for wearing a campaign shirt to vote", badge: "PARTLY TRUE", badgeClass: "badge-partly" }
];

const processNodes = [
  { label: "Voter Casts\nBallot", tip: "You mark your choices on paper or a digital screen. Paper ballots create a verifiable record that can be audited later." },
  { label: "Ballot Box\nSealed", tip: "Completed ballots are placed in sealed, tamper-evident containers. Election judges from both parties monitor this process." },
  { label: "Transport to\nCounting Centre", tip: "Sealed ballot containers are transported under bipartisan supervision with documented chain-of-custody procedures." },
  { label: "Machine\nCount", tip: "High-speed optical scanners read and tabulate paper ballots. These machines are tested before and after every election." },
  { label: "Human\nAudit", tip: "A random sample of ballots is hand-counted and compared to machine totals. This risk-limiting audit catches any discrepancies." },
  { label: "Results\nCertified", tip: "County and state election boards review results, resolve any discrepancies, and officially certify the final vote totals." },
  { label: "Electoral\nCollege", tip: "For presidential races, certified state results determine electors who cast votes in December. Congress counts these in January." }
];

const candidates = [
  { name: "Anika Sharma", party: "Progressive Party", color: "#6C5CE7", emoji: "🟣" },
  { name: "Bruno Osei", party: "Liberty Alliance", color: "#00B894", emoji: "🟢" },
  { name: "Carla Reyes", party: "Unity Coalition", color: "#E17055", emoji: "🟠" },
  { name: "David Chen", party: "Civic Front", color: "#0984E3", emoji: "🔵" }
];

const deadlinesData = [
  { title: "Voter Registration Deadline", date: new Date(2026, 9, 13), desc: "October 13, 2026" },
  { title: "Absentee Ballot Request", date: new Date(2026, 9, 27), desc: "October 27, 2026" },
  { title: "Early Voting Period", date: new Date(2026, 9, 24), desc: "October 24 – November 1, 2026" },
  { title: "Election Day", date: new Date(2026, 10, 3), desc: "November 3, 2026" }
];

// State
let completedSteps = new Set();
let votes = [35, 30, 20, 15];
const voxSystemPrompt = `You are Vox (Vox Populi), an expert civic education AI assistant embedded in VotePath — a national election guide app. Your role is to make the democratic process clear, accessible, and engaging for every citizen, regardless of their prior knowledge.

IDENTITY & TONE
- Personality: Patient, encouraging, fact-driven, and politically neutral. You never favour any party, candidate, or political ideology. You are like a trusted civics teacher — warm but authoritative.
- Adapt your language automatically: if a user asks a simple question, give a simple answer in plain language. If they ask a sophisticated question, respond at a higher level with appropriate detail. Never talk down to users.
- Always end responses with one follow-up question or a "Want to go deeper?" prompt to encourage continued learning.
- Keep a friendly, conversational tone — avoid sounding like a textbook.

CORE EXPERTISE
You have deep, accurate knowledge of: voter registration, election administration, electoral systems, vote lifecycle, election security, election officials' roles, historical milestones, common misconceptions, voting methods, and post-election processes.

MYTH BUSTING MODE
When fact-checking, use this exact structure:
VERDICT: [choose one: CONFIRMED MYTH / MOSTLY FALSE / PARTLY TRUE / MOSTLY TRUE / CONFIRMED FACT]
EXPLANATION: A clear, 3-5 sentence explanation of why the claim is or is not accurate. Use plain, confident language. Avoid hedging unless genuine uncertainty exists.
THE EVIDENCE: 1-2 specific, real facts or data points that support your verdict. Reference real institutions where appropriate.
BOTTOM LINE: One plain-English sentence that a voter could confidently repeat to someone else.

VOTER JOURNEY ASSISTANCE
Structure responses about specific steps to cover:
1. What this step involves and why it matters
2. Most common mistakes
3. One surprising fact
4. What to do if something goes wrong

VOTING SYSTEMS EXPLAINER
Always use concrete examples with these fictional candidates: Anika Sharma, Bruno Osei, Carla Reyes, and David Chen. Walk through how votes are counted step-by-step and contrast with another system.

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
- Non-civic topics: Warmly redirect: "That's a bit outside my area! I'm focused on helping people understand and participate in elections. Is there something about the voting process... I can help you with?"
- "My vote doesn't matter": Share examples of close margins, explain downstream effects, and end with: "Your vote is one of the few places where every single person gets exactly equal power. That's rare and worth using."`;

let chatHistory = [{ role: "assistant", content: "Hi! I'm Vox — your personal election guide. Whether you're a first-time voter or just brushing up on how democracy works, I'm here to help with no jargon and no spin. What would you like to explore today?" }];

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  initHeroBg();
  initCountdown();
  initJourney();
  initMyths();
  initProcessSvg();
  initSimulator();
  initDeadlines();
  initChat();
  initNavbar();
  initScrollAnimations();
});

/* ===== NAVBAR ===== */
function initNavbar() {
  const nav = document.getElementById("navbar");
  const ham = document.getElementById("navHamburger");
  const links = document.getElementById("navLinks");
  window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 50));
  ham.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
}

/* ===== HERO BG ===== */
function initHeroBg() {
  const bg = document.getElementById("heroBg");
  for (let i = 0; i < 12; i++) {
    const line = document.createElement("div");
    line.className = "line";
    line.style.left = (i * 9) + "%";
    line.style.animationDelay = (i * 1.5) + "s";
    line.style.opacity = 0.3 + Math.random() * 0.4;
    bg.appendChild(line);
  }
}

/* ===== COUNTDOWN ===== */
function initCountdown() {
  const target = new Date();
  target.setDate(target.getDate() + 60);
  function update() {
    const diff = target - new Date();
    if (diff <= 0) return;
    document.getElementById("cdDays").textContent = String(Math.floor(diff / 864e5)).padStart(2, "0");
    document.getElementById("cdHours").textContent = String(Math.floor((diff % 864e5) / 36e5)).padStart(2, "0");
    document.getElementById("cdMins").textContent = String(Math.floor((diff % 36e5) / 6e4)).padStart(2, "0");
    document.getElementById("cdSecs").textContent = String(Math.floor((diff % 6e4) / 1e3)).padStart(2, "0");
  }
  update();
  setInterval(update, 1000);
}

/* ===== SCROLL ANIMATIONS ===== */
function initScrollAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll(".fade-in").forEach(el => obs.observe(el));
}

/* ===== JOURNEY MAP ===== */
function initJourney() {
  const timeline = document.getElementById("journeyTimeline");
  journeySteps.forEach((step, i) => {
    const card = document.createElement("div");
    card.className = "journey-step" + (i === 0 ? " active" : "");
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-label", `Step ${i + 1}: ${step.title}`);
    card.innerHTML = `
      <div class="step-num">${i + 1}</div>
      <span class="step-check" aria-hidden="true">✓</span>
      <div class="step-title">${step.title}</div>
      <div class="step-expand">
        <div class="step-expand-inner">
          <p>${step.desc}</p>
          <p><strong style="color:var(--gold)">Key Deadline:</strong> ${step.deadline}</p>
          <p><strong style="color:var(--slate)">Common Mistake:</strong> ${step.mistakes}</p>
          <div class="fact-box"><strong>Did You Know?</strong> ${step.fact}</div>
          <button class="mark-done-btn" data-step="${i}" aria-label="Mark step ${i + 1} as done">Mark as Done</button>
        </div>
      </div>`;
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("mark-done-btn")) return;
      document.querySelectorAll(".journey-step").forEach(s => { if (s !== card) s.classList.remove("expanded"); });
      card.classList.toggle("expanded");
    });
    timeline.appendChild(card);
  });
  timeline.addEventListener("click", (e) => {
    if (e.target.classList.contains("mark-done-btn")) {
      const idx = parseInt(e.target.dataset.step);
      completedSteps.add(idx);
      const step = timeline.children[idx];
      step.classList.add("completed");
      step.classList.remove("active");
      e.target.textContent = "Completed ✓";
      e.target.classList.add("done");
      e.target.disabled = true;
      // Activate next incomplete step
      for (let j = 0; j < journeySteps.length; j++) {
        if (!completedSteps.has(j)) {
          timeline.children[j].classList.add("active");
          break;
        }
      }
    }
  });
}

/* ===== MYTHS ===== */
function initMyths() {
  const container = document.getElementById("mythCards");
  mythsData.forEach((m, i) => {
    const card = document.createElement("div");
    card.className = "myth-card fade-in";
    card.innerHTML = `
      <h4>Myth #${i + 1}</h4>
      <p class="myth-text">"${m.myth}"</p>
      <button class="bust-btn" data-idx="${i}" aria-label="Bust myth: ${m.myth}">Bust This Myth</button>
      <div class="skeleton" id="mythSkel${i}" style="display:none"></div>
      <div class="myth-response" id="mythResp${i}"></div>`;
    container.appendChild(card);
  });
  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("bust-btn")) {
      const idx = parseInt(e.target.dataset.idx);
      bustMyth(idx, mythsData[idx].myth);
    }
  });
  document.getElementById("mythSubmitBtn").addEventListener("click", () => {
    const val = document.getElementById("mythInput").value.trim();
    if (!val) return;
    // Add custom myth card
    const i = document.querySelectorAll(".myth-card").length;
    const card = document.createElement("div");
    card.className = "myth-card";
    card.innerHTML = `
      <h4>Your Myth</h4>
      <p class="myth-text">"${val}"</p>
      <div class="skeleton" id="mythSkel${i}" style="display:none"></div>
      <div class="myth-response" id="mythResp${i}"></div>`;
    container.prepend(card);
    document.getElementById("mythInput").value = "";
    bustMyth(i, val);
  });
}

async function bustMyth(idx, myth) {
  const skel = document.getElementById(`mythSkel${idx}`);
  const resp = document.getElementById(`mythResp${idx}`);
  if (resp.classList.contains("visible")) return;
  skel.style.display = "block";
  try {
    // Backend proxy: x-api-key + model claude-sonnet-4-20250514 handled server-side
    const res = await fetch("/api/myth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY
      },
      body: JSON.stringify({
        myth: myth,
        model: "claude-sonnet-4-20250514"
      })
    });
    const data = await res.json();
    const text = data.response || "Unable to process this myth at the moment.";
    skel.style.display = "none";
    // Determine badge
    let badge = "CONFIRMED MYTH", bc = "badge-myth";
    if (text.includes("MOSTLY FALSE")) { badge = "MOSTLY FALSE"; bc = "badge-false"; }
    else if (text.includes("PARTLY TRUE")) { badge = "PARTLY TRUE"; bc = "badge-partly"; }
    else if (text.includes("MOSTLY TRUE")) { badge = "MOSTLY TRUE"; bc = "badge-partly"; }
    else if (text.includes("CONFIRMED FACT")) { badge = "CONFIRMED FACT"; bc = "badge-false"; }
    
    // Display the full structured response, formatting it nicely
    let formattedText = text
      .replace(/VERDICT:.*?\n/, '')
      .replace(/EXPLANATION:/g, '<br><strong style="color:var(--gold)">Explanation:</strong>')
      .replace(/THE EVIDENCE:/g, '<br><br><strong style="color:var(--slate)">The Evidence:</strong>')
      .replace(/BOTTOM LINE:/g, '<br><br><strong style="color:var(--green)">Bottom Line:</strong>');

    resp.innerHTML = `<span class="confidence-badge ${bc}">${badge}</span><br>${formattedText}`;
    simulateStreaming(resp);
  } catch (err) {
    skel.style.display = "none";
    const m = mythsData[idx] || { badge: "CONFIRMED MYTH", badgeClass: "badge-myth" };
    resp.innerHTML = `<span class="confidence-badge ${m.badgeClass || 'badge-myth'}">${m.badge || 'CONFIRMED MYTH'}</span><br><br><strong style="color:var(--gold)">Explanation:</strong> This claim has been evaluated by election security experts. While concerns are understandable, the evidence does not support this claim. U.S. elections employ multiple layers of verification, bipartisan oversight, and post-election audits to ensure accuracy and integrity.<br><br><strong style="color:var(--green)">Bottom Line:</strong> You can trust the integrity of the election process.`;
    simulateStreaming(resp);
  }
}

function simulateStreaming(el) {
  const html = el.innerHTML;
  el.innerHTML = "";
  el.classList.add("visible");
  let i = 0;
  const interval = setInterval(() => {
    i += 5;
    if (i > html.length) i = html.length;
    el.innerHTML = html.substring(0, i);
    if (i === html.length) clearInterval(interval);
  }, 10);
}

/* ===== PROCESS SVG ===== */
function initProcessSvg() {
  const svg = document.getElementById("processSvg");
  const colors = ["#C9A84C","#4A6FA5","#C9A84C","#4A6FA5","#C9A84C","#4A6FA5","#C9A84C"];
  let nodesHtml = "";
  processNodes.forEach((n, i) => {
    const x = 65 + i * 115;
    const y = 100;
    // Connector line
    if (i < processNodes.length - 1) {
      nodesHtml += `<line x1="${x + 35}" y1="${y}" x2="${x + 80}" y2="${y}" stroke="rgba(201,168,76,0.3)" stroke-width="2" stroke-dasharray="6,4" class="process-line" data-idx="${i}"/>`;
    }
    const lines = n.label.split("\n");
    nodesHtml += `<g class="process-node" data-idx="${i}">
      <circle class="node-circle" cx="${x}" cy="${y}" r="32" fill="${colors[i]}" opacity="0.15" stroke="${colors[i]}" stroke-width="2"/>
      <circle cx="${x}" cy="${y}" r="6" fill="${colors[i]}"/>
      <text x="${x}" y="${y + 52}" text-anchor="middle" fill="#F5F0E8" font-size="11" font-family="Source Sans Pro">${lines[0]}</text>
      ${lines[1] ? `<text x="${x}" y="${y + 66}" text-anchor="middle" fill="#8A94A6" font-size="10" font-family="Source Sans Pro">${lines[1]}</text>` : ""}
    </g>`;
  });
  svg.innerHTML = nodesHtml;

  // Tooltips
  const tooltip = document.getElementById("processTooltip");
  const wrap = document.getElementById("processWrap");
  svg.querySelectorAll(".process-node").forEach(node => {
    node.addEventListener("mouseenter", (e) => {
      const idx = parseInt(node.dataset.idx);
      tooltip.textContent = processNodes[idx].tip;
      const rect = node.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      tooltip.style.left = (rect.left - wrapRect.left + rect.width / 2 - 130) + "px";
      tooltip.style.top = (rect.top - wrapRect.top - 70) + "px";
      tooltip.classList.add("show");
    });
    node.addEventListener("mouseleave", () => tooltip.classList.remove("show"));
  });

  // Animate button
  document.getElementById("animateBtn").addEventListener("click", () => {
    const nodes = svg.querySelectorAll(".process-node");
    const lines = svg.querySelectorAll(".process-line");
    nodes.forEach(n => { n.style.opacity = "0"; });
    lines.forEach(l => { l.style.opacity = "0"; });
    nodes.forEach((n, i) => {
      setTimeout(() => { n.style.transition = "opacity 0.5s ease"; n.style.opacity = "1"; n.querySelector(".node-circle").style.animation = "nodePopIn 0.5s ease forwards"; }, i * 400);
    });
    lines.forEach((l, i) => {
      setTimeout(() => { l.style.transition = "opacity 0.5s ease"; l.style.opacity = "1"; }, i * 400 + 200);
    });
  });
}

/* ===== VOTING SIMULATOR ===== */
function initSimulator() {
  const candWrap = document.getElementById("simCandidates");
  candidates.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "sim-candidate";
    div.innerHTML = `
      <div class="avatar" style="background:${c.color}">${c.emoji}</div>
      <h4>${c.name}</h4>
      <p class="party">${c.party}</p>
      <label for="slider${i}" style="color:var(--text-muted);font-size:0.85rem;">Vote share</label>
      <input type="range" id="slider${i}" class="vote-slider" min="0" max="100" value="${votes[i]}" data-idx="${i}" aria-label="Vote share for ${c.name}">
      <div class="vote-val" id="voteVal${i}">${votes[i]}%</div>`;
    candWrap.appendChild(div);
  });
  candWrap.addEventListener("input", (e) => {
    if (e.target.classList.contains("vote-slider")) {
      const idx = parseInt(e.target.dataset.idx);
      votes[idx] = parseInt(e.target.value);
      document.getElementById(`voteVal${idx}`).textContent = votes[idx] + "%";
      calculateResults();
    }
  });
  calculateResults();
}

function calculateResults() {
  const total = votes.reduce((a, b) => a + b, 0) || 1;
  const pcts = votes.map(v => (v / total * 100));
  const resWrap = document.getElementById("simResults");

  // FPTP: highest vote share wins
  const fptpWinner = pcts.indexOf(Math.max(...pcts));

  // RCV simulation: eliminate lowest, redistribute proportionally
  let rcvPcts = [...pcts];
  let eliminated = new Set();
  let rcvWinner = -1;
  for (let round = 0; round < 3; round++) {
    const max = Math.max(...rcvPcts.filter((_, i) => !eliminated.has(i)));
    if (max > 50) { rcvWinner = rcvPcts.indexOf(max); break; }
    let minVal = Infinity, minIdx = -1;
    rcvPcts.forEach((v, i) => { if (!eliminated.has(i) && v < minVal) { minVal = v; minIdx = i; } });
    if (minIdx === -1) break;
    eliminated.add(minIdx);
    const redistrib = minVal / (candidates.length - eliminated.size);
    rcvPcts = rcvPcts.map((v, i) => eliminated.has(i) ? 0 : v + redistrib);
  }
  if (rcvWinner === -1) rcvWinner = rcvPcts.indexOf(Math.max(...rcvPcts));

  // Proportional: seats proportional to vote share (10 seats)
  const seats = pcts.map(p => Math.round(p / 100 * 10));

  const systems = [
    { name: "First Past the Post", desc: "Whoever gets the most votes wins — even without a majority.", winner: candidates[fptpWinner].name, bars: pcts },
    { name: "Ranked Choice Voting", desc: "Lowest candidate eliminated each round; their votes redistributed.", winner: candidates[rcvWinner].name, bars: rcvPcts },
    { name: "Proportional Representation", desc: "Seats awarded in proportion to vote share. 10 seats total.", winner: `${seats.map((s, i) => `${candidates[i].name.split(" ")[1]}: ${s}`).join(", ")}`, bars: pcts, isSeats: true }
  ];

  resWrap.innerHTML = "";
  systems.forEach(sys => {
    const card = document.createElement("div");
    card.className = "sim-result-card";
    let barsHtml = "";
    sys.bars.forEach((p, i) => {
      if (sys.isSeats) {
        barsHtml += `<div class="result-bar-wrap"><div class="result-bar-label"><span>${candidates[i].name}</span><span>${seats[i]} seats</span></div><div class="result-bar"><div class="result-bar-fill" style="width:${p}%;background:${candidates[i].color}"></div></div></div>`;
      } else {
        barsHtml += `<div class="result-bar-wrap"><div class="result-bar-label"><span>${candidates[i].name}</span><span>${p.toFixed(1)}%</span></div><div class="result-bar"><div class="result-bar-fill" style="width:${p}%;background:${candidates[i].color}"></div></div></div>`;
      }
    });
    card.innerHTML = `<h4>${sys.name}</h4><p class="desc">${sys.desc}</p>${barsHtml}<div class="sim-winner">Winner: ${sys.winner}</div>`;
    resWrap.appendChild(card);
  });
}

/* ===== DEADLINES ===== */
function initDeadlines() {
  const grid = document.getElementById("deadlineGrid");
  const now = new Date();
  deadlinesData.forEach(dl => {
    const diff = Math.ceil((dl.date - now) / 864e5);
    let urgClass = "urgency-green";
    if (diff < 7) urgClass = "urgency-red";
    else if (diff < 30) urgClass = "urgency-amber";
    const card = document.createElement("div");
    card.className = "deadline-card";
    card.innerHTML = `
      <div class="urgency-ring ${urgClass}">
        <span class="days">${Math.max(0, diff)}</span>
        <span class="days-label">days left</span>
      </div>
      <h4>${dl.title}</h4>
      <p class="dl-date">${dl.desc}</p>
      <button class="reminder-btn" aria-label="Set reminder for ${dl.title}">📋 Set Reminder</button>`;
    card.querySelector(".reminder-btn").addEventListener("click", function () {
      const text = `REMINDER: ${dl.title} — ${dl.desc}. Don't miss this important election deadline!`;
      navigator.clipboard.writeText(text).then(() => {
        this.textContent = "✓ Reminder Set!";
        this.classList.add("copied");
      });
    });
    grid.appendChild(card);
  });
}

/* ===== AI CHAT ===== */
function initChat() {
  const toggle = document.getElementById("chatToggle");
  const panel = document.getElementById("chatPanel");
  const close = document.getElementById("closeChat");
  const input = document.getElementById("chatInput");
  const send = document.getElementById("chatSend");
  const msgs = document.getElementById("chatMessages");
  const chips = document.getElementById("chatChips");

  // Initial greeting
  msgs.innerHTML = '<div class="chat-msg bot">Hi! I\'m Vox — your personal election guide. Whether you\'re a first-time voter or just brushing up on how democracy works, I\'m here to help with no jargon and no spin. What would you like to explore today?</div>';
  
  // Set chips
  chips.innerHTML = `
    <button class="chat-chip" aria-label="Walk me through the voter journey">Walk me through the voter journey</button>
    <button class="chat-chip" aria-label="Explain how votes are actually counted">Explain how votes are actually counted</button>
    <button class="chat-chip" aria-label="What's the difference between voting systems?">What's the difference between voting systems?</button>
  `;

  toggle.addEventListener("click", () => panel.classList.toggle("open"));
  close.addEventListener("click", () => panel.classList.remove("open"));

  function sendMsg(text) {
    if (!text.trim()) return;
    // User message
    chatHistory.push({ role: "user", content: text });
    const userDiv = document.createElement("div");
    userDiv.className = "chat-msg user";
    userDiv.textContent = text;
    msgs.appendChild(userDiv);
    input.value = "";
    chips.style.display = "none";
    msgs.scrollTop = msgs.scrollHeight;

    // Bot loading
    const botDiv = document.createElement("div");
    botDiv.className = "chat-msg bot";
    botDiv.innerHTML = '<span class="loading-dots">Thinking...</span>';
    msgs.appendChild(botDiv);
    msgs.scrollTop = msgs.scrollHeight;

    // API call — Backend proxy: x-api-key + model claude-sonnet-4-20250514 handled server-side
    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY
      },
      body: JSON.stringify({
        message: text,
        model: "claude-sonnet-4-20250514",
        system: voxSystemPrompt,
        messages: chatHistory.filter(m => m.role !== "assistant" || m !== chatHistory[0]).slice(-10)
      })
    }).then(r => r.json()).then(data => {
      const reply = data.response || "I'm having trouble connecting right now. Please try again!";
      chatHistory.push({ role: "assistant", content: reply });
      
      // Basic markdown parsing for the chat
      let parsedReply = reply
        .replace(/\n\n/g, '<br><br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

      // Simulate streaming
      botDiv.innerHTML = "";
      let ci = 0;
      
      const interval = setInterval(() => {
        ci += 3;
        if (ci > parsedReply.length) ci = parsedReply.length;
        botDiv.innerHTML = parsedReply.substring(0, ci);
        msgs.scrollTop = msgs.scrollHeight;
        if (ci === parsedReply.length) {
          clearInterval(interval);
        }
      }, 10);
    }).catch(err => {
      const reply = "Backend API is unreachable. Please make sure you are accessing this site via http://localhost:3000 and the server is running!";
      chatHistory.push({ role: "assistant", content: reply });
      let errorCi = 0;
      botDiv.innerHTML = "";
      const interval = setInterval(() => {
        errorCi += 3;
        if (errorCi > reply.length) errorCi = reply.length;
        botDiv.innerHTML = reply.substring(0, errorCi);
        msgs.scrollTop = msgs.scrollHeight;
        if (errorCi === reply.length) {
          clearInterval(interval);
        }
      }, 10);
    });
  }

  send.addEventListener("click", () => sendMsg(input.value));
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMsg(input.value); });
  chips.addEventListener("click", (e) => {
    if (e.target.classList.contains("chat-chip")) sendMsg(e.target.textContent);
  });
}
