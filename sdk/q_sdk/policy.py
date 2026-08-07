"""
Q SDK — Client-side policy cache.
Caches policies from Q backend to enable local enforcement without network calls.
"""

from typing import Dict, Any, List
import time

class PolicyResult:
    def __init__(self, action: str, reason: str = ""):
        self.action = action  # "allow", "block", "require_approval"
        self.reason = reason


class PolicyCache:
    """Caches policies retrieved from the Q backend."""
    
    def __init__(self, ttl_seconds: int = 60):
        self._policies: List[Dict[str, Any]] = []
        self._last_fetched: float = 0
        self._ttl = ttl_seconds

    def update_policies(self, policies: List[Dict[str, Any]]):
        self._policies = policies
        self._last_fetched = time.time()

    def is_stale(self) -> bool:
        return (time.time() - self._last_fetched) > self._ttl

    def evaluate(self, event) -> PolicyResult:
        """
        Evaluate an event against cached policies.
        This is a lightweight client-side evaluation. 
        The backend performs authoritative evaluation.
        """
        for policy in self._policies:
            if not policy.get("is_active", True):
                continue
                
            # Basic client-side check: if policy is block-all for this tool
            conditions = policy.get("conditions", {})
            if conditions.get("tool_name") == event.tool_name:
                actions = policy.get("actions", {})
                if actions.get("type") == "block":
                    return PolicyResult("block", f"Blocked by policy: {policy.get('name')}")
                elif actions.get("type") == "require_approval":
                    return PolicyResult("require_approval", f"Approval required by policy: {policy.get('name')}")
        
        return PolicyResult("allow")
