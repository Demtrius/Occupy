"""
Test the actual slots API endpoint to debug the issue.
"""

import pytest
from datetime import datetime, time
from uuid import uuid4
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession
from app.services.slots import compute_slots
from tests.factories import create_user, create_clique, create_service, create_availability
from tests.conftest import make_token


@pytest.mark.asyncio
async def test_slots_api_endpoint_directly(db_session: AsyncSession, client, make_token):
    """Test the actual slots API endpoint with the exact scenario"""
    
    # Setup: Create test data
    user = await create_user(db_session, email="test@example.com", username="testuser")
    clique = await create_clique(db_session, owner=user, name="Test Clique")
    service = await create_service(
        db_session, 
        clique=clique, 
        title="Test Service",
        duration_minutes=60,
        buffer_minutes=0
    )
    
    # Create availability for Tuesday (day_of_week=1) - EXACT scenario from issue
    availability = await create_availability(
        db_session,
        clique=clique,
        is_recurring=True,
        day_of_week=1,  # Tuesday
        start_time=time(10, 0),  # 10:00 UTC
        end_time=time(18, 0),    # 18:00 UTC
        timezone_str="UTC"
    )
    
    await db_session.commit()
    
    print(f"\n=== API TEST DEBUG INFO ===")
    print(f"Created user: {user.id}")
    print(f"Created clique: {clique.id}")
    print(f"Created service: {service.id}")
    print(f"Created availability: {availability.id}")
    print(f"Availability - Recurring: {availability.is_recurring}")
    print(f"Availability - Day of week: {availability.day_of_week}")
    print(f"Availability - Start time: {availability.start_time}")
    print(f"Availability - End time: {availability.end_time}")
    print(f"Availability - Timezone: {availability.timezone}")
    
    # Test the exact request from the issue
    # Date: 2025-11-03T23:00:00Z to 2025-11-04T22:59:59Z
    # This covers November 4, 2025 (Tuesday)
    params = {
        "serviceId": str(service.id),
        "from": "2025-11-03T23:00:00Z",
        "to": "2025-11-04T22:59:59Z"
    }
    
    print(f"\nAPI Request params:")
    for key, value in params.items():
        print(f"  {key}: {value}")
    
    # Create auth token
    token = make_token(user)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Call the API endpoint
    response = await client.get(
        f"/api/v1/cliques/{clique.id}/slots",
        params=params,
        headers=headers
    )
    
    print(f"\nAPI Response:")
    print(f"  Status: {response.status_code}")
    print(f"  Body: {response.json()}")
    
    # Also test the service directly for comparison
    window_start = datetime(2025, 11, 3, 23, 0, 0, tzinfo=ZoneInfo("UTC"))
    window_end = datetime(2025, 11, 4, 22, 59, 59, tzinfo=ZoneInfo("UTC"))
    
    direct_slots = await compute_slots(
        db_session,
        str(clique.id),
        str(service.id),
        window_start,
        window_end
    )
    
    print(f"\nDirect service call result:")
    print(f"  Slots found: {len(direct_slots)}")
    for i, slot in enumerate(direct_slots):
        print(f"    Slot {i+1}: {slot}")
    
    # The API should return the same as the direct service call
    assert response.status_code == 200
    api_response = response.json()
    assert "slots" in api_response
    assert len(api_response["slots"]) == len(direct_slots), f"API returned {len(api_response['slots'])} slots but service returned {len(direct_slots)}"
    
    if len(direct_slots) > 0:
        assert len(api_response["slots"]) > 0, "API should return slots when service finds them"