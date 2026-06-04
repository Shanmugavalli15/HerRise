const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Mongoose Model Definitions (Standard Production Path)
const submissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Submission type is required'],
    enum: {
      values: ['general', 'volunteer', 'donation', 'partnership'],
      message: 'Invalid submission type',
    },
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
  },
  referenceId: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate referenceId before saving a new mongoose document
submissionSchema.pre('save', function (next) {
  if (!this.referenceId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.referenceId = `SCF-${randomStr}`;
  }
  next();
});

const MongooseSubmission = mongoose.model('Submission', submissionSchema);

// 2. Custom JSON File-based Model (Zero-Dependency Fallback Path if MongoDB is offline)
const DATA_FILE = path.join(__dirname, '../data/submissions.json');

// Ensure data folder and file exists
const initializeLocalStore = () => {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
  } catch (err) {
    console.error('Failed to initialize fallback database file:', err.message);
  }
};

const getLocalData = () => {
  initializeLocalStore();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed reading local database file:', err.message);
    return [];
  }
};

const saveLocalData = (data) => {
  initializeLocalStore();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed writing local database file:', err.message);
  }
};

class LocalSubmission {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.type = data.type;
    this.message = data.message;
    this.createdAt = new Date();
    
    // Auto-generate reference ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.referenceId = `SCF-${randomStr}`;
  }

  async save() {
    const list = getLocalData();
    this._id = new Date().getTime().toString(36) + Math.random().toString(36).slice(2, 6);
    const doc = {
      _id: this._id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      type: this.type,
      message: this.message,
      referenceId: this.referenceId,
      createdAt: this.createdAt.toISOString()
    };
    list.push(doc);
    saveLocalData(list);
    return doc;
  }

  static async find(query = {}) {
    let list = getLocalData();
    
    // Filter by type
    if (query.type && query.type !== 'all') {
      list = list.filter(item => item.type === query.type);
    }
    
    // Text search query ($or)
    if (query.$or) {
      const criteria = query.$or.map(o => {
        const key = Object.keys(o)[0];
        const val = o[key]; // RegExp object
        return { key, regex: val };
      });
      list = list.filter(item => {
        return criteria.some(c => {
          return c.regex.test(item[c.key]);
        });
      });
    }
    
    // Sort descending by date
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }

  static async findById(id) {
    const list = getLocalData();
    return list.find(item => item._id === id) || null;
  }

  static async findByIdAndDelete(id) {
    let list = getLocalData();
    const index = list.findIndex(item => item._id === id);
    if (index !== -1) {
      const removed = list.splice(index, 1);
      saveLocalData(list);
      return removed[0];
    }
    return null;
  }

  static async aggregate(pipeline) {
    const list = getLocalData();
    const counts = {};
    list.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return Object.keys(counts).map(type => ({
      _id: type,
      count: counts[type]
    }));
  }
}

// 3. Dynamic Factory Selector (Exposes Mongoose or JSON storage depending on state)
const Submission = function (data) {
  const isMongoConnected = mongoose.connection.readyState === 1;
  if (isMongoConnected) {
    return new MongooseSubmission(data);
  } else {
    console.log('MongoDB is disconnected. Routing submission to local JSON store.');
    return new LocalSubmission(data);
  }
};

// Proxied Static methods
Submission.find = function (query) {
  const isMongoConnected = mongoose.connection.readyState === 1;
  return isMongoConnected ? MongooseSubmission.find(query) : LocalSubmission.find(query);
};

Submission.findById = function (id) {
  const isMongoConnected = mongoose.connection.readyState === 1;
  return isMongoConnected ? MongooseSubmission.findById(id) : LocalSubmission.findById(id);
};

Submission.findByIdAndDelete = function (id) {
  const isMongoConnected = mongoose.connection.readyState === 1;
  return isMongoConnected ? MongooseSubmission.findByIdAndDelete(id) : LocalSubmission.findByIdAndDelete(id);
};

Submission.aggregate = function (pipeline) {
  const isMongoConnected = mongoose.connection.readyState === 1;
  return isMongoConnected ? MongooseSubmission.aggregate(pipeline) : LocalSubmission.aggregate(pipeline);
};

module.exports = Submission;
