'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatDateTime,
  getActivityPostsForStudent,
  getAllObservations,
  getRoleUser,
  getStudentObservations,
  getTeacherStudents,
  useDemoStore,
} from '@/lib/mock/demo-store';
import { BookOpen, Camera, Users } from 'lucide-react';

export default function TeacherDashboardPage() {
  const snapshot = useDemoStore();
  const teacher = getRoleUser('teacher');
  const students = getTeacherStudents(teacher.id);
  const recentObs = getAllObservations().slice(0, 4);

  const totalPosts = snapshot.activityPosts.length;
  const totalObs = snapshot.observations.length;
  const presentToday = students.length; // All present in demo

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">My Classroom</h1>
          <p className="text-sm text-slate-500 mt-1">
            Nurture House Montessori — {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="bg-white border-slate-200 gap-2">
            <Link href="/teacher/observations"><BookOpen className="w-4 h-4" /> Observations</Link>
          </Button>
          <Button asChild className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2">
            <Link href="/teacher/activity"><Camera className="w-4 h-4" /> Post Activity</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Students', value: students.length, sub: 'on roll' },
          { label: 'Present Today', value: presentToday, sub: `of ${students.length}` },
          { label: 'Observations', value: totalObs, sub: 'logged' },
          { label: 'Activity Posts', value: totalPosts, sub: 'published' },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-serif text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Classroom roster */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Classroom Roster</CardTitle>
            <Link href="/teacher/students" className="text-xs text-montessori-primary font-medium hover:underline">
              Full profiles →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-50">
            {students.map((student) => {
              const obsCount = getStudentObservations(student.id).length;
              const postCount = getActivityPostsForStudent(student.id).length;
              return (
                <div key={student.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className={`w-9 h-9 rounded-full ${student.avatarColor} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                    {student.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.classroom} · {student.ageGroup}</p>
                  </div>
                  {student.allergies.length > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50 hidden sm:flex">
                      ⚠ {student.allergies[0]}
                    </Badge>
                  )}
                  <div className="text-right hidden sm:block shrink-0">
                    <p className="text-xs text-slate-400">{obsCount} obs · {postCount} posts</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button asChild variant="outline" size="sm" className="text-xs bg-white">
                      <Link href={`/teacher/observations/${student.id}`}>Observe</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="text-xs bg-white hidden sm:flex">
                      <Link href="/teacher/activity">Post</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent observations */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Observations</CardTitle>
            <Link href="/teacher/observations" className="text-xs text-montessori-primary font-medium hover:underline">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentObs.map((obs) => {
            const student = snapshot.students.find((s) => s.id === obs.studentId);
            return (
              <div key={obs.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${student?.avatarColor ?? 'bg-slate-300'} text-white flex items-center justify-center text-[10px] font-bold`}>
                      {student?.name.split(' ').map((n) => n[0]).join('') ?? '?'}
                    </div>
                    <span className="text-sm font-medium text-slate-800">{student?.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${obs.leaf.areaTone.soft} ${obs.leaf.areaTone.text} ${obs.leaf.areaTone.border}`}
                    >
                      {obs.leaf.areaName} · {obs.leaf.activityName}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 shrink-0">{formatDateTime(obs.createdAt)}</p>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{obs.content}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
