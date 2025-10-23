# UseFeed

This project is a simple RSS feed reader application with a React frontend and a Node.js backend.

## Goal

The main goal of this project is to create a web application that allows users to add RSS feed URLs and view the content from those feeds in a clean and user-friendly interface.

## Tech Stack

### Frontend

*   **React:** A JavaScript library for building user interfaces.
*   **Vite:** A fast build tool and development server for modern web projects.
*   **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
*   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.

### Backend

*   **Node.js:** A JavaScript runtime built on Chrome's V8 JavaScript engine.
*   **Express:** A minimal and flexible Node.js web application framework.
*   **TypeScript:** For type-safe backend code.
*   **axios:** A promise-based HTTP client for the browser and Node.js.
*   **cors:** A Node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
*   **rss-parser:** A lightweight RSS parser for Node.js.

## Setup

### Prerequisites

*   Node.js and npm installed.

### Development Setup

1.  Install dependencies for the root, backend, and frontend:
    ```bash
    npm install
    npm install --prefix backend
    npm install --prefix frontend
    ```
2.  Create a `.env` file in the `backend` directory and populate it with the necessary environment variables. You can use the `.env.example` file as a template.
3.  Create a `.env` file in the `frontend` directory and populate it with the necessary environment variables. You can use the `.env.example` file as a template.
4.  Start the development servers for both frontend and backend:
    ```bash
    npm run dev
    ```
    The frontend will be accessible at `http://localhost:5173` and the backend server will be running on `http://localhost:3000`.
