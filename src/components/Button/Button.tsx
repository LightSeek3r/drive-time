import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: 'primary' | 'quiet';
};

export function Button({ variant = 'primary', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={`${styles.button} ${styles[variant]}`} {...rest} />;
}
