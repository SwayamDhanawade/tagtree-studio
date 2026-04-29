import { useState, useEffect, useCallback } from 'react';
import { type Tag } from './types/tag';
import { TagView } from './components/TagView';
import { getTrees, createTree, updateTree } from './api/trees';
import './App.css';

const initialTree: Tag = {
  name: 'root',
  children: [
    {
      name: 'child1',
      children: [
        { name: 'child1-child1', data: 'c1-c1 Hello' },
        { name: 'child1-child2', data: 'c1-c2 JS' },
      ],
    },
    { name: 'child2', data: 'c2 World' },
  ],
};

interface TreeState {
  id: number | null;
  tree: Tag;
  collapsedPaths: Record<string, boolean>;
  exportedJson: string;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  errorMessage: string;
}

function setLeafData(tree: Tag, path: number[], newData: string): Tag {
  if (path.length === 0) {
    return { ...tree, data: newData };
  }
  if ('children' in tree) {
    const [index, ...rest] = path;
    const updatedChildren = tree.children.map((child, i) =>
      i === index ? setLeafData(child, rest, newData) : child
    );
    return { ...tree, children: updatedChildren };
  }
  return tree;
}

function updateTagName(tree: Tag, path: number[], newName: string): Tag {
  if (path.length === 0) {
    return { ...tree, name: newName };
  }
  if ('children' in tree) {
    const [index, ...rest] = path;
    const updatedChildren = tree.children.map((child, i) =>
      i === index ? updateTagName(child, rest, newName) : child
    );
    return { ...tree, children: updatedChildren };
  }
  return tree;
}

function addChildToTag(tree: Tag, path: number[]): Tag {
  if (path.length === 0) {
    const newChild: Tag = { name: 'New Child', data: 'Data' };
    if ('children' in tree) {
      return { ...tree, children: [...tree.children, newChild] };
    }
    return { name: tree.name, children: [newChild] };
  }
  if ('children' in tree) {
    const [index, ...rest] = path;
    const updatedChildren = tree.children.map((child, i) =>
      i === index ? addChildToTag(child, rest) : child
    );
    return { ...tree, children: updatedChildren };
  }
  return tree;
}

function exportTree(tree: Tag): object {
  if ('children' in tree) {
    return {
      name: tree.name,
      children: tree.children.map(exportTree),
    };
  }
  return {
    name: tree.name,
    data: tree.data,
  };
}

function makeTreeState(tree: Tag, id: number | null = null): TreeState {
  return {
    id,
    tree,
    collapsedPaths: {},
    exportedJson: '',
    saveStatus: 'idle',
    errorMessage: '',
  };
}

function updateTreeState(
  states: TreeState[],
  id: number | null,
  updater: (s: TreeState) => TreeState
): TreeState[] {
  return states.map((s) => (s.id === id ? updater(s) : s));
}

export default function App() {
  const [trees, setTrees] = useState<TreeState[]>([]);
  const [appStatus, setAppStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [appError, setAppError] = useState('');

  useEffect(() => {
    getTrees()
      .then((records) => {
        if (records.length > 0) {
          setTrees(records.map((r) => makeTreeState(r.tree as Tag, r.id)));
        } else {
          setTrees([makeTreeState(initialTree)]);
        }
        setAppStatus('ready');
      })
      .catch(() => {
        setAppStatus('error');
        setAppError('Failed to fetch saved trees. Backend may not be running.');
      });
  }, []);

  const handleDataChange = useCallback((treeId: number | null, path: number[], newData: string) => {
    setTrees((prev) =>
      updateTreeState(prev, treeId, (s) => ({
        ...s,
        tree: setLeafData(s.tree, path, newData),
      }))
    );
  }, []);

  const handleNameChange = useCallback((treeId: number | null, path: number[], newName: string) => {
    setTrees((prev) =>
      updateTreeState(prev, treeId, (s) => ({
        ...s,
        tree: updateTagName(s.tree, path, newName),
      }))
    );
  }, []);

  const handleToggleCollapse = useCallback((treeId: number | null, path: number[]) => {
    const key = path.join('.');
    setTrees((prev) =>
      updateTreeState(prev, treeId, (s) => ({
        ...s,
        collapsedPaths: { ...s.collapsedPaths, [key]: !s.collapsedPaths[key] },
      }))
    );
  }, []);

  const handleAddChild = useCallback((treeId: number | null, path: number[]) => {
    setTrees((prev) =>
      updateTreeState(prev, treeId, (s) => ({
        ...s,
        tree: addChildToTag(s.tree, path),
      }))
    );
  }, []);

  const handleExport = useCallback((treeId: number | null) => {
    setTrees((prev) => {
      const treeState = prev.find((s) => s.id === treeId);
      if (!treeState) return prev;

      const exported = exportTree(treeState.tree);
      const exportedJson = JSON.stringify(exported, null, 2);

      if (treeState.id === null) {
        void (async () => {
          try {
            setTrees((p) =>
              updateTreeState(p, treeId, (s) => ({ ...s, saveStatus: 'saving', errorMessage: '' }))
            );
            const record = await createTree(exported);
            setTrees((p) =>
              updateTreeState(p, treeId, (s) => ({
                ...s,
                id: record.id,
                saveStatus: 'saved',
                exportedJson: JSON.stringify(exportTree(s.tree), null, 2),
              }))
            );
          } catch {
            setTrees((p) =>
              updateTreeState(p, treeId, (s) => ({
                ...s,
                saveStatus: 'error',
                errorMessage: 'Failed to save tree. Backend may not be running.',
              }))
            );
          }
        })();
        return updateTreeState(prev, treeId, (s) => ({ ...s, exportedJson, saveStatus: 'saving' }));
      } else {
        const savedId = treeState.id;
        void (async () => {
          try {
            setTrees((p) =>
              updateTreeState(p, treeId, (s) => ({ ...s, saveStatus: 'saving', errorMessage: '' }))
            );
            await updateTree(savedId, exported);
            setTrees((p) =>
              updateTreeState(p, treeId, (s) => ({ ...s, saveStatus: 'saved' }))
            );
          } catch {
            setTrees((p) =>
              updateTreeState(p, treeId, (s) => ({
                ...s,
                saveStatus: 'error',
                errorMessage: 'Failed to update tree. Backend may not be running.',
              }))
            );
          }
        })();
        return updateTreeState(prev, treeId, (s) => ({ ...s, exportedJson, saveStatus: 'saving' }));
      }
    });
  }, []);

  if (appStatus === 'loading') {
    return (
      <div className="app">
        <h1>AIMonk Nested Tags</h1>
        <div className="loading">Loading saved trees...</div>
      </div>
    );
  }

  if (appStatus === 'error') {
    return (
      <div className="app">
        <h1>AIMonk Nested Tags</h1>
        <div className="error">{appError}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>AIMonk Nested Tags</h1>
        <p className="app-subtitle">Click a tag name to rename. Edit data, add children, collapse/expand, then Export to save.</p>
      </div>
      {trees.map((ts) => (
        <div key={ts.id ?? 'new'} className="tree-card">
          <div className="tree-card-header">
            <h2>{ts.id ? `Saved Tree #${ts.id}` : 'New Tree'}</h2>
            <div className="tree-card-actions">
              {ts.saveStatus === 'saving' && <span className="status saving">Saving...</span>}
              {ts.saveStatus === 'saved' && <span className="status saved">Saved</span>}
              {ts.saveStatus === 'error' && (
                <span className="status error">{ts.errorMessage}</span>
              )}
              <button className="export-btn" onClick={() => handleExport(ts.id)}>
                Export
              </button>
            </div>
          </div>
          <TagView
            tag={ts.tree}
            path={[]}
            collapsedPaths={ts.collapsedPaths}
            onToggleCollapse={(p) => handleToggleCollapse(ts.id, p)}
            onDataChange={(p, d) => handleDataChange(ts.id, p, d)}
            onAddChild={(p) => handleAddChild(ts.id, p)}
            onNameChange={(p, n) => handleNameChange(ts.id, p, n)}
          />
          {ts.exportedJson && (
            <details open>
              <summary>Exported JSON</summary>
              <pre>{ts.exportedJson}</pre>
            </details>
          )}
          <details>
            <summary>Live Tree JSON</summary>
            <pre>{JSON.stringify(exportTree(ts.tree), null, 2)}</pre>
          </details>
        </div>
      ))}
    </div>
  );
}
