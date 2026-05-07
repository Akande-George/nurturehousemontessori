'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function BulkLogPage() {
  const [activeTab, setActiveTab] = useState<'meals' | 'nap' | 'hygiene'>('meals');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [mealType, setMealType] = useState('AM Snack');
  const [mealAmount, setMealAmount] = useState('All');
  const [napDuration, setNapDuration] = useState('45 mins');
  const [hygieneType, setHygieneType] = useState('Toilet');
  const [details, setDetails] = useState('');
  const { toast } = useToast();
  
  const students = [
    { id: '1', name: 'Oliver S.', class: 'Toddler A', avatar: 'O', bg: 'bg-emerald-100 text-emerald-700' },
    { id: '2', name: 'Emma J.', class: 'Toddler A', avatar: 'E', bg: 'bg-amber-100 text-amber-700' },
    { id: '3', name: 'Noah W.', class: 'Toddler A', avatar: 'N', bg: 'bg-blue-100 text-blue-700' },
    { id: '4', name: 'Ava B.', class: 'Toddler A', avatar: 'A', bg: 'bg-emerald-100 text-emerald-700' },
    { id: '5', name: 'Lucas M.', class: 'Toddler A', avatar: 'L', bg: 'bg-amber-100 text-amber-700' },
    { id: '6', name: 'Mia C.', class: 'Toddler A', avatar: 'M', bg: 'bg-blue-100 text-blue-700' },
  ];

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const resetForm = () => {
    setDetails('');
    setMealType('AM Snack');
    setMealAmount('All');
    setNapDuration('45 mins');
    setHygieneType('Toilet');
  };

  const handleSubmit = () => {
    if (selectedStudents.length === 0) return;

    const actionLabel =
      activeTab === 'meals'
        ? `${mealType} (${mealAmount})`
        : activeTab === 'nap'
          ? `Nap (${napDuration})`
          : `Hygiene (${hygieneType})`;

    toast({
      title: 'Bulk log saved',
      description: `${actionLabel} logged for ${selectedStudents.length} student${selectedStudents.length === 1 ? '' : 's'}.`,
    });
    resetForm();
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Bulk Activity Logging</h1>
          <p className="text-sm text-slate-500">Log meals, naps, and hygiene for multiple students at once.</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="meals">Meals</TabsTrigger>
            <TabsTrigger value="nap">Naps</TabsTrigger>
            <TabsTrigger value="hygiene">Hygiene</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Selector */}
        <div className="lg:col-span-1">
          <Card className="border-slate-100 shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="font-medium text-slate-900 text-sm">Select Students</h2>
              <Button 
                variant="link"
                onClick={selectAll}
                className="text-xs font-medium text-montessori-primary p-0 h-auto"
              >
                {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {students.map(student => (
                <button
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedStudents.includes(student.id) 
                      ? 'border-montessori-primary bg-montessori-primary/5' 
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs ${
                      selectedStudents.includes(student.id) ? 'bg-montessori-primary text-white' : student.bg
                    }`}>
                      {student.avatar}
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${selectedStudents.includes(student.id) ? 'text-montessori-primary' : 'text-slate-900'}`}>
                        {student.name}
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedStudents.includes(student.id) 
                      ? 'border-montessori-primary bg-montessori-primary text-white' 
                      : 'border-slate-300'
                  }`}>
                    {selectedStudents.includes(student.id) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
              <p className="text-sm text-slate-600 font-medium text-center">
                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </Card>
        </div>

        {/* Action Form */}
        <div className="lg:col-span-2">
          <Card className="border-slate-100 shadow-sm p-6 flex flex-col relative h-[600px]">
            {selectedStudents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Students Selected</h3>
                <p className="text-sm text-slate-500 max-w-sm">Select one or more students from the left panel to log an activity for them simultaneously.</p>
              </div>
            ) : (
              <>
                {activeTab === 'meals' && (
                  <div className="flex-1 animate-in fade-in duration-300">
                    <h3 className="text-lg font-medium text-slate-900 mb-6 font-serif">Log Meal ({selectedStudents.length} students)</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Meal Type</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['AM Snack', 'Lunch', 'PM Snack'].map(type => (
                            <button
                              key={type}
                              onClick={() => setMealType(type)}
                              className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${mealType === type ? 'border-montessori-primary bg-montessori-primary/5 text-montessori-primary' : 'border-slate-200 hover:border-montessori-primary text-slate-600 hover:text-montessori-primary'}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Amount Eaten</label>
                        <div className="grid grid-cols-4 gap-3">
                          {['All', 'Most', 'Some', 'None'].map(amt => (
                            <button
                              key={amt}
                              onClick={() => setMealAmount(amt)}
                              className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${mealAmount === amt ? 'border-montessori-primary bg-montessori-primary/5 text-montessori-primary' : 'border-slate-200 hover:border-montessori-primary text-slate-600 hover:text-montessori-primary'}`}
                            >
                              {amt}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Details (Optional)</label>
                        <Textarea value={details} onChange={(e) => setDetails(e.target.value)} className="w-full rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[100px]" placeholder="e.g., Sent home uneaten sandwich..." />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'nap' && (
                  <div className="flex-1 animate-in fade-in duration-300 space-y-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-6 font-serif">Log Nap ({selectedStudents.length} students)</h3>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Nap Duration</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['30 mins', '45 mins', '60+ mins'].map((duration) => (
                          <button
                            key={duration}
                            onClick={() => setNapDuration(duration)}
                            className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${napDuration === duration ? 'border-montessori-primary bg-montessori-primary/5 text-montessori-primary' : 'border-slate-200 hover:border-montessori-primary text-slate-600 hover:text-montessori-primary'}`}
                          >
                            {duration}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Notes (Optional)</label>
                      <Textarea value={details} onChange={(e) => setDetails(e.target.value)} className="w-full rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[100px]" placeholder="e.g., Slept calmly with minimal settling support." />
                    </div>
                  </div>
                )}

                {activeTab === 'hygiene' && (
                  <div className="flex-1 animate-in fade-in duration-300 space-y-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-6 font-serif">Log Hygiene ({selectedStudents.length} students)</h3>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Hygiene Type</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Toilet', 'Diaper Change', 'Hand Wash'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setHygieneType(type)}
                            className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${hygieneType === type ? 'border-montessori-primary bg-montessori-primary/5 text-montessori-primary' : 'border-slate-200 hover:border-montessori-primary text-slate-600 hover:text-montessori-primary'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Notes (Optional)</label>
                      <Textarea value={details} onChange={(e) => setDetails(e.target.value)} className="w-full rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[100px]" placeholder="e.g., Independent handwashing completed after snack." />
                    </div>
                  </div>
                )}
                
                <div className="mt-auto pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <Button variant="outline" onClick={resetForm} className="px-6 rounded-full font-medium">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} className="px-8 rounded-full bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2">
                    Submit Log
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
