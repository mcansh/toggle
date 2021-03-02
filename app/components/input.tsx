import * as React from 'react';
import type { Except, SetRequired } from 'type-fest';

type RawInputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

type InputProps = SetRequired<Except<RawInputProps, 'className'>, 'name'>;

const InputLabel: React.FC<{
  id: string;
  label: string;
  rightLabel?: React.ReactNode;
}> = ({ id, label, children, rightLabel }) => (
  <label
    htmlFor={id}
    className="font-semibold text-left text-gray-900 cursor-default"
  >
    <div className="flex items-center justify-between">
      <span>{label}</span>
      {rightLabel && rightLabel}
    </div>
    {children}
  </label>
);

const BaseInput: React.VFC<InputProps> = ({ name, id = name, ...props }) => (
  <input
    name={name}
    id={id}
    className="w-full px-3 py-1.5 mx-0 mt-1 text-sm border border-gray-300 rounded-md cursor-text"
    {...props}
  />
);

interface Props extends InputProps {
  label: string;
}

const Input: React.VFC<Props> = ({ name, id = name, label, ...props }) => (
  <label
    htmlFor={id}
    className="block font-semibold text-left text-gray-900 cursor-default"
  >
    <div className="flex items-center justify-between">
      <span>{label}</span>
    </div>

    <input
      name={name}
      id={id}
      className="w-full px-3 py-1.5 mx-0 mt-1 text-sm border border-gray-300 rounded-md cursor-text"
      {...props}
    />
  </label>
);

export { Input, BaseInput, InputLabel };
