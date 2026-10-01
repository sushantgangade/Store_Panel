import { PrismaClient, Role, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const products = [
    { name: 'Margherita Pizza', description: 'Classic Italian pizza with tomato and mozzarella', price: 12, stock: 20, category: 'Food', status: ProductStatus.active },
    { name: 'Classic Burger', description: 'Beef burger with lettuce and tomato', price: 10, stock: 15, category: 'Food', status: ProductStatus.active },
    { name: 'Coca Cola', description: '330ml Coca Cola', price: 3, stock: 50, category: 'Drink', status: ProductStatus.inactive },
    { name: 'Pepperoni Pizza', description: 'Pizza with pepperoni and cheese', price: 14, stock: 18, category: 'Food', status: ProductStatus.active },
    { name: 'Veggie Pizza', description: 'Fresh vegetables on tomato base', price: 13, stock: 12, category: 'Food', status: ProductStatus.active },
    { name: 'Cheeseburger', description: 'Double cheese beef burger', price: 11, stock: 22, category: 'Food', status: ProductStatus.active },
    { name: 'French Fries', description: 'Crispy golden fries', price: 4, stock: 100, category: 'Food', status: ProductStatus.active },
    { name: 'Chicken Wings', description: 'Spicy grilled chicken wings', price: 9, stock: 30, category: 'Food', status: ProductStatus.active },
    { name: 'Orange Juice', description: 'Freshly squeezed orange juice', price: 4, stock: 40, category: 'Drink', status: ProductStatus.active },
    { name: 'Iced Latte', description: 'Cold espresso with milk', price: 5, stock: 25, category: 'Drink', status: ProductStatus.active },
    { name: 'Green Tea', description: 'Hot Japanese green tea', price: 3, stock: 60, category: 'Drink', status: ProductStatus.active },
    { name: 'Sparkling Water', description: '500ml sparkling mineral water', price: 2, stock: 80, category: 'Drink', status: ProductStatus.inactive },
    { name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 7, stock: 10, category: 'Dessert', status: ProductStatus.active },
    { name: 'Cheesecake', description: 'New York style cheesecake', price: 8, stock: 8, category: 'Dessert', status: ProductStatus.active },
    { name: 'Ice Cream Vanilla', description: 'Vanilla bean ice cream', price: 5, stock: 35, category: 'Dessert', status: ProductStatus.active },
    { name: 'Tiramisu', description: 'Italian coffee dessert', price: 9, stock: 6, category: 'Dessert', status: ProductStatus.inactive },
    { name: 'Apple Pie', description: 'Warm apple pie slice', price: 6, stock: 14, category: 'Dessert', status: ProductStatus.active },
    { name: 'Caesar Salad', description: 'Romaine with caesar dressing', price: 8, stock: 20, category: 'Food', status: ProductStatus.active },
    { name: 'Sushi Platter', description: 'Assorted fresh sushi', price: 18, stock: 5, category: 'Food', status: ProductStatus.active },
    { name: 'Milkshake', description: 'Strawberry milkshake', price: 6, stock: 30, category: 'Drink', status: ProductStatus.active },
    { name: 'Brownie', description: 'Fudgy chocolate brownie', price: 4, stock: 45, category: 'Dessert', status: ProductStatus.active },
    { name: 'Nachos', description: 'Tortilla chips with cheese dip', price: 7, stock: 25, category: 'Food', status: ProductStatus.active },
    { name: 'Mojito', description: 'Refreshing mint mocktail', price: 6, stock: 20, category: 'Drink', status: ProductStatus.inactive },
    { name: 'Donut', description: 'Glazed donut', price: 3, stock: 55, category: 'Dessert', status: ProductStatus.active },
    { name: 'Hot Dog', description: 'Classic hot dog with mustard', price: 5, stock: 40, category: 'Food', status: ProductStatus.active },
];

async function main() {
    console.log('🌱 Seeding database...');

    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const managerHash = await bcrypt.hash('Manager123!', 10);

    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: { email: 'admin@example.com', name: 'Admin User', password: passwordHash, role: Role.ADMIN },
    });

    await prisma.user.upsert({
        where: { email: 'manager@example.com' },
        update: {},
        create: { email: 'manager@example.com', name: 'Manager User', password: managerHash, role: Role.MANAGER },
    });

    const categoryNames = ['Food', 'Drink', 'Dessert', 'Other'];
    const categories: Record<string, string> = {};
    for (const name of categoryNames) {
        const c = await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        categories[name] = c.id;
    }

    await prisma.product.deleteMany();
    for (const p of products) {
        await prisma.product.create({
            data: {
                name: p.name,
                description: p.description,
                price: p.price,
                stock: p.stock,
                status: p.status,
                categoryId: categories[p.category],
                image: `https://picsum.photos/seed/${encodeURIComponent(p.name)}/400/300`,
            },
        });
    }

    console.log(`✅ Seeded ${products.length} products and 2 users`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });