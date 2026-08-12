"""
Q SDK — Telemetry Client
Handles sending events from the SDK to the Q backend via HTTP.
"""

import httpx
import logging
import asyncio
import time
from functools import wraps
from typing import Optional
from q_sdk.models import TelemetryEvent, ApprovalRequestPayload, ApprovalResponse

logger = logging.getLogger("q_sdk.telemetry")

def with_backoff(max_retries=3, initial_delay=1.0, max_delay=8.0):
    """Decorator to automatically retry network requests with exponential backoff."""
    def decorator(func):
        if asyncio.iscoroutinefunction(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                delay = initial_delay
                for attempt in range(max_retries + 1):
                    try:
                        return await func(*args, **kwargs)
                    except (httpx.RequestError, httpx.TimeoutException) as e:
                        if attempt == max_retries:
                            logger.error(f"Network error in {func.__name__} after {max_retries} retries: {e}")
                            raise e
                        logger.warning(f"Network error in {func.__name__} (attempt {attempt+1}/{max_retries}): {e}. Retrying in {delay}s...")
                        await asyncio.sleep(delay)
                        delay = min(delay * 2, max_delay)
            return async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                delay = initial_delay
                for attempt in range(max_retries + 1):
                    try:
                        return func(*args, **kwargs)
                    except (httpx.RequestError, httpx.TimeoutException) as e:
                        if attempt == max_retries:
                            logger.error(f"Network error in {func.__name__} after {max_retries} retries: {e}")
                            raise e
                        logger.warning(f"Network error in {func.__name__} (attempt {attempt+1}/{max_retries}): {e}. Retrying in {delay}s...")
                        time.sleep(delay)
                        delay = min(delay * 2, max_delay)
            return sync_wrapper
    return decorator


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

    @with_backoff()
    def _post_sync(self, endpoint: str, json: dict = None, timeout: float = None):
        return self._client.post(endpoint, json=json, timeout=timeout or self.timeout)

    @with_backoff()
    async def _post_async(self, endpoint: str, json: dict = None, timeout: float = None):
        client = self._get_async_client()
        return await client.post(endpoint, json=json, timeout=timeout or self.timeout)

    @with_backoff()
    def _get_sync(self, endpoint: str):
        return self._client.get(endpoint)

    def emit_sync(self, event: TelemetryEvent) -> bool:
        """Send a telemetry event synchronously."""
        try:
            response = self._post_sync(
                "/events/ingest",
                json=event.model_dump(mode="json"),
            )
            if response.status_code == 200:
                return True
            else:
                logger.warning(f"Event ingestion failed: {response.status_code} {response.text}")
                return False
        except Exception as e:
            logger.error(f"Failed to emit event after retries: {e}")
            return False

    async def emit(self, event: TelemetryEvent) -> bool:
        """Send a telemetry event asynchronously."""
        try:
            response = await self._post_async(
                "/events/ingest",
                json=event.model_dump(mode="json"),
            )
            if response.status_code == 200:
                return True
            else:
                logger.warning(f"Event ingestion failed: {response.status_code} {response.text}")
                return False
        except Exception as e:
            logger.error(f"Failed to emit event after retries: {e}")
            return False

    def request_approval_sync(self, payload: ApprovalRequestPayload) -> ApprovalResponse:
        """Send an approval request synchronously and wait for human response."""
        try:
            response = self._post_sync(
                "/approvals/request",
                json=payload.model_dump(mode="json"),
                timeout=payload.timeout_seconds + 5,
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
            logger.error(f"Approval request error after retries: {e}")
            return ApprovalResponse(approved=False, review_notes=f"Error: {str(e)}")

    async def request_approval(self, payload: ApprovalRequestPayload) -> ApprovalResponse:
        """Send an approval request and wait for human response."""
        try:
            response = await self._post_async(
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
            logger.error(f"Approval request error after retries: {e}")
            return ApprovalResponse(approved=False, review_notes=f"Error: {str(e)}")

    def register_agent(self, registration: dict) -> dict:
        """Register this agent with Q and receive an agent ID."""
        try:
            response = self._post_sync("/agents/register", json=registration)
            if response.status_code in (200, 201):
                return response.json()
            else:
                logger.error(f"Agent registration failed: {response.status_code} {response.text}")
                return {}
        except Exception as e:
            logger.error(f"Agent registration error after retries: {e}")
            return {}

    def heartbeat(self, agent_id: str) -> bool:
        """Send a heartbeat to Q confirming the agent is alive."""
        try:
            response = self._post_sync(f"/agents/{agent_id}/heartbeat")
            return response.status_code == 200
        except Exception:
            return False

    def fetch_policies(self, agent_id: str) -> list:
        """Fetch all active policies for this agent."""
        try:
            response = self._get_sync(f"/policies/active?agent_id={agent_id}")
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Failed to fetch policies: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Policy fetch error after retries: {e}")
            return []

    async def close(self):
        """Clean up HTTP clients."""
        self._client.close()
        if self._async_client:
            await self._async_client.aclose()
