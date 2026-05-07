'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Info, Check, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | null;

export default function AttendancePage() {
  const [students, setStudents] = useState([
    { id: '1', name: 'Sarah Jenkins', status: 'present' as AttendanceStatus, time: '8:42 AM', notes: '' },
    { id: '2', name: 'Leo Martinez', status: 'absent' as AttendanceStatus, time: null, notes: 'Called in sick' },
    { id: '3', name: 'Zoe Wong', status: null as AttendanceStatus, time: null, notes: '' },
    { id: '4', name: 'Elias Thorne', status: 'present' as AttendanceStatus, time: '8:50 AM', notes: '' },
    { id: '5', name: 'Mia Chen', status: 'late' as AttendanceStatus, time: '9:15 AM', notes: 'Traffic' },
    { id: '6', name: 'Jackson Lee', status: null as AttendanceStatus, time: null, notes: '' },
    { id: '7', name: 'Ava Patel', status: null as AttendanceStatus, time: null, notes: '' },
    { id: '8', name: 'Noah Davis', status: 'present' as AttendanceStatus, time: '8:35 AM', notes: '' },
  ]);
  const { toast } = useToast();

  const handleAction = (actionName: string) => {
    toast({
      title: `${actionName} saved`,
      description: "Attendance updates have been stored in the demo register.",
    });
  };

  const markStatus = (id: string, status: AttendanceStatus) => {
    setStudents(students.map(s => {
      if (s.id === id) {
        const time = status === 'present' || status === 'late' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
        return { ...s, status, time: s.status !== status ? time : s.time }; // Only update time if status changes
      }
      return s;
    }));
  };

  const markedCount = students.filter(s => s.status !== null).length;
  const presentCount = students.filter(s => s.status === 'present' || s.status === 'late').length;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Morning Attendance</h1>
          <p className="text-sm text-slate-500">Primary A (Elm Room) • Tuesday, October 24</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Input 
              type="text" 
              placeholder="Search student..." 
              className="pl-9 border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <Button onClick={() => handleAction('Save Register')} className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm shrink-0">
            Save Register
          </Button>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="mb-6 border-slate-100 shadow-sm bg-slate-50 relative overflow-hidden">
        <div 
          className="absolute left-0 top-0 bottom-0 bg-montessori-primary/10 transition-all duration-500" 
          style={{ width: `${(markedCount / students.length) * 100}%` }}
        />
        <CardContent className="p-4 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-montessori-primary font-bold shadow-sm">
              {markedCount}/{students.length}
            </div>
            <div>
              <p className="font-medium text-slate-900">Attendance Register</p>
              <p className="text-sm text-slate-500">
                {markedCount === students.length ? 'All students marked.' : `${students.length - markedCount} students left to mark.`}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900">{presentCount} Present</p>
            <p className="text-xs text-slate-500">Currently in class</p>
          </div>
        </CardContent>
      </Card>

      {/* Roster List */}
      <div className="space-y-3">
        {students.map((student) => (
          <Card key={student.id} className={`border-slate-100 shadow-sm overflow-hidden transition-all ${student.status === null ? 'hover:border-montessori-primary/50' : ''}`}>
            <CardContent className="p-0 flex flex-col sm:flex-row items-center">
              
              <div className="p-4 flex-1 flex items-center gap-4 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium shrink-0 transition-colors ${
                  student.status === 'present' || student.status === 'late' ? 'bg-emerald-100 text-emerald-700' :
                  student.status === 'absent' || student.status === 'excused' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{student.name}</h3>
                  {student.time ? (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> In at {student.time}
                    </p>
                  ) : student.notes ? (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Info className="w-3 h-3" /> {student.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Not marked yet</p>
                  )}
                </div>
              </div>

              <div className="p-3 w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 bg-slate-50/50">
                <Button 
                  variant={student.status === 'present' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => markStatus(student.id, 'present')}
                  className={student.status === 'present' ? 'bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto shadow-sm' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 w-full sm:w-auto'}
                >
                  {student.status === 'present' && <Check className="w-3.5 h-3.5 mr-1" />}
                  Present
                </Button>
                
                <Button 
                  variant={student.status === 'late' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => markStatus(student.id, 'late')}
                  className={student.status === 'late' ? 'bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto shadow-sm' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 w-full sm:w-auto'}
                >
                  Late
                </Button>

                <Button 
                  variant={student.status === 'absent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => markStatus(student.id, 'absent')}
                  className={student.status === 'absent' ? 'bg-rose-500 hover:bg-rose-600 text-white w-full sm:w-auto shadow-sm' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 w-full sm:w-auto'}
                >
                  Absent
                </Button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
      
    </div>
  );
}
