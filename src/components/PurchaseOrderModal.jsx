import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, PackagePlus, X } from 'lucide-react';


const defaultQuantity = product => Math.max(1, Math.ceil(product.demand * 0.6));

export default function PurchaseOrderModal({ product, onClose, onSubmit }) {
  const [quantity, setQuantity] = useState(defaultQuantity(product));
  const [unitPrice, setUnitPrice] = useState(79.99);
  const [supplier, setSupplier] = useState('Northstar Wholesale');
  const [deliveryDate, setDeliveryDate] = useState('2026-09-18');
  const [notes, setNotes] = useState('Prioritize this shipment due to stockout risk.');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
 // const { width, height } = useWindowSize();

  useEffect(() => {
    const handleKeyDown = event => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const total = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const submit = event => {
    event.preventDefault();
    const nextErrors = {};
    if (!supplier.trim()) nextErrors.supplier = 'Select a supplier.';
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) nextErrors.quantity = 'Enter a whole number greater than 0.';
    if (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) <= 0) nextErrors.unitPrice = 'Enter a price greater than 0.';
    if (!deliveryDate) nextErrors.deliveryDate = 'Choose a delivery date.';
    else if (deliveryDate < new Date().toISOString().slice(0, 10)) nextErrors.deliveryDate = 'Delivery date must be today or later.';
    if (notes.length > 500) nextErrors.notes = 'Notes must be 500 characters or fewer.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitted(true);
    window.setTimeout(() => onSubmit({ product, quantity: Number(quantity), unitPrice: Number(unitPrice), supplier, deliveryDate, notes }), 500);
  };

  return <div className="modal-backdrop open" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-order-title">
      <button className="modal-close" onClick={onClose} aria-label="Close purchase order modal"><X size={19} /></button>
      {submitted ? <div className="purchase-success"><span className="success-icon"><CheckCircle2 size={30} /></span><h2>Purchase order created</h2><p><strong>{quantity} units</strong> of {product.name} were added to the purchasing queue.</p><button className="button primary" onClick={onClose}>Done</button></div> : <form onSubmit={submit}>
        <div className="purchase-heading"><span className="purchase-icon"><PackagePlus size={19} /></span><div><p className="eyebrow">Purchasing workflow</p><h2 id="purchase-order-title">Create purchase order</h2><p className="subtle">Review the recommendation before sending it to purchasing.</p></div></div>
        <div className="purchase-product"><div className="product-thumb headphones"><img src={product.image} alt="" /></div><div><strong>{product.name}</strong><small>{product.sku} · {product.category}</small></div><span className="risk-pill high">{product.risk}% risk</span></div>
        <div className="purchase-fields"><label>Supplier<select aria-invalid={Boolean(errors.supplier)} value={supplier} onChange={event => setSupplier(event.target.value)}><option value="">Select supplier</option><option>Northstar Wholesale</option><option>Acme Distribution</option><option>Direct supplier</option></select>{errors.supplier && <small className="field-error" role="alert">{errors.supplier}</small>}</label><label>Quantity<input aria-invalid={Boolean(errors.quantity)} type="number" min="1" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} />{errors.quantity && <small className="field-error" role="alert">{errors.quantity}</small>}</label><label>Unit price ($)<input aria-invalid={Boolean(errors.unitPrice)} type="number" min="0.01" step="0.01" value={unitPrice} onChange={event => setUnitPrice(event.target.value)} />{errors.unitPrice && <small className="field-error" role="alert">{errors.unitPrice}</small>}</label><label>Expected delivery<div className="input-with-icon"><CalendarDays size={14} /><input aria-invalid={Boolean(errors.deliveryDate)} type="date" value={deliveryDate} onChange={event => setDeliveryDate(event.target.value)} /></div>{errors.deliveryDate && <small className="field-error" role="alert">{errors.deliveryDate}</small>}</label></div>
        <label className="purchase-notes">Notes<textarea aria-invalid={Boolean(errors.notes)} rows="3" maxLength="500" value={notes} onChange={event => setNotes(event.target.value)} />{errors.notes && <small className="field-error" role="alert">{errors.notes}</small>}<small className="field-hint">{notes.length}/500</small></label>
        <div className="purchase-total"><span>Estimated order value</span><strong>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
        <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button type="submit" className="button primary"><PackagePlus size={14} /> Create purchase order</button></div>
      </form>}
      
    </section>
  </div>;
}
