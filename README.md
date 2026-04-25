[README.md](https://github.com/user-attachments/files/27087011/README.md)
# Vote-Path
<div align="center">

```
██╗   ██╗ ██████╗ ████████╗███████╗██████╗  █████╗ ████████╗██╗  ██╗
██║   ██║██╔═══██╗╚══██╔══╝██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██║  ██║
██║   ██║██║   ██║   ██║   █████╗  ██████╔╝███████║   ██║   ███████║
╚██╗ ██╔╝██║   ██║   ██║   ██╔══╝  ██╔═══╝ ██╔══██║   ██║   ██╔══██║
 ╚████╔╝ ╚██████╔╝   ██║   ███████╗██║     ██║  ██║   ██║   ██║  ██║
  ╚═══╝   ╚═════╝    ╚═╝   ╚══════╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝
```

### *Your Vote. Your Voice. Your Guide.*

---

**🏆 Google Promptwar — National Level Entry**
&nbsp;
[![Built with Claude](https://img.shields.io/badge/Built%20with-Anthropic%20Claude-orange?style=flat-square)](https://anthropic.com)
[![Civic Tech](https://img.shields.io/badge/Category-Civic%20Tech-navy?style=flat-square)](/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-gold?style=flat-square)](/)
[![WCAG AA](https://img.shields.io/badge/Accessibility-WCAG%20AA-green?style=flat-square)](/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](/)

</div>

---

## 📖 What is VotePath?

> *"Democracy works best when every citizen understands it."*

**VotePath** is an AI-powered civic education platform that transforms how citizens learn about, prepare for, and participate in elections. Built for the Google Promptwar competition, it combines beautiful design, real-time AI assistance, and interactive simulations to make the democratic process accessible to everyone — from first-time voters to seasoned civic participants.

Unlike existing apps that only show *who* to vote for, VotePath teaches *how* democracy actually works.

---

## ✨ Features at a Glance

| Feature | What it does | Why it's unique |
|---|---|---|
| 🗺️ **Voter Journey Map** | 7-step interactive guide from registration to certification | Progress tracking with "Mark as Done" — no other app has this |
| 🎯 **Myth Buster** | AI fact-checks election misinformation in real time | Live Anthropic API call with structured VERDICT + EVIDENCE output |
| 🎮 **Voting Systems Simulator** | Compare FPTP vs Ranked Choice vs Proportional with live sliders | Shows how the same votes produce different winners — the "aha moment" |
| 🤖 **Vox AI Coach** | Floating chat tutor that adapts to your knowledge level | Powered by Claude, politically neutral, beginner-to-expert adaptive |
| ⏱️ **Live Countdown Engine** | Real-time timers to every election deadline | Colour-coded urgency rings (green → amber → red) |
| 📊 **Process Visualiser** | Animated SVG showing a vote's journey from booth to certification | Interactive nodes with tooltips, full animation playback |
| 🔔 **Smart Deadline Tracker** | Personalised reminders for all key dates | One-click "Set Reminder" copies calendar-ready text |
| ♿ **Accessible by Default** | WCAG AA compliant, ARIA labels, screen-reader friendly | Multilingual AI translation support via Vox |

---

## 🚀 Getting Started — Step by Step

### Step 1 — Generate the app

Paste the **Frontend Prompt** into Claude (claude.ai or API). Claude will return a complete single HTML file. This takes about 60–90 seconds.

```
Tip: Use claude-sonnet-4-20250514 for best results.
If the output gets cut off, type "continue" and Claude will resume.
```

### Step 2 — Save the file

1. Copy the entire HTML output from Claude
2. Open any text editor (Notepad, VS Code, TextEdit)
3. Paste and save as `votepath.html`

```bash
# If you have VS Code installed:
code votepath.html
```

### Step 3 — Open in browser

Double-click `votepath.html` — it opens in your default browser instantly.  
No server needed. No npm install. No dependencies. Just open and run.

```
✅ Works in: Chrome, Firefox, Safari, Edge
✅ Works on: Windows, Mac, Linux, Android, iOS
❌ Internet Explorer is not supported (nobody uses it anyway)
```

### Step 4 — Test the AI features

The app calls the Anthropic API. You need to be in an environment where the API key is handled automatically (claude.ai artifacts, Anthropic sandbox, or your own API key).

**If running locally with your own API key**, find this line in the HTML:

```javascript
headers: {
  "Content-Type": "application/json",
  // API key is handled by environment
}
```

And add your key:

```javascript
headers: {
  "Content-Type": "application/json",
  "x-api-key": "sk-ant-YOUR-KEY-HERE",
  "anthropic-version": "2023-06-01"
}
```

---

## 🔍 How to Check If Everything Works — QA Checklist

Run through this checklist before submitting or demoing:

### Visual & Layout
- [ ] Hero section loads with animated headline
- [ ] Countdown timer is counting down (not frozen or showing NaN)
- [ ] "Start My Journey" button scrolls smoothly to the Journey Map
- [ ] All 7 Journey Map steps are visible and clickable
- [ ] Expanding a step shows explanation, deadlines, and Did You Know fact
- [ ] "Mark as Done" shows a gold checkmark and advances progress
- [ ] Section headings all have the gold underline accent
- [ ] Footer shows all navigation links + "Powered by Anthropic Claude" badge

### AI Features
- [ ] Click "Bust This Myth" on any pre-loaded myth card → response appears within 5 seconds
- [ ] Myth response shows VERDICT badge (CONFIRMED MYTH / MOSTLY FALSE / etc.)
- [ ] Vox chat opens when you click the floating button (bottom-right)
- [ ] Typing a question in Vox and pressing Enter returns a response
- [ ] Starter prompt chips ("How does Electoral College work?" etc.) are clickable
- [ ] Chat history stays visible as you scroll up

### Simulator
- [ ] Moving any candidate slider updates all three result columns instantly
- [ ] The winner name changes when you move sliders to show different outcomes
- [ ] All three systems (FPTP, Ranked Choice, Proportional) show different winners with the right slider positions

### Deadlines & Tracker
- [ ] All 4 deadline cards are visible
- [ ] Days remaining numbers are correct (not negative, not 0)
- [ ] Urgency ring colour matches the days remaining (green/amber/red)
- [ ] "Set Reminder" button shows a confirmation message after click

### Responsive / Mobile
- [ ] Resize browser to 375px width — layout should not break
- [ ] Journey Map stacks vertically on mobile
- [ ] Chat panel fits within screen on mobile
- [ ] All text remains readable (no overflow or cut-off)

### Accessibility
- [ ] Tab through the page with keyboard — all interactive elements are reachable
- [ ] Hover states visible on all buttons and cards
- [ ] No text on coloured backgrounds that's hard to read

---

## 🏗️ Project Structure

```
votepath/
│
├── votepath.html          ← The entire app (single file)
│
├── README.md              ← This file
│
└── prompts/
    ├── frontend-prompt.txt   ← The prompt used to generate the app
    └── system-prompt.txt     ← The AI backend system prompt (Vox)
```

Everything lives in one HTML file. CSS, JS, and content are all inline.

---

## 🧠 How the AI Works

VotePath uses the **Anthropic Claude API** in two ways:

```
┌─────────────────────────────────────────────────────────┐
│                    USER ACTION                          │
└────────────────────────┬────────────────────────────────┘
                         │
           ┌─────────────┴──────────────┐
           │                            │
    "Bust This Myth"            "Ask Vox a question"
           │                            │
           ▼                            ▼
  Myth text → API call         Question + chat history
  System: fact-check mode      System: Vox civics tutor
           │                            │
           ▼                            ▼
  Structured response:          Adaptive response:
  VERDICT + EVIDENCE +          Beginner or expert level
  BOTTOM LINE                   + follow-up question
           │                            │
           └─────────────┬──────────────┘
                         │
                         ▼
              Rendered in the UI
```

**Model used:** `claude-sonnet-4-20250514`  
**Max tokens:** `1000` per response  
**Political bias:** Zero — hardcoded neutrality in system prompt

---

## 🎨 Design System

| Element | Value |
|---|---|
| Background | `#0A1628` (Deep Navy) |
| Surface | `#F5F0E8` (Warm Cream) |
| Primary Accent | `#C9A84C` (Rich Gold) |
| Secondary Accent | `#4A6FA5` (Slate Blue) |
| Heading Font | Playfair Display (Google Fonts) |
| Body Font | Source Sans Pro (Google Fonts) |
| Border Radius | 8px (cards), 4px (buttons) |
| Animation | CSS keyframes + IntersectionObserver |

---

## 🏆 Why This Wins

After analysing every major election app on the market:

| App | What it does | What it's missing |
|---|---|---|
| ActiVote | Voter research & profiles | No education, no AI, no simulation |
| WeVote | Ballot guide & endorsements | No process education, no myth busting |
| Election 2024 | Electoral college map | US-only, no civics education at all |
| Election Central (PBS) | Static civics lessons | No interactivity, no AI, no personalisation |
| **VotePath** | **All of the above + AI + simulation** | **Nothing — this is the complete package** |

### The 3 killer differentiators

1. **Voting Systems Simulator** — No other consumer app lets you see how the same votes produce a different winner under different systems. This creates genuine insight in seconds.

2. **AI Myth Buster** — Misinformation is the #1 threat to election integrity. VotePath is the only education app that fights it in real time with a structured, evidence-backed AI response.

3. **Civic Authority Aesthetic** — The navy/gold design language signals trustworthiness. Every other app looks like a startup. VotePath looks like it was built by the government — which, for an election guide, is exactly right.

---

## 📋 Demo Script (4 minutes)

Use this exact order when presenting to judges:

```
00:00 → Open app. Hero countdown creates instant urgency.
00:30 → Click "Start My Journey". Journey Map scrolls into view.
01:00 → Click Step 1 (Eligibility). Expand. Read the Did You Know.
01:30 → Mark Steps 1 and 2 as Done. Gold checkmarks appear.
02:00 → Scroll to Myth Buster. Type: "Elections are rigged."
02:30 → AI response streams in. Point out the VERDICT badge.
03:00 → Scroll to Voting Simulator. Drag sliders slowly.
03:20 → "Watch — the winner just changed." Point to different results.
03:40 → Open Vox chat. Ask: "How does ranked choice voting work?"
04:00 → Response appears. "This is your personalised civics coach."
```

**Closing line for judges:**  
*"VotePath turns a confused citizen into a confident voter in under 10 minutes. That's the mission of democracy."*

---

## 🛠️ Troubleshooting

**App opens but looks unstyled**  
→ Check your internet connection. Google Fonts requires a live connection to load.

**AI features not working (no response from Myth Buster or Vox)**  
→ You need a valid Anthropic API key. Add it to the fetch headers as shown in Step 4 above.

**Countdown timer shows NaN or wrong number**  
→ The demo date is hardcoded 60 days from when Claude generated the file. This is expected behaviour for a demo.

**Simulator sliders don't update results**  
→ Try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R). If still broken, the JS may have been truncated during generation — regenerate with the frontend prompt.

**Layout broken on mobile**  
→ Ensure you're viewing in a browser, not a file preview. Open Chrome/Safari on your phone and navigate to the file.

---

## 🤝 Built With

- **[Anthropic Claude](https://anthropic.com)** — AI backbone for Vox and Myth Buster
- **[Google Fonts](https://fonts.google.com)** — Playfair Display + Source Sans Pro
- **Vanilla HTML/CSS/JS** — Zero framework dependencies
- **SVG animations** — Pure CSS, no library needed

---

## 📜 License

MIT License — free to use, modify, and submit for competitions.

---

<div align="center">

**Made for Google Promptwar · National Level Competition**

*"The vote is the most powerful nonviolent tool we have."* — John Lewis

---

⭐ If VotePath helps you understand democracy better, that's the whole point.

</div>
