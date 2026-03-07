import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, Server, Database, Code2, FolderOpen } from "lucide-react";

const copyToClipboard = (text, setCopied) => {
  navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed max-h-96 overflow-y-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, setCopied)}
        className="absolute top-3 right-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

const API_SERVICE = `// src/api/axiosConfig.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ── AUTH
export const authApi = {
  login: (email, password) =>
    api.post("/auth/login", { email, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  logout: () => { localStorage.removeItem("token"); window.location.href = "/login"; },
};

// ── EMPLOYEES
export const employeeApi = {
  list: ()          => api.get("/employees").then((r) => r.data),
  getByEmail: (e)   => api.get(\`/employees/email/\${e}\`).then((r) => r.data),
  create: (d)       => api.post("/employees", d).then((r) => r.data),
  update: (id, d)   => api.put(\`/employees/\${id}\`, d).then((r) => r.data),
  delete: (id)      => api.delete(\`/employees/\${id}\`),
};

// ── DEPARTMENTS
export const departmentApi = {
  list: ()        => api.get("/departments").then((r) => r.data),
  create: (d)     => api.post("/departments", d).then((r) => r.data),
  update: (id, d) => api.put(\`/departments/\${id}\`, d).then((r) => r.data),
  delete: (id)    => api.delete(\`/departments/\${id}\`),
};

// ── LEAVE APPLICATIONS
export const leaveApi = {
  list: ()            => api.get("/leaves").then((r) => r.data),
  listByEmail: (e)    => api.get(\`/leaves/employee/\${e}\`).then((r) => r.data),
  create: (d)         => api.post("/leaves", d).then((r) => r.data),
  update: (id, d)     => api.put(\`/leaves/\${id}\`, d).then((r) => r.data),
};

// ── PAYSLIPS
export const payslipApi = {
  list: ()            => api.get("/payslips").then((r) => r.data),
  listByEmail: (e)    => api.get(\`/payslips/employee/\${e}\`).then((r) => r.data),
  create: (d)         => api.post("/payslips", d).then((r) => r.data),
  update: (id, d)     => api.put(\`/payslips/\${id}\`, d).then((r) => r.data),
};

// ── SALARY APPROVALS
export const salaryApprovalApi = {
  list: ()        => api.get("/salary-approvals").then((r) => r.data),
  create: (d)     => api.post("/salary-approvals", d).then((r) => r.data),
  update: (id, d) => api.put(\`/salary-approvals/\${id}\`, d).then((r) => r.data),
};`;

const POM_XML = `<!-- pom.xml -->
<project>
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
  </parent>
  <groupId>com.company</groupId>
  <artifactId>payroll-backend</artifactId>
  <version>0.0.1-SNAPSHOT</version>

  <dependencies>
    <!-- Web -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Security + JWT -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-api</artifactId>
      <version>0.11.5</version>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-impl</artifactId>
      <version>0.11.5</version>
    </dependency>
    <!-- JPA + MySQL -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>com.mysql</groupId>
      <artifactId>mysql-connector-j</artifactId>
      <scope>runtime</scope>
    </dependency>
    <!-- Lombok -->
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <optional>true</optional>
    </dependency>
  </dependencies>
</project>`;

const APPLICATION_PROPERTIES = `# src/main/resources/application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/payroll_db
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

app.jwt.secret=YourSuperSecretJWTKey1234567890AbCdEfGh
app.jwt.expiration=86400000

# Allow React dev server
spring.web.cors.allowed-origins=http://localhost:5173`;

const EMPLOYEE_ENTITY = `// Employee.java
package com.company.payroll.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
@Data @NoArgsConstructor @AllArgsConstructor
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    @Column(unique = true)
    private String email;
    private String phone;
    private String department;
    private String designation;
    private LocalDate dateOfJoining;
    private Double baseSalary;
    private String status = "active";
    private Integer leaveBalance = 24;
}

// ─── Leave Application ───────────────────────────────────────
// LeaveApplication.java
@Entity @Table(name = "leave_applications")
@Data @NoArgsConstructor @AllArgsConstructor
public class LeaveApplication {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String employeeName;
    private String employeeEmail;
    private String department;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer days;
    private String reason;
    private String status = "pending";
    private String adminRemarks;
}

// ─── Payslip ─────────────────────────────────────────────────
// Payslip.java
@Entity @Table(name = "payslips")
@Data @NoArgsConstructor @AllArgsConstructor
public class Payslip {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String employeeName;
    private String employeeEmail;
    private String department;
    private String month;
    private Double baseSalary;
    private Double hra;
    private Double transportAllowance;
    private Double medicalAllowance;
    private Double bonus = 0.0;
    private Double taxDeduction;
    private Double providentFund;
    private Double otherDeductions = 0.0;
    private Double grossSalary;
    private Double totalDeductions;
    private Double netSalary;
    private String status = "draft";
}`;

const CONTROLLERS = `// EmployeeController.java
package com.company.payroll.controller;

import com.company.payroll.model.Employee;
import com.company.payroll.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class EmployeeController {

    private final EmployeeRepository repo;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Employee> all() { return repo.findAll(); }

    @GetMapping("/email/{email}")
    public Employee byEmail(@PathVariable String email) {
        return repo.findByEmail(email).orElseThrow();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Employee create(@RequestBody Employee e) { return repo.save(e); }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Employee update(@PathVariable Long id, @RequestBody Employee e) {
        e.setId(id); return repo.save(e);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id); return ResponseEntity.noContent().build();
    }
}

// ─── AuthController.java ─────────────────────────────────────
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );
        String token = jwtUtil.generateToken(req.getEmail());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        UserDetails user = (UserDetails) auth.getPrincipal();
        return ResponseEntity.ok(Map.of(
            "email", user.getUsername(),
            "role", user.getAuthorities().iterator().next().getAuthority()
        ));
    }
}`;

const SECURITY_CONFIG = `// SecurityConfig.java
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

// JwtUtil.java
@Component
public class JwtUtil {
    @Value("\${app.jwt.secret}") private String secret;
    @Value("\${app.jwt.expiration}") private long expiration;

    public String generateToken(String username) {
        return Jwts.builder()
            .setSubject(username)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()))
            .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes()))
            .build().parseClaimsJws(token).getBody().getSubject();
    }
}`;

const PROJECT_STRUCTURE = `payroll-system/
├── payroll-backend/              ← Spring Boot Project
│   ├── src/main/java/com/company/payroll/
│   │   ├── PayrollApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java
│   │   │   └── JwtAuthFilter.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── EmployeeController.java
│   │   │   ├── DepartmentController.java
│   │   │   ├── LeaveController.java
│   │   │   ├── PayslipController.java
│   │   │   └── SalaryApprovalController.java
│   │   ├── model/
│   │   │   ├── Employee.java
│   │   │   ├── Department.java
│   │   │   ├── LeaveApplication.java
│   │   │   ├── Payslip.java
│   │   │   ├── SalaryApproval.java
│   │   │   └── User.java
│   │   ├── repository/
│   │   │   └── (one JpaRepository per model)
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   └── PayslipService.java
│   │   └── util/
│   │       └── JwtUtil.java
│   └── src/main/resources/
│       └── application.properties
│
└── payroll-frontend/             ← React (Vite) Project
    ├── src/
    │   ├── api/
    │   │   └── axiosConfig.js    ← 👈 replace base44Client with this
    │   ├── components/
    │   │   ├── dashboard/
    │   │   ├── employees/
    │   │   └── ui/               ← shadcn/ui components
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Employees.jsx
    │   │   ├── Departments.jsx
    │   │   ├── LeaveManagement.jsx
    │   │   ├── SalaryApprovals.jsx
    │   │   ├── PayslipManagement.jsx
    │   │   ├── EmployeeDashboard.jsx
    │   │   ├── ApplyLeave.jsx
    │   │   └── MyPayslips.jsx
    │   └── App.jsx
    └── package.json`;

const MIGRATION_STEPS = [
  {
    step: "1",
    title: "Set up Spring Boot project",
    desc: "Use Spring Initializr (start.spring.io) with Web, Security, JPA, MySQL, Lombok dependencies. Copy pom.xml shown below.",
  },
  {
    step: "2",
    title: "Create the database",
    desc: 'Run: CREATE DATABASE payroll_db; in MySQL. Spring will auto-create tables via spring.jpa.hibernate.ddl-auto=update.',
  },
  {
    step: "3",
    title: "Copy the model, repository, controller code",
    desc: "Use the code snippets below as templates for all entities: Employee, Department, LeaveApplication, Payslip, SalaryApproval.",
  },
  {
    step: "4",
    title: "Create a new React (Vite) project",
    desc: "Run: npm create vite@latest payroll-frontend -- --template react. Install: axios, react-router-dom, tailwindcss, shadcn/ui, @tanstack/react-query, lucide-react.",
  },
  {
    step: "5",
    title: "Replace the API client",
    desc: "Copy the axiosConfig.js below into src/api/. Then replace all `appClient.entities.X.list()` calls with `employeeApi.list()`, `leaveApi.list()` etc.",
  },
  {
    step: "6",
    title: "Copy page & component files",
    desc: "Copy all files from pages/ and components/ from this Base44 project into your Vite project's src/pages and src/components folders.",
  },
  {
    step: "7",
    title: "Add login page",
    desc: "Create a Login page that calls authApi.login(email, password), stores the returned JWT token in localStorage, then redirects to the dashboard.",
  },
];

export default function SpringBootExport() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Server className="h-7 w-7 text-indigo-500" />
          Spring Boot + React Export Guide
        </h1>
        <p className="text-slate-500 mt-1">Everything you need to migrate this payroll system to your own Spring Boot backend.</p>
      </div>

      {/* Migration Steps */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><FolderOpen className="h-5 w-5 text-indigo-500" /> Migration Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MIGRATION_STEPS.map((s) => (
              <div key={s.step} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{s.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Structure */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Database className="h-5 w-5 text-emerald-500" /> Recommended Project Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock code={PROJECT_STRUCTURE} lang="text" />
        </CardContent>
      </Card>

      {/* Code Tabs */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Code2 className="h-5 w-5 text-amber-500" /> Code Snippets</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="api">
            <TabsList className="flex flex-wrap gap-1 h-auto mb-4">
              <TabsTrigger value="api">React API Client</TabsTrigger>
              <TabsTrigger value="pom">pom.xml</TabsTrigger>
              <TabsTrigger value="props">application.properties</TabsTrigger>
              <TabsTrigger value="entities">Java Models</TabsTrigger>
              <TabsTrigger value="controllers">Controllers</TabsTrigger>
              <TabsTrigger value="security">Security + JWT</TabsTrigger>
            </TabsList>
            <TabsContent value="api"><CodeBlock code={API_SERVICE} /></TabsContent>
            <TabsContent value="pom"><CodeBlock code={POM_XML} /></TabsContent>
            <TabsContent value="props"><CodeBlock code={APPLICATION_PROPERTIES} /></TabsContent>
            <TabsContent value="entities"><CodeBlock code={EMPLOYEE_ENTITY} /></TabsContent>
            <TabsContent value="controllers"><CodeBlock code={CONTROLLERS} /></TabsContent>
            <TabsContent value="security"><CodeBlock code={SECURITY_CONFIG} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-0 shadow-sm bg-indigo-50 border-indigo-100">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-indigo-800 mb-2">Key Replacements when migrating:</p>
          <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
            <li>Replace <code className="bg-indigo-100 px-1 rounded">appClient.auth.me()</code> → <code className="bg-indigo-100 px-1 rounded">authApi.me()</code></li>
            <li>Replace <code className="bg-indigo-100 px-1 rounded">appClient.auth.logout()</code> → <code className="bg-indigo-100 px-1 rounded">authApi.logout()</code></li>
            <li>Replace <code className="bg-indigo-100 px-1 rounded">appClient.entities.Employee.list()</code> → <code className="bg-indigo-100 px-1 rounded">employeeApi.list()</code></li>
            <li>Replace <code className="bg-indigo-100 px-1 rounded">appClient.entities.Employee.create(data)</code> → <code className="bg-indigo-100 px-1 rounded">employeeApi.create(data)</code></li>
            <li>JWT token is stored in <code className="bg-indigo-100 px-1 rounded">localStorage("token")</code> after login</li>
            <li>Admin role maps to <code className="bg-indigo-100 px-1 rounded">ROLE_ADMIN</code>, employee to <code className="bg-indigo-100 px-1 rounded">ROLE_USER</code> in Spring Security</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}