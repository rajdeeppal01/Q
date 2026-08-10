"""
Q — Agentic AI Security & Governance Platform
Main FastAPI Application Entry Point

"The name's Q. I give the agents their tools... and I make sure they don't misuse them."
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter
import logging

from app.config import settings
from app.database import engine, Base
from app.websocket.manager import manager
from app.routes import auth, agents, events, alerts, policies, approvals, audit
from fastapi.responses import JSONResponse
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("q")


# --- Lifespan ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Create all tables on startup
    logger.info("  Q is initializing...")
    Base.metadata.create_all(bind=engine)
    logger.info(" Database tables created/verified")
    logger.info(f" Q v{settings.APP_VERSION} is online")
    yield
    logger.info("  Q is shutting down...")


# --- App ---

app = FastAPI(
    title="Q — Agentic AI Security & Governance Platform",
    description=(
        "The security and governance control plane for autonomous AI agents. "
        "Q discovers, monitors, and governs AI agents — managing their identities, "
        "enforcing policies, detecting anomalies, and ensuring regulatory compliance "
        "across NIST AI RMF, OWASP Agentic Top 10, and ISO 42001."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
)


# --- Middleware ---

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting
app.state.limiter = limiter
from slowapi import _rate_limit_exceeded_handler
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc), "traceback": traceback.format_exc()}
    )


# --- Routes ---

app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(events.router)
app.include_router(alerts.router)
app.include_router(policies.router)
app.include_router(approvals.router)
app.include_router(audit.router)


# --- Health Check ---

@app.get("/", tags=["System"])
def root():
    return {
        "name": "Q",
        "tagline": "Agentic AI Security & Governance Platform",
        "version": settings.APP_VERSION,
        "status": "operational",
    }


@app.get("/health", tags=["System"])
def health():
    return {"status": "healthy"}


# --- WebSocket Endpoints ---

@app.websocket("/ws/monitor")
async def monitor_websocket(websocket: WebSocket):
    """Global monitoring channel — receives ALL agent events in real-time."""
    await manager.connect(websocket, channel="global")
    try:
        while True:
            # Keep connection alive; dashboard sends pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel="global")


@app.websocket("/ws/monitor/{agent_id}")
async def agent_monitor_websocket(websocket: WebSocket, agent_id: str):
    """Agent-specific monitoring channel."""
    await manager.connect(websocket, channel=agent_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel=agent_id)
