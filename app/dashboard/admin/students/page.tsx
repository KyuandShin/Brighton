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
      .then((data) => {
        if (Array.isArray(data)) setStudents(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s => {
    return search === '' || 
      s.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.user.email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#748ffc]/10 rounded-2xl flex items-center justify-center">
            <Users size={24} className="text-[#748ffc]" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#2c3e50]">Student Management</h2>
            <p className="text-[#7f8c8d] font-bold text-xs uppercase tracking-widest">
              View and manage all registered students
            </p>
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or email..."
          className="w-full bg-white border-2 border-[#f1f3f5] rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-[#2c3e50] focus:outline-none focus:border-[#748ffc] transition-all placeholder:text-[#adb5bd]"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-[#f1f3f5] overflow-hidden animate-pulse">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="p-6 border-b border-[#f1f3f5] h-24 bg-[#f8f9fa]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#e9ecef] rounded-[40px] p-16 text-center space-y-4">
          <Users size={40} className="mx-auto text-[#adb5bd]" />
          <p className="text-sm font-black uppercase tracking-widest text-[#adb5bd]">
            No students found
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#f1f3f5] overflow-hidden">
          {filtered.map((student) => (
            <div 
              key={student.id} 
              className="p-6 border-b border-[#f1f3f5] last:border-0"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative w-14 h-14 shrink-0">
                    <Image
                      src={student.user.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.user.email}`}
                      alt={student.user.name ?? 'Student'}
                      fill
                      className="rounded-2xl bg-[#f8f9fa] object-cover"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-black text-lg text-[#2c3e50] truncate">
                      {student.user.name ?? 'Unnamed Student'}
                    </h3>
                    <p className="text-[10px] font-bold text-[#7f8c8d] uppercase tracking-tight">
                      {student.user.email}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-[#f8f9fa] rounded-full text-[9px] font-black uppercase text-[#748ffc]">
                        {student.schoolLevel}
                      </span>
                      {student.gradeLevel && (
                        <span className="px-2 py-0.5 bg-[#f8f9fa] rounded-full text-[9px] font-black uppercase text-[#748ffc]">
                          Grade {student.gradeLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button className="p-2.5 bg-[#f8f9fa] rounded-xl hover:bg-[#748ffc] hover:text-white transition-all">
                    <Eye size={16} />
                  </button>
                  <button className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                    <Edit size={16} />
                  </button>
                  <button className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
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