'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/Input/Input';

export default function SignupPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();

		const { error } = await supabase.auth.signUp({
			email,
			password,
		});

		if (error) {
			setError(error.message);
		} else {
			setSuccess('Check your email to confirm registration.');
			setEmail('');
			setPassword('');
		}
	};

	return (
		<div style={{ padding: '2rem' }}>
			<h1>Sign Up</h1>
			<form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
				<Input
					label="Email"
					type="email"
					id="email"
					name="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<Input
					label="Password"
					type="password"
					id="password"
					name="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
				<button type="submit">Sign Up</button>
			</form>

			{error && <p style={{ color: 'red' }}>{error}</p>}
			{success && <p style={{ color: 'green' }}>{success}</p>}
		</div>
	);
}
