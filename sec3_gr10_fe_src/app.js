const express = require('express');
const dotenv = require("dotenv");
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

// 1. Configuration
dotenv.config();
const app = express();
const router = express.Router();
const PORT = process.env.PORT || 3030;
const BACKEND_URL = `http://localhost:${process.env.BACKEND_PORT || 3031}`;

// Create a proxy to the backend
app.use('/api', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    logLevel: 'debug' // For development
}));

app.use(express.static(path.join(__dirname, 'public'))); // Static files
app.use(express.json()); // Essential for parsing JSON from frontend
app.use(express.urlencoded({ extended: true }));

/* --- Helper Function for HTML --- */
const serveHTML = (fileName, subfolder = '') => (req, res) => {
    res.sendFile(path.join(__dirname, 'template', subfolder, fileName));
};

/* --- AUTH / LOGIN ROUTES --- */
router.get('/', serveHTML('Login Choice.html'));
router.get('/login-admin', serveHTML('Login Admin.html'));
router.get('/login-student', serveHTML('Login Student.html'));

/* --- ADMIN ROUTES (in /template/admin/) --- */
router.get('/admin/dashboard', serveHTML('Dashboard.html', 'admin'));
router.get('/admin/add-brand', serveHTML('Add Brand.html', 'admin'));
router.get('/admin/add-category', serveHTML('Add Category.html', 'admin'));
router.get('/admin/add-product', serveHTML('Add Product.html', 'admin'));
router.get('/admin/brand-control', serveHTML('Brand Control.html', 'admin'));
router.get('/admin/category-control', serveHTML('Category Control.html', 'admin'));
router.get('/admin/edit-brand', serveHTML('Edit Brand.html', 'admin'));
router.get('/admin/edit-category', serveHTML('Edit Category.html', 'admin'));
router.get('/admin/edit-product', serveHTML('Edit Product.html', 'admin'));
router.get('/admin/penalty', serveHTML('Penalty Page.html', 'admin'));
router.get('/admin/product-control', serveHTML('Product Control.html', 'admin'));
router.get('/admin/team', serveHTML('Team Page.html', 'admin'));

/* --- STUDENT ROUTES (in /template/student/) --- */
router.get('/student/dashboard', serveHTML('Dashboard.html', 'student'));
router.get('/student/cart', serveHTML('Cart Page.html', 'student'));
router.get('/student/justification', serveHTML('Justification Page.html', 'student'));
router.get('/student/product', serveHTML('Product Page.html', 'student'));
router.get('/student/profile', serveHTML('Profile.html', 'student'));
router.get('/student/rent', serveHTML('Rent.html', 'student'));
router.get('/student/search', serveHTML('Search.html', 'student'));
router.get('/student/search-result', serveHTML('Search Result.html', 'student'));
router.get('/student/team', serveHTML('Team Page.html', 'student'));

// Register Router
app.use('/', router);

// Final Error Handling
app.use((err, req, res, next) => {
    console.error(`[Server Error] ${err.message}`);
    res.status(500).send('Internal Server Error');
});

/* Server Start */
app.listen(process.env.PORT, () => {
    console.log(`Server listening on port: ${process.env.PORT}`);
    console.log(`Visit the website: http://localhost:${process.env.PORT}`);
});
