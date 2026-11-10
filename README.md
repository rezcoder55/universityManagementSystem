# University & School Management System API 🎓

A complete, enterprise-ready, type-safe RESTful API for University and School Management built with **Node.js**, **Express 5**, **TypeScript**, and **Prisma ORM** connecting to **PostgreSQL**.

---

## 📑 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Database Schema (ERD Overview)](#database-schema-erd-overview)
- [Standard API Response Format](#standard-api-response-format)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation & Database Setup](#installation--database-setup)
  - [Running the Application](#running-the-application)
- [API Endpoints Reference](#api-endpoints-reference)
  - [Auth](#1-authentication-apiv1auth)
  - [Classes](#2-classes-apiv1classes)
  - [Students](#3-students-apiv1students)
  - [Teachers](#4-teachers-apiv1teachers)
  - [Subjects](#5-subjects-apiv1subjects)
  - [Attendance](#6-attendance-apiv1attendance)
  - [Marks & Grades](#7-marks-apiv1marks)
  - [Fee Vouchers](#8-fee-vouchers-apiv1fee-vouchers)
- [Scripts Reference](#scripts-reference)

---

## 🌟 Overview

The University Management API is designed to manage academic institutions seamlessly. It handles administrative operations, student enrollment, teacher assignments, class schedules, daily attendance tracking, exams & grades evaluation, and fee voucher billing with strict **Role-Based Access Control (RBAC)**.

---

## 🚀 Key Features

* **Authentication & RBAC**: Secure JWT authentication with strict role checks (`ADMIN`, `TEACHER`, `STUDENT`, `PARENT`). Passwords hashed with `bcrypt`.
* **Standardized JSON Responses**: Every endpoint returns a predictable `{ message, status, data }` structure.
* **Automatic Code & Voucher Generation**:
  * Unique Student Codes (e.g. `STU-2026-0001`)
  * Unique Fee Voucher Numbers (e.g. `VOUCH-2026-00001`)
* **Student & Teacher Profiles**: Seamless database transactions linking `User` credentials with academic profiles.
* **Class & Subject Management**: Academic year tracking and many-to-many teacher-class assignments.
* **Attendance Tracking**: Fast upsert operations based on compound unique keys (`studentId + date`) with statuses: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`.
* **Exam Marks & Grading**: Term-based assessments (`MIDTERM`, `FINAL`, `MONTHLY`) linked to individual subjects and students.
* **Financial Management**: Student fee vouchers with due dates, payment timestamps, and status transitions (`PENDING`, `PAID`, `OVERDUE`, `CANCELLED`).
* **Visual Data Preview**: Built-in **Prisma Studio** integration for browsing and managing live database records via a visual dashboard.

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) (ESM) | Native ECMAScript Modules (`"type": "module"`) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type checking with `nodenext` resolution |
| **Framework** | [Express 5](https://expressjs.com/) | Modern web server framework |
| **ORM** | [Prisma 7](https://www.prisma.io/) | Next-gen ORM with `@prisma/adapter-pg` driver adapter |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Relational database storage |
| **Authentication** | [JWT](https://jwt.io/) & [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Stateless token authorization and secure hashing |
| **Dev Engine** | [tsx](https://github.com/privatenumber/tsx) | Ultra-fast TypeScript execution and watch mode |

---

## 📁 Project Architecture

```text
UniversityManagement/
├── University-management-ERD.pdf    # Database Entity-Relationship Diagram
├── README.md                         # Project documentation
└── backend/
    ├── .env                          # Environment variables (DB URL, JWT Secret)
    ├── package.json                  # Scripts and dependencies
    ├── tsconfig.json                 # Strict TypeScript configuration
    ├── prisma.config.ts              # Prisma 7 datasource configuration
    ├── prisma/
    │   └── schema.prisma             # Database models, relations & enums
    └── src/
        ├── app.ts                    # Express application setup & route mounting
        ├── server.ts                 # Server startup and port listening
        ├── config/
        │   └── prisma.ts             # PrismaClient initialization with PostgreSQL adapter
        ├── middlewares/
        │   └── auth.middleware.ts    # JWT token verification and role restriction
        ├── utils/
        │   └── apiResponse.ts       # Unified response helpers (sendSuccess, sendError)
        ├── routes/
        │   ├── auth.routes.ts        # Auth endpoints (/login, /register)
        │   ├── class.routes.ts       # Class management
        │   ├── student.routes.ts     # Student profiles & enrollment
        │   ├── teacher.routes.ts     # Teacher management & class assignments
        │   ├── subject.routes.ts     # Curriculum subjects
        │   ├── attendance.routes.ts  # Attendance logging & class reports
        │   ├── mark.routes.ts        # Exam marks & academic results
        │   └── feeVoucher.routes.ts  # Billing & fee vouchers
        └── controllers/
            ├── auth.controller.ts
            ├── class.controller.ts
            ├── student.controller.ts
            ├── teacher.controller.ts
            ├── subject.controller.ts
            ├── attendance.controller.ts
            ├── mark.controller.ts
            └── feeVoucher.controller.ts
```

---

## 🗄 Database Schema (ERD Overview)

### Models & Enums

* **`Role` Enum**: `ADMIN` | `TEACHER` | `STUDENT` | `PARENT`
* **`AttendanceStatus` Enum**: `PRESENT` | `ABSENT` | `LATE` | `EXCUSED`
* **`FeeStatus` Enum**: `PAID` | `PENDING` | `OVERDUE` | `CANCELLED`

```text
       ┌───────────┐
       │   User    │◄──────────┐
       └─────┬─────┘           │
             │                 │ (1-to-1)
      ┌──────┴──────┐          │
      ▼             ▼          │
┌───────────┐ ┌───────────┐    │
│  Student  │ │  Teacher  │────┘
└─────┬─────┘ └─────┬─────┘
      │ (N-to-1)    │ (N-to-M via TeacherClass)
      ▼             ▼
┌───────────┐ ┌──────────────┐
│   Class   │ │ TeacherClass │
└───────────┘ └──────────────┘
      ▲
      │
┌─────┴───────────────┐
│ Related Modules:    │
│  - Attendance       │ (Student + Date unique key, Teacher reference)
│  - Subject          │ (1-to-many with Marks)
│  - Mark             │ (Student + Subject + ExamType)
│  - FeeVoucher       │ (Student billing, amounts, due dates, statuses)
└─────────────────────┘
```

---

## 📦 Standard API Response Format

All responses strictly follow a uniform 3-key JSON structure:

### Success Response (`200 OK`, `201 Created`)
```json
{
  "message": "User registered successfully",
  "status": "success",
  "data": {
    "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "student@example.com",
    "fullName": "Ahmed Ali",
    "phone": "+201234567890",
    "role": "STUDENT"
  }
}
```

### Error Response (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal`)
```json
{
  "message": "Access denied. No token provided.",
  "status": "error",
  "data": null
}
```

---

## ⚙️ Getting Started

### Prerequisites
* **Node.js** v20+ or v24+
* **PostgreSQL** running locally or remotely (e.g. Docker, Supabase, Neon)

### Environment Configuration

In `backend/.env`, configure your environment variables:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/school_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
```

### Installation & Database Setup

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Push the schema to your PostgreSQL database:
   ```bash
   npx prisma db push
   ```

4. Generate the Prisma Client types:
   ```bash
   npx prisma generate
   ```

### Running the Application

* **Development mode (with hot-reload via tsx)**:
  ```bash
  npm run dev
  ```
  Server runs at: `http://localhost:5000`

* **Visual Database Dashboard (Prisma Studio)**:
  ```bash
  npm run studio
  ```
  Opens in browser at: `http://localhost:5555`

* **Production Build & Start**:
  ```bash
  npm run build
  npm start
  ```

---

## 🔌 API Endpoints Reference

All API routes are prefixed with `/api/v1`.

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register user (`email`, `password`, `fullName`, `phone`, `role`) |
| `POST` | `/api/v1/auth/login` | Public | Login with `email` and `password`, returns JWT token |

### 2. Classes (`/api/v1/classes`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/classes` | Authenticated | Get all classes and student counts |
| `POST` | `/api/v1/classes` | `ADMIN` only | Create class (`name`, `academicYear`) |

### 3. Students (`/api/v1/students`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/students` | `ADMIN`, `TEACHER` | Get all students with class & parent info |
| `POST` | `/api/v1/students` | `ADMIN` only | Create student (`email`, `password`, `fullName`, `phone`, `classId`, optional `parentId`). Automatically assigns student code. |

### 4. Teachers (`/api/v1/teachers`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/teachers` | `ADMIN`, `TEACHER` | Get all teachers and their assigned classes |
| `POST` | `/api/v1/teachers` | `ADMIN` only | Create teacher with specialization and optional initial classes |
| `POST` | `/api/v1/teachers/:teacherId/assign-classes` | `ADMIN` only | Assign teacher to an array of class IDs (`classIds: string[]`) |

### 5. Subjects (`/api/v1/subjects`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/subjects` | Authenticated | List all curriculum subjects |
| `POST` | `/api/v1/subjects` | `ADMIN` only | Create a new subject (`name`, `code`, optional `description`) |

### 6. Attendance (`/api/v1/attendance`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/attendance` | `ADMIN`, `TEACHER` | Record or bulk upsert student attendance (`classId`, `date`, `records: [{ studentId, status }]`) |
| `GET` | `/api/v1/attendance/class/:classId` | `ADMIN`, `TEACHER` | Get attendance for a class (optional filter `?date=YYYY-MM-DD`) |

### 7. Marks (`/api/v1/marks`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/marks` | `ADMIN`, `TEACHER` | Record student mark (`studentId`, `subjectId`, `examType`, `marksObtained`, `maxMarks`, `term`) |
| `GET` | `/api/v1/marks/student/:studentId` | Authenticated | Get all marks and subjects for a specific student |

### 8. Fee Vouchers (`/api/v1/fee-vouchers`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/fee-vouchers` | `ADMIN` only | Create a fee voucher (`studentId`, `amount`, `dueDate`, `title`, optional `description`). Automatically generates voucher number. |
| `PATCH` | `/api/v1/fee-vouchers/:id/status` | `ADMIN` only | Update voucher status (`status`: `PAID`, `PENDING`, `OVERDUE`, `CANCELLED`, optional `paymentDate`) |
| `GET` | `/api/v1/fee-vouchers/student/:studentId` | Authenticated | Get all fee vouchers for a specific student |

---

## 📜 Scripts Reference

Run these commands inside the `backend/` directory:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Runs the server in development mode using `tsx watch` |
| `build` | `npm run build` | Compiles TypeScript source files into `./dist` |
| `start` | `npm run start` | Runs the compiled production code with `node dist/server.js` |
| `studio` | `npm run studio` | Launches Prisma Studio dashboard at `http://localhost:5555` |

---

## 🛡 License
This project is licensed under the **ISC License**.

