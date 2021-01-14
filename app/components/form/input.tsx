import * as React from 'react';
import type { Except, SetRequired } from 'type-fest';

type InputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

type RequiredInputProps = SetRequired<InputProps, 'name'>;

type FinalInputProps = Except<RequiredInputProps, 'className'>;

interface MyProps {
  label: string;
}

interface Props extends FinalInputProps, MyProps {}

const Label: React.FC<{ label: string }> = ({ children, label }) => (
  <label className="block">
    <span>{label}: </span>
    {children}
  </label>
);

const InputOnly: React.VFC<FinalInputProps> = ({ type = 'text', ...props }) => (
  <input
    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:bg-indigo-100"
    type={type}
    {...props}
  />
);

const Input: React.VFC<Props> = ({ type = 'text', label, ...props }) => (
  <Label label={label}>
    <input
      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:bg-indigo-100"
      type={type}
      {...props}
    />
  </Label>
);

export { Input, Label, InputOnly };
