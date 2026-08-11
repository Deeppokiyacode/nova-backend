from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('ask/', views.chat_with_ai, name='chat_with_ai'),
]
