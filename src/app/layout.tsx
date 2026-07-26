import type { Metadata } from 'next';
import { Manrope, Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { Header, Footer, ModalManager, UserInitializer } from '@/components';
import { ModalProvider } from '@/contexts/ModalContext';
import { AuthDebug } from '@/components/AuthDebug/AuthDebug';

const manrope = Manrope({
	subsets: ['latin'],
	weight: ['400', '500', '700'],
	variable: '--font-inter',
	display: 'swap',
})

const inter = Inter({
	subsets: ['latin'],
	weight: ['100', '300', '500', '700'],
	variable: '--font-inter',
	display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
	subsets: ['latin', 'cyrillic'],
	weight: ['400', '500', '700'],
	variable: '--font-cormorant',
	display: 'swap',
});


export const metadata: Metadata = {
	title: "Essera store",
	description: "Essera store",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				{/* Outlined */}
				<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" />
			</head>
			<body className={`${manrope.variable} ${inter.variable} ${cormorantGaramond.variable} ...`} suppressHydrationWarning>
				<ModalProvider>
					<UserInitializer />
					{/*<AuthDebug />*/}
					<Header />
					{children}
					<Footer />
					<ModalManager />
				</ModalProvider>
			</body>
		</html>
	);
}
