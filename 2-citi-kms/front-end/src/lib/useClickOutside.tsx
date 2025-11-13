import { useEffect, RefObject } from "react";

function useClickOutside<T extends HTMLElement>(
  callback: () => void,
  ...refs: RefObject<T>[]
): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        refs.every(
          (ref) => ref.current && !ref.current.contains(event.target as Node)
        )
      ) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [refs, callback]);
}

export default useClickOutside;
