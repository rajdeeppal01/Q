"""
Q SDK — Instrument any AI agent with security governance.

Usage:
    from q_sdk import QAgent, tool, require_approval

    agent = QAgent(
        name="my-agent",
        q_url="http://localhost:8000",
        api_key="q_sk_..."
    )

    @agent.tool(risk_level="high")
    @require_approval(reason="Sensitive operation")
    def my_tool(query: str) -> str:
        return "result"

    agent.run("Do something")
"""

from q_sdk.client import QAgent
from q_sdk.decorators import tool, require_approval
from q_sdk.interceptors import wrap_llm_call

__version__ = "0.1.0"
__all__ = ["QAgent", "tool", "require_approval", "wrap_llm_call"]
