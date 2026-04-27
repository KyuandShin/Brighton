'use client';

import { useState, useEffect } from 'react';
import { Users, Edit, Trash2, Eye, Search } from 'lucide-react';
import Image from 'next/image';

interface StudentAdmin {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: string;
  };
  schoolLevel: string;
  gradeLevel: number | null;
  schoolName: string | null;
  parentEmail: string | null;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/students')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setStudents(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) =>
    search === '' ||
    s.user.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-p-purple rounded-2xl flex items-center justify-center">
            <Users size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-text-main">Student Management</h2>
            <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
              View and manage all registered students
            </p>
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or email..."
          className="w-full bg-white border-2 border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-text-main focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-border overflow-hidden animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 border-b border-border h-24 bg-surface-elevated" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-border rounded-[40px] p-16 text-center space-y-4">
          <Users size={40} className="mx-auto text-text-muted" />
          <p className="text-sm font-black uppercase tracking-widest text-text-muted">No students found</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-border overflow-hidden">
          {filtered.map((student) => (
            <div key={student.id} className="p-6 border-b border-border last:border-0">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative w-14 h-14 shrink-0">
                    <Image
                      src={student.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.user.email}`}
                      alt={student.user.name ?? 'Student'}
                      fill
                      className="rounded-2xl bg-surface-elevated object-cover"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-black text-lg text-text-main truncate">
                      {student.user.name ?? 'Unnamed Student'}
                    </h3>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight">
                      {student.user.email}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-p-purple rounded-full text-[9px] font-black uppercase text-primary">
                        {student.schoolLevel}
                      </span>
                      {student.gradeLevel && (
                        <span className="px-2 py-0.5 bg-p-blue rounded-full text-[9px] font-black uppercase text-blue-600">
                          Grade {student.gradeLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button className="p-2.5 bg-surface-elevated rounded-xl hover:bg-primary hover:text-white transition-all text-text-muted">
                    <Eye size={16} />
                  </button>
                  <button className="p-2.5 bg-p-blue text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                    <Edit size={16} />
                  </button>
                  <button className="p-2.5 bg-p-rose text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
