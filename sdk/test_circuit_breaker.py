from q_sdk import QAgent, require_approval

# Initialize with a dead URL to force connection errors
agent = QAgent(
    name="test-agent",
    q_url="http://localhost:9999",
    api_key="fake_key"
)

@agent.tool(risk_level="high", require_approval=True)
def test_action():
    return "done"

print("Executing test action...")
result = test_action()
print(f"Result: {result}")
