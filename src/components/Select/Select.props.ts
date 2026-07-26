import { DetailedHTMLProps, SelectHTMLAttributes, ReactNode } from 'react';

export interface SelectProps
	extends DetailedHTMLProps<SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> {
	isInvalid?: boolean;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	className?: string;
	label?: string;
}
