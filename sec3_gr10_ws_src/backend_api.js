const express = require('express');
const dotenv = require("dotenv");
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
const router = express.Router();

app.use(express.json()); // Essential for parsing JSON from your frontend
app.use(express.urlencoded({ extended: true }));
app.use('/', router);

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
router.post('/api/ai-assist', async (req, res) => {
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