import React, { useEffect } from "react";

export const useOutsideClick = <T extends HTMLElement = HTMLDivElement>(
  ref: React.RefObject<T>,
  callback: Function
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // DO NOTHING if the element being clicked is the target element or their children
      const target = event.target as Node;
      if (!ref.current || ref.current.contains(target)) {
        return;
      }
      callback(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};
