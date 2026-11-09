import type { NavigationController } from 'valdi_navigation/src/NavigationController';

const NAVIGATION_TAP_GUARD_MS = 650;
let navigationActionPending = false;

/**
 * Prevents rapid repeated taps from stacking multiple pages or sheets while a
 * native navigation transition is starting. The gate is application-wide so a
 * new page's controller cannot race a tap already dispatched by the prior page.
 */
export function runNavigationAction(
  navigationController: NavigationController | undefined,
  action: () => void,
): boolean {
  if (!navigationController || navigationActionPending) return false;

  navigationActionPending = true;
  try {
    action();
  } catch (error) {
    navigationActionPending = false;
    throw error;
  }

  setTimeout(() => {
    navigationActionPending = false;
  }, NAVIGATION_TAP_GUARD_MS);
  return true;
}
