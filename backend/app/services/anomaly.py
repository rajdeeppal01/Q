"""
Q — Anomaly Detection Engine
=============================
Statistical baseline tracking and pattern-based anomaly detection for governed AI agents.

Detection Strategies:
  1. OWASP Agentic Top 10 pattern matching (keyword/signature heuristics)
  2. Rate spike detection  — events/min vs rolling 15-min baseline
  3. Error rate spike      — error ratio vs rolling baseline
  4. Tool frequency shift  — sudden new or high-volume tool use
  5. Risk escalation       — agent risk profile suddenly elevated
  6. Scope deviation       — accessing tools/data not seen before
"""

import time
import logging
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("q.anomaly")

# ─── OWASP Agentic Top-10 Signatures ────────────────────────────────────────

OWASP_PATTERNS = [
    # ASI01 — Agent Goal Hijacking / Prompt Injection
    {
        "id": "ASI01",
        "name": "Prompt Injection Attempt",
        "severity": "critical",
        "keywords": [
            "ignore previous instructions", "ignore all instructions", "bypass",
            "system prompt", "you are now", "disregard your", "forget your",
            "act as", "jailbreak", "dan mode",
        ],
    },
    # ASI02 — Tool Misuse / Unexpected Tool Execution
    {
        "id": "ASI02",
        "name": "Suspicious Tool Name",
        "severity": "high",
        "tool_names": [
            "drop_database", "delete_all", "wipe_data", "rm_rf", "format_disk",
            "exec_shell", "run_shell", "execute_code", "os_command",
            "send_bulk_email", "mass_message",
        ],
    },
    # ASI03 — Identity & Privilege Abuse
    {
        "id": "ASI03",
        "name": "Privilege Escalation Attempt",
        "severity": "critical",
        "keywords": [
            "sudo", "admin password", "root access", "escalate privilege",
            "grant permission", "bypass auth", "unauthorized",
        ],
    },
    # ASI06 — Sensitive Information / Secrets Exfiltration
    {
        "id": "ASI06",
        "name": "Sensitive Data Exposure",
        "severity": "high",
        "keywords": [
            "password", "secret", "api_key", "credentials", "private_key",
            "access_token", "bearer", "ssh_key", ".env", "config.json",
            "secrets.json", "id_rsa",
        ],
    },
    # ASI10 — Rogue Agent Behavior
    {
        "id": "ASI10",
        "name": "Rogue Behavior Signature",
        "severity": "critical",
        "tool_names": [
            "exfiltrate_data", "data_exfiltration", "exfil", "c2_connect",
            "reverse_shell", "phishing_email", "unauthorized_transfer",
        ],
    },
]


# ─── Agent Baseline Tracker ──────────────────────────────────────────────────

@dataclass
class AgentBaseline:
    """Rolling statistics for a single agent."""
    agent_id: str
    # Rolling event timestamps (last 15 min window)
    event_timestamps: deque = field(default_factory=lambda: deque(maxlen=1000))
    # Error timestamps
    error_timestamps: deque = field(default_factory=lambda: deque(default_factory=list, maxlen=500))
    # Tool name counts since registration
    tool_counts: dict = field(default_factory=lambda: defaultdict(int))
    # Risk level counts
    risk_counts: dict = field(default_factory=lambda: defaultdict(int))
    # Baseline rates (updated every 5 minutes)
    baseline_rate_per_min: float = 0.0
    baseline_error_rate: float = 0.0
    total_events: int = 0
    first_seen: float = field(default_factory=time.time)
    last_updated: float = field(default_factory=time.time)

    def record_event(self, event_type: str, tool_name: Optional[str], risk_level: str):
        now = time.time()
        self.event_timestamps.append(now)
        self.risk_counts[risk_level] += 1
        self.total_events += 1
        if tool_name:
            self.tool_counts[tool_name] += 1
        if event_type == "error":
            self.error_timestamps.append(now)
        # Recompute baseline every 50 events
        if self.total_events % 50 == 0:
            self._recompute_baseline(now)
        self.last_updated = now

    def _recompute_baseline(self, now: float):
        window = 900  # 15 minutes
        recent = [t for t in self.event_timestamps if now - t <= window]
        self.baseline_rate_per_min = len(recent) / 15.0
        recent_errors = [t for t in self.error_timestamps if now - t <= window]
        self.baseline_error_rate = (len(recent_errors) / max(len(recent), 1))

    def current_rate_per_min(self, window_sec: int = 60) -> float:
        now = time.time()
        recent = sum(1 for t in self.event_timestamps if now - t <= window_sec)
        return float(recent)

    def current_error_rate(self, window_sec: int = 300) -> float:
        now = time.time()
        recent_events = sum(1 for t in self.event_timestamps if now - t <= window_sec)
        recent_errors = sum(1 for t in self.error_timestamps if now - t <= window_sec)
        if recent_events == 0:
            return 0.0
        return recent_errors / recent_events


# ─── Anomaly Detection Result ─────────────────────────────────────────────────

@dataclass
class AnomalyResult:
    detected: bool
    owasp_id: Optional[str]
    anomaly_type: str
    message: str
    severity: str  # low / medium / high / critical
    evidence: dict


# ─── Anomaly Detector ─────────────────────────────────────────────────────────

class AnomalyDetector:
    """
    Singleton that maintains in-memory per-agent baselines and runs
    detection checks on every incoming event.
    """

    def __init__(self):
        self._baselines: dict[str, AgentBaseline] = {}

    def _get_baseline(self, agent_id: str) -> AgentBaseline:
        if agent_id not in self._baselines:
            self._baselines[agent_id] = AgentBaseline(agent_id=agent_id)
        return self._baselines[agent_id]

    def analyze(
        self,
        agent_id: str,
        event_type: str,
        tool_name: Optional[str],
        risk_level: str,
        input_data: Optional[dict],
    ) -> list[AnomalyResult]:
        """
        Run all detectors on an event. Returns a list of AnomalyResults (empty = clean).
        """
        baseline = self._get_baseline(agent_id)
        results: list[AnomalyResult] = []

        # 1. OWASP Pattern Matching
        owasp = self._check_owasp(tool_name, input_data)
        if owasp:
            results.append(owasp)

        # 2. Rate spike (only after 20+ events for a meaningful baseline)
        if baseline.total_events >= 20:
            rate_spike = self._check_rate_spike(baseline)
            if rate_spike:
                results.append(rate_spike)

        # 3. Error rate spike
        if baseline.total_events >= 10:
            err_spike = self._check_error_spike(baseline, event_type)
            if err_spike:
                results.append(err_spike)

        # 4. Risk escalation
        risk_esc = self._check_risk_escalation(baseline, risk_level)
        if risk_esc:
            results.append(risk_esc)

        # 5. New tool (scope deviation) — after 30 events
        if baseline.total_events >= 30 and tool_name:
            scope = self._check_scope_deviation(baseline, tool_name)
            if scope:
                results.append(scope)

        # Record event AFTER analysis so baseline reflects pre-event state
        baseline.record_event(event_type, tool_name, risk_level)

        return results

    # ── Individual Detectors ──────────────────────────────────────────────────

    def _check_owasp(self, tool_name, input_data) -> Optional[AnomalyResult]:
        input_str = str(input_data or "").lower()
        tool_str  = (tool_name or "").lower()

        for pattern in OWASP_PATTERNS:
            # Keyword match on input data
            if "keywords" in pattern:
                matched = next((kw for kw in pattern["keywords"] if kw in input_str), None)
                if matched:
                    return AnomalyResult(
                        detected=True,
                        owasp_id=pattern["id"],
                        anomaly_type="owasp_pattern_match",
                        message=f"{pattern['name']} detected — keyword: '{matched}'",
                        severity=pattern["severity"],
                        evidence={"matched_keyword": matched, "owasp_id": pattern["id"]},
                    )
            # Tool name match
            if "tool_names" in pattern:
                if tool_str in [t.lower() for t in pattern["tool_names"]] or \
                   any(banned in tool_str for banned in [t.lower() for t in pattern["tool_names"]]):
                    return AnomalyResult(
                        detected=True,
                        owasp_id=pattern["id"],
                        anomaly_type="owasp_tool_misuse",
                        message=f"{pattern['name']} — suspicious tool: '{tool_name}'",
                        severity=pattern["severity"],
                        evidence={"tool_name": tool_name, "owasp_id": pattern["id"]},
                    )
        return None

    def _check_rate_spike(self, baseline: AgentBaseline) -> Optional[AnomalyResult]:
        current = baseline.current_rate_per_min()
        expected = baseline.baseline_rate_per_min
        if expected < 1.0:
            return None  # No stable baseline yet
        ratio = current / expected
        if ratio > 5.0:
            return AnomalyResult(
                detected=True,
                owasp_id="ASI08",
                anomaly_type="rate_spike",
                message=f"Event rate spike: {current:.1f} events/min vs baseline {expected:.1f} ({ratio:.1f}x)",
                severity="high" if ratio > 10 else "medium",
                evidence={"current_rate": current, "baseline_rate": expected, "ratio": ratio},
            )
        return None

    def _check_error_spike(self, baseline: AgentBaseline, event_type: str) -> Optional[AnomalyResult]:
        if event_type != "error":
            return None
        current_err = baseline.current_error_rate()
        if current_err > 0.4:  # > 40% error rate
            return AnomalyResult(
                detected=True,
                owasp_id="ASI08",
                anomaly_type="error_rate_spike",
                message=f"High error rate detected: {current_err*100:.0f}% of recent events are errors",
                severity="high" if current_err > 0.6 else "medium",
                evidence={"error_rate": current_err},
            )
        return None

    def _check_risk_escalation(self, baseline: AgentBaseline, risk_level: str) -> Optional[AnomalyResult]:
        """Flag if agent suddenly emits critical events when its history was mostly low/medium."""
        if risk_level != "critical":
            return None
        total = sum(baseline.risk_counts.values())
        if total < 5:
            return None
        prior_criticals = baseline.risk_counts.get("critical", 0)
        prior_high      = baseline.risk_counts.get("high", 0)
        dangerous_pct   = (prior_criticals + prior_high) / max(total, 1)
        if dangerous_pct < 0.1 and prior_criticals == 0:
            # First critical event from an otherwise clean agent — flag it
            return AnomalyResult(
                detected=True,
                owasp_id="ASI10",
                anomaly_type="risk_escalation",
                message=f"Sudden risk escalation: first CRITICAL event from an agent with {total} prior clean events",
                severity="high",
                evidence={"prior_total": total, "prior_criticals": prior_criticals},
            )
        return None

    def _check_scope_deviation(self, baseline: AgentBaseline, tool_name: str) -> Optional[AnomalyResult]:
        """Flag if a completely new tool is invoked by a well-established agent."""
        if tool_name in baseline.tool_counts:
            return None
        established_tools = len(baseline.tool_counts)
        if established_tools < 3:
            return None  # Too early to flag scope deviation
        return AnomalyResult(
            detected=True,
            owasp_id="ASI02",
            anomaly_type="scope_deviation",
            message=f"Scope deviation: new tool '{tool_name}' invoked by agent with {established_tools} known tools",
            severity="medium",
            evidence={"new_tool": tool_name, "known_tools": list(baseline.tool_counts.keys())},
        )

    def get_baseline_summary(self, agent_id: str) -> Optional[dict]:
        if agent_id not in self._baselines:
            return None
        b = self._baselines[agent_id]
        return {
            "agent_id": agent_id,
            "total_events": b.total_events,
            "baseline_rate_per_min": round(b.baseline_rate_per_min, 2),
            "current_rate_per_min": round(b.current_rate_per_min(), 2),
            "baseline_error_rate": round(b.baseline_error_rate, 3),
            "current_error_rate": round(b.current_error_rate(), 3),
            "tool_count": len(b.tool_counts),
            "risk_breakdown": dict(b.risk_counts),
        }


# Module-level singleton
anomaly_detector = AnomalyDetector()
