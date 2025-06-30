const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ملفات البيانات
const PRODUCTS_FILE = path.join(__dirname, 'data/products.json');
const ORDERS_FILE = path.join(__dirname, 'data/orders.json');

// تهيئة ملفات البيانات إذا لم تكن موجودة
if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([
        {id: 1, name: 'إسبريسو', price: 10, category: 'مشروبات ساخنة', image: 'espresso.jpg'},
        {id: 2, name: 'كابتشينو', price: 12, category: 'مشروبات ساخنة', image: 'cappuccino.jpg'},
        {id: 3, name: 'آيس كوفي', price: 15, category: 'مشروبات باردة', image: 'ice-coffee.jpg'},
        {id: 4, name: 'كيك الشوكولاتة', price: 20, category: 'حلويات', image: 'chocolate-cake.jpg'}
    ]));
}

if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
}

// قراءة البيانات من الملفات
function readProducts() {
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE));
}

function readOrders() {
    return JSON.parse(fs.readFileSync(ORDERS_FILE));
}

// كتابة البيانات إلى الملفات
function writeProducts(products) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function writeOrders(orders) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Routes

// المنتجات
app.get('/api/products', (req, res) => {
    const products = readProducts();
    res.json(products);
});

app.post('/api/products', (req, res) => {
    const products = readProducts();
    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        ...req.body
    };
    products.push(newProduct);
    writeProducts(products);
    res.json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
    const products = readProducts();
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({error: 'Product not found'});
    }
    products[index] = {...products[index], ...req.body};
    writeProducts(products);
    res.json(products[index]);
});

app.delete('/api/products/:id', (req, res) => {
    const products = readProducts();
    const filteredProducts = products.filter(p => p.id !== parseInt(req.params.id));
    writeProducts(filteredProducts);
    res.sendStatus(204);
});

// الطلبات
app.get('/api/orders', (req, res) => {
    const orders = readOrders();
    res.json(orders);
});

app.post('/api/orders', (req, res) => {
    const orders = readOrders();
    const newOrder = {
        id: 'order_' + Date.now(),
        ...req.body
    };
    orders.push(newOrder);
    writeOrders(orders);
    res.json({orderId: newOrder.id});
});

app.put('/api/orders/:id', (req, res) => {
    const orders = readOrders();
    const index = orders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({error: 'Order not found'});
    }
    orders[index] = {...orders[index], ...req.body};
    writeOrders(orders);
    res.json(orders[index]);
});

// الإحصائيات
app.get('/api/stats', (req, res) => {
    const orders = readOrders();
    const products = readProducts();
    
    const today = new Date().toISOString().split('T')[0];
    const dailyOrders = orders.filter(o => o.createdAt.split('T')[0] === today);
    
    const dailySales = dailyOrders.reduce((total, order) => {
        return total + order.items.reduce((orderTotal, item) => {
            const product = products.find(p => p.id === item.productId);
            return orderTotal + (product ? product.price * item.quantity : 0);
        }, 0);
    }, 0);
    
    const productCounts = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity;
        });
    });
    
    const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([productId, count]) => {
            const product = products.find(p => p.id === parseInt(productId));
            return {
                name: product ? product.name : 'منتج غير معروف',
                orders: count
            };
        });
    
    res.json({
        dailySales,
        dailyOrders: dailyOrders.length,
        topProducts
    });
});

// بدء الخادم
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
