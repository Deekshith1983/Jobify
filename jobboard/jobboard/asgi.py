"""
ASGI config for jobboard project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from users.middleware import TokenAuthMiddleware
from channels.routing import ProtocolTypeRouter, URLRouter
import users.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jobboard.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddleware(
        URLRouter(
            users.routing.websocket_urlpatterns
        )
    ),
})
