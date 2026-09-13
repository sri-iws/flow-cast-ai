import sqlite3

import pytest
from fastapi.testclient import TestClient

from main import app, Product, PurchaseOrderCreate, sanitize_filename, sanitize_text


client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_users():
    with sqlite3.connect("inventory.db") as connection:
        connection.execute("DELETE FROM users")
        connection.execute("DELETE FROM sqlite_sequence WHERE name = 'users'")
        connection.commit()


def test_register_and_login_for_manager_role():
    payload = {
        "fullName": "Ava Stone",
        "email": "ava.manager@example.com",
        "username": "ava.manager",
        "password": "SecurePass123!",
        "role": "manager",
    }

    register_response = client.post("/api/auth/register", json=payload)
    assert register_response.status_code == 201
    body = register_response.json()
    assert body["role"] == "manager"
    assert body["username"] == "ava.manager"

    login_response = client.post(
        "/api/auth/login",
        json={"username": "ava.manager", "password": "SecurePass123!"},
    )
    assert login_response.status_code == 200
    login_body = login_response.json()
    assert login_body["role"] == "manager"
    assert login_body["token"]


def test_register_and_login_for_ceo_and_analyst_roles():
    for payload in (
        {
            "fullName": "Olivia CEO",
            "email": "olivia.ceo@example.com",
            "username": "olivia.ceo",
            "password": "SecurePass123!",
            "role": "ceo",
        },
        {
            "fullName": "Leo Analyst",
            "email": "leo.analyst@example.com",
            "username": "leo.analyst",
            "password": "SecurePass123!",
            "role": "analyst",
        },
    ):
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201, response.text
        assert response.json()["role"] == payload["role"]

        login = client.post(
            "/api/auth/login",
            json={"username": payload["username"], "password": payload["password"]},
        )
        assert login.status_code == 200, login.text
        assert login.json()["role"] == payload["role"]


def test_reject_invalid_role_or_wrong_password():
    response = client.post(
        "/api/auth/register",
        json={
            "fullName": "Bad User",
            "email": "bad.user@example.com",
            "username": "bad.user",
            "password": "Pass123!",
            "role": "admin",
        },
    )
    assert response.status_code == 400

    register_response = client.post(
        "/api/auth/register",
        json={
            "fullName": "Sam User",
            "email": "sam.user@example.com",
            "username": "sam.user",
            "password": "Pass123!",
            "role": "manager",
        },
    )
    assert register_response.status_code == 201

    bad_login = client.post(
        "/api/auth/login",
        json={"username": "sam.user", "password": "WrongPass!"},
    )
    assert bad_login.status_code == 401


def test_product_fields_strip_dangerous_markup():
    product = Product.model_validate(
        {
            "name": "<script>alert('x')</script> Widget & Co",
            "sku": "SKU-001",
            "category": "Electronics",
            "stock": 22,
            "demand": 15,
            "health": "Healthy",
            "recommendation": "<b>Keep</b> on hand for peak demand.",
            "risk": 14,
            "daysLeft": 8,
            "image": "https://example.com/image.png",
        }
    )

    assert product.name == "Widget & Co"
    assert product.recommendation == "Keep on hand for peak demand."


def test_order_fields_reject_control_characters():
    order = PurchaseOrderCreate.model_validate(
        {
            "productSku": "SKU-001",
            "productName": "Widget & Co",
            "quantity": 10,
            "unitPrice": 24.5,
            "supplier": "Northstar\nWholesale",
            "deliveryDate": "2026-09-15",
            "notes": "Priority\x00 check",
        }
    )

    assert order.supplier == "Northstar Wholesale"
    assert order.notes == "Priority check"


def test_uploaded_filename_block_path_traversal():
    with pytest.raises(ValueError):
        sanitize_filename("../../etc/passwd.csv")

    assert sanitize_filename("sales_2026.csv") == "sales_2026.csv"
