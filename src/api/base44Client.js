/**
 * App Client — API-based data layer
 * Connects React frontend to the Express API server,
 * which connects to SQL Server (PayrollProDB).
 *
 * Falls back to localStorage if the API server is not running.
 */

const API_BASE = 'http://localhost:5000/api';
const SESSION_KEY = 'payrollpro_session';

// ============================================================
// Helper: Make API requests
// ============================================================
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  /** @type {RequestInit} */
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
}


// ============================================================
// Entity Store — talks to Express API
// ============================================================
function createEntityStore(apiPath) {
  return {
    async list(sortField, limit) {
      try {
        let items = await apiFetch(`/${apiPath}`);
        if (sortField) {
          const desc = sortField.startsWith('-');
          const field = desc ? sortField.slice(1) : sortField;
          items.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            return desc ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
          });
        }
        if (limit) items = items.slice(0, limit);
        return items;
      } catch (err) {
        console.warn(`API unavailable for ${apiPath}, using localStorage fallback`);
        return this._fallbackList(sortField, limit);
      }
    },

    async filter(filters, sortField) {
      try {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([k, v]) => params.append(k, v));
        }
        if (sortField) params.append('_sort', sortField);
        const items = await apiFetch(`/${apiPath}/filter?${params.toString()}`);
        return items;
      } catch (err) {
        console.warn(`API unavailable for ${apiPath}, using localStorage fallback`);
        return this._fallbackFilter(filters, sortField);
      }
    },

    async create(data) {
      try {
        return await apiFetch(`/${apiPath}`, { method: 'POST', body: data });
      } catch (err) {
        console.warn(`API unavailable for ${apiPath}, using localStorage fallback`);
        return this._fallbackCreate(data);
      }
    },

    async update(id, data) {
      try {
        return await apiFetch(`/${apiPath}/${id}`, { method: 'PUT', body: data });
      } catch (err) {
        console.warn(`API unavailable for ${apiPath}, using localStorage fallback`);
        return this._fallbackUpdate(id, data);
      }
    },

    async delete(id) {
      try {
        return await apiFetch(`/${apiPath}/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn(`API unavailable for ${apiPath}, using localStorage fallback`);
        return this._fallbackDelete(id);
      }
    },

    // ── localStorage Fallbacks ──────────────────────
    _getStorageKey() {
      const map = {
        'employees': 'Employee',
        'departments': 'Department',
        'leaves': 'LeaveApplication',
        'payslips': 'Payslip',
        'salary-approvals': 'SalaryApproval',
        'attendance': 'Attendance',
      };
      return `payrollpro_${map[apiPath] || apiPath}`;
    },

    _getAllLocal() {
      try {
        const data = localStorage.getItem(this._getStorageKey());
        return data ? JSON.parse(data) : [];
      } catch { return []; }
    },

    _saveAllLocal(items) {
      localStorage.setItem(this._getStorageKey(), JSON.stringify(items));
    },

    _fallbackList(sortField, limit) {
      let items = this._getAllLocal();
      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = desc ? sortField.slice(1) : sortField;
        items.sort((a, b) => {
          const aVal = a[field] || '';
          const bVal = b[field] || '';
          return desc ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
        });
      }
      if (limit) items = items.slice(0, limit);
      return items;
    },

    _fallbackFilter(filters, sortField) {
      let items = this._getAllLocal();
      if (filters) {
        items = items.filter(item =>
          Object.entries(filters).every(([key, value]) => item[key] === value)
        );
      }
      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = desc ? sortField.slice(1) : sortField;
        items.sort((a, b) => {
          const aVal = a[field] || '';
          const bVal = b[field] || '';
          return desc ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
        });
      }
      return items;
    },

    _fallbackCreate(data) {
      const items = this._getAllLocal();
      const newItem = {
        ...data,
        id: crypto.randomUUID(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      items.push(newItem);
      this._saveAllLocal(items);
      return newItem;
    },

    _fallbackUpdate(id, data) {
      const items = this._getAllLocal();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) throw new Error('Not found');
      items[index] = { ...items[index], ...data, updated_date: new Date().toISOString() };
      this._saveAllLocal(items);
      return items[index];
    },

    _fallbackDelete(id) {
      const items = this._getAllLocal();
      this._saveAllLocal(items.filter(item => item.id !== id));
      return { success: true };
    },
  };
}


// ============================================================
// Auth System — API-based with localStorage session
// ============================================================
function createAuth() {
  return {
    async login(email, password) {
      try {
        const user = await apiFetch('/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
      } catch (err) {
        // Fallback to localStorage auth
        return this._fallbackLogin(email, password);
      }
    },

    async register({ email, password, full_name, role = 'employee' }) {
      try {
        const user = await apiFetch('/auth/register', {
          method: 'POST',
          body: { email, password, full_name, role },
        });
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
      } catch (err) {
        // Fallback to localStorage auth
        return this._fallbackRegister({ email, password, full_name, role });
      }
    },

    async me() {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) throw { status: 401, message: 'Not authenticated' };
      return JSON.parse(session);
    },

    isLoggedIn() {
      return !!localStorage.getItem(SESSION_KEY);
    },

    logout(redirectUrl) {
      localStorage.removeItem(SESSION_KEY);
      if (redirectUrl) window.location.href = redirectUrl;
    },

    redirectToLogin() { /* Handled by React */ },

    async getAllUsers() {
      try {
        return await apiFetch('/auth/users');
      } catch {
        const users = JSON.parse(localStorage.getItem('payrollpro_users') || '[]');
        return users.map(({ password, ...u }) => u);
      }
    },

    // ── localStorage Fallbacks ──────────────────────
    _fallbackLogin(email, password) {
      const users = JSON.parse(localStorage.getItem('payrollpro_users') || '[]');
      const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!user) throw new Error('Invalid email or password');
      const { password: _, ...sessionUser } = user;
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    },

    _fallbackRegister({ email, password, full_name, role }) {
      const users = JSON.parse(localStorage.getItem('payrollpro_users') || '[]');
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('A user with this email already exists');
      }
      const newUser = {
        id: crypto.randomUUID(), email, password, full_name, role,
        created_date: new Date().toISOString(),
      };
      users.push(newUser);
      localStorage.setItem('payrollpro_users', JSON.stringify(users));

      if (role === 'employee') {
        const employees = JSON.parse(localStorage.getItem('payrollpro_Employee') || '[]');
        employees.push({
          id: `e-${crypto.randomUUID().slice(0, 8)}`,
          full_name,
          email,
          phone: '',
          department: 'Unassigned',
          designation: 'New Joiner',
          date_of_joining: new Date().toISOString().split('T')[0],
          base_salary: 0,
          salary: 0,
          leave_balance: 24,
          status: 'active',
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        });
        localStorage.setItem('payrollpro_Employee', JSON.stringify(employees));
      }

      const { password: _, ...sessionUser } = newUser;
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    },
  };
}


// ============================================================
// Seed localStorage fallback data (only if API server is down)
// ============================================================
const SEED_FLAG = 'payrollpro_seeded_v3';

function seedLocalFallbackData() {
  if (localStorage.getItem(SEED_FLAG)) return;

  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  const toEmail = (name) => {
    const parts = name.toLowerCase().split(' ');
    return parts[0] + '.' + parts[parts.length - 1] + '@payrollpro.com';
  };
  const randomJoinDate = (i) => {
    const y = 2021 + (i % 5), m = String(1 + (i % 12)).padStart(2, '0'), d = String(1 + (i * 7) % 28).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const genPhone = (i) => `+91 ${String(90000 + i * 1111).slice(0, 5)} ${String(10000 + i * 777).slice(0, 5)}`;

  const allEmployees = [
    ['Rahul Sharma', 'Engineering', 'Senior Developer', 75000],
    ['Anita Desai', 'Engineering', 'Full Stack Developer', 60000],
    ['Suresh Patel', 'Human Resources', 'HR Manager', 65000],
    ['Deepika Nair', 'Finance', 'Accountant', 55000],
    ['Arjun Reddy', 'Marketing', 'Marketing Executive', 50000],
    ['Kavitha Iyer', 'Operations', 'Operations Lead', 70000],
    ['Manoj Kumar', 'Engineering', 'Junior Developer', 40000],
    ['Pooja Gupta', 'Finance', 'Finance Analyst', 52000],
    ['Vikram Singh', 'Engineering', 'Software Engineer', 58000],
    ['Neha Verma', 'Marketing', 'SEO Specialist', 45000],
    ['Rohit Agarwal', 'Sales', 'Sales Executive', 48000],
    ['Priya Menon', 'HR', 'HR Executive', 42000],
    ['Kiran Das', 'IT Support', 'System Administrator', 55000],
    ['Sneha Kapoor', 'Finance', 'Auditor', 60000],
    ['Ajay Mishra', 'Engineering', 'Backend Developer', 62000],
    ['Meena Joshi', 'Operations', 'Operations Manager', 68000],
    ['Varun Mehta', 'Marketing', 'Digital Marketer', 46000],
    ['Nikhil Jain', 'Sales', 'Sales Manager', 66000],
    ['Aditi Rao', 'Engineering', 'Frontend Developer', 57000],
    ['Rakesh Yadav', 'IT Support', 'Network Engineer', 54000],
    ['Divya Sharma', 'Finance', 'Finance Manager', 72000],
    ['Tarun Khanna', 'Engineering', 'DevOps Engineer', 63000],
    ['Anjali Gupta', 'HR', 'HR Assistant', 38000],
    ['Sunil Verma', 'Operations', 'Supervisor', 49000],
    ['Pankaj Bansal', 'Sales', 'Sales Associate', 41000],
    ['Ritu Sharma', 'Marketing', 'Content Writer', 44000],
    ['Abhishek Tiwari', 'Engineering', 'QA Engineer', 50000],
    ['Shalini Nair', 'Finance', 'Accounts Executive', 47000],
    ['Gaurav Kapoor', 'IT Support', 'Technical Support', 43000],
    ['Mohit Jain', 'Engineering', 'Software Engineer', 56000],
    ['Nisha Patel', 'Marketing', 'Social Media Manager', 52000],
    ['Amit Kumar', 'Sales', 'Business Development Executive', 53000],
    ['Rekha Reddy', 'HR', 'Recruitment Specialist', 48000],
    ['Sanjay Gupta', 'Operations', 'Logistics Manager', 61000],
    ['Alok Singh', 'Engineering', 'Data Engineer', 64000],
    ['Pooja Sharma', 'Finance', 'Tax Consultant', 59000],
    ['Naveen Kumar', 'IT Support', 'IT Manager', 69000],
    ['Kavya Iyer', 'Marketing', 'Brand Manager', 67000],
    ['Rajesh Patel', 'Sales', 'Regional Sales Manager', 74000],
    ['Deepak Verma', 'Engineering', 'Machine Learning Engineer', 76000],
    ['Ananya Das', 'HR', 'HR Coordinator', 45000],
    ['Manish Yadav', 'Operations', 'Operations Executive', 47000],
    ['Rohan Kapoor', 'Engineering', 'Mobile App Developer', 58000],
    ['Shruti Mehta', 'Finance', 'Budget Analyst', 55000],
    ['Arvind Kumar', 'IT Support', 'Helpdesk Engineer', 41000],
    ['Swati Gupta', 'Marketing', 'Campaign Manager', 62000],
    ['Harish Patel', 'Sales', 'Sales Coordinator', 44000],
    ['Karthik Reddy', 'Engineering', 'Software Architect', 85000],
    ['Bhavana Nair', 'HR', 'Talent Acquisition', 51000],
    ['Prakash Singh', 'Operations', 'Warehouse Manager', 57000],
    ['Shyam Kumar', 'Engineering', 'Cloud Engineer', 66000],
    ['Neelam Sharma', 'Finance', 'Payroll Specialist', 54000],
    ['Vijay Mishra', 'IT Support', 'Security Analyst', 60000],
    ['Jyoti Verma', 'Marketing', 'PR Manager', 63000],
    ['Rajiv Agarwal', 'Sales', 'Territory Manager', 65000],
    ['Sunita Patel', 'HR', 'HR Business Partner', 70000],
    ['Aditya Rao', 'Engineering', 'Data Scientist', 80000],
    ['Kunal Mehta', 'Engineering', 'Backend Developer', 59000],
    ['Priti Singh', 'Finance', 'Financial Planner', 58000],
    ['Sandeep Kumar', 'Operations', 'Operations Analyst', 52000],
    ['Vivek Sharma', 'IT Support', 'IT Technician', 39000],
    ['Ritu Agarwal', 'Marketing', 'Marketing Analyst', 50000],
    ['Ashok Yadav', 'Sales', 'Sales Consultant', 48000],
    ['Ramesh Patel', 'Engineering', 'System Engineer', 57000],
    ['Shobha Nair', 'Finance', 'Senior Accountant', 68000],
    ['Devendra Singh', 'Operations', 'Supply Chain Manager', 71000],
    ['Arpita Das', 'HR', 'HR Executive', 46000],
    ['Kiran Reddy', 'Engineering', 'Full Stack Developer', 61000],
    ['Mahesh Kumar', 'IT Support', 'Network Administrator', 56000],
  ];

  // Users
  const users = JSON.parse(localStorage.getItem('payrollpro_users') || '[]');
  if (users.length === 0) {
    const userList = [
      { id: 'admin-001', email: 'admin@payrollpro.com', password: 'admin123', full_name: 'Admin User', role: 'admin', created_date: now },
    ];
    allEmployees.forEach(([name], i) => {
      userList.push({ id: `emp-${String(i + 1).padStart(3, '0')}`, email: toEmail(name), password: 'emp123', full_name: name, role: 'employee', created_date: now });
    });
    localStorage.setItem('payrollpro_users', JSON.stringify(userList));
  }

  // Departments
  const dk = 'payrollpro_Department';
  if (!localStorage.getItem(dk) || JSON.parse(localStorage.getItem(dk)).length === 0) {
    localStorage.setItem(dk, JSON.stringify([
      { id: 'dept-001', name: 'Engineering', head: 'Ravi Kumar', description: 'Software Development & Engineering team', created_date: now, updated_date: now },
      { id: 'dept-002', name: 'Human Resources', head: 'Priya Sharma', description: 'HR, Recruitment & Employee Relations', created_date: now, updated_date: now },
      { id: 'dept-003', name: 'Finance', head: 'Anil Mehta', description: 'Accounting, Payroll & Financial Planning', created_date: now, updated_date: now },
      { id: 'dept-004', name: 'Marketing', head: 'Sneha Reddy', description: 'Brand, Digital Marketing & Communications', created_date: now, updated_date: now },
      { id: 'dept-005', name: 'Operations', head: 'Vikram Singh', description: 'Business Operations & Logistics', created_date: now, updated_date: now },
      { id: 'dept-006', name: 'Sales', head: 'Nikhil Jain', description: 'Sales, Business Development & Revenue', created_date: now, updated_date: now },
      { id: 'dept-007', name: 'IT Support', head: 'Naveen Kumar', description: 'IT Infrastructure, Support & Security', created_date: now, updated_date: now },
      { id: 'dept-008', name: 'HR', head: 'Sunita Patel', description: 'Human Resources Operations & Talent Management', created_date: now, updated_date: now },
    ]));
  }

  // Employees
  const ek = 'payrollpro_Employee';
  if (!localStorage.getItem(ek) || JSON.parse(localStorage.getItem(ek)).length === 0) {
    localStorage.setItem(ek, JSON.stringify(allEmployees.map(([name, dept, desig, salary], i) => ({
      id: `e-${String(i + 1).padStart(3, '0')}`, full_name: name, email: toEmail(name), phone: genPhone(i),
      department: dept, designation: desig, date_of_joining: randomJoinDate(i),
      base_salary: salary, salary: salary, leave_balance: 24, status: 'active', created_date: now, updated_date: now,
    }))));
  }

  // Payslips
  const pk = 'payrollpro_Payslip';
  if (!localStorage.getItem(pk) || JSON.parse(localStorage.getItem(pk)).length === 0) {
    localStorage.setItem(pk, JSON.stringify(allEmployees.map(([name, dept, , salary], i) => {
      const hra = Math.round(salary * 0.10), gross = salary + hra + 350;
      const tax = Math.round(gross * 0.10), pf = Math.round(salary * 0.12);
      return {
        id: `ps-${String(i + 1).padStart(3, '0')}`, employee_name: name, employee_email: toEmail(name),
        department: dept, month: 'February 2026', base_salary: salary, hra, transport_allowance: 200,
        medical_allowance: 150, bonus: 0, gross_salary: gross, tax_deduction: tax, provident_fund: pf,
        other_deductions: 0, total_deductions: tax + pf, net_salary: gross - tax - pf, status: 'paid',
        created_date: now, updated_date: now
      };
    })));
  }

  // Attendance
  const ak = 'payrollpro_Attendance';
  if (!localStorage.getItem(ak) || JSON.parse(localStorage.getItem(ak)).length === 0) {
    const sts = ['present', 'present', 'present', 'present', 'present', 'present', 'absent', 'half_day', 'on_leave', 'present'];
    localStorage.setItem(ak, JSON.stringify(allEmployees.map(([name, dept], i) => {
      const st = sts[i % sts.length], isW = st === 'present' || st === 'half_day';
      const ciH = 8 + (i % 3), ciM = (i * 5) % 60, coH = st === 'half_day' ? 13 : 17 + (i % 3), coM = (i * 7) % 60;
      const w = isW ? Math.round(((coH + coM / 60) - (ciH + ciM / 60)) * 10) / 10 : 0;
      return {
        id: `att-${String(i + 1).padStart(3, '0')}`, employee_name: name, employee_email: toEmail(name),
        department: dept, date: today, status: st,
        check_in: isW ? `${String(ciH).padStart(2, '0')}:${String(ciM).padStart(2, '0')}` : null,
        check_out: isW ? `${String(coH).padStart(2, '0')}:${String(coM).padStart(2, '0')}` : null,
        worked_hours: w, overtime_hours: isW ? Math.max(0, Math.round((w - 8) * 10) / 10) : 0,
        notes: st === 'absent' ? 'Not available' : st === 'on_leave' ? 'On leave' : '', created_date: now, updated_date: now
      };
    })));
  }

  // Leave Applications & Salary Approvals (keep simple)
  const lk = 'payrollpro_LeaveApplication';
  if (!localStorage.getItem(lk) || JSON.parse(localStorage.getItem(lk)).length === 0) {
    localStorage.setItem(lk, JSON.stringify([
      { id: 'lv-001', employee_name: 'Rahul Sharma', employee_email: toEmail('Rahul Sharma'), department: 'Engineering', leave_type: 'casual', start_date: '2026-03-10', end_date: '2026-03-11', days: 2, reason: 'Personal work', status: 'pending', created_date: now, updated_date: now },
      { id: 'lv-002', employee_name: 'Anita Desai', employee_email: toEmail('Anita Desai'), department: 'Engineering', leave_type: 'sick', start_date: '2026-03-05', end_date: '2026-03-06', days: 2, reason: 'Fever and cold', status: 'approved', approved_by: 'Admin User', created_date: now, updated_date: now },
    ]));
  }

  const sk = 'payrollpro_SalaryApproval';
  if (!localStorage.getItem(sk) || JSON.parse(localStorage.getItem(sk)).length === 0) {
    localStorage.setItem(sk, JSON.stringify([
      { id: 'sa-001', employee_name: 'Rahul Sharma', employee_email: toEmail('Rahul Sharma'), department: 'Engineering', change_type: 'raise', current_salary: 75000, proposed_salary: 85000, month: 'March 2026', reason: 'Excellent performance', status: 'pending', created_date: now, updated_date: now },
    ]));
  }

  localStorage.setItem(SEED_FLAG, 'true');
  console.log('PayrollPro: localStorage fallback data seeded');
}

// Seed fallback data on load
seedLocalFallbackData();


// ============================================================
// Export App Client
// ============================================================
export const appClient = {
  auth: createAuth(),
  entities: {
    Employee: createEntityStore('employees'),
    Department: createEntityStore('departments'),
    LeaveApplication: createEntityStore('leaves'),
    Payslip: createEntityStore('payslips'),
    SalaryApproval: createEntityStore('salary-approvals'),
    Attendance: createEntityStore('attendance'),
    LeavePolicy: createEntityStore('leave-policy'),
  },
};
