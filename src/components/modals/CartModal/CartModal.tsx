'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { CartModalProps } from './CartModal.props';
import styles from './CartModal.module.css';
import { Button, CartItem } from '@/components';
import { useCartStore } from '@/stores/cartStore';

export const CartModal = ({ onClose: _onClose }: CartModalProps) => {
	void _onClose;
	// Read cart entries from Zustand store (UI-friendly data only)
	const items = useCartStore((s) => s.items);

	const remove = useCartStore((s) => s.remove);
	const setQuantity = useCartStore((s) => s.setQuantity);

	const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
	const isEmpty = items.length === 0;

	const handleRemove = (productId: number, size: string, color: string) => {
		remove({ productId, size: size || null, color: color || null });
	};

	const handleQuantityChange = (
		productId: number,
		size: string,
		color: string,
		newQty: number
	) => {
		setQuantity({ productId, size: size || null, color: color || null }, newQty);
	};

	return (
		<div
			className={clsx(styles.container)}
			role="dialog"
			aria-modal="true"
			aria-labelledby="cart-modal-title"
		>
			<div id="cart-modal-title" className={clsx(styles.title)}>
				My Bag
			</div>

			<div className={clsx(styles.list)}>
				{isEmpty ? (
					<div className={styles.empty}>Your bag is empty</div>
				) : (
					items.map((item) => (
						<CartItem
							key={`${item.product.id}-${item.size ?? ''}-${item.color ?? ''}`}
							product={item.product}
							size={item.size ?? ''}
							color={item.color ?? ''}
							quantity={item.quantity}
							onRemove={handleRemove}
							onQuantityChange={handleQuantityChange}
						/>
					))
				)}
			</div>
			{!isEmpty && (
				<div className={clsx(styles.total)}>
					<span>Subtotal </span>
					<span>${subtotal.toFixed(2)}</span>
				</div>
			)}

			<div className={clsx(styles.checkout)}>
				<Link href="/checkout">
					<Button
						className={clsx('wFull')}
						size="md"
						color="primary"
						disabled={isEmpty} // disable checkout when cart is empty
					>
						Checkout
					</Button>
				</Link>
			</div>
		</div>
	);
};
