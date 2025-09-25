# Occupy

## Project Structure

```
Occupy/
├── mobile/          # Expo/React Native mobile application
├── backend/         # Django backend API
├── .vscode/         # VS Code configuration
└── README.md        # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Python (v3.8 or later)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Android SDK (for Android development)

### Mobile App Setup

1. Navigate to the mobile directory:

   ```bash
   cd mobile
   ```

2. Install dependencies:

   ```bash
   make setup-mobile
   ```

3. Start the Expo development server:
   ```bash
   make dev-mobile
   ```

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (if not already created):

   ```bash
   python -m venv ../.venv
   source ../.venv/bin/activate  # On Windows: ..\.venv\Scripts\activate
   ```

3. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Run Django migrations:

   ```bash
   python manage.py migrate
   ```

5. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

## Mobile Development

### Key Technologies

- **Expo SDK 52** (Latest version with New Architecture support)
- **React Native 0.76**
- **React Navigation 7**
- **UI Kitten** for UI components
- **Expo Router** for navigation

### Available Commands

Use `make help` to see all available commands. Key commands include:

- `make dev` - Start both mobile and backend servers
- `make dev-mobile` - Start Expo development server only
- `make dev-backend` - Start Django development server only
- `make build-android` - Build for Android device
- `make build-ios` - Build for iOS device
- `make setup` - Install all dependencies

## Backend Development

### Key Technologies

- **Django** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL/SQLite** - Database

### Available Commands

- `make dev-backend` - Start development server
- `make migrate` - Apply database migrations
- `make makemigrations` - Create new migrations
- `make superuser` - Create admin user
- `make shell` - Django interactive shell

## Development Workflow

### Full Stack Development

1. **Start both servers simultaneously:**

   ```bash
   make dev
   ```

2. **Or start them individually:**

   ```bash
   # Terminal 1 - Backend
   make dev-backend

   # Terminal 2 - Mobile
   make dev-mobile
   ```

## Deployment

### Mobile App Deployment

The project is configured for Expo Application Services (EAS):

1. **Build for production:**

   ```bash
   make build-mobile
   # or for specific platforms
   make build-android
   make build-ios
   ```

2. **Deploy updates:**
   ```bash
   make update-mobile
   ```

### Backend Deployment

The backend includes Docker configuration:

1. **Using Docker:**
   ```bash
   make docker
   ```

## Configuration Files

### Mobile Configuration

- `mobile/app.json` - Expo configuration
- `mobile/eas.json` - EAS Build configuration
- `mobile/babel.config.mjs` - Babel configuration
- `mobile/metro.config.mjs` - Metro bundler configuration

### Backend Configuration

- `backend/settings.py` - Django settings
- `backend/requirements.txt` - Python dependencies
- `backend/Dockerfile` - Docker configuration
