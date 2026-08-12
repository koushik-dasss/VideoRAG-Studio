const mongoose = require('mongoose');

// One segment = one line of Whisper transcript with timestamp
const timelineSegmentSchema = new mongoose.Schema({
  start: {
    type: Number,
    required: true,
  },
  end: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    default: '',
  },
  isKeyPoint: {
    type: Boolean,
    default: false,
  },
});

// One flashcard sub-unit
const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer:   { type: String, required: true },
  topic:    { type: String },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
});

// One quiz question (MCQ)
const quizQuestionSchema = new mongoose.Schema({
  question:      { type: String, required: true },
  options:       [String],
  correctOption: { type: Number },
  explanation:   { type: String },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
});

// Main Lecture schema
const lectureSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title:   { type: String, required: true },
    subject: { type: String, default: '' },
    language:{ type: String, default: 'English' },
    fileType: {
      type: String,
      enum: ['video', 'audio', 'pdf', 'pptx', 'youtube'],
      required: true,
    },
    fileUrl:    { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
    duration:   { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['uploading', 'transcribing', 'processing', 'done', 'failed'],
      default: 'uploading',
    },
    rawTranscript: { type: String, default: '' },
    timeline: [timelineSegmentSchema],
    summaryShort:    { type: String, default: '' },
    summaryDetailed: { type: String, default: '' },
    notes:           { type: String, default: '' },
    flashcards:      [flashcardSchema],
    quizQuestions:   [quizQuestionSchema],
    keyTopics:       [String],
    formulas:        [String],
  },
  {
    timestamps: true,
  }
);

// Performance Indexes
lectureSchema.index({ userId: 1, createdAt: -1 });
lectureSchema.index({ status: 1 });

module.exports = mongoose.model('Lecture', lectureSchema);