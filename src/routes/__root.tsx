import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { FocusModeProvider, FocusTimerWidget } from "@/components/FocusMode";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Orchids EduAssist" },
      { name: "description", content: "This is a chatbot for CBSE students of all grades to get their questions answered perfectly and clearly." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Orchids EduAssist" },
      { property: "og:description", content: "This is a chatbot for CBSE students of all grades to get their questions answered perfectly and clearly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Orchids EduAssist" },
      { name: "twitter:description", content: "This is a chatbot for CBSE students of all grades to get their questions answered perfectly and clearly." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/Wbyb5ltc9ecfx1tEVJcd0lmrBnv2/social-images/social-1778651179167-EduAssist.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/Wbyb5ltc9ecfx1tEVJcd0lmrBnv2/social-images/social-1778651179167-EduAssist.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap",
      },
      { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const PORTAL_ROUTES = [
    "/chat", "/dashboard", "/quiz", "/flashcards", "/revision", "/planner",
    "/settings", "/weekly-quiz", "/teacher", "/admin", "/parent",
    "/parent-chat", "/parent-dashboard", "/homework", "/leaderboard", "/achievements",
  ];
  const showSidebar = PORTAL_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));

  // Timer only visible on student-facing pages
  const STUDENT_ROUTES = [
    "/dashboard", "/chat", "/quiz", "/flashcards", "/revision", "/planner",
    "/homework", "/exam-mode", "/achievements",
  ];
  const showTimer = STUDENT_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <FocusModeProvider>
            <SidebarProvider defaultOpen={false}>
              <div className="flex min-h-screen w-full">
                {showSidebar && <AppSidebar />}
                <div className="relative flex-1">
                  {showSidebar && (
                    <SidebarTrigger className="fixed left-2 top-2 z-50 rounded-md border border-border bg-background/80 backdrop-blur" />
                  )}
                  {showTimer && (
                    <div className="fixed right-3 top-3 z-50">
                      <FocusTimerWidget />
                    </div>
                  )}
                  <Outlet />
                </div>
              </div>
            </SidebarProvider>
          </FocusModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
