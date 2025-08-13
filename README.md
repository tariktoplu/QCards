# Quantum Bluff 🃏

**A real-time, multiplayer, web-based card game that blends the principles of quantum mechanics with the strategic arts of bluffing and deduction.**

This project delivers a unique gaming experience where players manipulate the quantum states of "qubit cards" using gate operations, make deceptive claims about their moves, and challenge their opponents' bluffs. At its core, the game is powered by a genuine **Qiskit** simulator that performs all quantum calculations.

---

## ✨ Features

*   **Real-time Multiplayer:** A seamless and fluid gameplay experience powered by Socket.IO.
*   **Lobby System:** Allows players to enter a name before finding and joining a game.
*   **Authentic Quantum Mechanics:**
    *   **Gate Operations:** Utilize a full suite of fundamental quantum gates—`H` (Hadamard), `X` (Pauli-X), `Z` (Pauli-Z), `I` (Identity), and `CNOT` (Controlled-NOT).
    *   **Superposition & Collapse:** Use the H gate to put qubits into a superposition, and watch them probabilistically collapse to `|0>` or `|1>` when a challenge (a measurement) occurs.
    *   **Entanglement:** Create entangled pairs with the CNOT gate and earn bonus points if they collapse to the same state when measured.
*   **Complete Strategic Loop:**
    *   A core gameplay mechanic based on bluffing about the true state of your qubits and challenging your opponent's claims.
    *   Features a live scoreboard, turn timer, round limits, and win/loss conditions.
    *   A dynamic deck system where used cards are replaced by drawing new ones.
    *   A "Play Again" option to immediately start a new match.
*   **Professional & Modular Architecture:** The entire application is built on a robust three-service microservice model.

---

## 🧩 Tech Stack

### **Frontend (Client)**
*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **State Management:** Zustand
*   **Real-time Communication:** Socket.IO Client
*   **Styling:** Tailwind CSS
*   **Animation:** Framer Motion

### **Backend (Server)**
*   **Platform:** Node.js
*   **Framework:** Express.js
*   **Language:** TypeScript
*   **Real-time Communication:** Socket.IO
*   **Execution:** ts-node & nodemon

### **Quantum Simulator (Simulator)**
*   **Platform:** Python 3.10+
*   **Framework:** FastAPI
*   **Quantum Library:** Qiskit, Qiskit Aer

### **Infrastructure**
*   **Containerization:** Docker, Docker Compose

---

## 🚀 Getting Started

There are two primary methods to run this project: a **Local Setup** for rapid development and a **Docker Setup** for easy deployment and sharing.

### **Prerequisites**
*   Node.js (v18+ recommended)
*   Python (v3.10+ recommended)
*   Git
*   Docker & Docker Compose

### **1. Local Development Environment**

This method is ideal for making quick code changes and testing them instantly. You will need three separate terminals.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tariktoplu/QCards.git
    cd quantum-bluff
    ```

2.  **Terminal 1: Start the Server**
    ```bash
    cd server
    npm install
    npm start
    ```

3.  **Terminal 2: Start the Simulator**
    ```bash
    cd simulator
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
    ```
    *> If you are using VS Code, fix import errors by running the `Python: Select Interpreter` command (CTRL+SHIFT+P) and choosing `./simulator/venv/bin/python`.*

4.  **Terminal 3: Start the Client**
    ```bash
    cd client
    npm install
    npm run dev
    ```
The game should now be running on `http://localhost:3000`.

### **2. Docker Setup (Recommended)**

This method runs the entire project with a single command, with all dependencies isolated in containers.

1.  **Clone the repository:** (if you haven't already)
    ```bash
    git clone https://github.com/your-username/quantum-bluff.git
    cd quantum-bluff
    ```

2.  **Build and run the Docker containers:**
    ```bash
    docker-compose up --build
    ```
    This command will build the images for the `client`, `server`, and `simulator` and start all three in a networked environment.

3.  **Access the game:**
    Navigate to `http://localhost:3000` in your browser.

---

## 📈 Future Enhancements

While this project is feature-complete according to its initial scope, there are many exciting possibilities for future development:
- **Database Integration:** Incorporate MongoDB or PostgreSQL to store user profiles, stats, and match history.
- **Advanced Physics:** Implement `Quantum Noise` or `Teleportation` as new game mechanics.
- **Game Modes:** Introduce different variants like an "Easy Mode" (no bluffing) for learning or an "Expert Mode".
- **Polish & Game Feel:** Add more detailed animations and sound effects to enrich the user experience.
