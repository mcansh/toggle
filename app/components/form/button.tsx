import * as React from 'react';

type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

interface Props {
  type?: ButtonProps['type'];
}

const SubmitButton: React.FC<Props> = ({ children, type = 'submit' }) => (
  <button
    className="block w-full py-2 mt-1 leading-relaxed border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    type={type}
  >
    {children}
  </button>
);

export { SubmitButton };
