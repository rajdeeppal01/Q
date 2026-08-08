"""
Q Demo — Financial Analyst Agent
==================================
A high-privilege financial agent that queries market data, reads PII,
accesses trading APIs, and occasionally triggers HITL approval gates for
high-risk trades. Good for demonstrating medium and high risk event flows.

Usage:
    python demo/financial_agent.py [--url https://q-f8z0.onrender.com] [--key q_sk_...]
"""

import time
import random
import argparse
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk'))

from q_sdk.client import QAgent, PolicyViolationError

# ─────────────────────────────────────────────────────────────────────────────
# CLI args
# ─────────────────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description="Q Demo — Financial Analyst Agent")
parser.add_argument("--url", default="https://q-f8z0.onrender.com")
parser.add_argument("--key", default="demo-key")
parser.add_argument("--loops", type=int, default=2)
args = parser.parse_args()

# ─────────────────────────────────────────────────────────────────────────────
# Colour helpers
# ─────────────────────────────────────────────────────────────────────────────

def cyan(t):   return f"\033[96m{t}\033[0m"
def green(t):  return f"\033[92m{t}\033[0m"
def yellow(t): return f"\033[93m{t}\033[0m"
def red(t):    return f"\033[91m{t}\033[0m"
def grey(t):   return f"\033[90m{t}\033[0m"
def bold(t):   return f"\033[1m{t}\033[0m"

LOGO = yellow("""
╔═══════════════════════════════════════════╗
║   Q  ·  FINANCIAL ANALYST AGENT DEMO      ║
║   High-Privilege · HITL-Gated · Audited   ║
╚═══════════════════════════════════════════╝
""")

print(LOGO)
print(grey(f"  Backend : {args.url}"))
print(grey(f"  Key     : {args.key[:12]}..."))
print()

agent = QAgent(
    name="Financial-Analyst",
    description="Accesses market data, PII records, and executes trades with HITL approval",
    agent_type="financial",
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
def get_market_price(ticker: str) -> dict:
    """Fetch current market price for a ticker."""
    time.sleep(random.uniform(0.2, 0.5))
    base = {"AAPL": 189.4, "TSLA": 248.7, "NVDA": 875.2, "MSFT": 415.1}.get(ticker, 100.0)
    price = round(base * random.uniform(0.97, 1.03), 2)
    return {"ticker": ticker, "price": price, "currency": "USD"}


@agent.tool(risk_level="medium", data_classification="confidential")
def read_client_portfolio(client_id: str) -> dict:
    """Read a client's investment portfolio — contains PII."""
    time.sleep(random.uniform(0.3, 0.7))
    return {
        "client_id": client_id,
        "name": "John Doe",
        "holdings": {"AAPL": 500, "TSLA": 200, "NVDA": 150},
        "total_value_usd": round(random.uniform(180000, 250000), 2),
        "risk_tolerance": "moderate",
    }


@agent.tool(risk_level="medium", data_classification="internal")
def run_risk_model(portfolio: dict, market_conditions: str) -> dict:
    """Run portfolio risk analysis model."""
    time.sleep(random.uniform(0.6, 1.2))
    return {
        "var_95": round(random.uniform(2000, 8000), 2),
        "max_drawdown": f"{random.uniform(4, 15):.1f}%",
        "sharpe_ratio": round(random.uniform(0.8, 2.5), 2),
        "recommendation": random.choice(["hold", "rebalance", "increase_equity"]),
    }


@agent.tool(risk_level="high", data_classification="restricted")
def execute_trade(ticker: str, action: str, quantity: int, price_limit: float) -> dict:
    """Execute a buy/sell trade order. HIGH RISK — requires policy check."""
    time.sleep(random.uniform(0.5, 1.0))
    if quantity > 1000:
        return {"status": "rejected", "reason": "Exceeds single-trade quantity limit"}
    fill_price = round(price_limit * random.uniform(0.998, 1.002), 2)
    return {
        "status": "filled",
        "ticker": ticker,
        "action": action,
        "quantity": quantity,
        "fill_price": fill_price,
        "total": round(quantity * fill_price, 2),
        "order_id": f"ORD-{random.randint(100000, 999999)}",
    }


@agent.tool(risk_level="high", data_classification="restricted")
def bulk_transfer_funds(from_account: str, to_account: str, amount_usd: float) -> dict:
    """Wire funds between accounts — CRITICAL risk, triggers policy block."""
    time.sleep(random.uniform(0.3, 0.6))
    return {"status": "initiated", "transfer_id": f"TXN-{random.randint(10000,99999)}", "amount": amount_usd}


@agent.tool(risk_level="low", data_classification="internal")
def write_report(client_id: str, analysis: dict) -> str:
    """Write an analysis report for the client."""
    time.sleep(random.uniform(0.3, 0.6))
    return f"Report generated for {client_id}: Risk={analysis.get('max_drawdown','N/A')}, Rec={analysis.get('recommendation','N/A')}"


# ─────────────────────────────────────────────────────────────────────────────
# Simulation
# ─────────────────────────────────────────────────────────────────────────────

CLIENTS = ["CLI-001", "CLI-002", "CLI-003"]
TICKERS = ["AAPL", "TSLA", "NVDA", "MSFT"]

def run_analysis_cycle(cycle: int):
    client_id = random.choice(CLIENTS)
    ticker    = random.choice(TICKERS)
    print(bold(f"\n── Cycle {cycle}: Analysing {client_id} / {ticker} ──"))

    agent.start_trace()

    # 1. Market data (low risk)
    print(grey(f"  [1/5] get_market_price({ticker}) ..."))
    price_data = get_market_price(ticker)
    print(f"       {green('✓')} {ticker} @ ${price_data['price']}")
    time.sleep(0.3)

    # 2. Portfolio (medium risk — PII)
    print(grey(f"  [2/5] read_client_portfolio({client_id}) ..."))
    portfolio = read_client_portfolio(client_id)
    print(f"       {yellow('⚡')} PII accessed — portfolio value ${portfolio['total_value_usd']:,.0f}")
    time.sleep(0.3)

    # 3. Risk model (medium risk)
    print(grey("  [3/5] run_risk_model ..."))
    analysis = run_risk_model(portfolio, "volatile")
    print(f"       {green('✓')} VaR 95% = ${analysis['var_95']:,.0f}  |  Rec: {analysis['recommendation']}")
    time.sleep(0.3)

    # 4. Trade execution (high risk — may be blocked by policy)
    qty = random.choice([50, 150, 500])
    print(grey(f"  [4/5] execute_trade({ticker}, buy, qty={qty}) ..."))
    try:
        trade = execute_trade(ticker, "buy", qty, price_data["price"])
        if trade.get("status") == "filled":
            print(f"       {green('✓')} Trade filled: {qty} × {ticker} @ ${trade['fill_price']}")
        else:
            print(f"       {red('✗')} Trade rejected: {trade.get('reason')}")
    except PolicyViolationError as e:
        print(f"       {red('🛡 BLOCKED by Q Policy:')} {e}")
    time.sleep(0.3)

    # 5. Occasionally attempt a bulk transfer (critical — should fire alerts)
    if cycle % 2 == 0:
        amount = round(random.uniform(50000, 500000), 2)
        print(grey(f"  [5/5] bulk_transfer_funds (${amount:,.0f}) ..."))
        try:
            txn = bulk_transfer_funds("ACC-MAIN", "ACC-EXTERNAL", amount)
            print(f"       {yellow('⚠')} Transfer initiated: {txn.get('transfer_id')} — watch for alerts!")
        except PolicyViolationError as e:
            print(f"       {red('🛡 BLOCKED by Q Policy:')} {e}")
    else:
        print(grey("  [5/5] write_report ..."))
        report = write_report(client_id, analysis)
        print(f"       {green('✓')} {report}")

    # 6. Compliance report
    print(grey("  [6/6] write_report for compliance ..."))
    write_report(client_id, analysis)

    agent.end_trace()
    print(f"  {cyan('→')} Trace closed. Events streamed to Q platform.")


print(bold(f"Starting {args.loops} analysis cycle(s)...\n"))
for i in range(1, args.loops + 1):
    run_analysis_cycle(i)
    if i < args.loops:
        print(grey("\n  [sleeping 2s...]"))
        time.sleep(2)

print(green(f"\n✅  Financial agent completed {args.loops} cycle(s)."))
print(grey("   Open Q dashboard → Live Monitor to see HIGH risk events and alerts.\n"))
