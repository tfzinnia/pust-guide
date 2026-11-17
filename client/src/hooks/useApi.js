import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/auth";
export default function useApi(url) {
  const { user, isGuest } = useAuth();
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({});
  const scope = `${user?.id || (isGuest ? "guest" : "none")}:${url}`;
  const key = `${scope}:${version}`;
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    api
      .get(url, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted)
          setState({
            key,
            scope,
            data: response.data,
            cachedAt: response.headers["x-offline-saved-at"],
          });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            key,
            scope,
            error:
              error.response?.data?.message ||
              "Unable to load this information. Check your connection and try again.",
          });
      });
    return () => controller.abort();
  }, [url, key, scope]);
  return {
    data: state.scope === scope ? state.data : undefined,
    error: state.key === key ? state.error : undefined,
    cachedAt: state.scope === scope ? state.cachedAt : undefined,
    loading: !!url && state.scope !== scope,
    refetch: () => setVersion((value) => value + 1),
  };
}
