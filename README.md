# She Can Foundation — Full-Stack Web Application

A premium, modern web application for "She Can Foundation" — a nonprofit empowering women and girls through STEM pathways, 1-on-1 mentorship, and leadership bootcamps.

## Technology Stack

- **Frontend**: React + Vite + TailwindCSS + React Router + Lucide Icons
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose (Submissions schema with auto-generated reference IDs)
- **Auth**: JWT (Admin dashboard login check)

---

## Project Structure

```
she-can-foundation/
├── package.json         # Orchestrates dev/install scripts for both projects
├── .env                 # Configurations (Server, DB, Admin account)
├── README.md            # Setup guidelines
├── server/              # Node.js backend
│   ├── server.js        # Express main configuration & connections
│   ├── middleware/
│   │   └── auth.js      # JWT verify middleware
│   ├── models/
│   │   └── Submission.js# Contact Mongoose Schema
│   └── routes/
│       ├── auth.js      # Admin credentials login check route
│       └── submissions.js# Public submit route & Admin panel endpoints
└── client/              # React frontend (Vite)
    ├── package.json
    ├── index.html       # Configured with Google Fonts (Syne, Outfit, IBM Plex Mono)
    ├── vite.config.js   # Dynamic API proxy proxying client requests to port 5000
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx      # Navigation routing setup
        ├── index.css    # AI Dark Theme globals, glow effects & page animation
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   └── SubmissionDrawer.jsx # Slide-over details pane for admin rows
        └── pages/
            ├── Home.jsx
            ├── About.jsx
            ├── Contact.jsx   # Interactive contact form & Reference ID screen
            ├── Volunteer.jsx
            ├── Donate.jsx
            └── Admin.jsx     # Login screen, stats layout, data tables & CSV exporter
```

---

## Setup & Running Instructions

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas connection string.

### 2. Configure Environment Variables
Create or verify the `.env` file at the root folder (`she-can-foundation/`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/she_can_foundation
JWT_SECRET=she_can_foundation_super_secret_jwt_key_2026_glow
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin12345
```

### 3. Installation
Open a terminal in the project root directory and run the following command to automatically install all dependencies in both the root backend and client projects:
```bash
npm run install-all
```
*(Alternatively, you can manually run `npm install` in the root, then `cd client && npm install`.)*

### 4. Running the Development Server
To launch both the Node/Express backend and the React/Vite dev server concurrently with one command, run:
```bash
npm run dev
```
- **React Frontend**: Runs at `http://localhost:5173` (requests to `/api/*` are automatically proxied to the backend).
- **Express Backend**: Runs at `http://localhost:5000`.

### 5. Accessing the Admin Panel
1. Open your browser and navigate to `/admin` (`http://localhost:5173/admin`).
2. Log in using the credentials configured in your `.env` file:
   - **Username**: `admin`
   - **Password**: `admin12345`
3. Once authorized, you can view statistical aggregates by type, search through submissions (by Name, Email, or Reference ID), filter by type, delete records, view details in a custom slide-over drawer, and export all records to a CSV file.

### 6. Production Build
To bundle the frontend application assets and run them through Express directly:
```bash
# Build Vite files (places bundle in client/dist/)
npm run build

# Start Express server (serves the client/dist folder directly)
npm start
```
Go to `http://localhost:5000` to access the full-stack app in production mode.
