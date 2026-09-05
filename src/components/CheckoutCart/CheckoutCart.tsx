'use client';
import { useEffect, useId, useState } from 'react';
import clsx from 'clsx';
import { CheckoutCartProps } from './CheckoutCart.props';
import styles from './CheckoutCart.module.css';
import { CheckoutProductItem, PromocodeInput, Button } from '@/components';
import { useCartStore } from '@/stores/cartStore';
import { pluralize } from '@/utils/plural';
import { DELIVERY_FORM_ID } from '@/constants/checkout';
import { useCheckoutStore } from '@/stores/checkoutStore';

export const CheckoutCart = ({ className, ...props }: CheckoutCartProps) => {
	const items = useCartStore((s) => s.items);

	const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
	const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
	const isEmpty = items.length === 0;

	const [isOpen, setIsOpen] = useState(false);
	// Paying state lives in the checkout store: the delivery form owns the submit,
	// this component only renders its progress.
	const isPaying = useCheckoutStore((s) => s.isPaying);
	const error = useCheckoutStore((s) => s.error);
	const resetPaying = useCheckoutStore((s) => s.resetPaying);
	const headerId = useId();
	const contentId = useId();
	const errorId = useId();

	// Coming back from Stripe with Back restores this page from the bfcache with the
	// submit guard still closed, which would leave the button disabled for good.
	useEffect(() => {
		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) resetPaying();
		};

		window.addEventListener('pageshow', handlePageShow);
		return () => window.removeEventListener('pageshow', handlePageShow);
	}, [resetPaying]);

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

						{/* Submits the delivery form, so the browser validates it first and a
						    missing form simply cannot start a payment. */}
						<Button
							type="submit"
							form={DELIVERY_FORM_ID}
							className={clsx(styles.proceed, 'wFull')}
							size="md"
							color="primary"
							disabled={isEmpty || isPaying}
							aria-busy={isPaying}
							aria-describedby={error ? errorId : undefined}
						>
							{isPaying ? (
								<span className={clsx(styles.paying)}>
									<span className={clsx(styles.spinner)} aria-hidden="true" />
									Redirecting to payment…
								</span>
							) : (
								'Continue to payment'
							)}
						</Button>

						{error && (
							<div id={errorId} className={clsx(styles.error)} role="alert">
								{error}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
