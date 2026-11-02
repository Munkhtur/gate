import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Locale-aware auth gate. ssr:false because the session lives in browser storage.
export const Route = createFileRoute("/$lang/_authenticated")({
  ssr: false,
  beforeLoad: async ({ params, location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/$lang/auth", params: { lang: params.lang }, search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
