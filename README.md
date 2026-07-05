# Markly - Role-Based Attendance Tracking Platform
Deployed version - [Markly](#)

Markly is a role-based attendance tracking and management platform tailored for educational or organizational settings. Designed to streamline attendance processes, it features distinct access roles for students, leads, and faculty. Students can track their attendance, leads can create meetings and mark attendance, and faculty can seamlessly resolve attendance conflicts. Integrated with Firebase for secure authentication and supported by an Express backend for notifications, Markly empowers organizations to manage attendance efficiently and transparently.

## Table of Contents
- [Overview and Architecture](#overview-and-architecture)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Tech Stack](#tech-stack)

## Overview and Architecture

### Overview:
In response to the challenges faced by educational institutions and organizations in accurately tracking attendance and resolving discrepancies, we propose the development of Markly, an integrated Attendance Management Platform. This platform leverages role-based access control and real-time updates to streamline the attendance marking process, enhance accountability, and provide seamless communication through automated notifications.

### Key Features:
- **Role-Based Access Control:** Secure and distinct interfaces for Students, Leads, and Faculty, ensuring users only access authorized functionalities.
- **Attendance Management:** Leads can effortlessly create meetings and mark attendee presence, while students can track their own attendance records.
- **Conflict Resolution:** A dedicated dashboard for Faculty to review and resolve any attendance discrepancies or conflicts.
- **Members Directory:** A centralized directory accessible by Leads and Faculty to manage and view user profiles.
- **Secure Authentication:** Robust user login, registration, and role verification powered by Firebase.
- **Automated Notifications:** Backend integration with Nodemailer and Twilio for potential email and SMS alerts regarding meetings and attendance updates.
- **Interactive UI:** A highly responsive and intuitive user interface built with React, TypeScript, and Vite.

### Architecture:

**Architecture Diagram**
[Markly Architecture Image]

| Component | Functionality |
| :--- | :--- |
| **React Frontend** | - Displays role-specific dashboards and handles user interactions.<br>- Manages state and routing using React Router.<br>- Handles user authentication via Firebase. |
| **Express Node Backend** | - Securely orchestrates notification requests (Email/SMS).<br>- Acts as an intermediate service for external API integrations (Twilio, Nodemailer). |
| **Firebase Auth & DB** | - Authenticates users and manages sessions.<br>- Stores and synchronizes attendance, meeting, and user profile data in real-time. |
| **Twilio API** | - Facilitates SMS notifications for users (via backend). |
| **Nodemailer** | - Manages email dispatch for automated alerts (via backend). |

## Installation

Clone the repository:
```bash
git clone https://github.com/shravdalvi/Markly.git
```

Install dependencies for the frontend:
```bash
npm install
```

Install dependencies for the backend:
```bash
cd backend
npm install
```

## Setup

### Run the frontend:
After installation navigate to the root directory. Ensure your environment variables are configured (e.g., Firebase config in `.env.local`). Run the following command to start the frontend:
```bash
npm run dev
```
Open your web browser and go to `http://localhost:5173` to access the application.

### Run the backend:
After installation navigate to the `backend` directory. Locate or create a `.env` file based on your environment requirements (e.g., adding Twilio or Nodemailer credentials). Run the following command to start the backend:
```bash
npm start
```

## Usage

**Test Users:**

- **Student User**
  - username: student_1
  - email: student@gmail.com
  - password: student@123

- **Lead User**
  - username: lead_1
  - email: lead@gmail.com
  - password: lead@123

- **Faculty User**
  - username: faculty_1
  - email: faculty@gmail.com
  - password: faculty@123

*(Update the above with your actual test credentials if needed)*

**Demo:**
Video link - [Your Demo Video Link Here]

### Images

**Landing Page**
<br><br>

**Login**
<br><br>

**Signup**
<br><br>

**Student Dashboard & Attendance**
<br><br>

**Lead Dashboard & Create Meeting**
<br><br>

**Lead Mark Attendance**
<br><br>

**Faculty Conflicts Resolution**
<br><br>

**Members Directory**
<br><br>

## API Documentation
Link: http://localhost:5000/api

## Tech Stack
JavaScript TypeScript Node.js Express.js React Vite Firebase HTML5 CSS3 Twilio Nodemailer

**Additional:**
- Twilio API
- Nodemailer
- Demonstration Video link - [Your Video Link Here]
