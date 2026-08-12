import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLecture } from '../services/lectureService';
import { NotificationService } from '../services/NotificationService';
import MainLayout from '../layouts/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileVideo, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      setStatus('error');
      setErrorMessage('Title and Video File are required');
      NotificationService.error('Title and Video File are required');
      return;
    }

    try {
      setStatus('uploading');
      const formData = new FormData();
      formData.append('userId', '64a1b2c3d4e5f6a7b8c9d0e1');
      formData.append('title', title);
      formData.append('subject', subject);
      formData.append('fileType', 'video');
      formData.append('file', file);

      NotificationService.info('Upload started...');
      await createLecture(formData);
      
      setStatus('success');
      NotificationService.success('Video uploaded successfully!');
      
      setTimeout(() => {
        navigate('/processing');
      }, 1000);
      
    } catch (err) {
      setStatus('error');
      const msg = err.response?.data?.error?.message || err.message;
      setErrorMessage(msg);
      NotificationService.error(`Upload failed: ${msg}`);
    }
  };

  return (
    <MainLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Upload Lecture</h1>
          <p className="text-slate-400 mt-2 text-lg">Upload a video to automatically generate transcripts, chapters, and vector embeddings.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Lecture Title *</label>
              <input 
                type="text" 
                placeholder="e.g. Introduction to Neural Networks" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject / Category</label>
              <input 
                type="text" 
                placeholder="e.g. Computer Science" 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div 
            className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
              ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}
              ${file ? 'border-green-500/50 bg-green-500/5' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/webm,audio/mpeg,audio/wav"
              onChange={handleChange}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <div className="bg-blue-500/20 p-4 rounded-full mb-4">
                    <UploadCloud className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Click or drag video to upload</h3>
                  <p className="text-slate-400 text-sm">MP4, WEBM, or Audio formats up to 2GB</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="file"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <div className="bg-green-500/20 p-4 rounded-full mb-4">
                    <FileVideo className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">{file.name}</h3>
                  <p className="text-slate-400 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="mt-4 text-sm text-red-400 hover:text-red-300 underline"
                  >
                    Remove file
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{errorMessage}</p>
              </motion.div>
            )}
            
            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">Video uploaded successfully! It is now being processed by the AI pipeline.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={status === 'uploading'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {status === 'uploading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading & Processing...
              </>
            ) : (
              'Upload and Process Lecture'
            )}
          </button>
          
        </form>
      </motion.div>
    </MainLayout>
  );
}