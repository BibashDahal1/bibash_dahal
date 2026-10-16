import { useEffect, useState } from "react";
import { getModelPool, type ModelPool } from "@/lib/characterAssets";

/** Which character files exist. Null while that is still being checked. */
export function useModelPool() {
  const [pool, setPool] = useState<ModelPool | null>(null);
  useEffect(() => {
    let cancelled = false;
    getModelPool().then((p) => {
      if (!cancelled) setPool(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return pool;
}
