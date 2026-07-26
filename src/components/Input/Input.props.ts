import { DetailedHTMLProps, InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps
	extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
	isInvalid?: boolean;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	className?: string;
	label?: string;
}
