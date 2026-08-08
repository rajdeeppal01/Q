import time
import uuid
import logging
from typing import Any, Dict, List, Optional
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult
from langchain_core.messages import BaseMessage

from q_sdk.client import QAgent, PolicyViolationError
from q_sdk.models import TelemetryEvent, EventType, RiskLevel

logger = logging.getLogger("q_sdk.langchain")

class QLangchainCallbackHandler(BaseCallbackHandler):
    """
    A LangChain callback handler that automatically instruments agents with Q governance.
    Intercepts LLM invocations and tool calls, routing them through Q telemetry and policy checks.
    """

    def __init__(self, q_agent: QAgent):
        super().__init__()
        self.q_agent = q_agent
        self._llm_starts: Dict[str, float] = {}
        self._tool_starts: Dict[str, float] = {}
        
        # Ensure a trace ID exists for the chain
        if not self.q_agent._trace_id:
            self.q_agent.start_trace()

    def _safe_serialize(self, data: Any) -> dict:
        return self.q_agent._safe_serialize(data)

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> Any:
        run_id = str(kwargs.get("run_id", uuid.uuid4()))
        self._llm_starts[run_id] = time.time()
        
        input_data = self._safe_serialize({"prompts": prompts})
        
        event = TelemetryEvent(
            agent_id=self.q_agent.agent_id,
            event_type=EventType.LLM_INVOKE,
            input_data=input_data,
            risk_level=RiskLevel.LOW,
            trace_id=self.q_agent._trace_id,
            parent_span_id=run_id
        )
        self.q_agent._telemetry.emit_sync(event)

    def on_chat_model_start(
        self, serialized: Dict[str, Any], messages: List[List[BaseMessage]], **kwargs: Any
    ) -> Any:
        run_id = str(kwargs.get("run_id", uuid.uuid4()))
        self._llm_starts[run_id] = time.time()
        
        serializable_msgs = [[msg.content for msg in msg_list] for msg_list in messages]
        input_data = self._safe_serialize({"messages": serializable_msgs})
        
        event = TelemetryEvent(
            agent_id=self.q_agent.agent_id,
            event_type=EventType.LLM_INVOKE,
            input_data=input_data,
            risk_level=RiskLevel.LOW,
            trace_id=self.q_agent._trace_id,
            parent_span_id=run_id
        )
        self.q_agent._telemetry.emit_sync(event)

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> Any:
        run_id = str(kwargs.get("run_id", ""))
        start_time = self._llm_starts.pop(run_id, time.time())
        latency_ms = (time.time() - start_time) * 1000
        
        # We don't necessarily need to emit a new event just for the end if we want to save DB space,
        # but for full tracing we can emit a decision event or just log success.
        output_data = self._safe_serialize(response.generations)
        
        event = TelemetryEvent(
            agent_id=self.q_agent.agent_id,
            event_type=EventType.DECISION,
            output_data=output_data,
            risk_level=RiskLevel.LOW,
            latency_ms=latency_ms,
            trace_id=self.q_agent._trace_id,
            parent_span_id=run_id
        )
        self.q_agent._telemetry.emit_sync(event)

    def on_llm_error(self, error: BaseException, **kwargs: Any) -> Any:
        run_id = str(kwargs.get("run_id", ""))
        start_time = self._llm_starts.pop(run_id, time.time())
        latency_ms = (time.time() - start_time) * 1000
        
        event = TelemetryEvent(
            agent_id=self.q_agent.agent_id,
            event_type=EventType.ERROR,
            error_message=str(error),
            risk_level=RiskLevel.LOW,
            latency_ms=latency_ms,
            trace_id=self.q_agent._trace_id,
            parent_span_id=run_id
        )
        self.q_agent._telemetry.emit_sync(event)

    def on_tool_start(
        self, serialized: Dict[str, Any], input_str: str, **kwargs: Any
    ) -> Any:
        run_id = str(kwargs.get("run_id", uuid.uuid4()))
        self._tool_starts[run_id] = time.time()
        
        tool_name = serialized.get("name", "unknown_tool")
        
        # Policy Evaluation
        class _PseudoEvent:
            pass
        _PseudoEvent.tool_name = tool_name
            
        policy_result = self.q_agent._policy_cache.evaluate(_PseudoEvent)
        if policy_result.action == "block":
            logger.warning(f"🚫 Q Policy blocked tool execution: {tool_name}")
            raise PolicyViolationError(policy_result.reason)
        # Note: HITL requires async or blocking mechanics which are complex in sync handlers,
        # so for LangChain we enforce blocks via PolicyCache natively.

        input_data = self._safe_serialize({"input": input_str})
        
        event = TelemetryEvent(
            agent_id=self.q_agent.agent_id,
            event_type=EventType.TOOL_CALL,
            tool_name=tool_name,
            input_data=input_data,
            risk_level=RiskLevel.MEDIUM, # Default to medium if unknown
            trace_id=self.q_agent._trace_id,
            parent_span_id=run_id
        )
        self.q_agent._telemetry.emit_sync(event)

    def on_tool_end(self, output: str, **kwargs: Any) -> Any:
        run_id = str(kwargs.get("run_id", ""))
        start_time = self._tool_starts.pop(run_id, time.time())
        latency_ms = (time.time() - start_time) * 1000
        tool_name = kwargs.get("name", "unknown_tool")
        
        event = TelemetryEvent(
            agent_id=self.q_agent.agent_id,
            event_type=EventType.TOOL_CALL,
            tool_name=tool_name,
            output_data=self._safe_serialize({"output": output}),
            risk_level=RiskLevel.MEDIUM,
            latency_ms=latency_ms,
            trace_id=self.q_agent._trace_id,
            parent_span_id=run_id
        )
        self.q_agent._telemetry.emit_sync(event)

    def on_tool_error(self, error: BaseException, **kwargs: Any) -> Any:
        run_id = str(kwargs.get("run_id", ""))
        start_time = self._tool_starts.pop(run_id, time.time())
        latency_ms = (time.time() - start_time) * 1000
        tool_name = kwargs.get("name", "unknown_tool")
        
        event = TelemetryEvent(
            agent_id=self.q_agent.agent_id,
            event_type=EventType.ERROR,
            tool_name=tool_name,
            error_message=str(error),
            risk_level=RiskLevel.MEDIUM,
            latency_ms=latency_ms,
            trace_id=self.q_agent._trace_id,
            parent_span_id=run_id
        )
        self.q_agent._telemetry.emit_sync(event)
