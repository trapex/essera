'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProductItem, Variants } from '@/interfaces/product.interface';
import type { SizeOption } from '@/interfaces/size.interface';
import type { CartEntry, CartProduct } from '@/interfaces/cart.interface';
import { MAX_CHECKOUT_LINES, MAX_LINE_QUANTITY } from '@/constants/checkout';

/** Composite key (not stored) */
type CartKey = { productId: number; size?: string | null; color?: string | null };

/** Build key from productId + size + color */
const cartKey = ({ productId, size, color }: CartKey) =>
	[productId, size ?? '', color ?? ''].join('|');

/** Checkout rejects anything above the backend's per-line limit, so the cart never exceeds it. */
const clampQuantity = (qty: number) => Math.min(qty, MAX_LINE_QUANTITY);

/** discountPrice ?? basePrice */
const unitPrice = (p: ProductItem) =>
	typeof p.discountPrice === 'number' ? p.discountPrice : p.basePrice;

function makeCartProduct(product: ProductItem, variant?: Variants, size?: SizeOption | null): CartProduct {
	const v = variant ?? product.variants?.[0];
	return {
		id: product.id,
		images: v?.images ?? [],
		slug: product.slug,
		title: product.title,
		price: unitPrice(product),
		label: product.label ?? '',
		inStock: size ? size.inStock !== false && ((size.quantity ?? 1) > 0) : true,
		category: product.category,
		brand: product.brand,
		createdAt: product.createdAt,
		updatedAt: product.updatedAt,
	};
}

type AddFromProductArgs = {
	product: ProductItem;
	variant?: Variants;
	size?: SizeOption | null;
	quantity?: number;
};

type CartState = {
	items: CartEntry[];                              // UI-only format
	addFromProduct: (args: AddFromProductArgs) => void;
	remove: (key: CartKey) => void;                  // remove by composite key
	setQuantity: (key: CartKey, qty: number) => void;// set qty (<=0 removes)
	clear: () => void;

	// selectors
	count: () => number;
	subtotal: () => number;
};

const safeStorage = () => {
	if (typeof window === 'undefined') {
		return {
			getItem: () => null,
			setItem: () => { },
			removeItem: () => { },
		} as unknown as Storage;
	}
	return localStorage;
};

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],

			addFromProduct: ({ product, variant, size, quantity = 1 }) => {
				const v = variant ?? product.variants?.[0];

				// Normalize size/color to strings because CartEntry.size/color are string
				const sizeStr = size?.size ?? '';
				const colorStr = v?.color ?? '';

				// Build UI entry
				const entry: CartEntry = {
					product: makeCartProduct(product, v, size ?? null),
					size: sizeStr,
					color: colorStr,
					quantity,
				};

				// Merge by composite key (treat empty string as null)
				const key = cartKey({
					productId: entry.product.id,
					size: sizeStr || null,
					color: colorStr || null,
				});

				const items = [...get().items];
				const idx = items.findIndex(
					(i) =>
						cartKey({ productId: i.product.id, size: i.size || null, color: i.color || null }) === key
				);

				if (idx >= 0) {
					items[idx] = {
						...items[idx],
						quantity: clampQuantity(items[idx].quantity + entry.quantity),
					};
				} else {
					// Checkout accepts a limited number of distinct lines; ignore the extra ones.
					if (items.length >= MAX_CHECKOUT_LINES) return;
					items.push({ ...entry, quantity: clampQuantity(entry.quantity) });
				}
				set({ items });
			},

			remove: (k) => {
				const key = cartKey(k);
				set({
					items: get().items.filter(
						(i) => cartKey({ productId: i.product.id, size: i.size || null, color: i.color || null }) !== key
					),
				});
			},

			setQuantity: (k, qty) => {
				const key = cartKey(k);
				if (qty <= 0) {
					set({
						items: get().items.filter(
							(i) => cartKey({ productId: i.product.id, size: i.size || null, color: i.color || null }) !== key
						),
					});
					return;
				}
				set({
					items: get().items.map((i) =>
						cartKey({ productId: i.product.id, size: i.size || null, color: i.color || null }) === key
							? { ...i, quantity: clampQuantity(qty) }
							: i
					),
				});
			},

			clear: () => set({ items: [] }),

			count: () => get().items.reduce((acc, it) => acc + it.quantity, 0),
			subtotal: () => get().items.reduce((acc, it) => acc + it.product.price * it.quantity, 0),
		}),
		{
			name: 'cart-v1',
			storage: createJSONStorage(safeStorage),
			partialize: (s) => ({ items: s.items }),
		}
	)
);
