'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
import { productSchema } from '@/lib/validation';

const formSchema = z.object({
    name: z.string().min(3, 'At least 3 characters'),
    description: z.string().min(1, 'Description is required'),
    price: z.coerce.number({ invalid_type_error: 'Price is required' }).positive('Must be greater than 0'),
    stock: z.coerce.number({ invalid_type_error: 'Stock is required' }).int('Must be a whole number').min(0, 'Cannot be negative'),
    categoryId: z.string().min(1, 'Category is required'),
    image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    status: z.enum(['active', 'inactive']),
});

type FormValues = z.input<typeof formSchema>;

type Props = {
    categories: { id: string; name: string }[];
    initial?: {
        id: string;
        name: string;
        description: string;
        price: number;
        stock: number;
        categoryId: string;
        image: string | null;
        status: 'active' | 'inactive';
    };
};

export function ProductForm({ categories, initial }: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const [pending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        setError,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initial
            ? {
                name: initial.name,
                description: initial.description,
                price: initial.price,
                stock: initial.stock,
                categoryId: initial.categoryId,
                image: initial.image ?? '',
                status: initial.status,
            }
            : { status: 'active', name: '', description: '', categoryId: categories[0]?.id ?? '', image: '' },
    });

    const status = watch('status');
    const categoryId = watch('categoryId');

    const onSubmit = (values: FormValues) => {
        setServerError(null);
        startTransition(async () => {
            const parsed = productSchema.safeParse(values);
            if (!parsed.success) {
                for (const [field, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
                    setError(field as keyof FormValues, { message: msgs?.[0] });
                }
                return;
            }

            const { createProductAction, updateProductAction } = await import('@/app/actions/products');
            const res = initial
                ? await updateProductAction(initial.id, parsed.data)
                : await createProductAction(parsed.data);

            if (!res.ok) {
                setServerError(res.error);
                if ('fieldErrors' in res && res.fieldErrors) {
                    for (const [field, msgs] of Object.entries(res.fieldErrors)) {
                        setError(field as keyof FormValues, { message: msgs?.[0] });
                    }
                }
                toast({ title: 'Save failed', description: res.error, variant: 'destructive' });
                return;
            }

            toast({ title: initial ? 'Product updated' : 'Product created', variant: 'success' });
            router.push('/products');
            router.refresh();
        });
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2" noValidate>
                    <Field className="sm:col-span-2" label="Name" htmlFor="name" error={errors.name?.message}>
                        <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
                    </Field>

                    <Field className="sm:col-span-2" label="Description" htmlFor="description" error={errors.description?.message}>
                        <textarea
                            id="description"
                            rows={4}
                            {...register('description')}
                            aria-invalid={!!errors.description}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </Field>

                    <Field label="Price ($)" htmlFor="price" error={errors.price?.message}>
                        <Input id="price" type="number" step="0.01" min="0" {...register('price')} aria-invalid={!!errors.price} />
                    </Field>

                    <Field label="Stock" htmlFor="stock" error={errors.stock?.message}>
                        <Input id="stock" type="number" min="0" step="1" {...register('stock')} aria-invalid={!!errors.stock} />
                    </Field>

                    <Field label="Category" error={errors.categoryId?.message}>
                        <Select value={categoryId} onValueChange={(v) => setValue('categoryId', v, { shouldValidate: true })}>
                            <SelectTrigger aria-label="Category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Status" error={errors.status?.message}>
                        <Select value={status} onValueChange={(v) => setValue('status', v as 'active' | 'inactive')}>
                            <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field className="sm:col-span-2" label="Image URL (optional)" htmlFor="image" error={errors.image?.message}>
                        <Input id="image" type="url" placeholder="https://example.com/image.jpg" {...register('image')} aria-invalid={!!errors.image} />
                    </Field>

                    {serverError && (
                        <p role="alert" className="sm:col-span-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            {serverError}
                        </p>
                    )}

                    <div className="sm:col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>Cancel</Button>
                        <Button type="submit" disabled={pending}>
                            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {initial ? 'Save changes' : 'Create product'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function Field({
    label, htmlFor, error, children, className,
}: { label: string; htmlFor?: string; error?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`space-y-2 ${className ?? ''}`}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
    );
}