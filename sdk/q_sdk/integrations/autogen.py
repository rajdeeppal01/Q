import time
import uuid
import logging
from typing import Any, Dict

from q_sdk.client import QAgent, PolicyViolationError
from q_sdk.models import TelemetryEvent, EventType, RiskLevel

logger = logging.getLogger("q_sdk.autogen")

def instrument_autogen_agent(autogen_agent: Any, q_agent: QAgent):
    """
    Instruments an AutoGen ConversableAgent with Q governance.
    Intercepts reply generation and tool executions.
    """
    
    # 1. Intercept Reply Generation (LLM Invocation)
    original_generate_reply = autogen_agent.generate_reply

    def q_generate_reply(messages=None, sender=None, **kwargs):
        run_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Ensure trace ID
        if not q_agent._trace_id:
            q_agent.start_trace()

        input_data = q_agent._safe_serialize({
            "messages": messages,
            "sender": sender.name if sender else "unknown"
        })
        
        # Emit LLM Start
        event = TelemetryEvent(
            agent_id=q_agent.agent_id,
            event_type=EventType.LLM_INVOKE,
            input_data=input_data,
            risk_level=RiskLevel.LOW,
            trace_id=q_agent._trace_id,
            parent_span_id=run_id
        )
        q_agent._telemetry.emit_sync(event)
        
        try:
            # Execute actual generation
            reply = original_generate_reply(messages=messages, sender=sender, **kwargs)
            
            latency_ms = (time.time() - start_time) * 1000
            end_event = TelemetryEvent(
                agent_id=q_agent.agent_id,
                event_type=EventType.DECISION,
                output_data=q_agent._safe_serialize({"reply": reply}),
                risk_level=RiskLevel.LOW,
                latency_ms=latency_ms,
                trace_id=q_agent._trace_id,
                parent_span_id=run_id
            )
            q_agent._telemetry.emit_sync(end_event)
            return reply
            
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            error_event = TelemetryEvent(
                agent_id=q_agent.agent_id,
                event_type=EventType.ERROR,
                error_message=str(e),
                risk_level=RiskLevel.LOW,
                latency_ms=latency_ms,
                trace_id=q_agent._trace_id,
                parent_span_id=run_id
            )
            q_agent._telemetry.emit_sync(error_event)
            raise

    # 2. Intercept Tool Execution
    original_execute_function = autogen_agent.execute_function

    def q_execute_function(func_call, *args, **kwargs):
        run_id = str(uuid.uuid4())
        start_time = time.time()
        tool_name = func_call.get("name", "unknown_tool")
        
        # Policy Evaluation
        class _PseudoEvent: pass
        _PseudoEvent.tool_name = tool_name
        policy_result = q_agent._policy_cache.evaluate(_PseudoEvent)
        
        if policy_result.action == "block":
            logger.warning(f"🚫 Q Policy blocked tool execution: {tool_name}")
            # AutoGen usually expects a string or dict for tool returns if error
            return (False, f"Error: Tool {tool_name} was blocked by Q Security Policy: {policy_result.reason}")

        # Emit Tool Start
        event = TelemetryEvent(
            agent_id=q_agent.agent_id,
            event_type=EventType.TOOL_CALL,
            tool_name=tool_name,
            input_data=q_agent._safe_serialize({"func_call": func_call}),
            risk_level=RiskLevel.MEDIUM,
            trace_id=q_agent._trace_id,
            parent_span_id=run_id
        )
        q_agent._telemetry.emit_sync(event)
        
        try:
            success, reply = original_execute_function(func_call, *args, **kwargs)
            
            latency_ms = (time.time() - start_time) * 1000
            end_event = TelemetryEvent(
                agent_id=q_agent.agent_id,
                event_type=EventType.TOOL_CALL,
                tool_name=tool_name,
                output_data=q_agent._safe_serialize({"success": success, "reply": reply}),
                risk_level=RiskLevel.MEDIUM,
                latency_ms=latency_ms,
                trace_id=q_agent._trace_id,
                parent_span_id=run_id
            )
            q_agent._telemetry.emit_sync(end_event)
            return success, reply
            
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            error_event = TelemetryEvent(
                agent_id=q_agent.agent_id,
                event_type=EventType.ERROR,
                tool_name=tool_name,
                error_message=str(e),
                risk_level=RiskLevel.MEDIUM,
                latency_ms=latency_ms,
                trace_id=q_agent._trace_id,
                parent_span_id=run_id
            )
            q_agent._telemetry.emit_sync(error_event)
            raise

    # Patch the agent
    autogen_agent.generate_reply = q_generate_reply
    if hasattr(autogen_agent, "execute_function"):
        autogen_agent.execute_function = q_execute_function
        
    logger.info(f"🛡️ AutoGen agent '{autogen_agent.name}' successfully instrumented with Q.")
    return autogen_agent
