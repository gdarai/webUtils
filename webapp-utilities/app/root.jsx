import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import "./tailwind.css";
import { HeroUIProvider } from "@heroui/react";

export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <HeroUIProvider>
          <main className="light text-foreground bg-background">
            {children}
            <ScrollRestoration />
            <Scripts />
          </main>
        </HeroUIProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
