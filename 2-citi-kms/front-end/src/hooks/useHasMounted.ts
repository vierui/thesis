import { useEffect, useState } from "react";

/**
 * Custom hook to detect if component has mounted on client-side.
 * Returns false during SSR and initial render, true after hydration.
 * Used to prevent hydration mismatches with components that use useId().
 */
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
