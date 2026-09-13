import csv
import html
import io
import os
import re
from datetime import date
from pathlib import Path
from typing import Annotated, Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationInfo, field_validator
from fastapi.staticfiles import StaticFiles
from backend.database import create_order, get_orders, get_products, initialize_database

app = FastAPI(title="Flow Cast AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://flow-cast-ai.onrender.com", "http://flow-cast-ai.onrender.com"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

initialize_database()

MAX_UPLOAD_BYTES = 50 * 1024 * 1024
REQUIRED_UPLOAD_FIELDS = {"date", "product_id", "units_sold", "price", "inventory_level", "promotion"}
CONTROL_CHARACTERS = re.compile(r"[\x00-\x1F\x7F]+")
HTML_TAGS = re.compile(r"<\s*(?:script|style)[^>]*>.*?<\s*/\s*(?:script|style)\s*>|<[^>]+>", re.IGNORECASE | re.DOTALL)


def sanitize_text(value: Any, *, allow_newlines: bool = False) -> str:
    if value is None:
        return ""
    normalized = html.unescape(str(value))
    normalized = HTML_TAGS.sub(" ", normalized)
    normalized = normalized.replace("\r", "\n") if allow_newlines else normalized.replace("\r", " ")
    normalized = CONTROL_CHARACTERS.sub(" ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def sanitize_filename(filename: str) -> str:
    if not filename or not str(filename).strip():
        raise ValueError("Filename is required.")

    raw_name = str(filename).strip()
    if ".." in raw_name.replace("\\", "/"):
        raise ValueError("Path traversal is not allowed.")

    candidate = os.path.basename(raw_name.replace("\\", "/")).strip()
    if not candidate or candidate in {".", ".."}:
        raise ValueError("Filename is invalid.")
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "_", candidate).strip("._")
    if not sanitized or sanitized in {".", ".."} or "/" in sanitized or "\\" in sanitized:
        raise ValueError("Filename contains unsupported characters.")
    if not sanitized.lower().endswith(".csv"):
        raise ValueError("Only CSV files are supported.")
    return sanitized


class Product(BaseModel):
    name: str
    sku: str
    category: str
    stock: int
    demand: int
    health: str
    recommendation: str
    risk: int
    daysLeft: int
    image: str

    @field_validator("name", "sku", "category", "health", "recommendation", "image", mode="before")
    @classmethod
    def sanitize_fields(cls, value: Any, info: ValidationInfo) -> Any:
        if value is None:
            return value
        if not isinstance(value, str):
            return value
        sanitized = sanitize_text(value)
        if info.field_name == "image":
            sanitized = sanitized.strip()
            if sanitized.startswith(("javascript:", "data:")):
                raise ValueError("Unsafe image URL.")
        return sanitized


class PurchaseOrderCreate(BaseModel):
    productSku: str = Field(min_length=1, max_length=64)
    productName: str = Field(min_length=1, max_length=200)
    quantity: int = Field(gt=0, le=1_000_000)
    unitPrice: float = Field(gt=0, le=1_000_000)
    supplier: str = Field(min_length=1, max_length=200)
    deliveryDate: date
    notes: str = Field(default="", max_length=500)

    @field_validator("productSku", "productName", "supplier", "notes", mode="before")
    @classmethod
    def sanitize_order_fields(cls, value: Any, info: ValidationInfo) -> Any:
        if value is None:
            return value
        if not isinstance(value, str):
            return value
        sanitized = sanitize_text(value)
        if info.field_name == "productSku":
            return sanitized.upper()
        return sanitized


class PurchaseOrder(PurchaseOrderCreate):
    id: int
    status: str
    createdAt: str


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "flow-cast-api", "date": date.today().isoformat()}

@app.get("/api/dashboard")
def dashboard():
    products = [Product(**product) for product in get_products()]
    return {"metrics": {"health": 84.6, "stockoutRisk": 8, "overstocked": 23, "accuracy": 39.8}, "products": products, "insight": "Demand is trending up 12%. The upcoming Fall Essentials promotion is the primary driver."}

@app.get("/api/products", response_model=list[Product])
def products():
    return get_products()

@app.get("/api/alerts", response_model=list[Product])
def alerts():
    return [product for product in get_products() if product["risk"] >= 60]


@app.get("/api/orders", response_model=list[PurchaseOrder])
def orders():
    return get_orders()


@app.post("/api/orders", response_model=PurchaseOrder, status_code=201)
def create_purchase_order(order: PurchaseOrderCreate):
    matching_product = next(
        (product for product in get_products() if product["sku"] == order.productSku),
        None,
    )
    if matching_product is None or matching_product["name"] != order.productName:
        raise HTTPException(status_code=400, detail="Product SKU and name do not match a catalog product.")
    return create_order({**order.model_dump(), "deliveryDate": order.deliveryDate.isoformat()})

@app.post("/api/data/upload")
async def upload_sales_data(file: Annotated[UploadFile, File()]):
    try:
        safe_filename = sanitize_filename(file.filename or "")
    except ValueError:
        return {"status": "rejected", "message": "Only CSV files are supported."}
    contents = bytearray()
    while chunk := await file.read(1024 * 1024):
        contents.extend(chunk)
        if len(contents) > MAX_UPLOAD_BYTES:
            return {"status": "rejected", "message": "CSV files must be 50 MB or smaller."}
    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8-sig")))
        if not reader.fieldnames or not REQUIRED_UPLOAD_FIELDS.issubset(reader.fieldnames):
            return {"status": "rejected", "message": "CSV is missing required fields."}
        row_count = 0
        for row in reader:
            row_count += 1
            if row_count > 500_000:
                return {"status": "rejected", "message": "CSV contains too many rows."}
            date.fromisoformat(row["date"])
            int(row["units_sold"])
            float(row["price"])
            int(row["inventory_level"])
            if row["promotion"] not in {"0", "1"}:
                raise ValueError
    except (UnicodeDecodeError, csv.Error, KeyError, TypeError, ValueError):
        return {"status": "rejected", "message": "CSV has invalid encoding, fields, or values."}
    return {"status": "queued", "filename": safe_filename, "bytes": len(contents), "message": "CSV validated and queued for processing."}


FRONTEND_DIST = Path(os.getenv("FLOW_CAST_FRONTEND_DIST", Path(__file__).resolve().parent / "frontend-dist"))
if FRONTEND_DIST.is_dir():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
