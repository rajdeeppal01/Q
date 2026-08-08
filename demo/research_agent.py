"""
Q Demo — Research Agent
======================
A benign research assistant that searches the web, reads papers,
synthesises notes, and writes summaries. All tools are low-to-medium risk.
Streams real telemetry to the Q platform so you can watch it on the
Mission Control and Live Monitor dashboards.

Usage:
    python demo/research_agent.py [--url https://q-f8z0.onrender.com] [--key q_sk_...]
"""

import time
import random
import argparse
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk'))

from q_sdk.client import QAgent

# ─────────────────────────────────────────────────────────────────────────────
# CLI args
# ─────────────────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description="Q Demo — Research Agent")
parser.add_argument("--url", default="https://q-f8z0.onrender.com", help="Q backend URL")
parser.add_argument("--key", default="demo-key", help="Agent API key")
parser.add_argument("--loops", type=int, default=3, help="How many research cycles to run")
args = parser.parse_args()

# ─────────────────────────────────────────────────────────────────────────────
# Colour helpers
# ─────────────────────────────────────────────────────────────────────────────

def cyan(t):  return f"\033[96m{t}\033[0m"
def green(t): return f"\033[92m{t}\033[0m"
def yellow(t):return f"\033[93m{t}\033[0m"
def grey(t):  return f"\033[90m{t}\033[0m"
def bold(t):  return f"\033[1m{t}\033[0m"

LOGO = cyan("""
╔═══════════════════════════════════════════╗
║   Q  ·  RESEARCH AGENT DEMO               ║
║   Governed · Transparent · Safe           ║
╚═══════════════════════════════════════════╝
""")

# ─────────────────────────────────────────────────────────────────────────────
# Agent init
# ─────────────────────────────────────────────────────────────────────────────

print(LOGO)
print(grey(f"  Backend : {args.url}"))
print(grey(f"  Key     : {args.key[:12]}..."))
print()

agent = QAgent(
    name="Research-Agent",
    description="Searches the web, reads academic papers, and synthesises findings",
    agent_type="research",
    framework="Custom",
    q_url=args.url,
    api_key=args.key,
)
print(green(f"✓  Agent registered  →  ID: {agent.agent_id or 'N/A (offline mode)'}"))
print()

# ─────────────────────────────────────────────────────────────────────────────
# Tools
# ─────────────────────────────────────────────────────────────────────────────

@agent.tool(risk_level="low", data_classification="public")
def web_search(query: str) -> str:
    """Search the web for a query."""
    time.sleep(random.uniform(0.3, 0.8))
    results = [
        f"[Result 1] Overview of '{query}' — Wikipedia",
        f"[Result 2] Recent paper: '{query}' in Nature AI (2024)",
        f"[Result 3] Blog post: Understanding {query} — Towards Data Science",
    ]
    return "\n".join(results)


@agent.tool(risk_level="low", data_classification="public")
def read_url(url: str) -> str:
    """Fetch and parse the text content of a web page."""
    time.sleep(random.uniform(0.4, 1.0))
    return (
        f"[Content of {url}]\n"
        "Abstract: This paper presents a comprehensive analysis of agentic AI systems "
        "and their governance challenges. We propose a multi-layer security framework "
        "inspired by NIST AI RMF and OWASP Agentic Top 10..."
    )


@agent.tool(risk_level="medium", data_classification="internal")
def store_notes(title: str, content: str) -> str:
    """Persist research notes to the internal knowledge store."""
    time.sleep(random.uniform(0.2, 0.5))
    return f"✓ Saved note '{title}' ({len(content)} chars)"


@agent.tool(risk_level="low", data_classification="public")
def write_summary(topic: str, findings: str) -> str:
    """Compose a structured research summary document."""
    time.sleep(random.uniform(0.5, 1.2))
    return (
        f"# Research Summary: {topic}\n\n"
        f"## Key Findings\n{findings[:200]}...\n\n"
        "## Recommendations\n"
        "1. Implement multi-layer agent governance\n"
        "2. Enforce HITL for high-risk decisions\n"
        "3. Log all tool calls for audit trail\n"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Topics to research
# ─────────────────────────────────────────────────────────────────────────────

TOPICS = [
    "Agentic AI security and governance frameworks",
    "Prompt injection attacks in LLM pipelines",
    "NIST AI Risk Management Framework compliance",
    "Multi-agent system vulnerabilities 2024",
    "Zero-trust architecture for AI agents",
    "Human-in-the-loop approval systems",
]

# ─────────────────────────────────────────────────────────────────────────────
# Simulation loop
# ─────────────────────────────────────────────────────────────────────────────

def run_research_cycle(topic: str, cycle: int):
    print(bold(f"\n── Cycle {cycle}: {topic} ──"))

    agent.start_trace()

    # 1. Search
    print(grey("  [1/4] web_search ..."))
    results = web_search(topic)
    print(f"       {green('✓')} {len(results.splitlines())} results found")
    time.sleep(0.5)

    # 2. Read top result URL
    url = f"https://arxiv.org/abs/2024.{random.randint(10000,99999)}"
    print(grey(f"  [2/4] read_url {url[:40]}..."))
    content = read_url(url)
    print(f"       {green('✓')} {len(content)} chars extracted")
    time.sleep(0.5)

    # 3. Store notes
    print(grey("  [3/4] store_notes ..."))
    store_notes(title=f"Notes: {topic}", content=results + "\n\n" + content)
    print(f"       {green('✓')} Notes saved to knowledge store")
    time.sleep(0.5)

    # 4. Write summary
    print(grey("  [4/4] write_summary ..."))
    summary = write_summary(topic, content)
    print(f"       {green('✓')} Summary written ({len(summary)} chars)")

    agent.end_trace()
    print(f"  {cyan('→')} Trace closed. All events streamed to Q platform.")


print(bold(f"Starting {args.loops} research cycle(s)...\n"))
for i in range(1, args.loops + 1):
    topic = TOPICS[(i - 1) % len(TOPICS)]
    run_research_cycle(topic, i)
    if i < args.loops:
        print(grey(f"\n  [sleeping 2s before next cycle...]"))
        time.sleep(2)

print(green(f"\n✅  Research agent completed {args.loops} cycle(s)."))
print(grey("   Open the Q dashboard → Live Monitor to see all events.\n"))
