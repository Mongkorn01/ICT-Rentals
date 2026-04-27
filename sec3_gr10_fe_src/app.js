const express = require('express');
const dotenv = require("dotenv");
const path = require('path');

dotenv.config();
const app = express();
const router = express.Router();

app.use(express.json()); // Essential for parsing JSON from your frontend
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // External CSS example
app.use('/', router);

// Error Handling (Should ALWAYS be last)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

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
router.get('/student/search-results', serveHTML('Search Result.html', 'student'));
router.get('/student/team', serveHTML('Team Page.html', 'student'));

/* Server Start */
app.listen(process.env.PORT, () => {
    console.log(`Server listening on port: ${process.env.PORT}`);
    console.log(`Visit the website: http://localhost:${process.env.PORT}`);
});
