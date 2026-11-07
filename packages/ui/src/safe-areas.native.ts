// Keeps Uniwind's safe-area utilities, like `pt-safe`, in step with the device. `integrations/metro.cjs` runs
// this before the app starts, as the wrapper has to be set by then, so that apps need no setup.
import { createElement, type ReactNode } from "react";
import { AppRegistry } from "react-native";
import { initialWindowMetrics, SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";

// Right from the first frame. The listener then follows rotation and the like.
if (initialWindowMetrics) Uniwind.updateInsets(initialWindowMetrics.insets);

function SafeAreas({ children }: { children: ReactNode }) {
  return createElement(SafeAreaListener, { onChange: ({ insets }) => Uniwind.updateInsets(insets) }, children);
}

AppRegistry.setWrapperComponentProvider(() => SafeAreas);
