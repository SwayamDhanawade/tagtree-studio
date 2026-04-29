const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface TreeRecord {
  id: number;
  root_name: string;
  tree: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function getTrees(): Promise<TreeRecord[]> {
  const res = await fetch(`${API_BASE}/trees`);
  if (!res.ok) throw new Error(`GET /trees failed: ${res.status}`);
  return res.json();
}

export async function createTree(tree: unknown): Promise<TreeRecord> {
  const res = await fetch(`${API_BASE}/trees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tree }),
  });
  if (!res.ok) throw new Error(`POST /trees failed: ${res.status}`);
  return res.json();
}

export async function updateTree(id: number, tree: unknown): Promise<TreeRecord> {
  const res = await fetch(`${API_BASE}/trees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tree }),
  });
  if (!res.ok) throw new Error(`PUT /trees/${id} failed: ${res.status}`);
  return res.json();
}
