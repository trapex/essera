/**
 * The delivery form and the "Continue to payment" button live in sibling components,
 * so the button submits the form by id — the browser then runs the form's own
 * validation, and a missing form means no submission at all.
 */
export const DELIVERY_FORM_ID = 'delivery-form';

/** Mirrors the backend checkout DTO: at most 20 units per line and 50 lines per order. */
export const MAX_LINE_QUANTITY = 20;
export const MAX_CHECKOUT_LINES = 50;
