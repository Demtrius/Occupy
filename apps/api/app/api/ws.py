from typing import Dict, List

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.deps import get_db
from ..core.auth import decode_token
from ..models.chat import Chat
from ..models.clique import Clique

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        print(f"[WS] Connection added to room {room_id}. Total: {len(self.active_connections[room_id])}")

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            try:
                self.active_connections[room_id].remove(websocket)
                if not self.active_connections[room_id]:
                    del self.active_connections[room_id]
            except ValueError:
                pass  # Connection already removed

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            # Create a copy of the list to avoid modification during iteration
            connections_to_send = self.active_connections[room_id].copy()
            for connection in connections_to_send:
                try:
                    # Check if connection is still open before sending
                    if hasattr(connection, 'client_state') and connection.client_state.name != 'DISCONNECTED':
                        await connection.send_json(message)
                except Exception as send_error:
                    print(f"[WS] Error sending to connection: {send_error}")
                    # Remove failed connection from active connections
                    if connection in self.active_connections.get(room_id, []):
                        self.active_connections[room_id].remove(connection)


manager = ConnectionManager()


async def _handle_chat_websocket(
    websocket: WebSocket,
    chat_id: str,
    token: str,
    db: AsyncSession,
) -> None:
    payload = decode_token(token)
    user_id = payload.get("sub") if payload else None
    if not user_id:
        await websocket.close(code=1008)
        return

    stmt = select(Chat).where(Chat.id == chat_id)
    result = await db.execute(stmt)
    chat = result.scalar_one_or_none()
    if not chat:
        await websocket.close(code=1008)
        return
    
    if user_id not in {
        str(chat.business_user_id),
        str(chat.client_user_id),
    }:
        await websocket.close(code=1008)
        return

    await manager.connect(chat_id, websocket)

    try:
        while True:
            try:
                data = await websocket.receive_json()
                message_type = data.get("type") or "message"
            except Exception as receive_error:
                # Break the loop if WebSocket is disconnected
                if "disconnect" in str(receive_error).lower():
                    break
                continue
            if message_type == "typing":
                await manager.broadcast(chat_id, {"type": "typing", "user_id": user_id})
                continue
            if message_type == "stop_typing":
                await manager.broadcast(chat_id, {"type": "stop_typing", "user_id": user_id})
                continue
            if message_type == "message.delete":
                await manager.broadcast(
                    chat_id,
                    {
                        "type": "message.deleted",
                        "user_id": user_id,
                        "message_id": data.get("message_id"),
                    },
                )
                continue
            await manager.broadcast(
                chat_id,
                {
                    "type": "message.created",
                    "user_id": user_id,
                    "content": data.get("content"),
                    "timestamp": data.get("timestamp"),
                },
            )
    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)
    except Exception:
        manager.disconnect(chat_id, websocket)
        raise


@router.websocket("/chat/{chat_id}")
async def chat_websocket(
    websocket: WebSocket,
    chat_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> None:
    """WebSocket for real-time chat messaging."""
    try:
        await _handle_chat_websocket(websocket, chat_id, token, db)
    except Exception:
        await websocket.close(code=1011)


@router.websocket("/chat")
async def chat_websocket_query(
    websocket: WebSocket,
    chat_id: str = Query(...),
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> None:
    """WebSocket endpoint that accepts chat_id via query parameter."""
    try:
        await _handle_chat_websocket(websocket, chat_id, token, db)
    except Exception:
        await websocket.close(code=1011)


@router.websocket("/user/{user_id}")
async def user_websocket(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...),
):
    """WebSocket for user-specific notifications."""
    try:
        print(f"[WS] User WebSocket connection attempt - user_id: {user_id}, token: {token[:20]}...")
        # Authenticate user
        payload = decode_token(token)
        authenticated_user_id = payload.get("sub")
        print(f"[WS] User WebSocket - authenticated_user_id: {authenticated_user_id}, requested_user_id: {user_id}")
        if not authenticated_user_id or authenticated_user_id != user_id:
            print(f"[WS] User WebSocket auth failed, closing connection")
            await websocket.close(code=1008)
            return

        room_id = f"user_{user_id}"
        await manager.connect(room_id, websocket)

        try:
            while True:
                # This endpoint is for broadcasting only, clients don't send data
                await websocket.receive_json()
        except WebSocketDisconnect:
            manager.disconnect(room_id, websocket)
    except Exception as e:
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

        # Allow only clique owners to subscribe for now.
        stmt = select(Clique).where(Clique.id == clique_id)
        result = await db.execute(stmt)
        clique = result.scalar_one_or_none()
        if not clique or str(clique.owner_user_id) != user_id:
            await websocket.close(code=1008)
            return

        room_id = f"booking_{clique_id}"
        await manager.connect(room_id, websocket)

        try:
            while True:
                # This endpoint is for broadcasting only, clients don't send data
                await websocket.receive_json()
        except WebSocketDisconnect:
            manager.disconnect(room_id, websocket)
    except Exception:
        await websocket.close(code=1011)
