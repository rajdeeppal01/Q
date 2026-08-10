from q_sdk import QAgent, require_approval
import time

# Initialize the agent (this now points to your live Render backend!)
agent = QAgent(
    name="my-first-agent",
    api_key="q_sk_demo_key_123"
)

# Protect this tool with Q
@agent.tool(risk_level="high")
def transfer_funds(user_id, amount):
    # Simulate some work
    time.sleep(1)
    return f"Transferred ${amount} to {user_id}"

print("Calling the protected tool. Check your live dashboard!")

try:
    # This will be intercepted by the SDK and sent to Render
    result = transfer_funds("usr_999", 5000)
    print(f"Tool executed successfully: {result}")
except Exception as e:
    print(f"Tool blocked or failed: {e}")
