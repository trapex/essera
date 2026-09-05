'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import styles from './page.module.css';
import { Button } from '@/components';
import { fetchPaymentStatus } from '@/api/checkout';
import { useCartStore } from '@/stores/cartStore';
import type { OrderStatus } from '@/interfaces/checkout.interface';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

/** What the page shows while, and after, the order is confirmed against the backend. */
type View = 'confirming' | 'paid' | 'pending' | 'failed' | 'unknown';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Coming back from Stripe proves nothing: the order only turns `PAID` from the Stripe
 * webhook, so the page polls `GET /checkout/payment/:orderId` and clears the cart when —
 * and only when — the backend says the payment went through.
 */
export const CheckoutSuccess = () => {
	const orderId = useSearchParams().get('orderId');
	const clearCart = useCartStore((s) => s.clear);
	const [view, setView] = useState<View>(orderId ? 'confirming' : 'unknown');
	const clearedRef = useRef(false);

	useEffect(() => {
		if (!orderId) return;

		const controller = new AbortController();
		let cancelled = false;

		const poll = async () => {
			const deadline = Date.now() + POLL_TIMEOUT_MS;
			let lastStatus: OrderStatus | undefined;

			while (!cancelled && Date.now() < deadline) {
				try {
					const { status } = await fetchPaymentStatus(orderId, controller.signal);
					lastStatus = status;

					if (status === 'PAID') {
						if (!clearedRef.current) {
							clearedRef.current = true;
							clearCart();
						}
						if (!cancelled) setView('paid');
						return;
					}

					if (status === 'FAILED' || status === 'CANCELLED') {
						if (!cancelled) setView('failed');
						return;
					}
				} catch {
					// A transient failure should not end the wait; the next tick tries again.
				}

				await sleep(POLL_INTERVAL_MS);
			}

			if (!cancelled) setView(lastStatus ? 'pending' : 'unknown');
		};

		void poll();

		return () => {
			cancelled = true;
			controller.abort();
		};
	}, [orderId, clearCart]);

	return (
		<div className={clsx(styles.card)} aria-live="polite" aria-busy={view === 'confirming'}>
			{view === 'confirming' && (
				<>
					<h1>Confirming your payment…</h1>
					<p className={clsx(styles.text)}>
						<span className={clsx(styles.spinner)} aria-hidden="true" />
						We are waiting for Stripe to confirm the payment. This usually takes a few seconds.
					</p>
				</>
			)}

			{view === 'paid' && (
				<>
					<h1>Thank you for your order</h1>
					<p className={clsx(styles.text)}>
						Your payment was successful and your order is confirmed. A receipt is on its way to
						your inbox.
					</p>
				</>
			)}

			{view === 'pending' && (
				<>
					<h1>Your payment is being processed</h1>
					<p className={clsx(styles.text)}>
						Stripe has not confirmed the payment yet. Nothing is lost — the order is recorded and
						will be confirmed as soon as the payment clears. Your cart is kept until then.
					</p>
				</>
			)}

			{view === 'failed' && (
				<>
					<h1>The payment did not go through</h1>
					<p className={clsx(styles.text)}>
						Your card was not charged and your cart is still waiting for you.
					</p>
					<Link href="/checkout" className={clsx(styles.link)}>
						<Button size="md" color="primary">Back to checkout</Button>
					</Link>
				</>
			)}

			{view === 'unknown' && (
				<>
					<h1>We could not find that order</h1>
					<p className={clsx(styles.text)}>
						If you were just charged, the confirmation may still be on its way — nothing was lost.
					</p>
				</>
			)}

			{(view === 'paid' || view === 'pending' || view === 'unknown' || view === 'confirming') && (
				<Link href="/shop" className={clsx(styles.link)}>
					<Button size="md" color={view === 'paid' ? 'primary' : 'neutral'}>
						Continue shopping
					</Button>
				</Link>
			)}
		</div>
	);
};
