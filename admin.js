new Vue({
    el: '#app',
    data: {
        activeTab: 'orders',
        orderFilter: 'all',
        orders: [],
        products: [],
        newProduct: {
            name: '',
            price: 0,
            category: '',
            image: ''
        },
        dailySales: 0,
        dailyOrders: 0,
        topProducts: []
    },
    created() {
        this.fetchOrders();
        this.fetchProducts();
        this.fetchStatistics();
    },
    computed: {
        filteredOrders() {
            if (this.orderFilter === 'all') {
                return this.orders;
            }
            return this.orders.filter(order => order.status === this.orderFilter);
        }
    },
    methods: {
        fetchOrders() {
            fetch('/api/orders')
                .then(res => res.json())
                .then(data => {
                    this.orders = data;
                })
                .catch(err => {
                    console.error('Error fetching orders:', err);
                    // بيانات افتراضية لأغراض التطوير
                    this.orders = [
                        {
                            id: 'order1',
                            tableNumber: 5,
                            items: [
                                {productId: 1, quantity: 2, notes: 'بدون سكر'},
                                {productId: 3, quantity: 1}
                            ],
                            status: 'new',
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: 'order2',
                            tableNumber: 3,
                            items: [
                                {productId: 2, quantity: 1},
                                {productId: 4, quantity: 2, notes: 'مزيد من الشوكولاتة'}
                            ],
                            status: 'preparing',
                            createdAt: new Date(Date.now() - 3600000).toISOString()
                        }
                    ];
                });
        },
        fetchProducts() {
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
        fetchStatistics() {
            fetch('/api/stats')
                .then(res => res.json())
                .then(data => {
                    this.dailySales = data.dailySales;
                    this.dailyOrders = data.dailyOrders;
                    this.topProducts = data.topProducts;
                })
                .catch(err => {
                    console.error('Error fetching stats:', err);
                    // بيانات افتراضية لأغراض التطوير
                    this.dailySales = 350;
                    this.dailyOrders = 12;
                    this.topProducts = [
                        {name: 'كابتشينو', orders: 8},
                        {name: 'آيس كوفي', orders: 5},
                        {name: 'إسبريسو', orders: 4}
                    ];
                });
        },
        refreshOrders() {
            this.fetchOrders();
        },
        updateOrderStatus(order) {
            fetch(`/api/orders/${order.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({status: order.status})
            })
            .then(res => res.json())
            .then(data => {
                alert('تم تحديث حالة الطلب');
            })
            .catch(err => {
                console.error('Error updating order:', err);
                alert('حدث خطأ أثناء تحديث حالة الطلب');
            });
        },
        getProductName(productId) {
            const product = this.products.find(p => p.id === productId);
            return product ? product.name : 'منتج غير معروف';
        },
        getProductPrice(productId) {
            const product = this.products.find(p => p.id === productId);
            return product ? product.price : 0;
        },
        calculateOrderTotal(order) {
            return order.items.reduce((total, item) => {
                return total + (this.getProductPrice(item.productId) * item.quantity);
            }, 0);
        },
        formatTime(isoString) {
            const date = new Date(isoString);
            return date.toLocaleTimeString('ar-EG');
        },
        addProduct() {
            if (!this.newProduct.name || !this.newProduct.price) {
                alert('الرجاء إدخال اسم المنتج والسعر');
                return;
            }

            fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.newProduct)
            })
            .then(res => res.json())
            .then(data => {
                this.products.push(data);
                this.newProduct = {name: '', price: 0, category: '', image: ''};
                alert('تم إضافة المنتج بنجاح');
            })
            .catch(err => {
                console.error('Error adding product:', err);
                alert('حدث خطأ أثناء إضافة المنتج');
            });
        },
        editProduct(product) {
            const newName = prompt('اسم المنتج:', product.name);
            if (newName === null) return;

            const newPrice = prompt('السعر:', product.price);
            if (newPrice === null) return;

            const newCategory = prompt('الفئة:', product.category);
            const newImage = prompt('صورة المنتج (رابط):', product.image);

            const updatedProduct = {
                ...product,
                name: newName,
                price: parseFloat(newPrice),
                category: newCategory,
                image: newImage
            };

            fetch(`/api/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedProduct)
            })
            .then(res => res.json())
            .then(data => {
                const index = this.products.findIndex(p => p.id === product.id);
                if (index !== -1) {
                    this.products.splice(index, 1, data);
                }
                alert('تم تحديث المنتج بنجاح');
            })
            .catch(err => {
                console.error('Error updating product:', err);
                alert('حدث خطأ أثناء تحديث المنتج');
            });
        },
        deleteProduct(productId) {
            if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

            fetch(`/api/products/${productId}`, {
                method: 'DELETE'
            })
            .then(res => {
                if (res.ok) {
                    this.products = this.products.filter(p => p.id !== productId);
                    alert('تم حذف المنتج بنجاح');
                }
            })
            .catch(err => {
                console.error('Error deleting product:', err);
                alert('حدث خطأ أثناء حذف المنتج');
            });
        }
    }
});
