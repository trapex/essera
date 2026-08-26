import Link from 'next/link';
import clsx from 'clsx';
import styles from './page.module.css';
import { Button } from '@/components';

/**
 * Stripe sends the buyer here when they back out of the hosted checkout. Nothing was
 * charged and the cart is left untouched, so returning to checkout resumes the order.
 */
export default function CheckoutCancelPage() {
	return (
		<div className={clsx('page', styles.page)}>
			<main className={clsx(styles.main)}>
				<div className={clsx(styles.card)}>
					<h1>Payment cancelled</h1>
					<p className={clsx(styles.text)}>
						You cancelled the payment, so nothing was charged. Your cart has been kept exactly as
						you left it.
					</p>
					<div className={clsx(styles.actions)}>
						<Link href="/checkout" className={clsx(styles.link)}>
							<Button size="md" color="primary">Return to checkout</Button>
						</Link>
						<Link href="/shop" className={clsx(styles.link)}>
							<Button size="md" color="neutral">Continue shopping</Button>
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
