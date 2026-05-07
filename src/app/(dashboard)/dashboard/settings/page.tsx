'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Bell, Shield, Users, Mail, CreditCard, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  
  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your changes have been updated successfully.',
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">School Settings</h1>
          <p className="text-sm text-slate-500">Manage your institution's profile, users, and billing preferences.</p>
        </div>
        
        <Button onClick={handleSave} className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2">
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-8 bg-transparent gap-4 overflow-x-auto w-full justify-start h-auto p-0 rounded-none border-b border-slate-200">
          <TabsTrigger value="general" className="data-[state=active]:border-montessori-primary data-[state=active]:text-montessori-primary border-b-2 border-transparent rounded-none px-4 py-3 font-medium text-slate-500 gap-2">
            <Building2 className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:border-montessori-primary data-[state=active]:text-montessori-primary border-b-2 border-transparent rounded-none px-4 py-3 font-medium text-slate-500 gap-2">
            <Users className="w-4 h-4" /> Team & Staff
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:border-montessori-primary data-[state=active]:text-montessori-primary border-b-2 border-transparent rounded-none px-4 py-3 font-medium text-slate-500 gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:border-montessori-primary data-[state=active]:text-montessori-primary border-b-2 border-transparent rounded-none px-4 py-3 font-medium text-slate-500 gap-2">
            <CreditCard className="w-4 h-4" /> Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium text-slate-900 mb-2">School Profile</h3>
              <p className="text-sm text-slate-500">Basic information about your Montessori program that will be displayed to parents.</p>
            </div>
            <div className="md:col-span-2">
              <Card className="border-slate-100 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">School Name</label>
                    <Input defaultValue="Nurture House Montessori" className="border-slate-200" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Contact Email</label>
                      <Input defaultValue="admin@nurturehouse.edu" className="border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Phone</label>
                      <Input defaultValue="(555) 123-4567" className="border-slate-200" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Campus Address</label>
                    <Input defaultValue="123 Discovery Way, Childville, ST 12345" className="border-slate-200" />
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-medium text-slate-900 mb-3">Programs Offered</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none px-3 py-1">Nido (0-18mo)</Badge>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-none px-3 py-1">Toddler (18mo-3y)</Badge>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none px-3 py-1">Primary (3-6y)</Badge>
                      <Badge variant="outline" className="border-dashed border-slate-300 text-slate-500 px-3 py-1 cursor-pointer hover:bg-slate-50">
                        + Add Program
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="team" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium text-slate-900 mb-2">Staff Directory</h3>
              <p className="text-sm text-slate-500">Manage teacher and administrative access to the platform.</p>
            </div>
            <div className="md:col-span-2">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-medium">Active Users</CardTitle>
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    <Shield className="w-3 h-3" /> Invite User
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y divide-slate-100">
                     {[
                       { name: 'Sarah Jenkins', email: 's.jenkins@nurturehouse.edu', role: 'Lead Teacher', status: 'Active' },
                       { name: 'Elena Rodriguez', email: 'e.rodriguez@nurturehouse.edu', role: 'Admin', status: 'Active' },
                       { name: 'Michael Chang', email: 'm.chang@nurturehouse.edu', role: 'Guide', status: 'Pending' },
                     ].map((user, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm">
                               {user.name.charAt(0)}
                             </div>
                             <div>
                               <p className="text-sm font-medium text-slate-900">{user.name}</p>
                               <p className="text-xs text-slate-500">{user.email}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <Badge variant="secondary" className={`${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} border-none`}>
                               {user.status}
                             </Badge>
                             <span className="text-sm text-slate-600 w-24">{user.role}</span>
                          </div>
                        </div>
                     ))}
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Additional tabs could be fully implemented here, keeping it concise for now */}
        <TabsContent value="notifications" className="mt-0">
           <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-10 text-center">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-slate-400" />
                 </div>
                 <h3 className="text-lg font-medium text-slate-900 mb-2">Notification Preferences</h3>
                 <p className="text-sm text-slate-500 max-w-sm mx-auto">Configure automated email digests, SMS alerts for emergencies, and daily parent update schedules.</p>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-0">
           <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-10 text-center">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-slate-400" />
                 </div>
                 <h3 className="text-lg font-medium text-slate-900 mb-2">Subscription & Billing</h3>
                 <p className="text-sm text-slate-500 max-w-sm mx-auto">Manage your platform subscription, view past invoices, and update payment methods.</p>
              </CardContent>
           </Card>
        </TabsContent>
        
      </Tabs>
    </div>
  );
}
