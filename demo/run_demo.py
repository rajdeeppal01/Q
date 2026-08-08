"""
Q Demo Launcher
===============
Runs all three demo agents in sequence so you can watch the full
range of events hit the Mission Control dashboard live.

Usage:
    python demo/run_demo.py [--url https://q-f8z0.onrender.com] [--key q_sk_...]
    python demo/run_demo.py --agent research
    python demo/run_demo.py --agent financial
    python demo/run_demo.py --agent rogue
"""

import subprocess
import argparse
import sys
import os
import time

def cyan(t):   return f"\033[96m{t}\033[0m"
def green(t):  return f"\033[92m{t}\033[0m"
def yellow(t): return f"\033[93m{t}\033[0m"
def red(t):    return f"\033[91m{t}\033[0m"
def grey(t):   return f"\033[90m{t}\033[0m"
def bold(t):   return f"\033[1m{t}\033[0m"

BANNER = cyan("""
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     Q  ·  AGENTIC AI GOVERNANCE PLATFORM                 ║
║     Demo Suite — 3 Agent Scenarios                       ║
║                                                          ║
║     🔬 Research Agent   — low/medium risk telemetry     ║
║     💰 Financial Agent  — PII, trades, HITL gates       ║
║     ⚠  Rogue Agent      — adversarial behaviour demo    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
""")

parser = argparse.ArgumentParser(description="Q Demo Launcher")
parser.add_argument("--url", default="https://q-f8z0.onrender.com", help="Q backend URL")
parser.add_argument("--key", default="demo-key", help="Agent API key (q_sk_...)")
parser.add_argument("--agent", choices=["research", "financial", "rogue", "all"], default="all",
                    help="Which agent to run (default: all)")
args = parser.parse_args()

DEMO_DIR = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable

AGENTS = {
    "research":  {"script": "research_agent.py",  "extra": ["--loops", "2"]},
    "financial": {"script": "financial_agent.py",  "extra": ["--loops", "2"]},
    "rogue":     {"script": "rogue_agent.py",       "extra": []},
}

print(BANNER)
print(grey(f"  Q Backend : {args.url}"))
print(grey(f"  API Key   : {args.key[:12]}..."))
print()
print(f"  {cyan('Tip:')} Open {cyan('https://q-vert-eight.vercel.app/monitor')} in your browser")
print(f"       to watch events stream in {bold('live')} as the agents run!\n")
print("=" * 62)

to_run = [args.agent] if args.agent != "all" else list(AGENTS.keys())

for agent_name in to_run:
    cfg = AGENTS[agent_name]
    script = os.path.join(DEMO_DIR, cfg["script"])
    cmd = [PY, script, "--url", args.url, "--key", args.key] + cfg["extra"]

    print(f"\n{bold(f'▶  Running: {agent_name.upper()} AGENT')}")
    print(grey(f"   {' '.join(cmd)}"))
    print("─" * 62)

    try:
        result = subprocess.run(cmd, check=False)
        if result.returncode == 0:
            print(green(f"\n  ✓  {agent_name} agent completed successfully"))
        else:
            print(yellow(f"\n  ⚠  {agent_name} agent exited with code {result.returncode}"))
    except KeyboardInterrupt:
        print(yellow("\n  [Interrupted by user]"))
        break
    except Exception as e:
        print(red(f"\n  ✗  Error running {agent_name}: {e}"))

    if agent_name != to_run[-1]:
        print(grey("\n  [5 second pause before next agent...]\n"))
        time.sleep(5)

print(f"\n{'=' * 62}")
print(green("  Demo suite complete!"))
print(f"""
  {cyan('Next steps:')}
  1. Open Mission Control  →  see aggregated KPIs
  2. Open Live Monitor     →  replay the event timeline
  3. Open Compliance       →  see OWASP scores shift after rogue run
  4. Open Agent Registry   →  check if rogue agent was quarantined
  5. Open Alerts           →  review critical alerts from phase 3/4
""")
