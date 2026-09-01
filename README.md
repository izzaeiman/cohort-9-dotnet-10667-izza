# Task Management Tool

## Overview
The Task Management Tool is a full-stack web application designed to help teams organize, track, and manage their daily tasks. The application supports role-based user management (Administrators and Regular Users), structured task creation, custom priority and category assignments, user profile personalization, and an interactive dashboard summarizing workflow performance.

---

## Technology Stack
- **Backend**: ASP.NET Core Web API (running on .NET 10)
- **Frontend**: React.js, TypeScript, Vite
- **Database / ORM**: SQL Server, Entity Framework Core (EF Core)
- **Logging**: Serilog
- **Unit Testing**: xUnit, Moq
- **Code Quality**: SonarQube

---

## Features
- **User Authentication**: Secure user registration and login utilizing Bcrypt password hashing.
- **JWT Authorization**: Cryptographically signed JWT bearer tokens validate client requests.
- **Role-Based Access Control**:
  - **Administrators**: Full access to create, view, update, assign, and delete any task across the system, as well as view member directories.
  - **Regular Users**: Read, update, and delete tasks assigned to them; cannot view or modify other users' tasks or reassign tasks.
- **Task Management**: Full CRUD operations with fields for title, description, priority (Low, Medium, High), status (Pending, In Progress, Completed), category, and due date.
- **Dashboard Metrics**: Summary cards displaying real-time task counts grouped by status.
- **User Profile & Settings (Mock/Local-only)**: Access and update user information, with secure sign-out functionality. Profile and Settings are currently mock/local-only and are not connected to backend/database APIs. These features are planned for a later development phase.
- **Serilog Logging**: Structured application event logging (excludes raw passwords, hashes, and secrets).
- **Global Exception Handling**: Exception middleware intercepts server errors globally, returning safe generic error payloads to clients while logging detailed traces internally.

---

## Project Structure
- `Backend/`: ASP.NET Core Web API project (controllers, repositories, services, DTOs, migrations, and program configuration).
- `Backend.Tests/`: xUnit unit test project (controllers and services mock-based assertions).
- `frontend/`: Single Page Application (React, TypeScript, CSS modules, Axios client).
- `sonar-project.properties`: Standard configuration file for SonarScanner.

---

## Setup & Configuration

### 1. Database Setup
The application is configured to connect to SQL Server. Update the connection string under `ConnectionStrings:DefaultConnection` in `Backend/appsettings.json` if necessary.

To apply database migrations and seed the initial schema:
```powershell
# Run from the repository root
dotnet ef database update --project Backend/Backend.csproj
```

### 2. Running the Backend
Set your JWT signing key environment variable, then start the API server:
```powershell
# Set JWT signing key (minimum 32 bytes)
$env:JWT_KEY="YourSuperSecretJWTKeyMustBeAtLeast32BytesLong"

# Start the ASP.NET Core Web API
dotnet run --project Backend/Backend.csproj
```
The API server runs by default on `http://localhost:5275`.

### 3. Running the Frontend
Install dependencies and start the Vite development server:
```bash
# Navigate to the frontend directory
cd frontend

# Install package dependencies
npm install

# Start Vite dev server
npm run dev
```
The frontend application will be accessible at `http://localhost:5173`. Ensure `VITE_API_BASE_URL` in your `.env` or development variables points to `http://localhost:5275/api`.

---

## Verification & Testing

### Backend Unit Tests
To execute all backend unit tests:
```powershell
# Run from repository root
dotnet test Backend.Tests/Backend.Tests.csproj
```

### Frontend Type-Checking & Build
To verify TypeScript compilation and build the production bundle:
```bash
# From the frontend directory
npx tsc --noEmit
npm run build
```

---

## SonarQube Quality Scan
A pre-configured `sonar-project.properties` is provided in the project root. To run a scan, start your local SonarQube Server and execute:
```powershell
dotnet sonarscanner begin /k:"task-management-tool" /d:sonar.host.url="http://localhost:9000" /d:sonar.token="YOUR_SONAR_TOKEN"
dotnet build Backend/Backend.csproj
dotnet test Backend.Tests/Backend.Tests.csproj
dotnet sonarscanner end /d:sonar.token="YOUR_SONAR_TOKEN"
```
Ensure that local build caches, `node_modules/`, `bin/`, `obj/`, and `.sonarqube/` are ignored in your execution context (pre-configured via exclusions in `sonar-project.properties` and `.gitignore`).
