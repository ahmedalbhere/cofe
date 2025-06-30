// الانتقال من صفحة الطاولة إلى القائمة
function startOrder() {
    const tableNumber = document.getElementById('tableNumber').value;
    if (tableNumber && tableNumber > 0) {
        localStorage.setItem('currentTable', tableNumber);
        window.location.href = 'menu.html';
    } else {
        alert('الرجاء إدخال رقم طاولة صحيح');
    }
}

// تطبيق Vue.js لصفحة القائمة
if (window.location.pathname.endsWith('menu.html')) {
    new Vue({
        el: '#app',
        data: {
            tableNumber: localStorage.getItem('currentTable') || 1,
            products: [],
            currentCategory: 'جميع الفئات',
            cart: [],
            notes: {}
        },
        created() {
            this.fetchProducts();
        },
        computed: {
            categories() {
                const cats = ['جميع الفئات', ...new Set(this.products.map(p => p.category))];
                return cats;
            },
            filteredProducts() {
                if (this.currentCategory === 'جميع الفئات') {
                    return this.products;
                }
                return this.products.filter(p => p.category === this.currentCategory);
            },
            total() {
                return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            }
        },
        methods: {
            fetchProducts() {
                // في الواقع، هذا سيكون طلب API إلى الخادم
                fetch('/api/products')
                    .then(res => res.json())
                    .then(data => {
                        this.products = data;
                    })
                    .catch(err => {
                        console.error('Error fetching products:', err);
                        // بيانات افتراضية لأغراض التطوير
                        this.products = [
                            {id: 1, name: 'إسبريسو', price: 10, category: 'مشروبات ساخنة', image: 'espresso.jpg'},
                            {id: 2, name: 'كابتشينو', price: 12, category: 'مشروبات ساخنة', image: 'cappuccino.jpg'},
                            {id: 3, name: 'آيس كوفي', price: 15, category: 'مشروبات باردة', image: 'ice-coffee.jpg'},
                            {id: 4, name: 'كيك الشوكولاتة', price: 20, category: 'حلويات', image: 'chocolate-cake.jpg'}
                        ];
                    });
            },
            setCategory(category) {
                this.currentCategory = category;
            },
            increaseQuantity(product) {
                const existingItem = this.cart.find(item => item.id === product.id);
                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    this.cart.push({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        notes: this.notes[product.id] || ''
                    });
                }
            },
            decreaseQuantity(product) {
                const existingItem = this.cart.find(item => item.id === product.id);
                if (existingItem) {
                    existingItem.quantity--;
                    if (existingItem.quantity <= 0) {
                        this.cart = this.cart.filter(item => item.id !== product.id);
                    }
                }
            },
            getQuantity(productId) {
                const item = this.cart.find(item => item.id === productId);
                return item ? item.quantity : 0;
            },
            submitOrder() {
                const order = {
                    tableNumber: parseInt(this.tableNumber),
                    items: this.cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        notes: item.notes
                    })),
                    status: 'new',
                    createdAt: new Date().toISOString()
                };

                fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(order)
                })
                .then(response => response.json())
                .then(data => {
                    alert('تم إرسال طلبك بنجاح! رقم الطلب: ' + data.orderId);
                    this.cart = [];
                    this.notes = {};
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('حدث خطأ أثناء إرسال الطلب');
                });
            },
            exitOrder() {
                localStorage.removeItem('currentTable');
                window.location.href = 'index.html';
            }
        }
    });
}
