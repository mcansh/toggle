import type { Loader } from '@remix-run/data';

function safelyParseJson(input: string) {
  try {
    return JSON.parse(input);
  } catch (error) {
    return undefined;
  }
}

export const loader: Loader = ({ session }) => {
  const flash = session.get('flash');
  const errorDetailsString = session.get('errorDetails');
  const errorDetails = errorDetailsString
    ? safelyParseJson(errorDetailsString)
    : undefined;

  return { flash, errorDetails };
};
