"use client";

import { create } from "zustand";
import { checkoutErrorMessage, createCheckoutPayment } from "@/api/checkout";
import { MAX_CHECKOUT_LINES, MAX_LINE_QUANTITY } from "@/constants/checkout";
import type {
  CheckoutItemDTO,
  ShippingAddressDTO,
} from "@/interfaces/checkout.interface";
import { useCartStore } from "@/stores/cartStore";
import { redirectTo } from "@/utils/redirect";

export interface DeliveryValues extends ShippingAddressDTO {
  apartments: string;
  email: string;
}

export const initialDelivery: DeliveryValues = {
  country: "United States",
  firstName: "",
  lastName: "",
  address: "",
  apartments: "",
  city: "",
  state: "",
  zip: "",
  phone: "+1 ",
  email: "",
};

type CheckoutState = {
  delivery: DeliveryValues;
  isPaying: boolean;
  error: string;
  setDelivery: (patch: Partial<DeliveryValues>) => void;
  /** Releases the submit guard, e.g. when the buyer comes back from Stripe. */
  resetPaying: () => void;
  /** Prices the cart with the backend and hands the buyer over to Stripe. */
  startPayment: () => Promise<void>;
};

/**
 * The cart lines as the backend wants them. Prices and totals stay out: the
 * backend recomputes both from the database.
 */
const toItems = (): CheckoutItemDTO[] =>
  useCartStore.getState().items.map((it) => ({
    productId: it.product.id,
    variant: it.color,
    size: it.size,
    quantity: it.quantity,
  }));

/** The same limits the backend enforces, checked here so the buyer gets a usable message. */
export const checkoutLimitError = (items: CheckoutItemDTO[]): string => {
  if (items.length > MAX_CHECKOUT_LINES) {
    return `An order can contain at most ${MAX_CHECKOUT_LINES} different items. Please remove a few and try again.`;
  }

  const overLimit = items.find((item) => item.quantity > MAX_LINE_QUANTITY);

  if (overLimit) {
    return `You can order at most ${MAX_LINE_QUANTITY} units of the same item. Please lower the quantity and try again.`;
  }

  return "";
};

const shippingFrom = (delivery: DeliveryValues): ShippingAddressDTO => ({
  country: delivery.country,
  firstName: delivery.firstName,
  lastName: delivery.lastName,
  address: delivery.address,
  apartments: delivery.apartments,
  city: delivery.city,
  state: delivery.state,
  zip: delivery.zip,
  phone: delivery.phone,
});

export const useCheckoutStore = create<CheckoutState>()((set, get) => ({
  delivery: initialDelivery,
  isPaying: false,
  error: "",

  setDelivery: (patch) =>
    set((state) => ({ delivery: { ...state.delivery, ...patch } })),

  resetPaying: () => set({ isPaying: false }),

  startPayment: async () => {
    if (get().isPaying) return;

    const items = toItems();

    if (items.length === 0) return;

    const limitError = checkoutLimitError(items);

    if (limitError) {
      set({ error: limitError });
      return;
    }

    set({ isPaying: true, error: "" });

    const { delivery } = get();

    try {
      const { url } = await createCheckoutPayment({
        items,
        email: delivery.email || undefined,
        shipping: shippingFrom(delivery),
      });

      if (!url) throw new Error("No payment URL");

      // The cart is kept until the payment is confirmed on /checkout/success.
      redirectTo(url);
    } catch (err) {
      set({ isPaying: false, error: checkoutErrorMessage(err) });
    }
  },
}));
