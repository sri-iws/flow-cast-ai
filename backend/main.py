import csv
import html
import io
import os
import re
from datetime import date
from pathlib import Path
from typing import Annotated, Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationInfo, field_validator
from fastapi.staticfiles import StaticFiles
from database import (
    create_order,
    create_user,
    get_orders,
    get_products,
    get_user_by_email,
    get_user_by_username,
    hash_password,
    initialize_database,
    verify_password,
)

app = FastAPI(title="Flow Cast AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://main.du2fef2n0b3af.amplifyapp.com",
        "https://flow-cast-ai.onrender.com",
        "http://localhost:5155",
        "http://127.0.0.1:5155",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    allow_credentials=True,
)

initialize_database()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"detail": exc.errors()})


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


class RegisterUser(BaseModel):
    fullName: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=4, max_length=200)
    username: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="manager")

    @field_validator("fullName", "email", "username", "role", mode="before")
    @classmethod
    def sanitize_auth_fields(cls, value: Any, info: ValidationInfo) -> Any:
        if value is None:
            return value
        if not isinstance(value, str):
            return value
        sanitized = sanitize_text(value).strip()
        if info.field_name in {"email", "username"}:
            sanitized = sanitized.lower()
        return sanitized

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if "@" not in value:
            raise ValueError("Email must be valid.")
        return value


class LoginUser(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=8, max_length=128)
    role: str | None = None

    @field_validator("username", mode="before")
    @classmethod
    def sanitize_username(cls, value: Any) -> Any:
        if value is None:
            return value
        if not isinstance(value, str):
            return value
        return sanitize_text(value).strip().lower()

    @field_validator("role")
    @classmethod
    def validate_login_role(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = sanitize_text(value).strip().lower()
        if normalized not in {"manager", "analyst", "ceo"}:
            raise ValueError("Role must be one of: manager, analyst, ceo")
        return normalized


class AuthResponse(BaseModel):
    id: int
    fullName: str
    email: str
    username: str
    role: str
    token: str


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


@app.post("/api/auth/register", response_model=dict, status_code=201)
def register_user(payload: RegisterUser):
    normalized_role = sanitize_text(payload.role).strip().lower()
    if normalized_role not in {"manager", "analyst", "ceo"}:
        raise HTTPException(status_code=400, detail="Role must be one of: manager, analyst, ceo")
    if get_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    if get_user_by_username(payload.username):
        raise HTTPException(status_code=400, detail="This username is already taken.")

    user = create_user({
        "fullName": payload.fullName,
        "email": payload.email,
        "username": payload.username,
        "passwordHash": hash_password(payload.password),
        "role": normalized_role,
    })
    return {
        "id": user["id"],
        "fullName": user["fullName"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"],
    }


@app.post("/api/auth/login", response_model=AuthResponse)
def login_user(payload: LoginUser):
    user = get_user_by_username(payload.username)
    if user is None or not verify_password(payload.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    if payload.role and payload.role != user["role"]:
        raise HTTPException(status_code=401, detail="Selected role does not match this account.")

    token = f"flowcast-{user['role']}-{user['id']}:{user['username']}"
    return {
        "id": user["id"],
        "fullName": user["fullName"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"],
        "token": token,
    }


@app.post("/api/auth/profile")
def get_profile(payload: LoginUser):
    user = get_user_by_username(payload.username)
    if user is None or not verify_password(payload.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return {
        "id": user["id"],
        "fullName": user["fullName"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"],
    }


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
