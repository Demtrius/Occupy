from typing import Dict, List

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.deps import get_db
from ..core.auth import decode_token
from ..models.chat import Chat

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)

manager = ConnectionManager()


@router.websocket("/chat/{chat_id}")
async def chat_websocket(
    websocket: WebSocket,
    chat_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """WebSocket for real-time chat messaging."""
    try:
        # Authenticate user
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return

        # Check if user has access to chat
        from sqlalchemy import select
        stmt = select(Chat).where(Chat.id == chat_id)
        result = await db.execute(stmt)
        chat = result.scalar_one_or_none()
        if not chat or user_id not in [str(chat.user1_id), str(chat.user2_id)]:
            await websocket.close(code=1008)
            return

        await manager.connect(chat_id, websocket)

        try:
            while True:
                data = await websocket.receive_json()
                # Broadcast message to all in chat
                await manager.broadcast(chat_id, {
                    "type": "message",
                    "user_id": user_id,
                    "content": data.get("content"),
                    "timestamp": data.get("timestamp"),
                })
        except WebSocketDisconnect:
            manager.disconnect(chat_id, websocket)
    except Exception:
        await websocket.close(code=1011)


@router.websocket("/bookings/{clique_id}")
async def booking_websocket(
    websocket: WebSocket,
    clique_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """WebSocket for real-time booking updates."""
    try:
        # Authenticate user
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return

        # Check if user is member of clique (simplified)
        # In real implementation, check clique membership
        await manager.connect(f"booking_{clique_id}", websocket)

        try:
            while True:
                # This endpoint is for broadcasting only, clients don't send data
                await websocket.receive_json()
        except WebSocketDisconnect:
            manager.disconnect(f"booking_{clique_id}", websocket)
    except Exception:
        await websocket.close(code=1011)