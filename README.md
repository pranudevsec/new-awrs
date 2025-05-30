# 🏆 Award Admin

**Award Admin** is a full-stack web application built using **Node.js** for the backend and **React.js** for the frontend. It includes an admin panel for managing award processes and related configurations. This monorepo structure enables synchronized development and streamlined builds for both client and server.

---

## 📁 Project Structure

This project is organized into the following main directories:

- **`/backend`** – Node.js
- **`/frontend`** – React.js

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/award_adminpanel.git
```

### 2. Install Dependencies

Install all dependencies for the root, frontend, and backend:

```bash
npm install                # Installs root dependencies
npm run install:frontend   # Installs frontend dependencies
npm run install:backend    # Installs backend dependencies
```

### 3. Run in Development Mode

Start both frontend and backend concurrently:

```bash
npm run dev
```

This will spin up the development environment for both sides of the application.

### 4. Build for Production

To create optimized builds for deployment:

```bash
npm run build
```