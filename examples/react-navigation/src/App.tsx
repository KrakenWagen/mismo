import { Navigation } from "./navigation/routes";

// The shared routes, as navigators; their URLs open the app at `acme://`.
export default function App() {
  return <Navigation linking={{ prefixes: ["acme://"] }} />;
}
