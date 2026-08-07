"""
Q SDK — QAgent: The core SDK class.
Wraps any AI agent with Q security governance instrumentation.
"""

import uuid
import time
import asyncio
import logging
from functools import wraps
from typing import Optional, Dict, Any, Callable, List

from q_sdk.telemetry import TelemetryClient
from q_sdk.models import TelemetryEvent, EventType, RiskLevel, ApprovalRequestPayload
from q_sdk.policy import PolicyCache, PolicyResult

logger = logging.getLogger("q_sdk")


class PolicyViolationError(Exception):
    """Raised when a tool call is blocked by Q policy."""
    pass


class ApprovalDeniedError(Exception):
    """Raised when a human denies a HITL approval request."""
    pass


class QAgent:
    """
    Main SDK class. Instruments any AI agent with Q governance.

    Usage:
        agent = QAgent(
            name="my-agent",
            q_url="http://localhost:8000",
            api_key="q_sk_..."
        )

        @agent.tool(risk_level="high")
        def search_web(query: str) -> str:
            return "results..."

        agent.run("Do something useful")
    """

    def __init__(
        self,
        name: str,
        q_url: str = "http://localhost:8000",
        api_key: str = "",
        description: str = "",
        agent_type: str = "general",
        framework: str = "custom",
        auto_register: bool = True,
    ):
        self.name = name
        self.description = description
        self.agent_type = agent_type
        self.framework = framework
        self.agent_id: Optional[str] = None
        self._tools: Dict[str, Dict[str, Any]] = {}
        self._telemetry = TelemetryClient(q_url, api_key)
        self._policy_cache = PolicyCache()
        self._trace_id: Optional[str] = None

        # Auto-register with Q
        if auto_register and api_key:
            self._register()

    def _register(self):
        """Register this agent with the Q backend."""
        result = self._telemetry.register_agent({
            "name": self.name,
            "description": self.description,
            "agent_type": self.agent_type,
            "framework": self.framework,
        })
        if result.get("id"):
            self.agent_id = result["id"]
            logger.info(f"✅ Agent '{self.name}' registered with Q (ID: {self.agent_id})")
        else:
            logger.warning(f"⚠️ Agent '{self.name}' registration failed — running without Q governance")

    def tool(
        self,
        risk_level: str = "low",
        data_classification: Optional[str] = None,
        require_approval: bool = False,
        approval_reason: str = "High-risk action",
        approval_timeout: int = 300,
    ) -> Callable:
        """
        Decorator to register and instrument a tool with Q governance.

        Every call to this tool will:
        1. Be logged as a telemetry event
        2. Be checked against active Q policies
        3. Optionally require human approval before execution
        """
        def decorator(func: Callable) -> Callable:
            tool_name = func.__name__

            # Check if function has @require_approval decorator metadata
            _require_approval = require_approval or getattr(func, "_q_require_approval", False)
            _approval_reason = getattr(func, "_q_approval_reason", approval_reason)
            _approval_timeout = getattr(func, "_q_approval_timeout", approval_timeout)

            # Store tool metadata
            self._tools[tool_name] = {
                "function": func,
                "risk_level": risk_level,
                "data_classification": data_classification,
                "require_approval": _require_approval,
                "approval_reason": _approval_reason,
            }

            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                return self._execute_tool_sync(
                    func, tool_name, risk_level, data_classification,
                    _require_approval, _approval_reason, _approval_timeout,
                    args, kwargs,
                )

            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                return await self._execute_tool_async(
                    func, tool_name, risk_level, data_classification,
                    _require_approval, _approval_reason, _approval_timeout,
                    args, kwargs,
                )

            # Return async wrapper if the original function is async
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            return sync_wrapper

        return decorator

    def _execute_tool_sync(
        self, func, tool_name, risk_level, data_classification,
        require_approval, approval_reason, approval_timeout,
        args, kwargs,
    ):
        """Synchronous tool execution with telemetry and policy checking."""
        start_time = time.time()
        span_id = str(uuid.uuid4())

        # Evaluate Policy Cache locally
        class _PseudoEvent:
            tool_name = tool_name
            
        policy_result = self._policy_cache.evaluate(_PseudoEvent)
        if policy_result.action == "block":
            raise PolicyViolationError(policy_result.reason)
        elif policy_result.action == "require_approval":
            require_approval = True
            approval_reason = policy_result.reason

        # Serialize inputs safely
        input_data = self._safe_serialize({"args": args, "kwargs": kwargs})

        try:
            # Execute the tool
            result = func(*args, **kwargs)
            latency_ms = (time.time() - start_time) * 1000

            # Emit success event
            event = TelemetryEvent(
                agent_id=self.agent_id,
                event_type=EventType.TOOL_CALL,
                tool_name=tool_name,
                input_data=input_data,
                output_data=self._safe_serialize(result),
                risk_level=RiskLevel(risk_level),
                latency_ms=latency_ms,
                trace_id=self._trace_id,
                parent_span_id=span_id,
            )
            self._telemetry.emit_sync(event)
            return result

        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            event = TelemetryEvent(
                agent_id=self.agent_id,
                event_type=EventType.ERROR,
                tool_name=tool_name,
                input_data=input_data,
                risk_level=RiskLevel(risk_level),
                latency_ms=latency_ms,
                trace_id=self._trace_id,
                error_message=str(e),
            )
            self._telemetry.emit_sync(event)
            raise

    async def _execute_tool_async(
        self, func, tool_name, risk_level, data_classification,
        require_approval, approval_reason, approval_timeout,
        args, kwargs,
    ):
        """Async tool execution with telemetry, policy checking, and HITL gates."""
        start_time = time.time()
        span_id = str(uuid.uuid4())
        input_data = self._safe_serialize({"args": args, "kwargs": kwargs})

        # Evaluate Policy Cache locally
        class _PseudoEvent:
            tool_name = tool_name
            
        policy_result = self._policy_cache.evaluate(_PseudoEvent)
        if policy_result.action == "block":
            raise PolicyViolationError(policy_result.reason)
        elif policy_result.action == "require_approval":
            require_approval = True
            approval_reason = policy_result.reason

        # HITL Gate: request approval if required
        if require_approval and self.agent_id:
            approval_payload = ApprovalRequestPayload(
                agent_id=self.agent_id,
                action_description=f"Tool call: {tool_name}",
                reason=approval_reason,
                context={
                    "tool_name": tool_name,
                    "input_data": input_data,
                    "risk_level": risk_level,
                    "data_classification": data_classification,
                },
                timeout_seconds=approval_timeout,
            )
            response = await self._telemetry.request_approval(approval_payload)
            if not response.approved:
                raise ApprovalDeniedError(
                    f"Human denied tool '{tool_name}': {response.review_notes}"
                )
            logger.info(f"✅ Human approved tool '{tool_name}'")

        try:
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)

            latency_ms = (time.time() - start_time) * 1000

            event = TelemetryEvent(
                agent_id=self.agent_id,
                event_type=EventType.TOOL_CALL,
                tool_name=tool_name,
                input_data=input_data,
                output_data=self._safe_serialize(result),
                risk_level=RiskLevel(risk_level),
                latency_ms=latency_ms,
                trace_id=self._trace_id,
                parent_span_id=span_id,
            )
            await self._telemetry.emit(event)
            return result

        except (PolicyViolationError, ApprovalDeniedError):
            raise
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            event = TelemetryEvent(
                agent_id=self.agent_id,
                event_type=EventType.ERROR,
                tool_name=tool_name,
                input_data=input_data,
                risk_level=RiskLevel(risk_level),
                latency_ms=latency_ms,
                trace_id=self._trace_id,
                error_message=str(e),
            )
            await self._telemetry.emit(event)
            raise

    def start_trace(self) -> str:
        """Start a new trace (links all events in a single agent run)."""
        self._trace_id = str(uuid.uuid4())
        return self._trace_id

    def end_trace(self):
        """End the current trace."""
        self._trace_id = None

    def run(self, task: str):
        """
        Run the agent with a given task.
        Override this method in subclasses for custom agent logic.
        """
        self.start_trace()
        logger.info(f"🏃 Agent '{self.name}' starting task: {task}")

        # Send heartbeat
        if self.agent_id:
            self._telemetry.heartbeat(self.agent_id)

        self.end_trace()

    @staticmethod
    def _safe_serialize(data) -> dict:
        """Safely serialize data to a JSON-compatible dict."""
        try:
            if isinstance(data, dict):
                return {k: str(v) if not isinstance(v, (str, int, float, bool, type(None), list, dict)) else v
                        for k, v in data.items()}
            elif isinstance(data, (str, int, float, bool, type(None))):
                return {"value": data}
            elif isinstance(data, (list, tuple)):
                return {"value": [str(item) for item in data]}
            else:
                return {"value": str(data)}
        except Exception:
            return {"value": "<unserializable>"}
