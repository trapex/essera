import { Suspense } from 'react';
import clsx from 'clsx';
import styles from './page.module.css';
import { CheckoutSuccess } from './CheckoutSuccess';

export default function CheckoutSuccessPage() {
	return (
		<div className={clsx('page', styles.page)}>
			<main className={clsx(styles.main)}>
				<Suspense fallback={<div className={clsx(styles.card)}>Confirming your payment…</div>}>
					<CheckoutSuccess />
				</Suspense>
			</main>
		</div>
	);
}
