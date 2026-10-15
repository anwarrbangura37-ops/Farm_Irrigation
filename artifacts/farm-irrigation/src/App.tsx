import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, Redirect, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Shell } from '@/components/Shell';
import { Landing } from '@/pages/Landing';
import { Dashboard } from '@/pages/DashboardOverview';
import { Plots } from '@/pages/Plots';
import { PlotTwin } from '@/pages/PlotTwin';
import { Alerts } from '@/pages/Alerts';
import { Reports } from '@/pages/Reports';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#244a37',
    colorForeground: '#294333',
    colorMutedForeground: '#718075',
    colorDanger: '#a34832',
    colorBackground: '#fbf9f2',
    colorInput: '#f6f3e9',
    colorInputForeground: '#294333',
    colorNeutral: '#ded8c9',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.85rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbf9f2] rounded-[24px] w-[440px] max-w-full overflow-hidden border border-[#e5dece] shadow-[0_18px_55px_rgba(42,59,42,.10)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#244a37] font-bold tracking-[-.04em]',
    headerSubtitle: 'text-[#718075]',
    socialButtonsBlockButtonText: 'text-[#294333] font-semibold',
    formFieldLabel: 'text-[#435c49] font-semibold',
    footerActionLink: 'text-[#31583d] font-semibold',
    footerActionText: 'text-[#718075]',
    dividerText: 'text-[#819083]',
    identityPreviewEditButton: 'text-[#31583d]',
    formFieldSuccessText: 'text-[#3e7549]',
    alertText: 'text-[#8c432f]',
    logoBox: 'mb-2',
    logoImage: 'rounded-lg',
    socialButtonsBlockButton: 'border-[#ded8c9] bg-[#f8f6ee] hover:bg-[#efede3]',
    formButtonPrimary: 'bg-[#244a37] hover:bg-[#193b2b] text-white',
    formFieldInput: 'border-[#ddd7c9] bg-[#f7f5ec] text-[#294333]',
    footerAction: 'text-[#718075]',
    dividerLine: 'bg-[#e5dfd2]',
    alert: 'bg-[#fbf0e9] border-[#ead0c4]',
    otpCodeFieldInput: 'border-[#ddd7c9] bg-[#f7f5ec]',
    formFieldRow: 'mb-4',
    main: 'px-6 py-5',
  },
};

function CacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) {
        client.clear();
      }
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);

  return null;
}

function HomeRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) {
    return <Redirect to="/dashboard" />;
  }
  return <Landing />;
}

function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return <div className="min-h-[100dvh] bg-[#f4f0e5] p-6"><div className="mx-auto mt-20 h-44 max-w-3xl animate-pulse rounded-2xl bg-[#e9e3d5]" /></div>;
  }
  if (!isSignedIn) {
    return <Redirect to="/" />;
  }
  return <Shell>{children}</Shell>;
}

function ProtectedDashboard() {
  return <Protected><Dashboard /></Protected>;
}

function ProtectedPlots() {
  return <Protected><Plots /></Protected>;
}

function ProtectedTwin() {
  return <Protected><PlotTwin /></Protected>;
}

function ProtectedAlerts() {
  return <Protected><Alerts /></Protected>;
}

function ProtectedReports() {
  return <Protected><Reports /></Protected>;
}

function SignInRoute() {
  return <div data-testid="page-sign-in" className="grain flex min-h-[100dvh] items-center justify-center bg-[#f4f0e5] px-4 py-10"><div className="relative z-10 w-full max-w-[440px]"><div className="mb-6 text-center"><p className="font-display text-2xl font-extrabold tracking-[-.06em] text-[#244a37]">Welcome back to the field.</p><p className="mt-2 text-sm text-[#718075]">Your farm’s latest readings are waiting.</p></div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div></div>;
}

function SignUpRoute() {
  return <div data-testid="page-sign-up" className="grain flex min-h-[100dvh] items-center justify-center bg-[#f4f0e5] px-4 py-10"><div className="relative z-10 w-full max-w-[440px]"><div className="mb-6 text-center"><p className="font-display text-2xl font-extrabold tracking-[-.06em] text-[#244a37]">Grow with better signals.</p><p className="mt-2 text-sm text-[#718075]">Create your Farm-Irrigation field account.</p></div><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div></div>;
}

function AppRoutes() {
  return <ErrorBoundary resetKey={window.location.pathname}>
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/sign-in/*?" component={SignInRoute} />
      <Route path="/sign-up/*?" component={SignUpRoute} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/plots" component={ProtectedPlots} />
      <Route path="/plots/:plotId" component={ProtectedTwin} />
      <Route path="/alerts" component={ProtectedAlerts} />
      <Route path="/reports" component={ProtectedReports} />
      <Route component={NotFound} />
    </Switch>
  </ErrorBoundary>;
}

function ClerkRouter() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      socialButtonsBlockButton: 'Continue with {{provider}}',
      signIn: {
        start: {
          title: 'Welcome back',
          subtitle: 'Sign in to see what your farm needs today.',
        },
      },
      signUp: {
        start: {
          title: 'Join the field team',
          subtitle: 'Create an account for your farm.',
        },
      },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <CacheInvalidator />
    <AppRoutes />
  </ClerkProvider>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkRouter />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>;
}

export default App;
