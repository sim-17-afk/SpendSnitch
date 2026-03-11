const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User'); // Imports your new User.js model

const app = express();
// const PORT = 5000;

// Middleware
app.use(cors()); 
app.use(express.json());

// Database Connection
const mongoURI = "mongodb+srv://sawantsimoni:SIMONI5555@cluster0.rrwbcsh.mongodb.net/SpendWiseDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Connected to SpendWise Database!"))
    .catch(err => console.log("❌ Connection error:", err));

// --- ROUTES ---

// 1. SIGNUP
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already registered!" });

        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ message: "Account created!" });
    } catch (err) {
        res.status(500).json({ error: "Registration failed." });
    }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && user.password === password) {
            res.json({ name: user.name, email: user.email, balance: user.balance });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: "Login failed." });
    }
});

// 3. FETCH USER DATA (For Dashboard & Profile Load)
app.get('/api/user-data', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.query.email });
        if (!user) return res.status(404).json({ error: "User not found" });
        
        res.json({ 
            name: user.name,
            email: user.email,
            bio: user.bio,
            savings: user.balance, 
            transactions: user.transactions,
            createdAt: user.createdAt // <-- ADDED THIS LINE to send the date to the profile page
        });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// 4. ADD TRANSACTION
// app.post('/api/transaction', async (req, res) => {
//     try {
//         const { email, amount, type, category } = req.body;
//         const user = await User.findOne({ email });
//         if (!user) return res.status(404).json({ error: "User not found" });

//         // Update Balance
//         if (type === 'income') {
//             user.balance += Number(amount);
//         } else {
//             user.balance -= Number(amount);
//         }

//         user.transactions.push({ type, amount, category });
//         await user.save();
        
//         res.json({ newTotal: user.balance, transactions: user.transactions });
//     } catch (err) {
//         res.status(500).json({ error: "Transaction failed." });
//     }
// });



// --- UPDATED ADD TRANSACTION ---
app.post("/api/transaction", async (req, res) => {
  const { email, amount, type, category } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const newTransaction = {
      amount: parseFloat(amount),
      type: type, 
      category: category || "Other",
      date: new Date()
    };

    user.transactions.push(newTransaction);

    // Standardized to 'savings'
    if (type === "income") {
      user.savings = (user.savings || 0) + newTransaction.amount;
    } else {
      user.savings = (user.savings || 0) - newTransaction.amount;
    }

    await user.save();
    res.status(200).json({ message: "Transaction successful", savings: user.savings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 5. DELETE TRANSACTION
// --- UPDATED DELETE TRANSACTION ---
app.post('/api/delete-transaction', async (req, res) => {
    try {
        const { email, transactionId } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Remove the transaction
        user.transactions = user.transactions.filter(tx => tx._id.toString() !== transactionId);

        // Recalculate 'savings' (Not balance!)
        user.savings = user.transactions.reduce((acc, curr) => {
            return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
        }, 0);

        await user.save();
        res.json({ success: true, newTotal: user.savings });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

// 6. UPDATE PROFILE (Name & Bio)
app.post('/api/update-profile', async (req, res) => {
    try {
        const { email, name, bio } = req.body;
        const user = await User.findOneAndUpdate(
            { email: email },
            { name: name, bio: bio },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Cloud sync complete", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. RESET DATA (Wipe Transactions)
app.post('/api/reset-data', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOneAndUpdate(
            { email: email },
            { $set: { transactions: [], savings: 0 } }, // Reset 'savings'
            { new: true }
        );
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ message: "Data wiped successfully" });
    } catch (err) {
        res.status(500).json({ error: "Reset failed" });
    }
});
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
// });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});