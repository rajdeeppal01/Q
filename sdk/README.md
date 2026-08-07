# Q SDK

The `q-sdk` is the official Python library for instrumenting AI agents with Q's security governance, policy enforcement, and telemetry tracking.

## Installation

```bash
pip install q-sdk
```

*(If installing locally for development from this repository: `pip install -e .`)*

## Quickstart

Wrap any AI agent in the `QAgent` class and decorate its tools.

```python
from q_sdk import QAgent, tool, require_approval

# Initialize the agent SDK
agent = QAgent(
    name="Financial Analyst Agent",
    q_url="https://your-render-app.onrender.com",
    api_key="your_q_api_key",
    agent_type="analyst",
    framework="custom"
)

# Instrument a tool
@agent.tool(risk_level="low", data_classification="public")
def fetch_stock_price(ticker: str):
    # This call is automatically logged and policy-checked by Q
    return f"Stock price for {ticker} is $100."

# Add Human-in-the-loop (HITL) gates to high-risk tools
@agent.tool(risk_level="critical", data_classification="pii")
@require_approval(reason="Accesses customer bank accounts", timeout_seconds=300)
def wire_transfer(customer_id: str, amount: float):
    # Execution will PAUSE here until an admin approves it via the Q Dashboard!
    return f"Transferred ${amount} for {customer_id}."
```

## Features

- **Automatic Telemetry**: Tracks tool invocations, inputs, outputs, errors, and latency.
- **Client-Side Policy Cache**: Evaluates tool calls against organization policies instantly with low latency.
- **Human-in-the-loop (HITL)**: `@require_approval` seamlessly pauses execution and blocks until a human administrator approves the action.
- **LLM Interception**: Log token usage and model inputs using the `wrap_llm_call` decorator.

## Architecture

The SDK communicates with the Q backend (FastAPI) via HTTP and WebSockets.
- **Registration**: On startup, the SDK registers the agent and retrieves its `agent_id`.
- **Policy Cache**: Downloads active policies on startup to perform rapid, local evaluation of tool calls.
- **Event Ingestion**: Async/Sync HTTP streams of events to the backend. 
- **Approvals**: Pauses execution and polls/waits on a WebSocket or long-polling endpoint for administrative sign-off.
