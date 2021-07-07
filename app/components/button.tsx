import clsx from 'clsx';
import * as React from 'react';

import type { Except } from 'type-fest';

type RawButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

type ButtonProps = Except<RawButtonProps, 'className'>;

interface Props extends ButtonProps {
  /**
   * @default basic
   */
  variant?: 'basic' | 'danger' | 'primary';
}

const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ children, variant = 'basic', ...props }, ref) => (
    <button
      className={clsx(
        'inline-flex justify-center w-full px-4 py-2 text-base font-medium rounded-md shadow-sm sm:w-auto sm:text-sm',
        {
          'text-gray-700 bg-white border border-gray-300 hover:text-gray-500 focus:outline-none focus:shadow-outline-indigo':
            variant === 'basic',
          'text-white bg-red-600 border border-transparent hover:bg-red-700 focus:outline-none focus:shadow-outline-red':
            variant === 'danger',
          'text-white bg-green-600 border border-transparent hover:bg-green-700 focus:outline-none focus:shadow-outline-green':
            variant === 'primary',
        }
      )}
      {...props}
      ref={ref}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';

export { Button };
