import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Check, Upload, Download } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Classes() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [session, setSession] = useState('');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Edit state
  const [editingClass, setEditingClass] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editSession, setEditSession] = useState('');

  function loadClasses() {
    api.get('/classes').then(({ data }) => setClasses(data.classes)).catch(() => {});
  }

  useEffect(loadClasses, []);

  async function createClass(e) {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a class name');
      return;
    }
    
    setCreating(true);
    try {
      await api.post('/classes', { 
        name: name.trim(), 
        section: section.trim() || null,
        subject: subject.trim() || null,
        session: session.trim() || null
      });
      setName(''); 
      setSection('');
      setSubject('');
      setSession('');
      loadClasses();
      alert('Class created successfully!');
    } catch (err) {
      console.error('Create class error:', err);
      alert(err.response?.data?.error || 'Failed to create class.');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(c) {
    setEditingClass(c.id);
    setEditName(c.name);
    setEditSection(c.section || '');
    setEditSubject(c.subject || '');
    setEditSession(c.session || '');
  }

  function cancelEdit() {
    setEditingClass(null);
    setEditName('');
    setEditSection('');
    setEditSubject('');
    setEditSession('');
  }

  async function saveEdit(classId) {
    if (!editName.trim()) {
      alert('Please enter a class name');
      return;
    }
    
    try {
      await api.put(`/classes/${classId}`, {
        name: editName.trim(),
        section: editSection.trim() || null,
        subject: editSubject.trim() || null,
        session: editSession.trim() || null
      });
      cancelEdit();
      loadClasses();
      if (selected?.id === classId) {
        setSelected(prev => prev ? { ...prev, name: editName, section: editSection, subject: editSubject, session: editSession } : null);
      }
    } catch (err) {
      console.error('Edit class error:', err);
      alert(err.response?.data?.error || 'Failed to update class.');
    }
  }

  async function deleteClass(classId) {
    if (!confirm('Are you sure you want to delete this class? All enrolled students will be removed.')) {
      return;
    }
    
    try {
      await api.delete(`/classes/${classId}`);
      if (selected?.id === classId) {
        setSelected(null);
        setStudents([]);
      }
      loadClasses();
    } catch (err) {
      console.error('Delete class error:', err);
      alert(err.response?.data?.error || 'Failed to delete class.');
    }
  }

  async function openClass(c) {
    setSelected(c);
    setMessage('');
    try {
      const { data } = await api.get(`/classes/${c.id}/students`);
      setStudents(data.students);
    } catch (err) {
      console.error('Load students error:', err);
    }
  }

  async function inviteStudent(e) {
    e.preventDefault();
    setMessage('');
    try {
      await api.post(`/classes/${selected.id}/students`, { 
        email: inviteEmail,
        roll_number: rollNumber || null
      });
      setInviteEmail('');
      setRollNumber('');
      const { data } = await api.get(`/classes/${selected.id}/students`);
      setStudents(data.students);
      setMessage('Student enrolled successfully!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not enroll student.');
    }
  }

  async function handleBulkUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setMessage('');
    try {
      const { data } = await api.post(`/classes/${selected.id}/students/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(data.message);
      // Reload students list
      const studentsRes = await api.get(`/classes/${selected.id}/students`);
      setStudents(studentsRes.data.students);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not upload file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function removeStudent(studentId) {
    if (!confirm('Remove this student from the class?')) return;
    try {
      await api.delete(`/classes/${selected.id}/students/${studentId}`);
      const { data } = await api.get(`/classes/${selected.id}/students`);
      setStudents(data.students);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not remove student.');
    }
  }

  function downloadSampleExcel() {
    // Create sample CSV content
    const csvContent = 'name,email,roll_number\nJohn Doe,john@school.edu,001\nJane Smith,jane@school.edu,002';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Classes</h1>
        <p className="text-ink/50 text-sm mt-1">Organize students into classes and sections.</p>
      </div>

      {user?.role === 'teacher' && (
        <form onSubmit={createClass} className="card flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="label">Class name</label>
            <input className="input" placeholder="Physics 101" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="label">Section</label>
            <input className="input" placeholder="Class 3A, Honors…" value={section} onChange={(e) => setSection(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="label">Subject</label>
            <input className="input" placeholder="Physics, Math…" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="label">Session</label>
            <input className="input" placeholder="2024-2025, Spring…" value={session} onChange={(e) => setSession(e.target.value)} />
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            <Plus size={16} /> {creating ? 'Creating...' : 'Add class'}
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Classes</h2>
          <div className="space-y-2">
            {classes.map((c) => (
              <div key={c.id} className={`rounded-lg transition ${selected?.id === c.id ? 'bg-brand-50' : 'hover:bg-[#F7F6FC]'}`}>
                {editingClass === c.id ? (
                  <div className="p-3 space-y-2">
                    <input className="input text-sm" placeholder="Class name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <input className="input text-sm" placeholder="Section" value={editSection} onChange={(e) => setEditSection(e.target.value)} />
                    <input className="input text-sm" placeholder="Subject" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
                    <input className="input text-sm" placeholder="Session" value={editSession} onChange={(e) => setEditSession(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(c.id)} className="btn-primary text-xs py-1 px-3"><Check size={14} /> Save</button>
                      <button onClick={cancelEdit} className="btn-secondary text-xs py-1 px-3"><X size={14} /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <button onClick={() => openClass(c)} className="text-left flex-1">
                      <p className="font-medium text-sm">{c.name} {c.section ? `· ${c.section}` : ''}</p>
                      {c.subject && <p className="text-xs text-ink/60">📚 {c.subject}</p>}
                      {c.session && <p className="text-xs text-ink/40">📅 {c.session}</p>}
                      {user?.role === 'teacher' && <p className="text-xs text-ink/40 mt-1">{c.student_count} students</p>}
                    </button>
                    {user?.role === 'teacher' && (
                      <div className="flex gap-1 ml-2">
                        <button onClick={(e) => { e.stopPropagation(); startEdit(c); }} className="p-1 hover:bg-gray-200 rounded" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteClass(c.id); }} className="p-1 hover:bg-red-100 rounded text-red-500" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {classes.length === 0 && <p className="text-sm text-ink/40 text-center py-8">No classes yet.</p>}
          </div>
        </div>

        {selected && (
          <div className="card">
            <h2 className="font-semibold mb-1">{selected.name} roster</h2>
            {selected.subject && <p className="text-sm text-ink/60">📚 {selected.subject}</p>}
            {selected.session && <p className="text-sm text-ink/40 mb-3">📅 {selected.session}</p>}
            
            {user?.role === 'teacher' && (
              <>
                <form onSubmit={inviteStudent} className="flex flex-wrap gap-2 mb-3">
                  <input
                    type="email" required className="input flex-1 min-w-[180px]" placeholder="student@school.edu"
                    value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <input
                    type="text" className="input w-24" placeholder="Roll No"
                    value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
                  />
                  <button className="btn-secondary shrink-0">Enroll</button>
                </form>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleBulkUpload}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    id="bulk-upload"
                  />
                  <label htmlFor="bulk-upload" className="btn-secondary text-xs cursor-pointer flex items-center gap-1">
                    <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Excel'}
                  </label>
                  <button onClick={downloadSampleExcel} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                    <Download size={14} /> Sample
                  </button>
                </div>
              </>
            )}
            
            {message && <p className="text-xs text-brand-600 mb-3">{message}</p>}
            
            <div className="divide-y divide-black/5">
              {students.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{s.name}</span>
                    {s.roll_number && <span className="text-xs text-brand-600 ml-2">(Roll: {s.roll_number})</span>}
                    <span className="text-ink/40 text-xs ml-2">{s.email}</span>
                  </div>
                  {user?.role === 'teacher' && (
                    <button onClick={() => removeStudent(s.id)} className="text-red-500 hover:text-red-700" title="Remove student">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {students.length === 0 && <p className="text-sm text-ink/40 text-center py-8">No students enrolled yet.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}