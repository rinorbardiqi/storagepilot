import { useConnectionStore } from '../store/connectionStore';
import { usePreferencesStore } from '../store/preferencesStore';

/** Remove a storage connection and hide its provider when none remain for that type. */
export function removeConnection(profileId: string): void {
  const conn = useConnectionStore.getState();
  const prefs = usePreferencesStore.getState();
  const target = conn.profiles.find((p) => p.id === profileId);
  if (!target) return;

  conn.removeProfile(profileId);

  const remaining = useConnectionStore.getState().profiles;
  const stillHasType = remaining.some((p) => p.type === target.type);
  if (!stillHasType) {
    prefs.setEnabledProviders(
      prefs.enabledProviders.filter((t) => t !== target.type),
    );
  }
}
