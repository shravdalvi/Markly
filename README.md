# Markly - Verifiable Committee Attendance & Conflict Resolution Platform
Deployed version - [Markly](https://markly-rouge.vercel.app/#/login)

Markly is a role-based attendance tracking platform specifically designed to bridge the trust gap between students, committee leads, and professors. Frequently, college students participating in university committees are forced to miss regular lectures to attend official committee meetings, leading to attendance shortages. When a student claims they were at a committee meeting mid-lecture, professors rightfully require verifiable proof to excuse the absence. Markly provides a verified, transparent system where Committee Leads log official meeting attendance, Students can track and present their verifiable participation, and Professors (Faculty) can confidently resolve attendance conflicts based on transparent records. Integrated with Firebase for secure authentication and supported by an Express backend for notifications, Markly ensures a smooth and accountable attendance process across the institution.

## Table of Contents
- [Overview and Architecture](#overview-and-architecture)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Tech Stack](#tech-stack)

## Overview and Architecture

### Overview:
College students actively involved in student committees frequently face attendance shortages because they miss lectures to attend official committee meetings. When students claim they were at a meeting, professors rightfully require proof to excuse the absence. Markly was developed to solve this exact problem. By providing a secure, role-based platform, Markly allows committee leads to officially track meeting attendance. This creates a verifiable record that students can present, and professors can trust, effectively resolving attendance disputes and enhancing accountability across the institution.

### Key Features:
- **Role-Based Access Control:** Secure and distinct interfaces tailored to the three primary stakeholders: Students (Committee Members), Committee Leads, and Professors (Faculty).
- **Verifiable Attendance Logging:** Committee Leads can effortlessly create official meetings and mark attendee presence, creating an immutable log of who attended the committee meeting.
- **Student Proof of Attendance:** Students can track their own attendance records and use this dashboard as transparent proof of their whereabouts during a missed lecture.
- **Professor Conflict Resolution Dashboard:** A dedicated dashboard for Professors to review submitted attendance discrepancies, verify a student's committee participation, and seamlessly resolve conflicts.
- **Members Directory:** A centralized directory accessible by Leads and Faculty to manage and view verified user profiles.
- **Secure Authentication:** Robust user login, registration, and role verification powered by Firebase.
- **Automated Notifications:** Backend integration with Nodemailer and Twilio for email and SMS alerts regarding meetings and attendance updates.
- **Interactive UI:** A highly responsive and intuitive user interface built with React, TypeScript, and Vite.

### Architecture:

**Architecture Diagram**
[Markly Architecture Image]

| Component | Functionality |
| :--- | :--- |
| **React Frontend** | - Displays role-specific dashboards (Student, Lead, Professor) and handles user interactions.<br>- Manages state and routing using React Router.<br>- Handles user authentication via Firebase. |
| **Express Node Backend** | - Securely orchestrates notification requests (Email/SMS).<br>- Acts as an intermediate service for external API integrations (Twilio, Nodemailer). |
| **Firebase Auth & DB** | - Authenticates users and manages sessions.<br>- Stores and synchronizes attendance, meeting logs, and user profile data in real-time. |
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

- **Student User - 1**
  - email: student01@gmail.com
  - password: stu@123
  
- **Student User - 2**
  - email: student02@gmail.com
  - password: stu@123

- **Lead User - 1**
  - email: lead@gmail.com
  - password: lead@123

- **Lead User - 2**
  - email: lead2@gmail.com
  - password: lead@123

- **Faculty User**
  - email: prof@gmail.com
  - password: prof@123


**Demo:**
Video link - [https://youtu.be/xTUwSkZ48Ic]

### Images

**Landing Page**
<br><br>

**Login**
<br><br>

**Signup**
<br><br>

**Student Dashboard & Attendance Proof**
<br><br>

**Lead Dashboard & Create Committee Meeting**
<br><br>

**Lead Mark Official Attendance**
<br><br>

**Professor Conflicts Resolution**
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
- Demonstration Video link - [https://youtu.be/xTUwSkZ48Ic]
