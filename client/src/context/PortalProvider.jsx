import { useEffect, useCallback, useState } from "react";
import { useAuth } from "./auth";
import { PortalContext } from "./portal";
import api from "../api/axios";
export default function PortalProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({});
  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [notifications, saved] = await Promise.all([
        api.get("/portal/notifications"),
        api.get("/portal/saved"),
      ]);
      setState({
        userId: user.id,
        notifications: notifications.data,
        saved: saved.data,
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error:
          error.response?.data?.message ||
          "Unable to load notifications and saved items.",
      }));
    }
  }, [user]);
  useEffect(() => {
    let active = true;
    if (user)
      Promise.resolve().then(() => {
        if (active) refresh();
      });
    const interval = setInterval(refresh, 30000);
    window.addEventListener("pust:portal-update", refresh);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("pust:portal-update", refresh);
    };
  }, [user, refresh]);
  const saved = state.userId === user?.id ? state.saved || [] : [];
  async function toggleSaved(kind, id) {
    if (saved.some((item) => item.kind === kind && item.id === id))
      await api.delete(`/portal/saved/${kind}/${id}`);
    else await api.put(`/portal/saved/${kind}/${id}`);
    await refresh();
  }
  async function markRead(id) {
    await api.patch("/portal/notifications/read", id ? { id } : {});
    await refresh();
  }
  return (
    <PortalContext.Provider
      value={{
        saved,
        notifications:
          state.userId === user?.id ? state.notifications?.items || [] : [],
        unread:
          state.userId === user?.id ? state.notifications?.unread || 0 : 0,
        error: state.error,
        loading: !!user && state.userId !== user.id,
        toggleSaved,
        markRead,
        refresh,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}
