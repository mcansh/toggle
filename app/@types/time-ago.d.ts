declare module 'time-ago' {
  function ago(input: Date | number | string, short?: boolean): string;
  function today(): string;
  function timefriendly(input: string): number;
  function mintoread(text: string, altComment?: string, wpm?: number): string;

  export { ago, today, timefriendly, mintoread };
}
