from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List
import json
import asyncio
from datetime import datetime

websocket_router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_connections: Dict[str, List[str]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Connect a WebSocket for a specific session"""
        await websocket.accept()
        connection_id = f"{session_id}_{datetime.utcnow().timestamp()}"
        self.active_connections[connection_id] = websocket
        
        if session_id not in self.session_connections:
            self.session_connections[session_id] = []
        self.session_connections[session_id].append(connection_id)
        
        # Send initial connection confirmation
        await self.send_message_to_session(session_id, {
            "type": "connection_established",
            "session_id": session_id,
            "connection_id": connection_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return connection_id
    
    def disconnect(self, connection_id: str, session_id: str):
        """Disconnect a WebSocket"""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if session_id in self.session_connections:
            if connection_id in self.session_connections[session_id]:
                self.session_connections[session_id].remove(connection_id)
            
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]
    
    async def send_message_to_session(self, session_id: str, message: Dict[str, Any]):
        """Send a message to all connections in a session"""
        if session_id in self.session_connections:
            disconnected_connections = []
            
            for connection_id in self.session_connections[session_id]:
                if connection_id in self.active_connections:
                    try:
                        websocket = self.active_connections[connection_id]
                        await websocket.send_text(json.dumps(message))
                    except Exception:
                        disconnected_connections.append(connection_id)
            
            # Clean up disconnected connections
            for connection_id in disconnected_connections:
                self.disconnect(connection_id, session_id)
    
    async def send_progress_update(self, session_id: str, step: str, progress: float, message: str = ""):
        """Send progress update to session"""
        await self.send_message_to_session(session_id, {
            "type": "progress_update",
            "step": step,
            "progress": progress,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    async def send_pattern_discovered(self, session_id: str, pattern_data: Dict[str, Any]):
        """Send pattern discovery update"""
        await self.send_message_to_session(session_id, {
            "type": "pattern_discovered",
            "pattern": pattern_data,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    async def send_lead_found(self, session_id: str, lead_data: Dict[str, Any]):
        """Send lead generation update"""
        await self.send_message_to_session(session_id, {
            "type": "lead_found",
            "lead": lead_data,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    async def send_analysis_complete(self, session_id: str, analysis_type: str, results: Dict[str, Any]):
        """Send analysis completion notification"""
        await self.send_message_to_session(session_id, {
            "type": "analysis_complete",
            "analysis_type": analysis_type,
            "results": results,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    async def send_error(self, session_id: str, error_message: str, error_type: str = "general"):
        """Send error notification"""
        await self.send_message_to_session(session_id, {
            "type": "error",
            "error_type": error_type,
            "message": error_message,
            "timestamp": datetime.utcnow().isoformat()
        })


manager = ConnectionManager()


@websocket_router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time updates"""
    connection_id = await manager.connect(websocket, session_id)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types from client
            if message.get("type") == "ping":
                await manager.send_message_to_session(session_id, {
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
            elif message.get("type") == "subscribe":
                # Handle subscription to specific events
                await manager.send_message_to_session(session_id, {
                    "type": "subscription_confirmed",
                    "events": message.get("events", []),
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect(connection_id, session_id)
    except Exception as e:
        await manager.send_error(session_id, f"WebSocket error: {str(e)}", "websocket_error")
        manager.disconnect(connection_id, session_id)


# Utility functions for sending updates from other parts of the application
async def notify_progress(session_id: str, step: str, progress: float, message: str = ""):
    """Utility function to send progress updates"""
    await manager.send_progress_update(session_id, step, progress, message)


async def notify_pattern_discovered(session_id: str, pattern_data: Dict[str, Any]):
    """Utility function to notify about pattern discovery"""
    await manager.send_pattern_discovered(session_id, pattern_data)


async def notify_lead_found(session_id: str, lead_data: Dict[str, Any]):
    """Utility function to notify about lead generation"""
    await manager.send_lead_found(session_id, lead_data)


async def notify_analysis_complete(session_id: str, analysis_type: str, results: Dict[str, Any]):
    """Utility function to notify about analysis completion"""
    await manager.send_analysis_complete(session_id, analysis_type, results)


async def notify_error(session_id: str, error_message: str, error_type: str = "general"):
    """Utility function to send error notifications"""
    await manager.send_error(session_id, error_message, error_type)
