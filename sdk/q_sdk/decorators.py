"""
Q SDK — Decorators for instrumenting agent tools and actions.
"""

from functools import wraps
from typing import Optional


def tool(risk_level: str = "low", data_classification: Optional[str] = None):
    """
    Decorator to mark a function as an agent tool.
    The Q SDK will intercept all calls to this function.

    Args:
        risk_level: "low", "medium", "high", or "critical"
        data_classification: Optional data type accessed ("pii", "financial", "public", "internal")

    Usage:
        @agent.tool(risk_level="high", data_classification="pii")
        def query_database(query: str) -> dict:
            ...
    """
    def decorator(func):
        # Store metadata on the function for the SDK to read
        func._q_tool = True
        func._q_risk_level = risk_level
        func._q_data_classification = data_classification
        return func
    return decorator


def require_approval(reason: str = "High-risk action", timeout_seconds: int = 300):
    """
    Decorator that adds a Human-in-the-Loop (HITL) gate to a tool.
    When this tool is called, execution pauses until a human approves or denies.

    Args:
        reason: Why this tool requires approval
        timeout_seconds: How long to wait before auto-denying (default: 5 minutes)

    Usage:
        @agent.tool(risk_level="critical")
        @require_approval(reason="Accesses customer financial data")
        def access_financial_records(customer_id: str) -> dict:
            ...
    """
    def decorator(func):
        func._q_require_approval = True
        func._q_approval_reason = reason
        func._q_approval_timeout = timeout_seconds
        return func
    return decorator
