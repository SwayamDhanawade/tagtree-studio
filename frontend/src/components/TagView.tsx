import { useState, useRef, useEffect } from 'react';
import { type Tag } from '../types/tag';
import './TagView.css';

interface TagViewProps {
  tag: Tag;
  path: number[];
  collapsedPaths: Record<string, boolean>;
  onToggleCollapse: (path: number[]) => void;
  onDataChange: (path: number[], newData: string) => void;
  onAddChild: (path: number[]) => void;
  onNameChange: (path: number[], newName: string) => void;
}

export function TagView({ tag, path, collapsedPaths, onToggleCollapse, onDataChange, onAddChild, onNameChange }: TagViewProps) {
  const hasChildren = 'children' in tag;
  const pathKey = path.join('.');
  const isCollapsed = !!collapsedPaths[pathKey];
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState(tag.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSave = () => {
    const trimmed = nameInputValue.trim();
    if (trimmed && trimmed !== tag.name) {
      onNameChange(path, trimmed);
    } else {
      setNameInputValue(tag.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setNameInputValue(tag.name);
      setIsEditingName(false);
    }
  };

  return (
    <div className="tag-container">
      <div className="tag-header">
        <button
          type="button"
          className="toggle-btn"
          onClick={() => onToggleCollapse(path)}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '>' : 'v'}
        </button>
        {isEditingName ? (
          <input
            ref={nameInputRef}
            className="tag-name-input"
            type="text"
            value={nameInputValue}
            onChange={(e) => setNameInputValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
          />
        ) : (
          <span
            className="tag-name"
            onClick={() => setIsEditingName(true)}
            title="Click to rename"
          >
            {tag.name}
          </span>
        )}
        <button
          type="button"
          className="add-child-btn"
          onClick={() => onAddChild(path)}
        >
          Add Child
        </button>
      </div>
      {!isCollapsed && (
        hasChildren ? (
          <div className="tag-children">
            {tag.children.map((child, index) => (
              <TagView
                key={`${child.name}-${index}`}
                tag={child}
                path={[...path, index]}
                collapsedPaths={collapsedPaths}
                onToggleCollapse={onToggleCollapse}
                onDataChange={onDataChange}
                onAddChild={onAddChild}
                onNameChange={onNameChange}
              />
            ))}
          </div>
        ) : (
          <div className="tag-data">
            <label htmlFor={`data-${pathKey}`}>Data</label>
            <input
              id={`data-${pathKey}`}
              type="text"
              value={tag.data}
              onChange={(e) => onDataChange(path, e.target.value)}
            />
          </div>
        )
      )}
    </div>
  );
}
