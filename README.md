# AIMonk Nested Tags

A full-stack React + FastAPI application for managing nested tag hierarchies with persistent storage.

## Features

- **Recursive tree rendering** — tags nest infinitely via children arrays
- **Editable tag names** — click any tag name to rename inline
- **Editable data fields** — leaf nodes have text inputs for data values
- **Collapse/expand** — toggle any node to show or hide its children
- **Add Child** — convert leaf nodes to parents or append children to existing parents
- **Persistent storage** — save/load trees via SQLite backend
- **Export** — view and persist the current tree as clean JSON
- **Multiple trees** — display and edit several saved trees simultaneously

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | FastAPI (Python) |
| Database | SQLite (via SQLAlchemy ORM) |
| Validation | Pydantic |

## Project Structure

```
aimonks/
├── frontend/
│   ├── src/
│   │   ├── api/trees.ts          # API client helpers
│   │   ├── components/TagView.tsx # Recursive tag renderer
│   │   ├── types/tag.ts           # Tag type definition
│   │   ├── App.tsx                # Main app with tree state
│   │   ├── App.css                # App-level styles
│   │   ├── index.css              # Base reset
│   │   └── main.tsx               # React entry point
│   ├── .env.example               # Environment variables
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app + CORS + startup
│   │   ├── database.py            # SQLAlchemy engine + session
│   │   ├── models.py              # TreeRecord DB model
│   │   ├── schemas.py             # Pydantic validation schemas
│   │   └── routes/trees.py        # GET/POST/PUT endpoints
│   └── requirements.txt
└── README.md
```

## Prerequisites

- Node.js (LTS)
- Python 3.10+
- pip

## Running the App

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend runs at `http://localhost:8000`. Database (`app/trees.db`) is created automatically on first start.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### Environment Variables (optional)

Copy `.env.example` to `.env.local` in the frontend folder:

```
VITE_API_URL=http://localhost:8000
```

Default is `http://localhost:8000` if not set.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/trees` | List all saved trees |
| `POST` | `/trees` | Create a new tree record |
| `PUT` | `/trees/{id}` | Update an existing tree record |

### Example Payload

```json
{
  "tree": {
    "name": "root",
    "children": [
      {
        "name": "child1",
        "children": [
          { "name": "c1", "data": "hello" }
        ]
      },
      { "name": "child2", "data": "world" }
    ]
  }
}
```

Each tag has:
- `name` (string) — required
- `children` (array of tags) — for parent nodes
- `data` (string) — for leaf nodes
- A tag must have **either** `children` or `data`, never both.

## Database Schema

Single SQLite table `trees`:

| Column | Type | Notes |
|---|---|---|
| `id` | Integer | Auto-increment primary key |
| `root_name` | String | Root tag name for quick reference |
| `tree_json` | Text | Full tree as JSON string |
| `created_at` | DateTime | Set on creation |
| `updated_at` | DateTime | Updated on each save |

## How It Works

1. **On load** — Frontend calls `GET /trees`. If records exist, all are rendered. If none, a default tree is shown as unsaved.
2. **Editing** — Each tree has independent React state for tree data, collapse state, and save status.
3. **Renaming** — Click any tag name to edit inline. Press Enter to save, Escape to cancel.
4. **Export** — Clicking Export serializes the tree to clean JSON (no UI state), then:
   - If unsaved → `POST /trees` → stores returned id
   - If saved → `PUT /trees/{id}` → updates existing record
5. **Persistence** — All changes survive page refresh after Export.

## Deployment Notes

- **Backend**: Any platform supporting Python/ASGI works (Railway, Render, Fly.io). Set `DATABASE_URL` environment variable for PostgreSQL in production.
- **Frontend**: Static build via `npm run build`. Deploy `frontend/dist/` to Vercel, Netlify, or any static host. Configure `VITE_API_URL` to point to backend URL.
- **Database**: SQLite is fine for local/dev. For production, switch to PostgreSQL by changing the SQLAlchemy connection string in `database.py`.

## Development Checklist

- [x] Recursive tree rendering
- [x] Editable leaf data
- [x] Editable tag names
- [x] Collapse/expand all nodes
- [x] Add Child on parent and leaf nodes
- [x] Leaf-to-parent conversion
- [x] Export with clean JSON output
- [x] Backend persistence (SQLite)
- [x] Fetch saved trees on load
- [x] Multiple trees rendered simultaneously
- [x] POST for new trees, PUT for existing
- [x] CORS configured for frontend dev
- [x] Loading and error states
- [x] Clean TypeScript (no `any`)
