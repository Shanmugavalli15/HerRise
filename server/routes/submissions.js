const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');

// @route   POST api/submissions
// @desc    Submit contact form
// @access  Public
router.post('/', async (req, res) => {
  const { name, email, phone, type, message } = req.body;

  // Manual server-side validation check
  if (!name || !email || !phone || !type || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const validTypes = ['general', 'volunteer', 'donation', 'partnership'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid submission type' });
  }

  try {
    const newSubmission = new Submission({
      name,
      email,
      phone,
      type,
      message,
    });

    const submission = await newSubmission.save();
    res.status(201).json({
      success: true,
      message: 'Form Submitted Successfully',
      referenceId: submission.referenceId,
      data: submission,
    });
  } catch (err) {
    console.error('Submission save error:', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/submissions/stats
// @desc    Get aggregated submissions stats by type
// @access  Private (Admin)
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Submission.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Format the stats to ensure all types are represented, even if 0
    const allTypes = ['general', 'volunteer', 'donation', 'partnership'];
    const formattedStats = {};
    
    // Initialize default values
    allTypes.forEach(type => {
      formattedStats[type] = 0;
    });

    // Populate with actual DB counts
    stats.forEach(stat => {
      if (allTypes.includes(stat._id)) {
        formattedStats[stat._id] = stat.count;
      }
    });

    formattedStats.total = stats.reduce((sum, item) => sum + item.count, 0);

    res.json(formattedStats);
  } catch (err) {
    console.error('Stats fetch error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/submissions
// @desc    Get all submissions with search and filter
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
  try {
    const { search, type } = req.query;
    let query = {};

    // Filter by type if provided
    if (type && type !== 'all') {
      query.type = type;
    }

    // Text search if search term provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { referenceId: searchRegex },
      ];
    }

    // Sort: newest first
    const submissions = await Submission.find(query).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    console.error('Submissions fetch error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE api/submissions/:id
// @desc    Delete a submission
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    await Submission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Submission removed successfully' });
  } catch (err) {
    console.error('Submission deletion error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
