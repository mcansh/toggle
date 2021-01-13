const flashTypes = {
  generic: 'flash',
  errorDetails: 'errorDetails',
  success: 'success',
  error: 'error',
  info: 'info',
} as const;

export type Flash = typeof flashTypes;
export { flashTypes };
