import json
import os
import sqlite3
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = Path(os.getenv("FLOW_CAST_DATABASE", BASE_DIR / "inventory.db"))
SEED_PATH = BASE_DIR / "seed_products.json"
SEED_ORDERS_PATH = BASE_DIR / "seed_orders.json"


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                sku TEXT NOT NULL UNIQUE,
                category TEXT NOT NULL,
                stock INTEGER NOT NULL,
                demand INTEGER NOT NULL,
                health TEXT NOT NULL,
                recommendation TEXT NOT NULL,
                risk INTEGER NOT NULL,
                days_left INTEGER NOT NULL,
                image TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_sku TEXT NOT NULL,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                unit_price REAL NOT NULL CHECK (unit_price > 0),
                supplier TEXT NOT NULL,
                delivery_date TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Pending',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        count = connection.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        if count == 0:
            seed_products = json.loads(SEED_PATH.read_text(encoding="utf-8"))
            seed_orders = json.loads(SEED_ORDERS_PATH.read_text(encoding="utf-8"))
            connection.executemany(
                """
                INSERT INTO products
                    (name, sku, category, stock, demand, health, recommendation, risk, days_left, image)
                VALUES
                    (:name, :sku, :category, :stock, :demand, :health, :recommendation,
                     :risk, :daysLeft, :image)
                """,
                seed_products,
            )
            connection.executemany(
                """
                INSERT INTO orders
                (id, product_sku, product_name, quantity, unit_price, supplier, delivery_date, notes, status, created_at)
                VALUES (:id, :product_sku, :product_name, :quantity, :unit_price, :supplier, :delivery_date,
                        :notes, :status, :created_at)
                """,
                seed_orders,
            )


def get_products() -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT name, sku, category, stock, demand, health, recommendation,
                   risk, days_left, image
            FROM products
            ORDER BY name COLLATE NOCASE
            """
        ).fetchall()
    return [
        {**dict(row), "daysLeft": row["days_left"]}
        for row in rows
    ]


def create_order(order: dict[str, Any]) -> dict[str, Any]:
    initialize_database()
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO orders
                (product_sku, product_name, quantity, unit_price, supplier,
                 delivery_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order["productSku"],
                order["productName"],
                order["quantity"],
                order["unitPrice"],
                order["supplier"],
                order["deliveryDate"],
                order.get("notes", ""),
            ),
        )
        row = connection.execute(
            "SELECT * FROM orders WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return order_from_row(row)


def get_orders() -> list[dict[str, Any]]:
    initialize_database()
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM orders ORDER BY created_at DESC, id DESC"
        ).fetchall()
    return [order_from_row(row) for row in rows]


def order_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "productSku": row["product_sku"],
        "productName": row["product_name"],
        "quantity": row["quantity"],
        "unitPrice": row["unit_price"],
        "supplier": row["supplier"],
        "deliveryDate": row["delivery_date"],
        "notes": row["notes"],
        "status": row["status"],
        "createdAt": row["created_at"],
    }
