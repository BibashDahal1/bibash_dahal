import { useCallback, useEffect, useState } from "react";

export function usePointerLock() {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const onChange = () => setLocked(document.pointerLockElement != null);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  const lock = useCallback(() => {
    document.body.requestPointerLock?.();
  }, []);

  return { locked, lock };
}
