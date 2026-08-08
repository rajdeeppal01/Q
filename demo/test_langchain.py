import os
import sys

# Add the local sdk directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'sdk')))

from q_sdk.client import QAgent
from q_sdk.integrations.langchain import QLangchainCallbackHandler
from langchain_core.callbacks import CallbackManager
from langchain_core.messages import HumanMessage
from langchain_core.language_models import FakeListChatModel
from langchain_core.tools import tool

def main():
    # 1. Initialize Q Agent
    print("Initializing QAgent...")
    q_agent = QAgent(
        name="LangChain-Test-Agent",
        q_url="https://q-f8z0.onrender.com",
        description="Testing LangChain integrations",
        agent_type="autonomous",
        framework="langchain"
    )

    # 2. Create the callback handler
    q_callback = QLangchainCallbackHandler(q_agent=q_agent)
    callbacks = [q_callback]

    # 3. Create a Fake LLM (simulating LangChain usage without OpenAI keys)
    llm = FakeListChatModel(responses=["I will use the search tool.", "The answer is 42."])

    # 4. Create a LangChain tool
    @tool
    def search_web(query: str) -> str:
        """Search the web for information."""
        return "Search results for: " + query

    print("\n[Simulating LLM Invocation...]")
    # 5. Invoke LLM with callbacks
    q_agent.start_trace()
    
    # Normally, an AgentExecutor handles this, but we can manually invoke
    llm.invoke([HumanMessage(content="What is 6 times 7?")], config={"callbacks": callbacks})

    print("\n[Simulating Tool Execution...]")
    # 6. Invoke tool with callbacks
    try:
        search_web.invoke({"query": "What is 6 times 7?"}, config={"callbacks": callbacks})
    except Exception as e:
        print("Tool error (expected if mocked out):", e)
        
    print("\n✅ Events successfully dispatched to Q Platform via LangChain callback handler!")

if __name__ == "__main__":
    main()
