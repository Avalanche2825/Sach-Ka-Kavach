# 🛡️ SACH Kavach — Bharat Trust Grid
### *Continuous Identity Trust & Adaptive Risk Interception Engine*

Designed and built for the **Bank of Baroda Hackathon 2026**, **SACH Kavach** is a privacy-first, risk-based Identity Trust Grid that continuously validates customer and enterprise identities across digital channels. Instead of relying on static login locks, it monitors behavioral biometrics, device fingerprints, KYC relationships, and administrative access, triggering step-up authentication and alerts *only* when real-time risk is elevated.

---

## 📌 Problem Statement Overview

Modern digital banking systems face severe vulnerabilities:
1. **Account Takeover (ATO)**: Sophisticated credential stuffing, session hijacking, and SIM swap exploits bypass standard username/password challenges.
2. **KYC & Identity Fraud**: Synthetic identities and syndicates register multiple accounts using duplicate/recycled device fingerprints, Aadhaar metrics, or locations.
3. **Insider Misuse**: Privileged bank staff querying customer records without explicit authorization, leading to data leaks and fraud.
4. **Static Friction**: Forcing multi-factor challenges (MFA) on every single action degrades user experience.

### Expected Outcomes of SACH Kavach
- **Friction-Optimized Access**: Low-risk users enjoy frictionless journeys; challenges are triggered dynamically only for anomalous events.
- **Comprehensive Protection**: Real-time detection of account hijack attempts, synthetic onboarding networks, and privileged insider overreach.
- **Inter-channel Scalability**: A modular architecture ready to scale across retail, corporate, and mobile channels.

---

## ⚙️ Architecture & Data Flow

SACH Kavach operates on a decoupled microservices model:

```
[ Client Browser (React 19) ]
           │ (Vite Proxy / API)
           ▼
[ Node.js Express API Server ] ── (Real-time events) ──► [ Admin Dashboard / Alert HUD ]
           │
           ├─► [ Python Flask ML Service ] 
           │       ├── Isolation Forest (Behavioral Anomaly)
           │       ├── Random Forest (Device Spoof Classification)
           │       └── Aadhaar & IP Clustered KYC Graph
           │
           └─► [ AI Cascade System ]
                   └── Grok-3-Mini ──► Llama-3.3-70b ──► Rule Heuristics
```

---

## 🚀 The 6 Shield Modules of SACH Kavach

### 🛡️ Module 1: Behavioral Biometrics (Typing Cadence Profiling)
- **Concept**: Learns a customer's typing behavior (keystroke press durations and flight intervals between keys).
- **Engine**: A client-side keystroke logger captures timings, which are parsed by a Python **Isolation Forest** model to establish a behavioral baseline.
- **Interception**: Script injections, botnets, and credential-stuffers are identified by typing speed deviations, locking out transactions before execution.

### 🛡️ Module 2: Account Takeover (ATO) Prevention
- **Concept**: Continuously calculates a dynamic trust score (0–100) using real-time attributes.
- **Engine**: Evaluates geo-velocity (impossible travel speed), new device fingerprinting, OS mismatches, active VPN/proxy detection, and SIM swap flags.
- **Action**: Directs transactions to a risk matrix: Allow, OTP Challenge, CIF Alert, Escrow hold, or Hard Block.

### 🛡️ Module 3: Suspicious Onboarding Prevention (KYC Graph)
- **Concept**: Analyzes registration relationships to spot synthetic identity rings.
- **Engine**: A relationship graph checks combinations of Aadhaar, PAN, device fingerprint, and IP address.
- **Interception**: Flags applications that attempt to reuse credentials across distinct identities (syndicates) and holds them for human review.

### 🛡️ Module 4: Elevated Risk Escalations (Guardian Console)
- **Concept**: Multi-signature step-up authorization for high-value or elevated-risk transactions.
- **Engine**: Holds transactions in secure escrow.
- **Interception**: Triggers a notification to a pre-registered family member or trusted **Guardian** via SMS. The transaction remains locked until authorized by the Guardian.

### 🛡️ Module 5: Hacker Delay Layer
- **Concept**: Adds mathematical friction to slow down brute-force scripts.
- **Engine**: Implements dynamic time-locks and proof-of-work (PoW) computation cycles.
- **Action**: When attack velocity spikes, the backend dynamically increases processing delays, turning a sub-second exploit script into a crawl.

### 🛡️ Module 6: Insider Threat Overwatch (Staff Access Control)
- **Concept**: Mitigates administrative database snooping.
- **Engine**: Establishes a **Customer Consent Ticket** protocol.
- **Action**: Bank staff are forbidden from searching customer records unless the customer has raised a support ticket and authorized it via OTP. Unauthorized lookups trigger immediate high-priority manager escalations and block access.

---

## 📊 Dynamic Trust Score Response Matrix

SACH Kavach evaluates transactions in real-time, mapping them to the following automated policies:

| Dynamic Trust Score | Risk Score | Policy Action | Status | Meaning / Action |
| :--- | :--- | :--- | :--- | :--- |
| **80 – 100** | 0 – 20 | `ALLOW` | Approved | Frictionless clearance |
| **60 – 79** | 21 – 40 | `OTP_REQUIRED` | OTP_Required | Step-up SMS challenge |
| **40 – 59** | 41 – 60 | `ALERT_CUSTOMER` | CIF_Required | Soft challenge / Alert user |
| **20 – 39** | 61 – 80 | `HOLD` | Guardian_Required | Escrow lock; Guardian multi-sig |
| **0 – 19** | 81 – 100 | `BLOCK` | Rejected | Auto-blocked & SOC logged |

---

## 🛠️ Technology Stack

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Vite | Fully responsive dashboard layout, motion micro-interactions, Recharts analytics, global notification toasts. |
| **Backend API** | Node.js, Express, Socket.io | Core database controllers, event pipelines, and real-time Socket notifications. |
| **Database** | MongoDB Atlas, Mongoose | Persistent storage for users, transactions, audit logs, and employee tickets. |
| **Machine Learning** | Python, Flask, Scikit-Learn | Real-time prediction microservice (Isolation Forest, Random Forest). |
| **AI Explanation** | xAI Grok API, Groq Llama 3.3 | Real-time generation of human-readable risk summaries & action justifications. |

---

## 👥 The Development Team

* **Chitra Saini** (Team Leader) — Frontend Architecture & Onboarding UX
* **Abhyuday Jain** — Backend Services & Escrow Security Pipelines
* **Hardik Mathur** — Machine Learning Models & System Integrations
* **Siddharth Raut** — Risk Algorithms & Threat Overwatch Workflows

---

## 🌐 Active Deployments

* **Production Frontend**: [https://sach-kavach-grid.vercel.app](https://sach-kavach-grid.vercel.app)
* **Production API Backend**: [https://sach-kavach-backend.onrender.com](https://sach-kavach-backend.onrender.com)
* **Production ML Service**: Hosted on Render private networks linked directly to the API Backend.
