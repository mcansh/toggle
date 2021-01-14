const flashTypes = {
  success: 'success',
  error: 'error',
  errorDetails: 'errorDetails',
  info: 'info',
} as const;

export type Flash = keyof typeof flashTypes;

export { flashTypes };
