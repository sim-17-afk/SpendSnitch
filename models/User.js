const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // Basic Information
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    
    // Profile Customization
    bio: { 
        type: String, 
        default: "💎 Emotionally stable. Financially questionable." 
    },

    // Financial Tracking
    // We use 'savings' to match your server.js logic: user.savings += amount
    savings: { 
        type: Number, 
        default: 0 
    },

    // Transaction History
    // This array stores every income and expense for the dashboard list
    transactions: [{
        type: { 
            type: String, 
            enum: ['income', 'expense'],
            required: true 
        },
        amount: { 
            type: Number, 
            required: true 
        },
        category: { 
            type: String, 
            default: 'General' 
        },
        date: { 
            type: Date, 
            default: Date.now 
        }
    }]
}, { 
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('User', UserSchema);