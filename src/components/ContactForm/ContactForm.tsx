'use client';
import { useState } from 'react';
import { ContactFormProps } from './ContactForm.props';
import styles from './ContactForm.module.css';
import clsx from 'clsx';
import { Input } from '@/components/Input/Input';
import { Textarea } from '@/components/Textarea/Textarea';
import { Button } from '@/components/Button/Button';
import { createContactMessage } from '@/api/contactMessages';

export const ContactForm = ({ children, className }: ContactFormProps) => {
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const form = e.currentTarget;
		const fd = new FormData(form);

		try {
			await createContactMessage({
				name: (fd.get('name') as string) ?? '',
				email: (fd.get('email') as string) ?? '',
				comment: (fd.get('comment') as string) ?? '',
			});

			setSubmitted(true);
			form.reset();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to send');
		} finally {
			setLoading(false);
		}
	}

	return (
		<form className={clsx(styles.form, className)} onSubmit={handleSubmit} autoComplete="off">
			<div className={clsx(styles.field)}>
				<Input
					label="Name"
					type="text"
					id="name"
					name="name"
					required
					minLength={2}
				/>
			</div>
			<div className={clsx(styles.field)}>
				<Input
					label="Email"
					type="email"
					id="email"
					name="email"
					required
				/>
			</div>
			<div className={clsx(styles.field)}>
				<Textarea
					label="Comment"
					id="comment"
					name="comment"
					required
					minLength={5}
					rows={4}
				/>
			</div>
			<Button type="submit" color="primary" disabled={loading}>
				Send
			</Button>
			{submitted && <div className={clsx(styles.success)}>Thanks for reaching us out!</div>}
			{error && <div className={clsx(styles.error)}>{error}</div>}
			{children}
		</form>
	);
};
