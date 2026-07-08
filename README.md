# Dreamora - Virtual Study Room Platform

A collaborative study portal featuring Pomodoro timers, ambient sound players, tasks planner, real-time sync study rooms, live room chats, and animated productivity analytics in an elegant glassmorphic dark interface.

## Key Features

1. **Circular Pomodoro Timer**: Adjust durations for focus sessions and breaks. Play synthesized completion chimes using browser Web Audio API, and automatically increment task targets and log session analytics.
2. **Ambient Sound Mixer**: Mix multiple channels (Rain & Thunder, Cafe chatter, Wind drone, Ocean waves, Lo-Fi chill beats) with individual sliders. Trigger presets like "Rainy Cafe" or "Deep Focus".
3. **Study Task Planner**: Create, prioritize (Low, Medium, High), track, and complete tasks. Selected target tasks are visually linked to the Pomodoro timer.
4. **Virtual Study Rooms**: Enter synchronized rooms like "Deep Focus Library" or "Lo-Fi Cafe Desk" to study with other active occupants. Select a nickname and avatar upon entering.
5. **Real-time Chat & Presence**: Broadcast live messages and current focus status updates (Focusing 🎯 / Resting ☕ / Idle 💤). Send animated emoji cheers (🔥, 👏, 🚀) that float up on partners' screens in real-time.
6. **Productivity Analytics**: View total focus time, active streaks, task completion ratios, category breakdown progress, and a custom SVG bar chart mapping daily hours.

---

## Technical Architecture

- **Frontend**: React + Vite, Custom CSS (Glassmorphism), Lucide-react, Socket.io-client.
- **Backend**: Node.js + Express, Socket.io, Mongoose (MongoDB).
- **Hybrid Storage Layer**: Dual database connection. The server attempts to connect to MongoDB. If MongoDB is offline, it activates the local JSON storage engine (`server/data/`) dynamically.

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher (tested on `v26.1.0`)
- **NPM**: `v9.0.0` or higher (tested on `v11.13.0`)
- **MongoDB**: (Optional) Will run in fallback mode if not running locally.

### Startup Guide

1. **Install Dependencies**:
   Open a terminal in the root directory and run:
   ```bash
   npm run install-all
   ```
   This will install package dependencies in the root, `client/` and `server/` directories.

2. **Run the Application**:
   Start both the backend server and React dev server concurrently:
   ```bash
   npm run dev
   ```

3. **Accessing the App**:
   - **Frontend**: Open [http://localhost:5173](http://localhost:5173) in your web browser.
   - **Backend API**: Accessible at [http://localhost:5000](http://localhost:5000).

---

## Development & Verification

To run tests validating API routes and Socket room events:
1. Start the server (runs on port 5000):
   ```bash
   npm run server
   ```
2. In a separate terminal, execute verification tests:
   ```bash
   node server/test.js
   ```
