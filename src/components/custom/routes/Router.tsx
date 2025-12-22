import {
    createBrowserRouter,
    RouterProvider,
    Outlet,
    useNavigate
} from "react-router";
import Providers from "@components/custom/providers/Providers";
import BasicNavbar from '@components/custom/ReusableNavbar/BasicNavbar';
import { Container, Typography, Box } from "@mui/material";
import SettingsPage, { ProfileContent } from "@components/pages/SettingsPage";
import StudioHomePage from "@components/pages/StudioHomePage";
import AuthPage from "@components/Auth/AuthPage";
import { useEffect, useState } from "react";
import { useSupabaseStore } from "@store/supabaseStore";
import { supabase } from "@api/supabase";
import EditorPage from "@components/pages/EditorPage";
import FeedPage from "@components/pages/FeedPage";
import ProfilePage from "@components/pages/ProfilePage";


export function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().finally(() => nav('/'));
  }, [nav]);

  return null;
}

const routes = [
    {
        label: "Home",
        path: "/",
        element: <StudioHomePage />
    },
    {
        label: "Image",
        path: "/image/:projectId?",
        element: <EditorPage />
    },
    {
        label: "Editor",
        path: "/editor/:projectId?",
        element: <EditorPage />
    },
    {
        label: "Feed",
        path: "/feed",
        element: <FeedPage />
    },
    {
        label: "Profile",
        path: "/profile",
        element: <ProfilePage />
    },
    {
        label: "Settings",
        path: "/settings",
        element: <ProfileContent profile={{
            id: "1",
            name: "Michael Woodward",
            email: "michael@woodward-studio.com",
            avatar_url: "https://i.pravatar.cc/150?u=1",
            stripe_tier: "free"
        }} setProfile={() => {}} />
    },
    {
        label: "Auth Callback",
        path: "/auth/callback",
        element: <AuthCallback />
    }
];



// Layout.tsx

export default function Layout() {
  const navigate = useNavigate();

  const session = useSupabaseStore((s) => s.session);
  const setSession = useSupabaseStore((s) => s.setSession);
  const setUserType = useSupabaseStore((s) => s.setUserType);

  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data.session as any;
      setSession(s ?? null);
      setUserType(s?.user ? 'admin' : null);
      setHydrating(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession((s as any) ?? null);
      setUserType(s?.user ? 'admin' : null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setUserType]);

  return (
    <Providers>
      {() => {
        if (hydrating) return null; // or a splash loader

        if (!session) {
          return (
            <AuthPage
              onAuthed={() => {
                // after OAuth redirect/callback, session will populate
                navigate('/');
              }}
            />
          );
        }

        return (
          <main>
            <BasicNavbar />
            <Box sx={{ mt: 10 }}>
              <Outlet />
            </Box>
            {/* <Container maxWidth={false} sx={{ mt: 10 }}>
            </Container> */}
          </main>
        );
      }}
    </Providers>
  );
}


export function AppRouter() {
    const appRoutes = [
        {
            path: "/",
            id: "root",
            element: (<Layout />),
            children: routes
        }
    ];
    const appRouter = createBrowserRouter(appRoutes);
    return <RouterProvider router={appRouter} />;
};