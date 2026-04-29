from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime
from typing import Optional


class Tag(BaseModel):
    name: str
    children: Optional[list["Tag"]] = None
    data: Optional[str] = None

    model_config = {"exclude_none": True}

    @model_validator(mode="after")
    def validate_xor(self):
        has_children = "children" in self.model_fields_set
        has_data = "data" in self.model_fields_set
        if has_children and has_data:
            raise ValueError("Tag cannot have both children and data")
        if not has_children and not has_data:
            raise ValueError("Tag must have either children or data")
        return self


Tag.model_rebuild()


class TreeCreate(BaseModel):
    tree: Tag


class TreeUpdate(BaseModel):
    tree: Tag


class TreeResponse(BaseModel):
    id: int
    root_name: str
    tree: Tag
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
