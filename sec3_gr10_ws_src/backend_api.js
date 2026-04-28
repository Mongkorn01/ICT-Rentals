const express = require('express');
const dotenv = require("dotenv");
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

dotenv.config();
const app = express();
const router = express.Router();

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use('/', router);

let dbConn = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

dbConn.connect((err) => {
    if (err) throw err;
    console.log(`Connected to DB: ${process.env.MYSQL_DATABASE}`);
});

/* --- Gemini Configuration --- */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    systemInstruction: `
        You are the AI Assistant for ICT-RENTALS, a Mahidol University equipment rental system.
        Use the following app map to help users navigate:

        GENERAL:
        - / : The initial Login Choice page.
        - /login-admin and /login-student : Specific login portals.

        STUDENT FLOW:
        - Dashboard (/student/dashboard): Main hub to see available gear.
        - Search (/student/search): Find specific items.
        - Cart & Rent (/student/cart, /student/rent): Review and finalize rentals.
        - Profile (/student/profile): View personal account details and rental history.

        ADMIN FLOW:
        - Dashboard (/admin/dashboard): Admin overview.
        - Controls: Brand Control, Category Control, and Product Control are for managing the inventory list.
        - Management: Add Brand/Category/Product pages are for adding new stock.
        - Penalty (/admin/penalty): Manage student late returns or damages.

        When asked "How do I navigate?", identify if they are likely a student or admin and guide them to the correct route. 
        Keep answers concise and helpful.
    `
});

/* --- AI Helper Route --- */
// Use this to get AI assistance anywhere in your app
router.post('/ai-assist', async (req, res) => {
    try {
        const { prompt } = req.body;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ success: true, text: response.text() });
    } catch (error) {
        console.error("Gemini Error:", error.message); // This prints the REAL error in your terminal
        res.status(500).json({ success: false, error: error.message });
    }
});


/* --- AUTH; /login-admin  /login-student --- */

router.post('/login-student', (req, res) => {
    const { student_id, password } = req.body;
    if (!student_id || !password)
        return res.status(400).json({ error: true, message: 'Please provide student ID and password.' });

    dbConn.query('SELECT * FROM Students WHERE student_id = ?', [student_id], async (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.length === 0)
            return res.status(401).json({ error: true, message: 'Invalid student ID or password.' });

        const student = results[0];
        const match = await bcrypt.compare(password, student.password);
        if (!match)
            return res.status(401).json({ error: true, message: 'Invalid student ID or password.' });

        const { password: _, ...studentData } = student;
        return res.json({ error: false, message: 'Login successful.', data: studentData });
    });
});

router.post('/login-admin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: true, message: 'Please provide email and password.' });

    dbConn.query('SELECT * FROM Administrators WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.length === 0)
            return res.status(401).json({ error: true, message: 'Invalid email or password.' });

        const admin = results[0];
        const match = await bcrypt.compare(password, admin.password);
        if (!match)
            return res.status(401).json({ error: true, message: 'Invalid email or password.' });

        dbConn.query(
            'INSERT INTO Admin_Activity_Logs (action_type, action_details, admin_id) VALUES (?, ?, ?)',
            ['Login', `Admin logged in: ${admin.email}`, admin.admin_id]
        );

        const { password: _, ...adminData } = admin;
        return res.json({ error: false, message: 'Login successful.', data: adminData });
    });
});

/* --- ADMIN; /admin/dashboard --- */

router.get('/admin/dashboard', (req, res) => {
    const { status } = req.query;
    const whereClause = status ? 'WHERE ri.status = ?' : '';
    const params = status ? [status] : [];
    const sql = `
        SELECT ri.rental_item_id, ri.status, ri.return_date, ri.penalty_fee,
            rt.borrow_date, rt.due_date, rt.event_name,
            s.student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
            ei.item_id, ei.serial_number,
            em.model_id, em.name AS equipment_name, em.brand, em.category
        FROM Rental_Items ri
        JOIN Rental_Transactions rt ON ri.transaction_id = rt.transaction_id
        JOIN Students s ON rt.student_id = s.student_id
        JOIN Equipments_Items ei ON ri.item_id = ei.item_id
        JOIN Equipments_Models em ON ei.model_id = em.model_id
        ${whereClause}
        ORDER BY rt.borrow_date DESC
    `;
    dbConn.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        return res.json({ error: false, data: results, message: 'Dashboard data retrieved.' });
    });
});

/* --- ADMIN; /admin/brand-control  /admin/add-brand  /admin/edit-brand --- */

router.get('/admin/brand-control', (req, res) => {
    dbConn.query('SELECT DISTINCT brand FROM Equipments_Models ORDER BY brand', (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        return res.json({ error: false, data: results, message: 'Brands retrieved.' });
    });
});

router.post('/admin/add-brand', (req, res) => {
    const { brand } = req.body;
    if (!brand) return res.status(400).json({ error: true, message: 'brand name is required.' });
    dbConn.query('SELECT DISTINCT brand FROM Equipments_Models WHERE brand = ?', [brand], (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.length > 0) return res.status(409).json({ error: true, message: 'Brand already exists.' });
        return res.json({ error: false, message: `Brand "${brand}" is ready to use.` });
    });
});

router.put('/admin/edit-brand/:brand', (req, res) => {
    const { new_brand } = req.body;
    if (!new_brand) return res.status(400).json({ error: true, message: 'new_brand is required.' });
    dbConn.query('UPDATE Equipments_Models SET brand = ? WHERE brand = ?', [new_brand, req.params.brand], (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ error: true, message: 'Brand not found.' });
        return res.json({ error: false, data: results.affectedRows, message: 'Brand updated successfully.' });
    });
});

router.delete('/admin/brand-control/:brand', (req, res) => {
    dbConn.query('DELETE FROM Equipments_Models WHERE brand = ?', [req.params.brand], (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ error: true, message: 'Brand not found.' });
        return res.json({ error: false, data: results.affectedRows, message: 'Brand deleted successfully.' });
    });
});

/* --- ADMIN; /admin/category-control  /admin/add-category  /admin/edit-category --- */

router.get('/admin/category-control', (req, res) => {
    dbConn.query('SELECT DISTINCT category FROM Equipments_Models ORDER BY category', (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        return res.json({ error: false, data: results, message: 'Categories retrieved.' });
    });
});

router.post('/add-category', (req, res) => {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: true, message: 'category name is required.' });
    dbConn.query('SELECT DISTINCT category FROM Equipments_Models WHERE category = ?', [category], (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.length > 0) return res.status(409).json({ error: true, message: 'Category already exists.' });
        return res.json({ error: false, message: `Category "${category}" is ready to use.` });
    });
});

router.put('/admin/edit-category/:category', (req, res) => {
    const { new_category } = req.body;
    if (!new_category) return res.status(400).json({ error: true, message: 'new_category is required.' });
    dbConn.query('UPDATE Equipments_Models SET category = ? WHERE category = ?', [new_category, req.params.category], (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ error: true, message: 'Category not found.' });
        return res.json({ error: false, data: results.affectedRows, message: 'Category updated successfully.' });
    });
});

router.delete('/admin/category-control/:category', (req, res) => {
    dbConn.query('DELETE FROM Equipments_Models WHERE category = ?', [req.params.category], (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ error: true, message: 'Category not found.' });
        return res.json({ error: false, data: results.affectedRows, message: 'Category deleted successfully.' });
    });
});

/* --- ADMIN; /admin/product-control  /admin/add-product  /admin/edit-product --- */

router.get('/admin/product-control', (req, res) => {
    const sql = `
        SELECT m.*,
            COUNT(CASE WHEN i.status = 'Available' THEN 1 END) AS quantity_available,
            COUNT(i.item_id) AS quantity_total
        FROM Equipments_Models m
        LEFT JOIN Equipments_Items i ON m.model_id = i.model_id
        GROUP BY m.model_id
    `;
    dbConn.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        return res.json({ error: false, data: results, message: 'All products retrieved.' });
    });
});

router.post('/admin/add-product', (req, res) => {
    const { name, brand, category, img_url, details, specs, admin_id } = req.body;
    if (!name || !brand || !category || !admin_id)
        return res.status(400).json({ error: true, message: 'name, brand, category, and admin_id are required.' });

    dbConn.query(
        'INSERT INTO Equipments_Models (name, brand, category, img_url, details, specs, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, brand, category, img_url || null, details || null, specs || null, admin_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: true, message: err.message });
            dbConn.query(
                'INSERT INTO Admin_Activity_Logs (action_type, action_details, admin_id) VALUES (?, ?, ?)',
                ['Add Model', `Added model: ${name} (model_id=${results.insertId})`, admin_id]
            );
            return res.json({ error: false, data: { model_id: results.insertId }, message: 'Product created successfully.' });
        }
    );
});

router.put('/admin/edit-product/:id', (req, res) => {
    const { name, brand, category, img_url, details, specs, admin_id } = req.body;
    if (!admin_id)
        return res.status(400).json({ error: true, message: 'admin_id is required.' });

    dbConn.query(
        'UPDATE Equipments_Models SET name=?, brand=?, category=?, img_url=?, details=?, specs=? WHERE model_id=?',
        [name, brand, category, img_url, details, specs, req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: true, message: err.message });
            if (results.affectedRows === 0) return res.status(404).json({ error: true, message: 'Product not found.' });
            dbConn.query(
                'INSERT INTO Admin_Activity_Logs (action_type, action_details, admin_id) VALUES (?, ?, ?)',
                ['Edit Model', `Updated model_id=${req.params.id}`, admin_id]
            );
            return res.json({ error: false, data: results.affectedRows, message: 'Product updated successfully.' });
        }
    );
});

router.delete('/admin/product-control/:id', (req, res) => {
    const { admin_id } = req.body;
    dbConn.query('DELETE FROM Equipments_Models WHERE model_id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ error: true, message: 'Product not found.' });
        if (admin_id) {
            dbConn.query(
                'INSERT INTO Admin_Activity_Logs (action_type, action_details, admin_id) VALUES (?, ?, ?)',
                ['Delete Model', `Deleted model_id=${req.params.id}`, admin_id]
            );
        }
        return res.json({ error: false, data: results.affectedRows, message: 'Product deleted successfully.' });
    });
});

/* --- ADMIN; /admin/penalty --- */

router.get('/admin/penalty', (req, res) => {
    const sql = `
        SELECT ri.rental_item_id, ri.penalty_fee, rt.due_date,
            CONCAT(s.first_name, ' ', s.last_name) AS student_name,
            s.email, s.phone, s.student_id,
            ei.serial_number, em.name AS equipment_name
        FROM Rental_Items ri
        JOIN Rental_Transactions rt ON ri.transaction_id = rt.transaction_id
        JOIN Students s ON rt.student_id = s.student_id
        JOIN Equipments_Items ei ON ri.item_id = ei.item_id
        JOIN Equipments_Models em ON ei.model_id = em.model_id
        WHERE ri.status = 'Overdue'
        ORDER BY rt.due_date ASC
    `;
    dbConn.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        return res.json({ error: false, data: results, message: 'Overdue items retrieved.' });
    });
});

/* --- STUDENT; /student/dashboard --- */

router.get('/student/dashboard/:id', (req, res) => {
    const sql = `
        SELECT ri.rental_item_id, ri.status, ri.return_date, ri.penalty_fee,
            rt.transaction_id, rt.borrow_date, rt.due_date, rt.event_name,
            em.name AS equipment_name, em.brand, em.category, ei.serial_number
        FROM Rental_Items ri
        JOIN Rental_Transactions rt ON ri.transaction_id = rt.transaction_id
        JOIN Equipments_Items ei ON ri.item_id = ei.item_id
        JOIN Equipments_Models em ON ei.model_id = em.model_id
        WHERE rt.student_id = ?
        ORDER BY rt.borrow_date DESC
    `;
    dbConn.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        return res.json({ error: false, data: results, message: 'Student dashboard retrieved.' });
    });
});

/* --- STUDENT; /student/rent --- */

router.get('/student/rent', (req, res) => {
    const sql = `
        SELECT m.*,
            COUNT(CASE WHEN i.status = 'Available' THEN 1 END) AS quantity_available,
            COUNT(i.item_id) AS quantity_total
        FROM Equipments_Models m
        LEFT JOIN Equipments_Items i ON m.model_id = i.model_id
        GROUP BY m.model_id
    `;
    dbConn.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        return res.json({ error: false, data: results, message: 'All products retrieved.' });
    });
});

/* --- STUDENT; /student/search  +  /student/search-results --- */

router.get('/student/search', (req, res) => {
    const { brand, category, status, name } = req.query;
    let conditions = [];
    let params = [];

    if (brand)    { conditions.push('m.brand LIKE ?');    params.push(`%${brand}%`); }
    if (category) { conditions.push('m.category LIKE ?'); params.push(`%${category}%`); }
    if (name)     { conditions.push('m.name LIKE ?');     params.push(`%${name}%`); }
    if (status)   { conditions.push('i.status = ?');      params.push(status); }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
        SELECT m.*,
            COUNT(CASE WHEN i.status = 'Available' THEN 1 END) AS quantity_available,
            COUNT(i.item_id) AS quantity_total
        FROM Equipments_Models m
        LEFT JOIN Equipments_Items i ON m.model_id = i.model_id
        ${whereClause}
        GROUP BY m.model_id
    `;
    dbConn.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        return res.json({ error: false, data: results, message: 'Search results retrieved.' });
    });
});

/* --- STUDENT; /student/product --- */

router.get('/student/product/:id', (req, res) => {
    const sql = `
        SELECT m.*,
            COUNT(CASE WHEN i.status = 'Available' THEN 1 END) AS quantity_available,
            COUNT(i.item_id) AS quantity_total
        FROM Equipments_Models m
        LEFT JOIN Equipments_Items i ON m.model_id = i.model_id
        WHERE m.model_id = ?
        GROUP BY m.model_id
    `;
    dbConn.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.length === 0) return res.status(404).json({ error: true, message: 'Product not found.' });
        return res.json({ error: false, data: results[0], message: 'Product retrieved.' });
    });
});

/* --- STUDENT; /student/profile --- */

router.get('/student/profile/:id', (req, res) => {
    dbConn.query(
        'SELECT student_id, first_name, last_name, email, phone FROM Students WHERE student_id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: true, message: err.message });
            if (results.length === 0) return res.status(404).json({ error: true, message: 'Student not found.' });
            return res.json({ error: false, data: results[0], message: 'Student profile retrieved.' });
        }
    );
});

/* --- STUDENT; /student/justification --- */
router.post('/student/justification', (req, res) => {
    const { 
        student_id, admin_id, event_name, reason, 
        where_event, outside_location, borrow_date, due_date, item_ids 
    } = req.body;

    // 1. Improved Validation (Checking for null/undefined specifically)
    if (student_id == null || admin_id == null || !event_name || !reason || !where_event || !borrow_date || !due_date || !item_ids?.length) {
        return res.status(400).json({ error: true, message: 'All required fields must be provided.' });
    }

    // 2. Insert into Rental_Transactions
    const transSql = 'INSERT INTO Rental_Transactions (borrow_date, due_date, event_name, reason, where_event, outside_location, admin_id, student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const transValues = [borrow_date, due_date, event_name, reason, where_event, outside_location || null, admin_id, student_id];

    dbConn.query(transSql, transValues, (err, transResult) => {
        if (err) return res.status(500).json({ error: true, message: "Transaction Error: " + err.message });

        const transaction_id = transResult.insertId;
        
        // 3. Prepare Bulk Insert for Rental_Items
        const rentalItemValues = item_ids.map(item_id => [transaction_id, item_id, 'Pending']);

        dbConn.query('INSERT INTO Rental_Items (transaction_id, item_id, status) VALUES ?', [rentalItemValues], (err2) => {
            if (err2) return res.status(500).json({ error: true, message: "Items Error: " + err2.message });

            // 4. Log the activity
            const logSql = 'INSERT INTO Admin_Activity_Logs (action_type, action_details, admin_id, target_transaction_id) VALUES (?, ?, ?, ?)';
            const logDetails = `Transaction ${transaction_id} submitted by student ${student_id}`;
            
            dbConn.query(logSql, ['Approve Loan', logDetails, admin_id, transaction_id], (err3) => {
                // We return success even if log fails, but we check for it
                if (err3) console.error("Log Error:", err3.message);
                
                return res.json({ 
                    error: false, 
                    data: { transaction_id }, 
                    message: 'Rental request submitted successfully.' 
                });
            });
        });
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
