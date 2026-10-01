'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'destructive' | 'success';
type Toast = { id: number; title: string; description?: string; variant?: ToastVariant };

type ToastContextValue = {
    toasts: Toast[];
    toast: (t: Omit<Toast, 'id'>) => void;
    dismiss: (id: number) => void;
};

const ToastCtx = React.createContext<ToastContextValue | null>(null);

/** Provider — must wrap the app. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const dismiss = React.useCallback((id: number) => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
    }, []);

    const toast = React.useCallback((t: Omit<Toast, 'id'>) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { ...t, id }]);
        setTimeout(() => dismiss(id), 4500);
    }, [dismiss]);

    const value = React.useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

    return (
        <ToastCtx.Provider value={value}>
            <ToastPrimitives.Provider swipeDirection="right">
                {children}
                <ToastViewport />
            </ToastPrimitives.Provider>
        </ToastCtx.Provider>
    );
}

/** Hook — safe to call anywhere below <ToastProvider>. */
export function useToast() {
    const ctx = React.useContext(ToastCtx);
    if (!ctx) {
        // In dev, throw to catch misconfiguration; in prod, no-op to avoid crashing.
        if (process.env.NODE_ENV !== 'production') {
            throw new Error('useToast must be used inside <ToastProvider />');
        }
        return { toasts: [], toast: () => { }, dismiss: () => { } };
    }
    return ctx;
}

/** Internal — rendered by ToastProvider. */
function ToastViewport() {
    const { toasts, dismiss } = React.useContext(ToastCtx)!;

    return (
        <>
            <ToastPrimitives.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-sm" />
            {toasts.map((t) => (
                <ToastPrimitives.Root
                    key={t.id}
                    open
                    onOpenChange={(open) => {
                        if (!open) dismiss(t.id);
                    }}
                    className={cn(
                        'fixed bottom-4 right-4 z-[100] flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
                        t.variant === 'destructive' &&
                        'border-destructive bg-destructive text-destructive-foreground',
                        t.variant === 'success' && 'border-emerald-500 bg-emerald-500 text-white',
                        (!t.variant || t.variant === 'default') &&
                        'border-border bg-card text-card-foreground'
                    )}
                >
                    <div className="flex-1">
                        <ToastPrimitives.Title className="text-sm font-semibold">
                            {t.title}
                        </ToastPrimitives.Title>
                        {t.description && (
                            <ToastPrimitives.Description className="mt-1 text-sm opacity-90">
                                {t.description}
                            </ToastPrimitives.Description>
                        )}
                    </div>
                    <ToastPrimitives.Close
                        aria-label="Close"
                        className="rounded p-1 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <X className="h-4 w-4" />
                    </ToastPrimitives.Close>
                </ToastPrimitives.Root>
            ))}
        </>
    );
}