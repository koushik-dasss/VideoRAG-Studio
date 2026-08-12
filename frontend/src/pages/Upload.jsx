import { useState } from 'react';
import { createLecture } from '../services/lectureService';

export default function Upload() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    try {
      setStatus('Creating...');
      const res = await createLecture({
        userId: '000000000000000000000001', // hardcode for now, auth later
        title,
        subject,
        fileType: 'video',
      });
      setStatus('Created! ID: ' + res.data.lectureId);
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Upload Lecture</h2>
      <input placeholder="Title" value={title} 
        onChange={e => setTitle(e.target.value)} style={{ display: 'block', margin: '10px 0' }} />
      <input placeholder="Subject" value={subject} 
        onChange={e => setSubject(e.target.value)} style={{ display: 'block', margin: '10px 0' }} />
      <button onClick={handleSubmit}>Create</button>
      <p>{status}</p>
    </div>
  );
}