import pytest
from django.conf import settings
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from soroscan import health


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestHealthView:
    def test_health_returns_ok_with_uptime(self, api_client):
        url = reverse("health")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "ok"
        assert "uptime_seconds" in response.data
        assert "uptime" in response.data
        assert isinstance(response.data["uptime_seconds"], int)
        assert response.data["uptime_seconds"] > 0
        assert isinstance(response.data["uptime"], str)
        assert response["X-SoroScan-Version"] == settings.SOFTWARE_VERSION

    def test_health_uptime_is_accurate(self, api_client, monkeypatch):
        monkeypatch.setattr(health, "PROCESS_START_TIME", 100.0)
        monkeypatch.setattr(health.time, "monotonic", lambda: 165.0)

        url = reverse("health")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["uptime_seconds"] == 65
        assert response.data["uptime"] == "0d 00:01:05"

    def test_health_uptime_counter_increases_across_requests(self, api_client, monkeypatch):
        times = iter([110.0, 125.0])

        monkeypatch.setattr(health, "PROCESS_START_TIME", 100.0)
        monkeypatch.setattr(health.time, "monotonic", lambda: next(times))

        url = reverse("health")

        first_response = api_client.get(url)
        second_response = api_client.get(url)

        assert first_response.status_code == status.HTTP_200_OK
        assert second_response.status_code == status.HTTP_200_OK
        assert first_response.data["uptime_seconds"] == 10
        assert second_response.data["uptime_seconds"] == 25
        assert second_response.data["uptime_seconds"] > first_response.data["uptime_seconds"]


@pytest.mark.django_db
class TestReadinessView:
    def test_ready_when_db_and_cache_connected(self, api_client):
        url = reverse("readiness")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"status": "ready"}
        assert response["X-SoroScan-Version"] == settings.SOFTWARE_VERSION

    def test_not_ready_when_db_fails(self, api_client, monkeypatch):
        from django.db import connection

        def mocked_cursor(*args, **kwargs):
            raise Exception("DB connection failed")

        monkeypatch.setattr(connection, "cursor", lambda: mocked_cursor())

        url = reverse("readiness")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.data["status"] == "not_ready"
        assert any("db" in e for e in response.data["errors"])
        assert response["X-SoroScan-Version"] == settings.SOFTWARE_VERSION

    def test_not_ready_when_cache_fails(self, api_client, monkeypatch):
        def mocked_get(*args, **kwargs):
            raise Exception("Cache connection failed")

        monkeypatch.setattr(cache, "get", mocked_get)

        url = reverse("readiness")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.data["status"] == "not_ready"
        assert any("redis" in e for e in response.data["errors"])
        assert response["X-SoroScan-Version"] == settings.SOFTWARE_VERSION