import * as Haptics from "expo-haptics";
import { useSettings } from "../state/settingsStore";

function enabled() {
  return useSettings.getState().hapticsEnabled;
}

export function hapticLight() {
  if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMedium() {
  if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticRestOver() {
  if (!enabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
