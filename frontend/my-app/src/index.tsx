import ReactDOM from "react-dom/client";
import App from "./App";

// Suppress outdated JSX transform warning from third-party dependencies
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  // Filter out the outdated JSX transform warning
  if (message.includes('outdated JSX transform') || message.includes('new-jsx-transform')) {
    return;
  }
  originalWarn.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
