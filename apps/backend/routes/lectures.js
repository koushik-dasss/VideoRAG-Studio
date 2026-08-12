const express = require('express');
const router  = express.Router();
const Lecture = require('../models/Lecture'); // Highly critical matching capital L

// GET /api/lectures/user/:userId -> List all lectures for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const lectures = await Lecture.find({ userId: req.params.userId })
      .select('title subject status duration keyTopics fileType createdAt')
      .sort({ createdAt: -1 });
    res.json(lectures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lectures/:id -> Get complete details of one lecture
router.get('/:id', async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });
    res.json(lecture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lectures/:id/timeline -> Lightweight timeline only endpoint
router.get('/:id/timeline', async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id).select('title duration timeline');
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });
    res.json(lecture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lectures -> Initialize a new entry document
router.post('/', async (req, res) => {
  try {
    const { userId, title, subject, fileType, fileUrl, youtubeUrl, language } = req.body;
    const lecture = new Lecture({
      userId,
      title,
      subject,
      fileType,
      fileUrl,
      youtubeUrl,
      language,
      status: 'uploading',
    });
    await lecture.save();
    res.status(201).json({
      message: 'Lecture initialization tracking created',
      lectureId: lecture._id,
      lecture,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/lectures/:id -> Incremental pipeline updates (AI content, timestamps)
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Lecture.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Lecture not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/lectures/:id -> Delete a lecture complete profile
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Lecture.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Lecture not found' });
    res.json({ message: 'Lecture deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

