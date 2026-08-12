const mongoose = require('mongoose');
require('dotenv').config({path: '../../.env'});
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  const { ProcessingJob } = require('./src/models/ProcessingJob');
  const { Lecture } = require('./src/models/Lecture');
  
  const jobs = await ProcessingJob.deleteMany({ status: { $ne: 'completed' } });
  const lectures = await Lecture.deleteMany({ status: { $ne: 'done' } });
  
  console.log('Cleaned up jobs:', jobs.deletedCount);
  console.log('Cleaned up lectures:', lectures.deletedCount);
  process.exit(0);
}).catch((err: Error) => {
  console.error('Error:', err.message);
  process.exit(1);
});
