# CLARA Frontend

The CLARA frontend is a React application for the AI procurement assistant. It provides authentication, multi-chat conversations, document and knowledge-base uploads, action approval, audit history, inventory forecasting, message feedback, and optional audio playback.

## Prerequisites

- Node.js 20 or later
- npm
- A running CLARA backend

## Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create a `.env` file in this directory and point it at the backend:

   ```dotenv
   REACT_APP_CHAT_ENDPOINT=http://localhost:8000
   ```

3. Start the development server:

   ```powershell
   npm start
   ```

The application opens at `http://localhost:3000` by default. The backend must allow requests from the frontend origin; the included backend development configuration enables CORS.

## Scripts

- `npm start` starts the Create React App development server and loads `.env`.
- `npm test` runs the React test suite.
- `npm run build` creates an optimized production build in `build/`.
- `npm run eject` ejects the Create React App configuration; this is irreversible.

## Application Features

- Register, sign in, sign out, and delete an account.
- Create, rename, select, and delete chat conversations.
- Send procurement requests, view message history, and rate assistant responses.
- Upload documents to a chat as temporary context or to a reusable knowledge base.
- Review, edit, approve, or reject pending agent actions and inspect audit activity.
- View inventory forecasts, trends, and products requiring attention.
- Switch between light and dark themes and use the responsive mobile navigation.

## Project Structure

- `src/App.js` renders the primary application shell.
- `src/components/ChatWindow.js` contains the chat-focused user interface and view navigation.
- `src/components/InventoryDashboard.js` and `src/components/ActionQueueManager.js` present inventory and action workflows.
- `src/hooks/useClaraChat.js` coordinates client state and application actions.
- `src/api/` contains the HTTP client and modules for chat, messages, users, documents, actions, and inventory endpoints.
- `src/assets/` contains application branding assets.

## Backend API Configuration

`REACT_APP_CHAT_ENDPOINT` is the only required frontend environment variable. It is used as the base URL for all requests, so it must not include a trailing slash.

For a deployed application, build with the deployed backend URL in `.env` before running `npm run build`:

```dotenv
REACT_APP_CHAT_ENDPOINT=https://api.example.com
```
