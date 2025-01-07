import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get the user from the scope (requires AuthMiddlewareStack)
        self.user = self.scope['user']

        if self.user.is_authenticated:
            # Join the user's notification group
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
        else:
            # Reject connection if the user is not authenticated
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            # Leave the user's notification group
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        # Handle incoming WebSocket messages if needed
        pass

    async def send_notification(self, event):
        # Send the notification to the WebSocket
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'message': event['message'],
        }))
