"""
Q WebSocket Connection Manager
Manages real-time connections for live monitoring and HITL approval notifications.
"""

from fastapi import WebSocket
from typing import Dict, Set
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time event streaming."""

    def __init__(self):
        # All active dashboard connections
        self.active_connections: Set[WebSocket] = set()
        # Agent-specific channels: agent_id -> set of connections
        self.agent_channels: Dict[str, Set[WebSocket]] = {}
        # SDK connections waiting for approval responses: approval_id -> websocket
        self.approval_waiters: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, channel: str = "global"):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        if channel != "global":
            if channel not in self.agent_channels:
                self.agent_channels[channel] = set()
            self.agent_channels[channel].add(websocket)
        logger.info(f"WebSocket connected. Channel: {channel}. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, channel: str = "global"):
        """Remove a WebSocket connection."""
        self.active_connections.discard(websocket)
        if channel in self.agent_channels:
            self.agent_channels[channel].discard(websocket)
            if not self.agent_channels[channel]:
                del self.agent_channels[channel]
        # Clean up approval waiters
        expired = [k for k, v in self.approval_waiters.items() if v == websocket]
        for k in expired:
            del self.approval_waiters[k]
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Send a message to ALL connected dashboard clients."""
        payload = json.dumps(message)
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.add(connection)
        for conn in disconnected:
            self.active_connections.discard(conn)

    async def send_to_agent_channel(self, agent_id: str, message: dict):
        """Send a message to clients monitoring a specific agent."""
        if agent_id in self.agent_channels:
            payload = json.dumps(message)
            disconnected = set()
            for connection in self.agent_channels[agent_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    disconnected.add(connection)
            for conn in disconnected:
                self.agent_channels[agent_id].discard(conn)

    async def register_approval_waiter(self, approval_id: str, websocket: WebSocket):
        """Register an SDK connection waiting for an approval response."""
        self.approval_waiters[approval_id] = websocket

    async def send_approval_response(self, approval_id: str, response: dict):
        """Send an approval/denial back to the waiting SDK."""
        if approval_id in self.approval_waiters:
            try:
                await self.approval_waiters[approval_id].send_text(json.dumps(response))
            except Exception:
                pass
            finally:
                del self.approval_waiters[approval_id]


# Singleton instance
manager = ConnectionManager()
