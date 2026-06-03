import { useAppStore } from '../store/appStore';
import { useModalStore } from '../store/modalStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useSelectionStore } from '../store/selectionStore';
import { useUiStore } from '../store/uiStore';

/** End the local session and return to onboarding. */
export function logout(): void {
  useModalStore.getState().closeAll();
  useSelectionStore.getState().clearSelection();

  useAppStore.getState().setCurrentBucket(null);
  useAppStore.getState().resetFilters();

  const ui = useUiStore.getState();
  ui.closeDetail();
  ui.closeBucketDetail();
  ui.closePropertiesPanel();
  ui.setNotFound(false, null);
  ui.setSessionConnectionLost(false);
  ui.setAppSection('explorer');
  ui.setActivityDrawerOpen(false);

  usePreferencesStore.getState().resetOnboarding();
}
