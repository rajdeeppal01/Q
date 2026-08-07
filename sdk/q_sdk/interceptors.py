"""
Q SDK — Interceptors for wrapping LLM provider calls.
Automatically captures LLM invocations as telemetry events.
"""

from functools import wraps
import time
import uuid
import inspect
from typing import Any, Callable

from q_sdk.models import TelemetryEvent, EventType, RiskLevel

def wrap_llm_call(agent: Any, provider: str = "custom", model: str = "unknown"):
    """
    Decorator to wrap an LLM generation call (e.g. Gemini, OpenAI) 
    and log it to Q Telemetry.
    """
    def decorator(func: Callable):
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            span_id = str(uuid.uuid4())
            try:
                result = func(*args, **kwargs)
                latency = (time.time() - start_time) * 1000
                event = TelemetryEvent(
                    agent_id=agent.agent_id,
                    event_type=EventType.LLM_INVOKE,
                    tool_name=f"llm:{provider}",
                    input_data={"model": model, "args": agent._safe_serialize(args), "kwargs": agent._safe_serialize(kwargs)},
                    output_data=agent._safe_serialize(result),
                    risk_level=RiskLevel.LOW,
                    latency_ms=latency,
                    trace_id=agent._trace_id,
                    parent_span_id=span_id
                )
                agent._telemetry.emit_sync(event)
                return result
            except Exception as e:
                latency = (time.time() - start_time) * 1000
                event = TelemetryEvent(
                    agent_id=agent.agent_id,
                    event_type=EventType.ERROR,
                    tool_name=f"llm:{provider}",
                    input_data={"model": model},
                    error_message=str(e),
                    risk_level=RiskLevel.LOW,
                    latency_ms=latency,
                    trace_id=agent._trace_id,
                )
                agent._telemetry.emit_sync(event)
                raise

        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            span_id = str(uuid.uuid4())
            try:
                result = await func(*args, **kwargs)
                latency = (time.time() - start_time) * 1000
                event = TelemetryEvent(
                    agent_id=agent.agent_id,
                    event_type=EventType.LLM_INVOKE,
                    tool_name=f"llm:{provider}",
                    input_data={"model": model, "args": agent._safe_serialize(args), "kwargs": agent._safe_serialize(kwargs)},
                    output_data=agent._safe_serialize(result),
                    risk_level=RiskLevel.LOW,
                    latency_ms=latency,
                    trace_id=agent._trace_id,
                    parent_span_id=span_id
                )
                await agent._telemetry.emit(event)
                return result
            except Exception as e:
                latency = (time.time() - start_time) * 1000
                event = TelemetryEvent(
                    agent_id=agent.agent_id,
                    event_type=EventType.ERROR,
                    tool_name=f"llm:{provider}",
                    input_data={"model": model},
                    error_message=str(e),
                    risk_level=RiskLevel.LOW,
                    latency_ms=latency,
                    trace_id=agent._trace_id,
                )
                await agent._telemetry.emit(event)
                raise
                
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator
