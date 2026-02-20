import { useEffect } from 'react';

/**
 * Locks the body scroll while the component using this hook is "open".
 * Restores the original overflow value on cleanup.
 */
export const useScrollLock = (locked: boolean) => {
    useEffect(() => {
        if (!locked) return;

        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = original;
        };
    }, [locked]);
};
