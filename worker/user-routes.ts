import { Hono } from "hono";
import type { Env } from './core-utils';
import { ProductEntity, SaleEntity, CustomerEntity, GoalEntity, ReportEntity, SettingsEntity, AuditLogEntity, DonationEntity } from "./entities";
import { ok, bad, notFound, Index } from './core-utils';
import { Customer, Sale, Product, Goal, Report, AuditLog, Settings, Donation } from "@shared/types";
import { MiddlewareHandler } from "hono";
import { getYear, setYear } from 'date-fns';
const initialSalesData = [
    { name: "Jonathan Charrier", date: "2015-10-06", total: 48.80, quantity: 2, source: "Inconnu" },
    { name: "ANDREE MILLOT", date: "2015-09-26", total: 70.00, quantity: 3, source: "Inconnu" },
    { name: "Anouk Baeckelandt", date: "2015-09-19", total: 62.20, quantity: 3, source: "Ecosia.org" },
    { name: "SOPHIE REMY", date: "2015-09-16", total: 45.40, quantity: 2, source: "Bing.com" },
    { name: "Laurent HARTICHABALET", date: "2015-08-02", total: 27.20, quantity: 1, source: "Yahoo" },
    { name: "Alain Bastard", date: "2015-07-14", total: 71.70, quantity: 2, source: "Direct" },
    { name: "Giuseppe Campo", date: "2015-07-14", total: 61.80, quantity: 2, source: "Direct" },
    { name: "Joseph Mangiavillano", date: "2015-07-05", total: 74.90, quantity: 3, source: "Direct" },
    { name: "John Doe", date: "2015-06-29", total: 100.00, quantity: 3, source: "Inconnu" },
    { name: "Jesse GIORGI", date: "2015-06-13", total: 74.90, quantity: 3, source: "Direct" },
    { name: "mahmoud nasereddine", date: "2015-06-05", total: 73.00, quantity: 3, source: "Office.net" },
    { name: "Olivier Kumer", date: "2015-05-30", total: 74.90, quantity: 3, source: "Google" },
    { name: "Benoit Richet", date: "2015-05-10", total: 74.90, quantity: 3, source: "Google" },
    { name: "Carline Kumer", date: "2015-05-03", total: 74.90, quantity: 3, source: "Google" },
    { name: "Giuseppe Campo", date: "2015-05-01", total: 61.80, quantity: 2, source: "Direct" },
    { name: "Louis PROTON", date: "2015-04-25", total: 39.80, quantity: 1, source: "Direct" },
];
const initialProductData: Omit<Product, 'id' | 'createdAt' | 'stockChezMoi' | 'stockAmazon'>[] = [
    { sku: 'FGS-LION-SITE', name: 'Gummies Lion\'s Mane Site', initialStock: 500, purchasePrice: 8.50, salePrice: 29.90 },
    { sku: 'FGS-LION-AMZ', name: 'Gummies Lion\'s Mane AMAZON', initialStock: 500, purchasePrice: 8.50, salePrice: 32.90 },
];
let seedDataPromise: Promise<void> | null = null;
let migrationPromise: Promise<void> | null = null;
async function runDataMigration(env: Env) {
    const settingsEntity = new SettingsEntity(env, 'global');
    const settings = await settingsEntity.getState();
    if (settings.dataMigration2015To2025Done) {
        return;
    }
    console.log("Running data migration: 2015 -> 2025...");
    // Migrate Sales
    const { items: allSales } = await SaleEntity.list(env);
    const salesToMigrate = allSales.filter(s => getYear(new Date(s.saleDate)) === 2015);
    for (const sale of salesToMigrate) {
        const saleEntity = new SaleEntity(env, sale.id);
        const newDate = setYear(new Date(sale.saleDate), 2025);
        await saleEntity.patch({ saleDate: newDate.toISOString() });
    }
    console.log(`Migrated ${salesToMigrate.length} sales records.`);
    // Migrate Goals
    const { items: allGoals } = await GoalEntity.list(env);
    const goalsToMigrate = allGoals.filter(g => g.year === 2015);
    for (const goal of goalsToMigrate) {
        // Delete old goal entity by its ID (e.g., "2015-10")
        await GoalEntity.delete(env, goal.id);
        // Create a new goal with the updated year and ID
        const newGoal: Goal = {
            ...goal,
            year: 2025,
            id: `2025-${String(goal.month).padStart(2, '0')}`,
        };
        await GoalEntity.create(env, newGoal);
    }
    console.log(`Migrated ${goalsToMigrate.length} goal records.`);
    // Set flag to prevent re-running
    await settingsEntity.mutate(s => ({ ...s, dataMigration2015To2025Done: true }));
    console.log("Data migration complete.");
}
async function seedData(env: Env) {
    const { items: existingSales } = await SaleEntity.list(env, null, 1);
    if (existingSales.length > 0) {
        return;
    }
    console.log("Seeding initial data...");
    const productMap = new Map<string, Product>();
    const { items: existingProducts } = await ProductEntity.list(env);
    if (existingProducts.length === 0) {
        for (const prodData of initialProductData) {
            let stockChezMoi = 0;
            let stockAmazon = 0;
            if (prodData.sku.includes('AMZ')) {
                stockAmazon = prodData.initialStock;
            } else {
                stockChezMoi = prodData.initialStock;
            }
            const product: Product = { ...prodData, id: prodData.sku, stockChezMoi, stockAmazon, createdAt: new Date().toISOString() };
            await ProductEntity.create(env, product);
            productMap.set(product.sku, product);
        }
    } else {
        existingProducts.forEach(p => productMap.set(p.sku, p));
    }
    const customerMap = new Map<string, string>();
    for (const saleData of initialSalesData) {
        let customerId = customerMap.get(saleData.name);
        if (!customerId) {
            const newCustomer: Customer = { id: crypto.randomUUID(), name: saleData.name, source: saleData.source, createdAt: new Date().toISOString() };
            await CustomerEntity.create(env, newCustomer);
            customerId = newCustomer.id;
            customerMap.set(saleData.name, customerId);
        }
        const productId = 'FGS-LION-SITE';
        const product = productMap.get(productId);
        const costOfSale = product ? product.purchasePrice * saleData.quantity : 0;
        const sale: Sale = {
            id: crypto.randomUUID(),
            customerId,
            productId,
            quantity: saleData.quantity,
            totalPrice: saleData.total,
            source: saleData.source,
            saleDate: new Date(saleData.date).toISOString(),
            channel: 'site',
            costOfSale,
            promoCode: '',
        };
        await SaleEntity.create(env, sale);
        const productEntity = new ProductEntity(env, sale.productId);
        if (await productEntity.exists()) {
            await productEntity.mutate(p => ({ ...p, stockChezMoi: p.stockChezMoi - sale.quantity }));
        }
    }
    console.log("Seeding complete.");
}
const startupMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
    if (!seedDataPromise) {
        seedDataPromise = seedData(c.env).catch(err => {
            console.error("Seeding failed:", err);
            seedDataPromise = null;
            throw new Error("Failed to initialize application data.");
        });
    }
    await seedDataPromise;
    if (!migrationPromise) {
        migrationPromise = runDataMigration(c.env).catch(err => {
            console.error("Migration failed:", err);
            migrationPromise = null;
            throw new Error("Failed to run data migration.");
        });
    }
    await migrationPromise;
    await next();
};
const authMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const token = authHeader.split(' ')[1];
    if (token !== 'fungicount-secret-token') {
        return c.json({ success: false, error: 'Invalid token' }, 401);
    }
    await next();
};
const apiKeyMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
    const apiKey = c.req.header('X-API-KEY');
    if (!apiKey) {
        return c.json({ success: false, error: 'API key is missing' }, 401);
    }
    const settingsEntity = new SettingsEntity(c.env, 'global');
    const settings = await settingsEntity.getState();
    if (!settings.apiKey || apiKey !== settings.apiKey) {
        return c.json({ success: false, error: 'Invalid API key' }, 403);
    }
    await next();
};
async function logAuditEvent(env: Env, log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    await AuditLogEntity.create(env, { ...log, id, timestamp });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.post('/api/login', async (c) => {
        const { email, password } = await c.req.json();
        if (email === 'admin@fungicount.com' && password === 'password') {
            return ok(c, { token: 'fungicount-secret-token' });
        }
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
    });
    const protectedRoutes = new Hono<{ Bindings: Env }>();
    protectedRoutes.use('*', authMiddleware);
    protectedRoutes.use('*', startupMiddleware);
    // PRODUCTS
    protectedRoutes.get('/products', async (c) => ok(c, await ProductEntity.list(c.env)));
    protectedRoutes.post('/products', async (c) => {
        const body = await c.req.json();
        if (!body.name || !body.sku) return bad(c, 'name and sku required');
        const product = { ...ProductEntity.initialState, ...body, id: body.sku, createdAt: new Date().toISOString() };
        const created = await ProductEntity.create(c.env, product);
        await logAuditEvent(c.env, { action: 'create', entity: 'product', entityId: created.id, details: `Produit "${created.name}" créé.` });
        return ok(c, created);
    });
    protectedRoutes.put('/products/:id', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json();
        const productEntity = new ProductEntity(c.env, id);
        if (!(await productEntity.exists())) return notFound(c);
        const updated = await productEntity.mutate(p => ({ ...p, ...body, id: p.id, sku: p.sku }));
        await logAuditEvent(c.env, { action: 'update', entity: 'product', entityId: id, details: `Produit "${updated.name}" mis à jour.` });
        return ok(c, updated);
    });
    protectedRoutes.delete('/products/:id', async (c) => {
        const id = c.req.param('id');
        const productEntity = new ProductEntity(c.env, id);
        const product = await productEntity.getState();
        if (!product?.id) return notFound(c);
        if (!await ProductEntity.delete(c.env, id)) return notFound(c);
        await logAuditEvent(c.env, { action: 'delete', entity: 'product', entityId: id, details: `Produit "${product.name}" supprimé.` });
        return ok(c, { id });
    });
    // SALES
    protectedRoutes.get('/sales', async (c) => ok(c, await SaleEntity.list(c.env)));
    protectedRoutes.post('/sales', async (c) => {
        const body: Omit<Sale, 'id' | 'costOfSale'> & { customerName?: string } = await c.req.json();
        if (!body.productId || !body.quantity || !body.totalPrice) return bad(c, 'productId, quantity, and totalPrice required');
        let customerId = body.customerId;
        if (!customerId && body.customerName) {
            const newCustomer: Customer = { id: crypto.randomUUID(), name: body.customerName, source: body.source || 'Manual Entry', createdAt: new Date().toISOString() };
            await CustomerEntity.create(c.env, newCustomer);
            customerId = newCustomer.id;
        } else if (!customerId) {
            return bad(c, 'customerId or customerName required');
        }
        const productEntity = new ProductEntity(c.env, body.productId);
        const product = await productEntity.getState();
        if (!product?.id) return bad(c, `Product with SKU ${body.productId} not found.`);
        if (body.channel === 'amazon') {
            await productEntity.mutate(p => ({ ...p, stockAmazon: p.stockAmazon - body.quantity }));
        } else {
            await productEntity.mutate(p => ({ ...p, stockChezMoi: p.stockChezMoi - body.quantity }));
        }
        const costOfSale = product.purchasePrice * body.quantity;
        const sale: Sale = { ...body, id: crypto.randomUUID(), customerId, costOfSale };
        const createdSale = await SaleEntity.create(c.env, sale);
        await logAuditEvent(c.env, { action: 'create', entity: 'sale', entityId: createdSale.id, details: `Vente créée pour le client ${customerId}.` });
        const customer = await new CustomerEntity(c.env, customerId).getState();
        return ok(c, { sale: createdSale, customer });
    });
    protectedRoutes.put('/sales/:id', async (c) => {
        const id = c.req.param('id');
        const body: Partial<Sale> = await c.req.json();
        const saleEntity = new SaleEntity(c.env, id);
        const oldSale = await saleEntity.getState();
        if (!oldSale?.id) return notFound(c);
        const productEntity = new ProductEntity(c.env, oldSale.productId);
        const product = await productEntity.getState();
        if (!product?.id) return bad(c, `Product for sale not found.`);
        const quantityDiff = (body.quantity ?? oldSale.quantity) - oldSale.quantity;
        if (quantityDiff !== 0) {
            if (oldSale.channel === 'amazon') {
                await productEntity.mutate(p => ({ ...p, stockAmazon: p.stockAmazon - quantityDiff }));
            } else {
                await productEntity.mutate(p => ({ ...p, stockChezMoi: p.stockChezMoi - quantityDiff }));
            }
        }
        const updatedCostOfSale = body.quantity ? product.purchasePrice * body.quantity : oldSale.costOfSale;
        const updated = await saleEntity.mutate(s => ({ ...s, ...body, costOfSale: updatedCostOfSale }));
        await logAuditEvent(c.env, { action: 'update', entity: 'sale', entityId: id, details: `Vente pour le client ${oldSale.customerId} mise à jour.` });
        return ok(c, updated);
    });
    protectedRoutes.delete('/sales/:id', async (c) => {
        const id = c.req.param('id');
        const saleEntity = new SaleEntity(c.env, id);
        const saleToDelete = await saleEntity.getState();
        if (!saleToDelete?.id) return notFound(c);
        const productEntity = new ProductEntity(c.env, saleToDelete.productId);
        if (await productEntity.exists()) {
            if (saleToDelete.channel === 'amazon') {
                await productEntity.mutate(p => ({ ...p, stockAmazon: p.stockAmazon + saleToDelete.quantity }));
            } else {
                await productEntity.mutate(p => ({ ...p, stockChezMoi: p.stockChezMoi + saleToDelete.quantity }));
            }
        }
        if (!await SaleEntity.delete(c.env, id)) return notFound(c);
        await logAuditEvent(c.env, { action: 'delete', entity: 'sale', entityId: id, details: `Vente pour le client ${saleToDelete.customerId} supprimée.` });
        return ok(c, { id });
    });
    protectedRoutes.post('/sales/batch', async (c) => {
        const salesData: { customerName: string, productSku: string, quantity: number, totalPrice: number, source: string, saleDate: string, channel?: 'site' | 'amazon' | 'pharmacy' }[] = await c.req.json();
        const { items: customers } = await CustomerEntity.list(c.env);
        const { items: products } = await ProductEntity.list(c.env);
        const customerMap = new Map(customers.map(cust => [cust.name.toLowerCase(), cust.id]));
        const productMap = new Map(products.map(p => [p.sku, p]));
        for (const saleItem of salesData) {
            let customerId = customerMap.get(saleItem.customerName.toLowerCase());
            if (!customerId) {
                const newCustomer: Customer = { id: crypto.randomUUID(), name: saleItem.customerName, source: saleItem.source || 'CSV Import', createdAt: new Date().toISOString() };
                await CustomerEntity.create(c.env, newCustomer);
                customerId = newCustomer.id;
                customerMap.set(newCustomer.name.toLowerCase(), customerId);
            }
            const product = productMap.get(saleItem.productSku);
            const costOfSale = product ? product.purchasePrice * saleItem.quantity : 0;
            const channel = saleItem.channel || 'site';
            const sale: Sale = { id: crypto.randomUUID(), customerId, productId: saleItem.productSku, quantity: saleItem.quantity, totalPrice: saleItem.totalPrice, source: saleItem.source, saleDate: saleItem.saleDate, channel, costOfSale, promoCode: '' };
            await SaleEntity.create(c.env, sale);
            const productEntity = new ProductEntity(c.env, saleItem.productSku);
            if (await productEntity.exists()) {
                if (channel === 'amazon') {
                    await productEntity.mutate(p => ({ ...p, stockAmazon: p.stockAmazon - sale.quantity }));
                } else {
                    await productEntity.mutate(p => ({ ...p, stockChezMoi: p.stockChezMoi - sale.quantity }));
                }
            }
        }
        await logAuditEvent(c.env, { action: 'batch-import', entity: 'sale', entityId: 'multiple', details: `${salesData.length} ventes importées.` });
        return ok(c, { message: `${salesData.length} sales imported successfully.` });
    });
    // CUSTOMERS
    protectedRoutes.get('/customers', async (c) => ok(c, await CustomerEntity.list(c.env)));
    // GOALS
    protectedRoutes.get('/goals', async (c) => ok(c, await GoalEntity.list(c.env)));
    protectedRoutes.post('/goals', async (c) => {
        const body: Omit<Goal, 'id' | 'createdAt'> = await c.req.json();
        if (!body.month || !body.year) return bad(c, 'month and year required');
        const id = `${body.year}-${String(body.month).padStart(2, '0')}`;
        const goalEntity = new GoalEntity(c.env, id);
        const goal = await goalEntity.mutate(g => ({ ...g, ...body, id, createdAt: g.createdAt || new Date().toISOString() }));
        await new Index(c.env, GoalEntity.indexName).add(id);
        return ok(c, goal);
    });
    // REPORTS
    protectedRoutes.get('/reports', async (c) => {
        const { items: sales } = await SaleEntity.list(c.env);
        const settingsEntity = new SettingsEntity(c.env, 'global');
        const settings = await settingsEntity.getState();
        const feePercentage = (settings.netMarginFeePercentage || 15) / 100;
        const monthlyAggregates: { [key: string]: Omit<Report, 'id' | 'createdAt'> } = {};
        for (const sale of sales) {
            const saleDate = new Date(sale.saleDate);
            const year = saleDate.getUTCFullYear();
            const month = saleDate.getUTCMonth() + 1;
            const key = `${year}-${month}`;
            if (!monthlyAggregates[key]) {
                monthlyAggregates[key] = { year, month, totalSales: 0, revenue: 0, grossMargin: 0, netMargin: 0 };
            }
            const grossMarginForSale = sale.totalPrice - sale.costOfSale;
            const netMarginForSale = grossMarginForSale * (1 - feePercentage);
            monthlyAggregates[key].totalSales += sale.quantity;
            monthlyAggregates[key].revenue += sale.totalPrice;
            monthlyAggregates[key].grossMargin += grossMarginForSale;
            monthlyAggregates[key].netMargin += netMarginForSale;
        }
        for (const key in monthlyAggregates) {
            const reportData = monthlyAggregates[key];
            const id = `${reportData.year}-${String(reportData.month).padStart(2, '0')}`;
            const reportEntity = new ReportEntity(c.env, id);
            await reportEntity.mutate(r => ({ ...r, ...reportData, id, createdAt: r.createdAt || new Date().toISOString() }));
            await new Index(c.env, ReportEntity.indexName).add(id);
        }
        return ok(c, await ReportEntity.list(c.env));
    });
    // SETTINGS
    protectedRoutes.get('/settings', async (c) => {
        const settingsEntity = new SettingsEntity(c.env, 'global');
        return ok(c, await settingsEntity.getState());
    });
    protectedRoutes.post('/settings', async (c) => {
        const body: Partial<Settings> = await c.req.json();
        const settingsEntity = new SettingsEntity(c.env, 'global');
        const updated = await settingsEntity.mutate(s => ({ ...s, ...body, id: 'global' }));
        await logAuditEvent(c.env, { action: 'update', entity: 'settings', entityId: 'global', details: `Paramètres mis à jour. Frais de marge nette : ${updated.netMarginFeePercentage}%.` });
        return ok(c, updated);
    });
    protectedRoutes.post('/settings/regenerate-api-key', async (c) => {
        const newApiKey = `fungi_${crypto.randomUUID().replace(/-/g, '')}`;
        const settingsEntity = new SettingsEntity(c.env, 'global');
        await settingsEntity.mutate(s => ({ ...s, apiKey: newApiKey }));
        await logAuditEvent(c.env, { action: 'update', entity: 'settings', entityId: 'global', details: `Nouvelle clé API générée.` });
        return ok(c, { apiKey: newApiKey });
    });
    // AMAZON INTEGRATION
    protectedRoutes.post('/settings/amazon/connect', async (c) => {
        const settingsEntity = new SettingsEntity(c.env, 'global');
        const updated = await settingsEntity.mutate(s => ({ ...s, amazonIntegration: { ...s.amazonIntegration, connected: true } }));
        await logAuditEvent(c.env, { action: 'update', entity: 'settings', entityId: 'global', details: `Intégration Amazon connectée.` });
        return ok(c, updated);
    });
    protectedRoutes.post('/settings/amazon/disconnect', async (c) => {
        const settingsEntity = new SettingsEntity(c.env, 'global');
        const updated = await settingsEntity.mutate(s => ({ ...s, amazonIntegration: { connected: false } }));
        await logAuditEvent(c.env, { action: 'update', entity: 'settings', entityId: 'global', details: `Intégration Amazon déconnectée.` });
        return ok(c, updated);
    });
    protectedRoutes.post('/settings/amazon/sync-sales', async (c) => {
        const amazonProductSku = 'FGS-LION-AMZ';
        const productEntity = new ProductEntity(c.env, amazonProductSku);
        const product = await productEntity.getState();
        if (!product?.id) return bad(c, 'Produit Amazon non trouvé.');
        const mockCustomerNames = ['Olivia Martin', 'Liam Dubois', 'Emma Bernard', 'Noah Garcia', 'Ava Petit', 'Lucas Roux', 'Mia Lefebvre', 'Leo Martinez'];
        const salesToCreate = Math.floor(Math.random() * 6) + 5; // 5 to 10 sales
        let totalQuantitySynced = 0;
        for (let i = 0; i < salesToCreate; i++) {
            const customerName = mockCustomerNames[Math.floor(Math.random() * mockCustomerNames.length)];
            const customerEntity = new CustomerEntity(c.env, crypto.randomUUID());
            const customer: Customer = { id: customerEntity.id, name: customerName, source: 'Amazon Sync', createdAt: new Date().toISOString() };
            await CustomerEntity.create(c.env, customer);
            const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2 units
            const totalPrice = product.salePrice * quantity;
            const costOfSale = product.purchasePrice * quantity;
            const sale: Sale = { id: crypto.randomUUID(), customerId: customer.id, productId: product.sku, quantity, totalPrice, source: 'Amazon Sync', saleDate: new Date().toISOString(), channel: 'amazon', costOfSale };
            await SaleEntity.create(c.env, sale);
            totalQuantitySynced += quantity;
        }
        await productEntity.mutate(p => ({ ...p, stockAmazon: p.stockAmazon - totalQuantitySynced }));
        const settingsEntity = new SettingsEntity(c.env, 'global');
        const updatedSettings = await settingsEntity.mutate(s => ({ ...s, amazonIntegration: { ...s.amazonIntegration, lastSync: new Date().toISOString() } }));
        await logAuditEvent(c.env, { action: 'batch-import', entity: 'sale', entityId: 'amazon-sync', details: `${salesToCreate} ventes synchronisées depuis Amazon.` });
        return ok(c, { settings: updatedSettings, salesCreated: salesToCreate });
    });
    // AUDIT LOG
    protectedRoutes.get('/audit-log', async (c) => ok(c, await AuditLogEntity.list(c.env)));
    // DONATIONS
    protectedRoutes.get('/donations', async (c) => ok(c, await DonationEntity.list(c.env)));
    protectedRoutes.post('/donations', async (c) => {
        const body: Omit<Donation, 'id' | 'donationDate'> = await c.req.json();
        if (!body.productId || !body.quantity) return bad(c, 'productId and quantity required');
        const productEntity = new ProductEntity(c.env, body.productId);
        if (!(await productEntity.exists())) return bad(c, `Product with SKU ${body.productId} not found.`);
        await productEntity.mutate(p => ({ ...p, stockChezMoi: p.stockChezMoi - body.quantity }));
        const donation: Donation = { ...body, id: crypto.randomUUID(), donationDate: new Date().toISOString() };
        const createdDonation = await DonationEntity.create(c.env, donation);
        await logAuditEvent(c.env, { action: 'create', entity: 'donation', entityId: createdDonation.id, details: `Don de ${createdDonation.quantity} unit��(s) du produit ${createdDonation.productId}.` });
        return ok(c, createdDonation);
    });
    app.route('/api', protectedRoutes);
    // WEBHOOK ROUTES (PUBLIC, API-KEY AUTHENTICATED)
    const webhookRoutes = new Hono<{ Bindings: Env }>();
    webhookRoutes.use('*', apiKeyMiddleware);
    webhookRoutes.post('/webhook/sale', async (c) => {
        const body = await c.req.json();
        if (!body.product?.sku || !body.customer?.name || !body.sale?.quantity) {
            return bad(c, 'Invalid payload: product.sku, customer.name, and sale.quantity are required.');
        }
        const { items: customers } = await CustomerEntity.list(c.env);
        const customerMap = new Map(customers.map(cust => [cust.name.toLowerCase(), cust]));
        let customer = customerMap.get(body.customer.name.toLowerCase());
        if (!customer) {
            const newCustomer: Customer = { id: crypto.randomUUID(), name: body.customer.name, email: body.customer.email || '', source: body.customer.source || 'Webhook', createdAt: new Date().toISOString() };
            await CustomerEntity.create(c.env, newCustomer);
            customer = newCustomer;
        }
        const productEntity = new ProductEntity(c.env, body.product.sku);
        const product = await productEntity.getState();
        if (!product?.id) {
            return bad(c, `Product with SKU ${body.product.sku} not found.`);
        }
        const saleData = body.sale;
        const channel = saleData.channel || 'site';
        if (channel === 'amazon') {
            await productEntity.mutate(p => ({ ...p, stockAmazon: p.stockAmazon - saleData.quantity }));
        } else {
            await productEntity.mutate(p => ({ ...p, stockChezMoi: p.stockChezMoi - saleData.quantity }));
        }
        const costOfSale = product.purchasePrice * saleData.quantity;
        const sale: Sale = { id: crypto.randomUUID(), customerId: customer.id, productId: product.sku, quantity: saleData.quantity, totalPrice: saleData.totalPrice, source: customer.source, saleDate: saleData.saleDate || new Date().toISOString(), channel, costOfSale, promoCode: saleData.promoCode || '' };
        await SaleEntity.create(c.env, sale);
        await logAuditEvent(c.env, { action: 'create', entity: 'sale', entityId: sale.id, details: `Vente créée via webhook pour le client ${customer.name}.` });
        return ok(c, { message: 'Sale created successfully', saleId: sale.id });
    });
    app.route('/api', webhookRoutes);
}