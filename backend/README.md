# Flow Cast AI API

FastAPI service for the inventory forecasting MVP.

## Run

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API exposes `/api/dashboard`, `/api/products`, `/api/alerts`, `/api/data/upload`, and `/api/health`.

Product records are stored in SQLite at `backend/inventory.db`. The database schema is created automatically on startup and is seeded once from `seed_products.json` when the products table is empty. Set `FLOW_CAST_DATABASE` to use a different SQLite path.
