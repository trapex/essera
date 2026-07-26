import styles from './page.module.css';
import clsx from 'clsx';
import { ContactForm } from '@/components';

export default function Contact() {
	return (
		<div className={clsx('page', styles.page)}>
			<main className={clsx(styles.main)}>
				<h1>Contact</h1>
				<div className={clsx(styles.flex)}>
					<div className={clsx(styles.contact)}>
						<ContactForm />
					</div>
					<div className={clsx(styles.image)}></div>
				</div>
			</main>
		</div>
	);
}
