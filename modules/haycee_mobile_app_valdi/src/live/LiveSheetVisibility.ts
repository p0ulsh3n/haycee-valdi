type LiveSheetVisibilityListener = (hasOpenSheet: boolean) => void;

let activeLiveSheetCount = 0;
const listeners = new Set<LiveSheetVisibilityListener>();

export const hasOpenLiveSheet = (): boolean => activeLiveSheetCount > 0;

export const observeLiveSheetVisibility = (listener: LiveSheetVisibilityListener): (() => void) => {
  listeners.add(listener);
  listener(hasOpenLiveSheet());
  return () => listeners.delete(listener);
};

/** Register a Live modal page and release it from that page's onDestroy. */
export const registerLiveSheet = (): (() => void) => {
  activeLiveSheetCount += 1;
  notifyListeners();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeLiveSheetCount = Math.max(0, activeLiveSheetCount - 1);
    notifyListeners();
  };
};

const notifyListeners = (): void => {
  const hasOpenSheet = hasOpenLiveSheet();
  listeners.forEach(listener => listener(hasOpenSheet));
};
