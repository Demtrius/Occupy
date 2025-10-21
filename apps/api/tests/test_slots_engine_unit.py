from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List
from uuid import UUID

import pytest
from hypothesis import given, strategies as st

from app.core.pagination import (
    decode_datetime_cursor,
    encode_datetime_cursor,
    slice_results,
)


@given(
    st.datetimes(
        timezones=st.just(timezone.utc),
        min_value=datetime(2020, 1, 1, tzinfo=timezone.utc),
    ),
    st.uuids(),
)
def test_cursor_roundtrip(created_at: datetime, entity_id: UUID):
    cursor = encode_datetime_cursor(created_at, entity_id)
    decoded = decode_datetime_cursor(cursor)
    assert decoded == (created_at, entity_id)


@dataclass
class Dummy:
    created_at: datetime
    id: UUID


def test_slice_results_truncates_and_sets_cursor():
    now = datetime.now(timezone.utc)
    items = [
        Dummy(created_at=now, id=uuid) for uuid in [UUID(int=i) for i in range(1, 4)]
    ]
    page, cursor = slice_results(items, limit=2)
    assert len(page) == 2
    assert cursor is not None


def test_slice_results_empty():
    page, cursor = slice_results([], limit=10)
    assert page == []
    assert cursor is None


def test_decode_cursor_errors():
    with pytest.raises(ValueError):
        decode_datetime_cursor("invalid")
