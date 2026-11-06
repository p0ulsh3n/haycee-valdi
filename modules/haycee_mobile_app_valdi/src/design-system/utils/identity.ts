/** Maximum username length shared by buyer and seller identity flows. */
export const USERNAME_MAX_LENGTH = 30;

/** Returns a trimmed username without an @ prefix, capped to the shared limit. */
export const normalizeUsername = (value: string): string => {
  const username = value.trim().replace(/^@+/, '');
  return Array.from(username).slice(0, USERNAME_MAX_LENGTH).join('');
};
