'use client';
import { useId, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { CheckoutCartProps } from './CheckoutCart.props';
import styles from './CheckoutCart.module.css';
import { CheckoutProductItem, PromocodeInput, Button } from '@/components';
import { useCartStore } from '@/stores/cartStore';
import { pluralize } from '@/utils/plural';

export const CheckoutCart = ({ className, ...props }: CheckoutCartProps) => {
	const items = useCartStore((s) => s.items);

	const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
	const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
	const isEmpty = items.length === 0;

	const [isOpen, setIsOpen] = useState(false);
	const headerId = useId();
	const contentId = useId();

	const handleApply = (code: string) => {
		// Hook up promocode flow here (server validation, totals update, etc.)
		console.log('Promocode:', code);
	};

	return (
		<div className={clsx(styles.checkout, className)} {...props}>
			<button
				type="button"
				id={headerId}
				className={clsx(styles.mobileHeader)}
				aria-expanded={isOpen}
				aria-controls={contentId}
				onClick={() => setIsOpen((v) => !v)}
			>
				<span className={styles.headerLeft}>
					<span
						className={clsx(styles.chevron, { [styles.chevronOpen]: isOpen })}
						aria-hidden="true"
					>
						❯
					</span>
					<span className={styles.headerTitle}>Order summary</span>
				</span>
				<span className={styles.headerTotal}>${subtotal.toFixed(2)}</span>
			</button>

			<div
				id={contentId}
				role="region"
				aria-labelledby={headerId}
				className={clsx(styles.content, { [styles.open]: isOpen })}
			>
				<div className={styles.contentInner}>
					<div className={clsx(styles.list)}>
						{isEmpty ? (
							<div className={styles.empty}>Your cart is empty</div>
						) : (
							items.map((it) => (
								<CheckoutProductItem
									className={clsx(styles.item)}
									key={`${it.product.id}-${it.size}-${it.color}`}
									product={it.product}
									size={it.size}
									color={it.color}
									quantity={it.quantity}
								/>
							))
						)}
					</div>

					{/* Promocode */}
					<div className={clsx(styles.promocode)}>
						<PromocodeInput onApply={handleApply} isLoading={false} error={''} />
					</div>

					{/* Summary */}
					<div className={clsx(styles.summary)}>
						<div className={clsx(styles.subtotal)}>
							<div className={clsx(styles.text)}>
								Subtotal · {pluralize(totalQty, 'item')}
							</div>
							<div className={clsx(styles.count)}>${subtotal.toFixed(2)}</div>
						</div>

						<div className={clsx(styles.shipping)}>
							<div className={clsx(styles.text)}>Shipping</div>
							<div className={clsx(styles.empty)}>Enter shipping address</div>
						</div>

						<div className={clsx(styles.total)}>
							<div>Total</div>
							<div>${subtotal.toFixed(2)}</div>
						</div>

						{/* Continue CTA can stay here (still read-only) */}
						<Link href="/checkout/payment">
							<Button className={clsx(styles.proceed, 'wFull')} size="md" color="primary" disabled={isEmpty}>
								Continue to payment
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};
