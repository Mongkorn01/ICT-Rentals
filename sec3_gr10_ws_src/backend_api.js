const express = require('express');
const dotenv = require("dotenv");
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

dotenv.config();
const app = express();
const router = express.Router();

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use('/', router);

const dbConn = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
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
router.post('/ai-assist', async (req, res) => {
    try {
        const { prompt } = req.body;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ success: true, text: response.text() });
    } catch (error) {
        console.error("Gemini Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});


/* --- AUTH; /login-admin  /login-student --- */

router.post('/login-student', async (req, res) => {
    const { student_id, password } = req.body;
    if (!student_id || !password)
        return res.status(400).json({ error: true, message: 'Please provide student ID and password.' });

    try {
        const [results] = await dbConn.query('SELECT * FROM Students WHERE student_id = ?', [student_id]);
        if (results.length === 0)
            return res.status(401).json({ error: true, message: 'Invalid student ID or password.' });

        const student = results[0];
        const match = await bcrypt.compare(password, student.password);
        if (!match)
            return res.status(401).json({ error: true, message: 'Invalid student ID or password.' });

        const { password: _, ...studentData } = student;
        return res.json({ error: false, message: 'Login successful.', data: studentData });
    } catch (err) {
        return res.status(500).json({ error: true, message: err.message });
    }
});

router.post('/login-admin', async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password)
        return res.status(400).json({ error: true, message: 'Please provide email/username and password.' });

    try {
        const [results] = await dbConn.query(
            'SELECT * FROM Administrators WHERE email = ? OR username = ?',
            [identifier, identifier]
        );
        if (results.length === 0)
            return res.status(401).json({ error: true, message: 'Invalid credentials.' });

        const admin = results[0];
        const match = await bcrypt.compare(password, admin.password);
        if (!match)
            return res.status(401).json({ error: true, message: 'Invalid credentials.' });

        dbConn.query(
            'INSERT INTO Admin_Activity_Logs (action_type, action_details, admin_id) VALUES (?, ?, ?)',
            ['Login', `Admin logged in: ${admin.email}`, admin.admin_id]
        );

        const { password: _, ...adminData } = admin;
        return res.json({ error: false, message: 'Login successful.', data: adminData });
    } catch (err) {
        return res.status(500).json({ error: true, message: err.message });
    }
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

router.delete('/admin/product-control/:id', async (req, res) => {
    const { admin_id } = req.body;
    const model_id = req.params.id;

    try {
        const [items] = await dbConn.query(
            'SELECT item_id, status FROM Equipments_Items WHERE model_id = ?',
            [model_id]
        );

        const borrowed = items.filter(i => i.status === 'Borrowed');
        if (borrowed.length > 0) {
            return res.status(400).json({
                error: true,
                message: `Cannot delete: ${borrowed.length} item(s) are currently borrowed.`
            });
        }

        const item_ids = items.map(i => i.item_id);

        if (item_ids.length > 0) {
            await dbConn.query('DELETE FROM Admin_Activity_Logs WHERE target_item_id IN (?)', [item_ids]);
            await dbConn.query('DELETE FROM Rental_Items WHERE item_id IN (?)', [item_ids]);
            await dbConn.query('DELETE FROM Equipments_Items WHERE model_id = ?', [model_id]);
        }

        const [result] = await dbConn.query(
            'DELETE FROM Equipments_Models WHERE model_id = ?', [model_id]
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ error: true, message: 'Product not found.' });

        if (admin_id) {
            dbConn.query(
                'INSERT INTO Admin_Activity_Logs (action_type, action_details, admin_id) VALUES (?, ?, ?)',
                ['Delete Model', `Deleted model_id=${model_id}`, admin_id]
            );
        }

        return res.json({ error: false, message: 'Product deleted successfully.' });
    } catch (err) {
        return res.status(500).json({ error: true, message: err.message });
    }
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

router.post('/student/justification', async (req, res) => {
    const { 
        student_id, admin_id, event_name, reason, 
        where_event, outside_location, borrow_date, due_date, item_ids 
    } = req.body;

    if (student_id == null || admin_id == null || !event_name || !reason || !where_event || !borrow_date || !due_date || !item_ids?.length) {
        return res.status(400).json({ error: true, message: 'All required fields must be provided.' });
    }

    try {
        const [transResult] = await dbConn.query(
            'INSERT INTO Rental_Transactions (borrow_date, due_date, event_name, reason, where_event, outside_location, admin_id, student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [borrow_date, due_date, event_name, reason, where_event, outside_location || null, admin_id, student_id]
        );

        const transaction_id = transResult.insertId;
        const rentalItemValues = item_ids.map(item_id => [transaction_id, item_id, 'Pending']);

        await dbConn.query('INSERT INTO Rental_Items (transaction_id, item_id, status) VALUES ?', [rentalItemValues]);

        dbConn.query(
            'INSERT INTO Admin_Activity_Logs (action_type, action_details, admin_id, target_transaction_id) VALUES (?, ?, ?, ?)',
            ['Approve Loan', `Transaction ${transaction_id} submitted by student ${student_id}`, admin_id, transaction_id]
        );

        return res.json({ error: false, data: { transaction_id }, message: 'Rental request submitted successfully.' });
    } catch (err) {
        return res.status(500).json({ error: true, message: err.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});