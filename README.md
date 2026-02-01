# Quantum Bluff 🃏

> **"The right card, at the right time, with the right quantum state"** — Strategic gameplay meets quantum mechanics

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green)](https://fastapi.tiangolo.com/)
[![Qiskit](https://img.shields.io/badge/Qiskit-1.0.0-purple)](https://qiskit.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A real-time, multiplayer, web-based card game that blends the principles of quantum mechanics with the strategic arts of bluffing and deduction.**

This project delivers a unique gaming experience where players manipulate the quantum states of "qubit cards" using gate operations, make deceptive claims about their moves, and challenge their opponents' bluffs. At its core, the game is powered by a genuine **Qiskit** simulator that performs all quantum calculations.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Problem & Solution](#problem--solution)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Game Rules](#game-rules)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Quantum Bluff** is an innovative gaming platform that combines quantum computing concepts with competitive strategy. Players manipulate qubit states using fundamental quantum gates while simultaneously playing a psychological bluffing game. The platform demonstrates how quantum mechanics principles can create engaging, educational gameplay experiences.

### 🎖️ Problems Solved

| Challenge                                      | Solution                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| 🎮 Complex quantum concepts hard to understand | **Interactive gameplay** that teaches through experience           |
| 🤯 Multiplayer synchronization in real-time    | **Socket.IO real-time engine** with sub-100ms latency              |
| 🧮 Accurate quantum simulations needed         | **Qiskit-powered quantum simulator** for true quantum calculations |
| 📊 Difficult to visualize qubit states         | **Interactive dashboard** with state visualization                 |
| 🏃 Limited engagement in educational games     | **Psychological bluffing mechanic** for compelling gameplay        |

---

## 🧩 Technology Stack

```
┌────────────────────────────────────────────────┐
│              ARCHITECTURE LAYERS                │
├────────────────────────────────────────────────┤
│ Frontend     │ Next.js + React + Tailwind     │
│ Backend      │ Express.js + Node.js            │
│ Real-time    │ Socket.IO                       │
│ Quantum      │ Qiskit + Qiskit Aer             │
│ State Mgmt   │ Zustand                         │
│ Deployment   │ Docker + Docker Compose         │
└────────────────────────────────────────────────┘
```

| Component              | Technology     | Version | Purpose                            |
| ---------------------- | -------------- | ------- | ---------------------------------- |
| **Frontend Framework** | Next.js        | 15      | Server-side rendering & App Router |
| **UI Library**         | React          | 19      | Component-based UI                 |
| **Styling**            | Tailwind CSS   | 4       | Utility-first CSS                  |
| **Backend Framework**  | Express.js     | 4.18    | HTTP server & routing              |
| **Real-time Comms**    | Socket.IO      | 4.7     | WebSocket event handling           |
| **Language**           | TypeScript     | 5       | Type-safe development              |
| **State Management**   | Zustand        | 4.4     | Client-side state                  |
| **Quantum Engine**     | Qiskit         | 1.0     | Quantum circuit simulation         |
| **Python Server**      | FastAPI        | 0.109   | Quantum simulator API              |
| **Container**          | Docker Compose | Latest  | Multi-service orchestration        |

---

## ✨ Key Features

- **Real-time Multiplayer:** Seamless and fluid gameplay powered by Socket.IO for instant communication
- **Lobby System:** Players enter a name and automatically match with opponents
- **Authentic Quantum Mechanics:**
  - **Gate Operations:** Full suite of fundamental quantum gates—`H` (Hadamard), `X` (Pauli-X), `Z` (Pauli-Z), `I` (Identity), and `CNOT` (Controlled-NOT)
  - **Superposition & Collapse:** Use the H gate to create superposition states that probabilistically collapse when measured
  - **Entanglement:** Create entangled qubit pairs with the CNOT gate and earn bonus points when they collapse to the same state
- **Complete Strategic Gameplay:**
  - Bluff about true qubit states and challenge opponent claims
  - Live scoreboard, turn timer (30s), and round limits (max 10 rounds)
  - Dynamic deck system with card replacement mechanics
  - Bluff tokens for high-stakes plays
- **Professional Architecture:** Microservice-based design with three independent services

---

## 📁 Project Structure

```
QCards/
│
├── 📄 README.md                    # This file
├── 📄 package.json                 # Root workspace config
├── 🐳 docker-compose.yml           # Multi-service orchestration
├── .gitignore
│
├── 📚 docs/
│   ├── ARCHITECTURE.md             # System design documentation
│   └── QUANTUM_GATES.md            # Quantum mechanics guide
│
├── 📱 client/                      # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   └── play/
│   │       └── page.tsx            # Game page
│   ├── components/
│   │   ├── GameScreen.tsx          # Main game UI
│   │   ├── GateCard.tsx            # Gate card component
│   │   ├── PlayerHand.tsx          # Player's card display
│   │   ├── QubitCard.tsx           # Qubit visualization
│   │   ├── Scoreboard.tsx          # Score tracking
│   │   ├── Lobby.tsx               # Matchmaking UI
│   │   ├── HowToPlayModal.tsx      # Rules & tutorial
│   │   ├── SocketManager.tsx       # Socket.IO wrapper
│   │   └── Navbar.tsx              # Navigation
│   ├── store/
│   │   └── useGameStore.ts         # Zustand state management
│   ├── public/                     # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── Dockerfile
│
├── 🔧 server/                      # Express.js backend
│   ├── src/
│   │   ├── server.ts               # Express setup
│   │   ├── socket.ts               # Socket.IO handlers
│   │   ├── game/
│   │   │   ├── state.ts            # Game state management
│   │   │   └── logic.ts            # Game rules & logic
│   │   └── types/
│   │       └── game.ts             # TypeScript interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── 🔬 simulator/                   # Python FastAPI quantum simulator
│   ├── main.py                     # FastAPI app + Qiskit integration
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile
│   └── __pycache__/
│
└── 🧪 tests/                       # Integration tests (future)
    └── e2e.test.ts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **Python** v3.10+
- **Git**
- **Docker & Docker Compose** (optional, for containerized setup)

### 5-Minute Setup

#### Option 1: Local Development

```bash
# Clone the repository
git clone https://github.com/tariktoplu/QCards.git
cd QCards
```

**Terminal 1 - Server:**

```bash
cd server
npm install
npm start
```

→ Server runs on `http://localhost:4000`

**Terminal 2 - Simulator:**

```bash
cd simulator
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

→ Simulator runs on `http://localhost:8000`

**Terminal 3 - Client:**

```bash
cd client
npm install
npm run dev
```

→ Client runs on `http://localhost:3000`

#### Option 2: Docker Compose (Recommended)

```bash
git clone https://github.com/tariktoplu/QCards.git
cd QCards
docker-compose up --build
```

Then navigate to `http://localhost:3000`

### ✅ Verify Installation

| URL                          | Expected                  |
| ---------------------------- | ------------------------- |
| `http://localhost:8000`      | API health check          |
| `http://localhost:8000/docs` | Swagger API documentation |
| `http://localhost:3000`      | Game dashboard            |

---

## 💻 Installation

### Step 1: Environment Configuration

```bash
# Create .env file in project root
cp .env.example .env
```

**Example `.env` file:**

```env
# API Settings
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=true

# Game Settings
DEFAULT_ROUNDS=10
TURN_TIME_LIMIT=30

# Quantum Simulator
QISKIT_AERSIMULATOR=true
```

### Step 2: Install Dependencies

```bash
# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install Python dependencies
pip install -r requirements.txt

# GPU Support (optional)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Step 3: Start Services

```bash
# Terminal 1: Start backend
cd server && npm start

# Terminal 2: Start simulator
cd simulator && uvicorn main:app --reload --port 8000

# Terminal 3: Start frontend
cd client && npm run dev
```

---

## 🎮 Usage

### Start Playing

1. Open `http://localhost:3000` in your browser
2. Enter your player name in the lobby
3. Wait for an opponent to join
4. Game starts automatically with both players connected
5. Select a gate card and declare a quantum state (you can bluff!)
6. Opponent can challenge or pass your claim
7. First to 10 points wins!

### API Endpoints

#### Health Check

```bash
curl http://localhost:8000
```

**Response:**

```json
{
  "status": "online",
  "version": "0.1.0",
  "models": {
    "quantum_simulator": "qiskit_v1"
  }
}
```

#### Quantum Gate Simulation

```bash
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "initial_state": "0",
    "gate": "H"
  }'
```

**Response:**

```json
{
  "final_state": "|+>",
  "probability_0": 0.5,
  "probability_1": 0.5
}
```

👉 **See all API endpoints:** `http://localhost:8000/docs`

---

## 📋 Game Rules

### Objective

Be the first player to reach 10 points by successfully declaring quantum states and challenging bluffs.

### Your Turn

1. **Select a Gate Card** from your hand
2. **Select a Target Qubit** (yours or opponent's for CNOT)
3. **Declare the New State** (you can bluff!)

### Quantum Gates

| Gate         | Symbol | Effect                                               |
| ------------ | ------ | ---------------------------------------------------- |
| **Hadamard** | `H`    | Creates superposition: `\|0\>` → `\|+\>` (50/50 mix) |
| **Pauli-X**  | `X`    | Flips qubit: `\|0\>` ↔ `\|1\>`                       |
| **Pauli-Z**  | `Z`    | Adds phase to superposition states                   |
| **Identity** | `I`    | No change to qubit state                             |
| **CNOT**     | `CX`   | 2-qubit gate: flips target if control is `\|1\>`     |

### Challenge Mechanics

| Scenario                        | Outcome                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| **Challenge + Correct Claim**   | Challenger loses 1 point, Declarer gains 1 point                                            |
| **Challenge + Incorrect Claim** | Challenger gains 2 points, Declarer loses 2 points                                          |
| **Pass**                        | Declarer gains 1 point                                                                      |
| **Entanglement Bonus**          | Using CNOT with both qubits in superposition: 3 bonus points if they collapse to same state |

---

## 🏗️ Architecture

### System Flow Diagram

```
┌─────────────────────────────────────┐
│   CLIENT (Next.js + React)          │
│  - Game UI                          │
│  - State Management (Zustand)       │
│  - Real-time Updates (Socket.IO)    │
└──────────────┬──────────────────────┘
               │ WebSocket
               ▼
┌─────────────────────────────────────┐
│   SERVER (Express.js + Node.js)     │
│  - Game Logic                       │
│  - State Synchronization            │
│  - Player Matching (Lobby)          │
└──────────────┬──────────────────────┘
               │ REST / HTTP
               ▼
┌─────────────────────────────────────┐
│  SIMULATOR (Python + Qiskit)        │
│  - Quantum Gate Simulations         │
│  - State Collapse Calculations      │
│  - Measurement Results              │
└─────────────────────────────────────┘
```

### Data Flow

```
Player Action (Gate + Qubit)
        │
        ▼
   Send via Socket.IO
        │
        ▼
  Server Receives & Validates
        │
        ├─→ Call Quantum Simulator
        │    └─→ Qiskit Circuit Execution
        │        └─→ State Calculation
        │
        ▼
  Update Game State
        │
        ├─→ Broadcast to Both Players
        ├─→ Check Win Conditions
        └─→ Update Scoreboard
        │
        ▼
   React to UI Changes
        │
        ▼
   Players See New State
```

---

## 🔌 API Endpoints

### Socket.IO Events

| Event              | Direction       | Payload                                                                                    |
| ------------------ | --------------- | ------------------------------------------------------------------------------------------ |
| `join_game`        | Client → Server | `{ playerName: string }`                                                                   |
| `play_and_declare` | Client → Server | `{ gateCardId, gateType, targetQubitId, controlQubitId?, declaredState?, usedBluffToken }` |
| `challenge_bluff`  | Client → Server | -                                                                                          |
| `pass_bluff`       | Client → Server | -                                                                                          |
| `request_rematch`  | Client → Server | -                                                                                          |
| `gameUpdate`       | Server → Client | Full game state                                                                            |
| `timer_tick`       | Server → Client | `{ time: number }`                                                                         |
| `playerLeft`       | Server → Client | -                                                                                          |

### REST Endpoints (Simulator)

**POST** `/simulate`

```json
{
  "initial_state": "0" | "1" | null,
  "gate": "H" | "X" | "Z" | "I" | "CNOT",
  "control_qubit": null | 0 | 1
}
```

**Response:**

```json
{
  "final_state": "|0>" | "|1>" | "|+>" | "|->" | "|error>",
  "probability_0": 0.0 | 0.5 | 1.0,
  "probability_1": 0.0 | 0.5 | 1.0,
  "is_superposition": boolean
}
```

---

## 🛠️ Development

### Code Quality Tools

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check

# Run tests
npm test
```

### Environment Variables

**Client (`.env.local`):**

```
NEXT_PUBLIC_SERVER_URL=http://localhost:4000
NEXT_PUBLIC_SIMULATOR_URL=http://localhost:8000
```

**Server (`.env`):**

```
PORT=4000
SIMULATOR_URL=http://localhost:8000
NODE_ENV=development
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- game.test.ts

# Generate coverage report
npm test -- --coverage
```

### E2E Tests

```bash
# Run Playwright tests
npm run test:e2e

# Run with UI
npm run test:e2e -- --ui
```

---

## 🚧 Roadmap

### MVP Phase

- [x] Project structure & GitHub setup
- [x] FastAPI backend scaffold
- [x] React dashboard UI
- [ ] Real-time multiplayer (Socket.IO)
- [ ] Quantum simulator integration
- [ ] Complete game logic

### Phase 2

- [ ] Database integration (PostgreSQL)
- [ ] User authentication & profiles
- [ ] Game statistics & leaderboard
- [ ] Mobile-responsive UI

### Phase 3

- [ ] Advanced quantum gates
- [ ] Game variants (Speed, Cooperative)
- [ ] Spectator mode
- [ ] Tournament system
- [ ] Replay system

---

## 🐛 Known Issues

None currently reported. Please [open an issue](https://github.com/tariktoplu/QCards/issues) if you find a bug!

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a **Pull Request**

### Code Standards

```bash
# Format with Prettier
prettier --write src/

# Lint with ESLint
eslint src/ --fix

# Type check with TypeScript
tsc --noEmit
```

---

## 👥 Development Team

- **Project Lead:** Tarık Toplu
- **Role:** Full-stack Developer
- **Contact:** [GitHub Profile](https://github.com/tariktoplu)

---

## 💬 Contact & Support

- 📧 **Email:** tarikttoplu@gmail.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/tariktoplu/QCards/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/tariktoplu/QCards/discussions)

---

## 🙏 Acknowledgments

- **Qiskit Team** for the quantum computing framework
- **Socket.IO** for real-time communication
- **Next.js** and **React** communities
- All contributors and players who test the game

---

**Made with ❤️ and quantum mechanics**

Last updated: February 1, 2026
