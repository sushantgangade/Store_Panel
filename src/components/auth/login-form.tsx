'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';

const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const callbackUrl = params.get('callbackUrl') || '/dashboard';
    const { toast } = useToast();
    const [pending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: 'admin@example.com', password: 'Admin123!' },
    });

    const onSubmit = (values: FormValues) => {
        setServerError(null);
        startTransition(async () => {
            const res = await signIn('credentials', {
                ...values,
                redirect: false,
            });
            if (res?.error) {
                setServerError('Invalid email or password');
                toast({ title: 'Login failed', description: 'Invalid email or password', variant: 'destructive' });
                return;
            }
            toast({ title: 'Welcome back!', variant: 'success' });
            router.push(callbackUrl);
            router.refresh();
        });
    };

    const busy = isSubmitting || pending;

    return (
        <Card className="shadow-lg">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="admin@example.com"
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? 'email-error' : undefined}
                            {...register('email')}
                        />
                        {errors.email && <p id="email-error" role="alert" className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? 'password-error' : undefined}
                            {...register('password')}
                        />
                        {errors.password && <p id="password-error" role="alert" className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>

                    {serverError && (
                        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                            {serverError}
                        </p>
                    )}

                    <Button type="submit" className="w-full" disabled={busy}>
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        {busy ? 'Signing in…' : 'Sign in'}
                    </Button>

                    {/* <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">Demo accounts</p>
                        <p>Admin: admin@example.com / Admin123!</p>
                        <p>Manager: manager@example.com / Manager123!</p>
                    </div> */}
                </form>
            </CardContent>
        </Card>
    );
}