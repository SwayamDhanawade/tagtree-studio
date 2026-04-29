from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone

from .database import Base


class TreeRecord(Base):
    __tablename__ = "trees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    root_name = Column(String, nullable=False)
    tree_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
