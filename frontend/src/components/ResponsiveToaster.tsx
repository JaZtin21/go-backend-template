import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

export function ResponsiveToaster() {
    const [position, setPosition] = useState<"top-center" | "bottom-right">("top-center");

    useEffect(() => {
        const media = window.matchMedia('(max-width: 767px)');

        // Set initial position
        setPosition(media.matches ? "top-center" : "bottom-right");

        // Update position on window resize
        const listener = (e: MediaQueryListEvent) => {
            setPosition(e.matches ? "top-center" : "bottom-right");
        };

        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    return (
        <Toaster
            position={position}
            duration={2000}
            toastOptions={{
                classNames: {
                    toast: 'toast !bg-bg-primary !text-text-main ',
                    title: '!text-text-main',
                    icon: '!text-brand-gold !fill-brand-gold !stroke-text-white !color-brand-gold',
                    description: '!text-text-main',
                    actionButton: 'action-button',
                    cancelButton: 'cancel-button',
                    closeButton: 'close-button',
                },
            }}
        />
    );
}
