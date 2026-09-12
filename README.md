# Flow Cast AI

A frontend MVP for intelligent inventory forecasting based on `specifications.docx`.

The terminal environment is:

- **OS:** Windows
- **Shell:** PowerShell
- **Project path:** `Inventory-management`
- **Frontend:** React + Vite on port `5173`
- **Backend:** FastAPI + Uvicorn on port `8000`
- **Backend environment:** Python virtual environment at `.venv`
- **Database:** SQLite at `inventory.db`
- **Combined startup:** `npm run dev:all`

## Run

Install dependencies once, then start both servers automatically:

```powershell steps
**Front-end**
cd Inventory-management
npm install
**backend**
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
** App start **
npm run dev:all
```

Open `http://127.0.0.1:5173`. FastAPI documentation is available at `http://127.0.0.1:8000/docs`.

You can also run the VS Code task `Flow Cast AI: start frontend and backend` from the Command Palette.

## Included MVP flows

- Inventory health overview with KPI cards and demand forecast visualization
- Stockout risk and reorder recommendations
- Product catalog search and category filtering
- Forecast explanation with confidence and demand drivers
- Alerts workspace
- CSV import modal and pipeline status
- Downloadable text inventory report
- Responsive desktop and mobile layouts

The React frontend connects to the FastAPI backend through `src/api.js`; the backend uses SQLite for local product data.
