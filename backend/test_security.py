import pytest

from main import Product, PurchaseOrderCreate, sanitize_filename, sanitize_text


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
