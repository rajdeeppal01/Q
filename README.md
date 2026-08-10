# Q — Agentic AI Security & Governance Platform

> *The name's Q. I give the agents their tools... and I make sure they don't misuse them.*

**Q** is the security and governance control plane for autonomous AI agents — the same way Kubernetes governs containers, Q governs AI agents.

![Status](https://img.shields.io/badge/Status-In_Development-blue) ![Python](https://img.shields.io/badge/Python-3.11+-3776AB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688) ![React](https://img.shields.io/badge/React-19-61dafb) ![License](https://img.shields.io/badge/License-MIT-green)

---

## The Problem

Every enterprise is deploying autonomous AI agents. But:
- **79% lack governance frameworks** for these agents (Deloitte, 2026)
- Non-human identities outnumber humans **45:1 to 144:1** in enterprise environments
- Only **15-28% of organizations** can track what their AI agents are doing
- A single compromised agent credential can execute a **full kill chain without malware**

## The Solution

Q provides end-to-end security governance for AI agents:

| Feature | What It Does |
|---|---|
| **Agent Registry** | Discovers and inventories all AI agents in an environment |
| **Non-Human IAM** | Manages agent identities with scoped permissions and credential rotation |
| **Real-Time Monitoring** | Tracks every tool call, LLM invocation, and data access in real-time |
| **Policy Engine** | Enforces governance rules with human-in-the-loop approval gates |
| **Anomaly Detection** | Detects rogue behavior, privilege escalation, and goal hijacking |
| **Audit Trails** | Full traceability of agent reasoning and actions |
| **Compliance** | Maps operations to NIST AI RMF, OWASP Agentic Top 10, ISO 42001 |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AI AGENTS (Instrumented)               │
│   Research Agent  ·  Data Analyst  ·  Code Reviewer      │
└────────────────────────┬────────────────────────────────┘
                         │ q-sdk (Python)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Q BACKEND (FastAPI)                     │
│   Policy Engine · Anomaly Detection · Audit · Compliance  │
│   WebSocket Gateway · Agent IAM · Report Generator        │
└────────────────────────┬────────────────────────────────┘
                         │ REST + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 Q DASHBOARD (React + Vite)                 │
│   Mission Control · Live Monitor · Compliance Radar       │
│   HITL Approvals · Agent Registry · Audit Timeline        │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| **SDK** | Python (framework-agnostic) |
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL (Neon) |
| **Frontend** | React 19, Vite, Framer Motion, Recharts |
| **AI** | Google Gemini (anomaly analysis, report generation) |
| **Auth** | JWT (humans) + API Keys (agents) |
| **Compliance** | NIST AI RMF, OWASP Agentic Top 10, ISO 42001 |

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
# Create .env (see .env.example)
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### SDK
```bash
pip install -e ./sdk
```

### Instrument Your Agent
```python
from q_sdk import QAgent

agent = QAgent(
    name="my-agent",
    q_url="http://localhost:8000",
    api_key="q_sk_..."
)

@agent.tool(risk_level="high", require_approval=True)
def access_database(query: str) -> dict:
    return db.execute(query)
```

## Compliance Framework Mappings

- **OWASP Agentic Top 10** (ASI01–ASI10): Goal hijacking, tool misuse, privilege abuse, rogue agents
- **NIST AI RMF**: Govern, Map, Measure, Manage
- **ISO 42001**: AI policies, lifecycle, data governance, third-party risk

## Author

**Rajdeep Pal** — 4th Year BTech CSE (Cybersecurity)

---

*Named after Q from James Bond — the quartermaster who equips agents with tools and ensures they're used responsibly.*
