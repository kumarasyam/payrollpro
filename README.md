# PayrollPro - Modern Payroll Management System

A comprehensive, full-stack Payroll Management System designed to handle employee records, attendance tracking, leave applications, and automated payslip generation.

## 🚀 Key Features

### 👨‍💼 For Administrators (HR/Management)
- **Employee Management:** Add, edit, and manage comprehensive employee profiles.
- **Department Controls:** Define organizational structure, heads, and view departmental budgets.
- **Attendance Tracking:** Monitor daily presence, half-days, leaves, and calculate overtime.
- **Leave Management:** Approve or reject leave applications submitted by employees.
- **Salary & Payroll:** Define salary structures, approve increment requests, and generate monthly payslips.
- **Analytics & Reports:** View high-level metrics, total payroll costs, and department-wise summaries.

### 🧑‍💻 For Employees
- **Self-Service Portal:** View personal details, department, and current salary.
- **My Attendance:** Check monthly attendance records and recorded check-in/out times.
- **Apply for Leave:** Submit leave requests and track approval status.
- **Download Payslips:** View and download monthly generated salary slips.
- **Salary Requests:** Request raises, advances, or bonuses with justifications.

---

## 🛠️ Technology Stack

- **Frontend:** React (Vite), Tailwind CSS, Framer Motion (Animations), Radix UI
- **Backend API:** Node.js, Express.js
- **Database:** Microsoft SQL Server (SSMS)
- **Authentication:** Local sessions & Windows Authentication (for DB)

---

## ⚙️ Architecture (Dual Mode)

PayrollPro is designed with a **Smart Fallback** resilient architecture:

1. **Connected Mode:** The React frontend connects to the Express API (port `5000`), which reads/writes live data directly from the Microsoft SQL Server database.
2. **Standalone Model (LocalStorage Fallback):** If the API server or Database is offline, the React frontend seamlessly falls back to browser `localStorage` to ensure continuous operation and demonstration capability.

---

## 💻 Installation & Setup

### Prerequisites
- Node.js (v18+)
- Microsoft SQL Server Management Studio (SSMS 2022)

### 1. Database Setup
1. Open SQL Server Management Studio (SSMS).
2. Connect to your local SQL Server instance (e.g., `localhost\SQLEXPRESS`).
3. Under the Object Explorer, right-click **Databases** > **New Database...**.
4. Name the database exactly: **`PayrollProDB`** and click **OK**.
5. Open the `PayrollPro_Database.sql` file provided in the repository root.
6. Execute (**F5**) the script. This will create all tables, stored procedures, and seed the database with **69 employees, 8 departments**, and sample data.

### 2. Backend Configuration
1. Rename or create a `.env` file in the project root:
   ```env
   DB_SERVER=localhost\SQLEXPRESS
   DB_NAME=PayrollProDB
   PORT=5000
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### 3. Running the Application
To run *both* the Node.js API server and the React frontend simultaneously:

```bash
npm run dev:full
```

- **Frontend App:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api`

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@payrollpro.com` | `admin123` |
| **Employee** | `rahul.sharma@payrollpro.com` | `emp123` |

*(Note: All seeded employee accounts use `emp123` as the default password for ease of testing)*

---

## 📁 Project Structure

```text
/
├── server/
│   ├── index.js             # Express API server entry & routes
│   └── db.js                # SQL Server connection & pool
├── src/
│   ├── api/                 # base44Client.js (API client & local fallbacks)
│   ├── components/          # Reusable UI components (Forms, Tables, ui/)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Main React routes (Dashboard, Employees, etc.)
│   ├── utils/               # Helper functions
│   ├── App.jsx              # Main React Application component
│   ├── Layout.jsx           # App layout wrapper (Sidebar, Header)
│   ├── index.css            # Tailwind & global styles
│   └── main.jsx             # React DOM rendering entry
├── entities/                # Base44 SDK entity models
├── .env                     # Database config settings
├── PayrollPro_Database.sql  # Complete DB schema + Dummy data
├── package.json             # Scripts & dependencies
├── tailwind.config.js       # Tailwind CSS configuration
└── vite.config.js           # Vite bundler configuration
```
