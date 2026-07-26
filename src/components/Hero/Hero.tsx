import { HeroProps } from './Hero.props';
import styles from './Hero.module.css';
import clsx from 'clsx';

export const Hero = ({ children, className, ...props }: HeroProps) => {
	return (
		<section className={clsx(styles.hero, className)} data-testid="hero" {...props}>
			<div className={clsx(styles.image)}></div>
			<div className={clsx(styles.overlay)}>
				<h1 className={clsx(styles.title)}>Confidence in every thread</h1>
				<p className={clsx(styles.subtitle)}>Minimal lingerie for women who choose calm, confidence, and comfort.</p>
			</div>
		</section>
	);
};
