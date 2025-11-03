"""
Dramatiq worker for background task processing.

This module handles asynchronous tasks like booking completion,
notifications, and other background jobs.
"""

import asyncio
from datetime import datetime, timezone

import dramatiq
from sqlalchemy.ext.asyncio import AsyncSession

from .core.auth import sessionmaker as db_sessionmaker
from .services.bookings import complete_booking


def get_db_session() -> AsyncSession:
    """Get a database session for worker tasks."""
    if db_sessionmaker is None:
        raise RuntimeError("Database sessionmaker not initialized")
    return db_sessionmaker()


@dramatiq.actor
def complete_booking_task(booking_id: str) -> None:
    """
    Complete a booking when its end time is reached.
    
    This task is scheduled when a booking is created and runs
    automatically at the booking's end time.
    """
    async def run_task() -> None:
        session = get_db_session()
        try:
            async with session as db:
                await complete_booking(db, booking_id)
                print(f"Successfully completed booking {booking_id}")
        except Exception as e:
            print(f"Failed to complete booking {booking_id}: {e}")
            # In production, you'd want proper logging here
            # and potentially retry logic
        finally:
            await session.close()
    
    asyncio.run(run_task())


@dramatiq.actor
def schedule_booking_completion(booking_id: str, end_ts: str) -> None:
    """
    Schedule a booking completion task for the specified end time.
    
    Args:
        booking_id: The UUID of the booking to complete
        end_ts: ISO string of when the booking ends (timezone-aware)
    """
    try:
        # Parse the end time
        end_time = datetime.fromisoformat(end_ts.replace('Z', '+00:00'))
        
        # Calculate delay until end time
        now = datetime.now(timezone.utc)
        if end_time > now:
            delay = (end_time - now).total_seconds()
            # Schedule the completion task with delay
            complete_booking_task.send_with_options(
                args=(booking_id,),
                delay=int(delay * 1000)  # Dramatiq expects milliseconds
            )
            print(f"Scheduled booking {booking_id} completion in {delay:.0f} seconds")
        else:
            # If end time is in the past, complete immediately
            complete_booking_task.send(booking_id)
            print(f"Booking {booking_id} end time in past, completing immediately")
            
    except Exception as e:
        print(f"Failed to schedule booking completion for {booking_id}: {e}")