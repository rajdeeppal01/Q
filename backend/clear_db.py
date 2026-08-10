import os
import sys

# Add the current directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import engine
from app.models.event import Event
from app.models.agent import Agent
from app.models.policy import PolicyViolation
from app.models.identity import AgentIdentity
from app.models.alert import Alert
from app.models.approval import ApprovalRequest

def clear_mock_data():
    with Session(engine) as session:
        print("Clearing alerts...")
        session.query(Alert).delete()
        print("Clearing approval requests...")
        session.query(ApprovalRequest).delete()
        print("Clearing policy violations...")
        session.query(PolicyViolation).delete()
        print("Clearing events...")
        session.query(Event).delete()
        print("Clearing agent identities...")
        session.query(AgentIdentity).delete()
        print("Clearing agents...")
        session.query(Agent).delete()
        session.commit()
        print("Database cleared successfully!")

if __name__ == "__main__":
    clear_mock_data()
