# Occupy Project Context for Gemini

This document provides an overview of the "Occupy" project, designed to serve as instructional context for the Gemini CLI agent.

## Project Overview

The "Occupy" project is a full-stack application consisting of a mobile frontend and a Django-based backend API.

*   **Mobile Frontend:** Developed using Expo/React Native, leveraging Expo SDK 52, React Native 0.76, React Navigation 7, UI Kitten for UI components, and Expo Router for navigation.
*   **Backend API:** Built with Django and Django REST Framework, utilizing PostgreSQL/SQLite for the database.

The project aims to provide a robust and scalable platform with clear separation of concerns between the client and server.

## Building and Running

The project uses `Makefile` for streamlined development workflows.

### Prerequisites

*   Node.js (v18 or later)
*   Python (v3.8 or later)
*   Expo CLI (`npm install -g @expo/cli`)
*   iOS Simulator (for iOS development)
*   Android Studio/Android SDK (for Android development)

### General Commands (from project root)

*   `make help`: See all available commands.
*   `make dev`: Start both mobile and backend development servers simultaneously.
*   `make setup`: Install all dependencies for both mobile and backend.

### Mobile App Setup and Running

1.  **Navigate to mobile directory:** `cd mobile`
2.  **Install dependencies:** `make setup-mobile` (or `npm install` / `yarn install` if `make` is not preferred)
3.  **Start Expo development server:** `make dev-mobile` (or `npx expo start`)

### Backend Setup and Running

1.  **Navigate to backend directory:** `cd backend`
2.  **Create and activate virtual environment:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate # On Windows: .venv\Scripts\activate
    ```
3.  **Install Python dependencies:** `pip install -r requirements.txt`
4.  **Run Django migrations:** `python manage.py migrate`
5.  **Start Django development server:** `make dev-backend` (or `python manage.py runserver`)

### Deployment

*   **Mobile App Deployment (via Expo Application Services - EAS):**
    *   `make build-mobile`: Build for production.
    *   `make build-android`: Build for Android.
    *   `make build-ios`: Build for iOS.
    *   `make update-mobile`: Deploy updates.
*   **Backend Deployment (via Docker):**
    *   `make docker`: Utilize Docker configuration for deployment.

## Development Conventions

*   **Code Structure:** The project is divided into `mobile/` for the frontend and `backend/` for the API.
*   **API Endpoints:** Authentication endpoints are clearly defined (e.g., `/api/auth/jwt/create/`, `/api/auth/users/me/`).
*   **Configuration:**
    *   Mobile: `mobile/app.json`, `mobile/eas.json`, `mobile/babel.config.mjs`, `mobile/metro.config.mjs`.
    *   Backend: `backend/config/settings/base.py` (and environment-specific settings), `backend/requirements.txt`, `backend/Dockerfile`.
*   **Linting/Formatting:** `.flake8` in the backend suggests Python linting is in place. `pyrightconfig.json` indicates type checking for Python. `tsconfig.json` in `mobile/` indicates TypeScript usage.
