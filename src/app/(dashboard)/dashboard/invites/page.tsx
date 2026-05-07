'use client';

import { Mail, CheckCircle2, Clock, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function PortalInvitesPage() {
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Parent Portal Activation</h1>
          <p className="text-sm text-slate-500">Manage account access and invitations for enrolled families.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-medium">
            Copy Registration Link
          </Button>
          <Button className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2">
            <Mail className="w-4 h-4" /> Send Bulk Invites (3)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Pending Activation', value: '3', trend: 'Invitations sent', color: 'bg-amber-100 text-amber-700' },
          { label: 'Active Portals', value: '138', trend: 'Parents registered', color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Needs Invite', value: '5', trend: 'Newly accepted', color: 'bg-blue-100 text-blue-700' }
        ].map((metric, i) => (
          <Card key={i} className="hover-lift transition-all border-slate-100 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-serif text-slate-900">{metric.value}</h3>
                  <span className="text-xs font-medium text-slate-400">{metric.trend}</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${metric.color}`}>
                 <KeyRound className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Card className="bg-montessori-earth/10 border-montessori-earth/20 shadow-none">
          <CardContent className="p-5">
             <h3 className="font-serif font-medium text-slate-900 mb-2">Automated Flow</h3>
             <p className="text-xs text-slate-600 mb-3 leading-relaxed">Invitations are sent automatically 24 hours after an acceptance letter is created.</p>
             <Button variant="link" className="text-montessori-primary font-medium p-0 h-auto text-xs flex items-center gap-1">
               Configure Flow <ArrowRight className="w-3 h-3" />
             </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Activation Status</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Parent Name</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Student</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Email Address</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Portal Status</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Last Action</TableHead>
                <TableHead className="font-medium text-right text-xs uppercase tracking-wider text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { parent: 'Sarah Smith', student: 'Oliver S.', email: 'sarah@example.com', status: 'Active', action: 'Logged in yesterday', statusBg: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80', icon: CheckCircle2 },
                { parent: 'Mike Johnson', student: 'Emma J.', email: 'mike@example.com', status: 'Pending', action: 'Invite sent Oct 23', statusBg: 'bg-amber-100 text-amber-700 hover:bg-amber-100/80', icon: Clock },
                { parent: 'Jessica Williams', student: 'Noah W.', email: 'jess@example.com', status: 'Needs Invite', action: 'Accepted Oct 21', statusBg: 'bg-slate-100 text-slate-700 hover:bg-slate-100/80', icon: Mail },
                { parent: 'David Brown', student: 'Ava B.', email: 'david@example.com', status: 'Needs Invite', action: 'Accepted Oct 24', statusBg: 'bg-slate-100 text-slate-700 hover:bg-slate-100/80', icon: Mail },
              ].map((record, i) => (
                <TableRow key={i} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="font-medium text-slate-900">{record.parent}</TableCell>
                  <TableCell className="text-slate-600">{record.student}</TableCell>
                  <TableCell className="text-slate-500">{record.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${record.statusBg} font-medium border-none flex items-center gap-1.5 w-max`}>
                      <record.icon className="w-3.5 h-3.5" />
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">{record.action}</TableCell>
                  <TableCell className="text-right">
                    {record.status !== 'Active' && (
                      <Button variant="ghost" className="text-montessori-primary hover:text-montessori-primary/80 hover:bg-montessori-primary/5 opacity-0 group-hover:opacity-100 transition-all font-medium h-8 px-3">
                        {record.status === 'Pending' ? 'Resend' : 'Send Invite'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
