import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.models import ContractEvent, TrackedContract


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()


@pytest.fixture
def user(db):
    User = get_user_model()
    return User.objects.create_user(username="stats-user", password="password")


@pytest.fixture
def contract(user):
    return TrackedContract.objects.create(
        contract_id="C" + "A" * 55,
        name="Stats Contract",
        owner=user,
    )


@pytest.fixture
def other_contract(user):
    return TrackedContract.objects.create(
        contract_id="C" + "B" * 55,
        name="Other Contract",
        owner=user,
    )


def create_event(contract, event_type, ledger, event_index):
    return ContractEvent.objects.create(
        contract=contract,
        event_type=event_type,
        payload={"event_type": event_type},
        payload_hash=f"hash-{contract.id}-{ledger}-{event_index}",
        ledger=ledger,
        event_index=event_index,
        timestamp=timezone.now(),
        tx_hash=f"tx-{contract.id}-{ledger}-{event_index}",
    )


@pytest.mark.django_db
class TestEventTypeStatisticsEndpoint:
    def test_endpoint_returns_event_type_distribution_for_contract(
        self,
        api_client,
        contract,
    ):
        create_event(contract, "transfer", 100, 0)
        create_event(contract, "transfer", 101, 0)
        create_event(contract, "swap", 102, 0)

        url = reverse("event-type-statistics")
        response = api_client.get(url, {"contract_id": contract.contract_id})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["contract_id"] == contract.contract_id
        assert response.data["total_events"] == 3

        counts = {
            item["event_type"]: item["count"]
            for item in response.data["event_types"]
        }

        assert counts["transfer"] == 2
        assert counts["swap"] == 1

    def test_endpoint_filters_by_contract(
        self,
        api_client,
        contract,
        other_contract,
    ):
        create_event(contract, "transfer", 100, 0)
        create_event(contract, "transfer", 101, 0)
        create_event(other_contract, "mint", 200, 0)

        url = reverse("event-type-statistics")
        response = api_client.get(url, {"contract_id": contract.contract_id})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_events"] == 2

        returned_contract_ids = {
            item["contract_id"]
            for item in response.data["event_types"]
        }

        assert returned_contract_ids == {contract.contract_id}

    def test_endpoint_returns_global_distribution_without_contract_filter(
        self,
        api_client,
        contract,
        other_contract,
    ):
        create_event(contract, "transfer", 100, 0)
        create_event(other_contract, "mint", 200, 0)

        url = reverse("event-type-statistics")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["contract_id"] is None
        assert response.data["total_events"] == 2
        assert len(response.data["event_types"]) == 2

    def test_endpoint_returns_404_for_unknown_contract(self, api_client):
        url = reverse("event-type-statistics")
        response = api_client.get(url, {"contract_id": "C" + "Z" * 55})

        assert response.status_code == status.HTTP_404_NOT_FOUND