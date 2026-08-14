export const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();

export const secondsAgo = (seconds: number): string =>
  new Date(Date.now() - seconds * 1_000).toISOString();

export const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * 3_600_000).toISOString();
