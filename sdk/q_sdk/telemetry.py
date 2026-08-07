"""
Q SDK — Telemetry Client
Handles sending events from the SDK to the Q backend via HTTP.
"""

import httpx
import logging
from typing import Optional
from q_sdk.models import TelemetryEvent, ApprovalRequestPayload, ApprovalResponse

logger = logging.getLogger("q_sdk.telemetry")


class TelemetryClient:
    """Sends telemetry events and approval requests to the Q backend."""

    def __init__(self, q_url: str, api_key: str, timeout: float = 10.0):
        self.q_url = q_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._client = httpx.Client(
            base_url=self.q_url,
            headers={
                "X-Q-API-Key": self.api_key,
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )
        self._async_client: Optional[httpx.AsyncClient] = None

    def _get_async_client(self) -> httpx.AsyncClient:
        if self._async_client is None or self._async_client.is_closed:
            self._async_client = httpx.AsyncClient(
                base_url=self.q_url,
                headers={
                    "X-Q-API-Key": self.api_key,
                    "Content-Type": "application/json",
                },
                timeout=self.timeout,
            )
        return self._async_client

    def emit_sync(self, event: TelemetryEvent) -> bool:
        """Send a telemetry event synchronously."""
        try:
            response = self._client.post(
                "/events/ingest",
                json=event.model_dump(mode="json"),
            )
            if response.status_code == 200:
                return True
            else:
                logger.warning(f"Event ingestion failed: {response.status_code} {response.text}")
                return False
        except Exception as e:
            logger.error(f"Failed to emit event: {e}")
            return False

    async def emit(self, event: TelemetryEvent) -> bool:
        """Send a telemetry event asynchronously."""
        try:
            client = self._get_async_client()
            response = await client.post(
                "/events/ingest",
                json=event.model_dump(mode="json"),
            )
            if response.status_code == 200:
                return True
            else:
                logger.warning(f"Event ingestion failed: {response.status_code} {response.text}")
                return False
        except Exception as e:
            logger.error(f"Failed to emit event: {e}")
            return False

    async def request_approval(self, payload: ApprovalRequestPayload) -> ApprovalResponse:
        """Send an approval request and wait for human response."""
        try:
            client = self._get_async_client()
            response = await client.post(
                "/approvals/request",
                json=payload.model_dump(mode="json"),
                timeout=payload.timeout_seconds + 5,  # Extra buffer
            )
            if response.status_code == 200:
                return ApprovalResponse(**response.json())
            else:
                logger.warning(f"Approval request failed: {response.status_code}")
                return ApprovalResponse(approved=False, review_notes="Request failed")
        except httpx.TimeoutException:
            logger.warning("Approval request timed out — auto-denied")
            return ApprovalResponse(approved=False, review_notes="Timeout — auto-denied")
        except Exception as e:
            logger.error(f"Approval request error: {e}")
            return ApprovalResponse(approved=False, review_notes=f"Error: {str(e)}")

    def register_agent(self, registration: dict) -> dict:
        """Register this agent with Q and receive an agent ID."""
        try:
            response = self._client.post("/agents/register", json=registration)
            if response.status_code in (200, 201):
                return response.json()
            else:
                logger.error(f"Agent registration failed: {response.status_code} {response.text}")
                return {}
        except Exception as e:
            logger.error(f"Agent registration error: {e}")
            return {}

    def heartbeat(self, agent_id: str) -> bool:
        """Send a heartbeat to Q confirming the agent is alive."""
        try:
            response = self._client.post(f"/agents/{agent_id}/heartbeat")
            return response.status_code == 200
        except Exception:
            return False

    async def close(self):
        """Clean up HTTP clients."""
        self._client.close()
        if self._async_client:
            await self._async_client.aclose()
