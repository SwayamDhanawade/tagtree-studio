import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import TreeRecord
from ..schemas import TreeCreate, TreeUpdate, Tag

router = APIRouter(prefix="/trees", tags=["trees"])


def _clean_tree(data: Any) -> Any:
    """Remove null values and empty children arrays from tree data."""
    if isinstance(data, dict):
        cleaned = {}
        if "name" in data:
            cleaned["name"] = data["name"]
        if "children" in data:
            children = data["children"]
            if isinstance(children, list) and len(children) > 0:
                cleaned["children"] = [_clean_tree(c) for c in children]
            elif isinstance(children, list) and len(children) == 0:
                pass
            elif children is None:
                pass
        if "data" in data:
            d = data["data"]
            if d is not None:
                cleaned["data"] = d
        return cleaned
    return data


def _serialize_response(record: TreeRecord) -> dict:
    tree_data = json.loads(record.tree_json)
    tree_data = _clean_tree(tree_data)
    return {
        "id": record.id,
        "root_name": record.root_name,
        "tree": tree_data,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


@router.get("")
def get_trees(db: Session = Depends(get_db)):
    records = db.query(TreeRecord).order_by(TreeRecord.created_at).all()
    return [_serialize_response(r) for r in records]


@router.post("", status_code=201)
def create_tree(payload: TreeCreate, db: Session = Depends(get_db)):
    tree_json = payload.tree.model_dump_json()
    record = TreeRecord(
        root_name=payload.tree.name,
        tree_json=tree_json,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _serialize_response(record)


@router.put("/{tree_id}")
def update_tree(tree_id: int, payload: TreeUpdate, db: Session = Depends(get_db)):
    record = db.query(TreeRecord).filter(TreeRecord.id == tree_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Tree not found")
    record.tree_json = payload.tree.model_dump_json()
    record.root_name = payload.tree.name
    db.commit()
    db.refresh(record)
    return _serialize_response(record)
