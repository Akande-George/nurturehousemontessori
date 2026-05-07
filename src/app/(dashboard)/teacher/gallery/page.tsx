'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Video, Filter, Share2, Tag, Search, CheckCircle2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'untagged' | 'shared'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const { toast } = useToast();

  const handleAction = (actionName: string) => {
    toast({
      title: actionName,
      description: "Media updates were applied to the selected items.",
    });
  };

  const submitUpload = () => {
    setIsUploadOpen(false);
    toast({ title: 'Media Uploaded', description: 'Your media has been successfully processed.' });
  };

  const submitTags = () => {
    setIsTagOpen(false);
    toast({ title: 'Tags Updated', description: 'The selected media has been tagged successfully.' });
  };

  // Interactive gallery data
  const [photos, setPhotos] = useState([
    { id: 1, type: 'image', date: 'Today, 10:15 AM', tags: ['Sarah J.', 'Practical Life'], shared: false, selected: false, imageUrl: 'https://picsum.photos/seed/gallery-1/640/640' },
    { id: 2, type: 'image', date: 'Today, 9:30 AM', tags: ['Noah W.', 'Elias T.', 'Sensorial'], shared: true, selected: true, imageUrl: 'https://picsum.photos/seed/gallery-2/640/640' },
    { id: 3, type: 'video', date: 'Yesterday', tags: ['Mia C.', 'Language'], shared: true, selected: false, imageUrl: 'https://picsum.photos/seed/gallery-3/640/640' },
    { id: 4, type: 'image', date: 'Yesterday', tags: [], shared: false, selected: false, imageUrl: 'https://picsum.photos/seed/gallery-4/640/640' },
    { id: 5, type: 'image', date: 'Oct 23', tags: ['Leo M.', 'Art'], shared: false, selected: false, imageUrl: 'https://picsum.photos/seed/gallery-5/640/640' },
    { id: 6, type: 'image', date: 'Oct 23', tags: ['Whole Class', 'Outdoors'], shared: true, selected: false, imageUrl: 'https://picsum.photos/seed/gallery-6/640/640' },
  ]);

  const selectedCount = photos.filter((p) => p.selected).length;
  const filteredPhotos = photos.filter((p) => {
    if (activeTab === 'untagged') return p.tags.length === 0;
    if (activeTab === 'shared') return p.shared;
    return true;
  });

  const togglePhotoSelection = (id: number) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const shareSelectedToPortal = () => {
    const selectedIds = photos.filter((p) => p.selected).map((p) => p.id);
    if (selectedIds.length === 0) return;

    setPhotos((prev) =>
      prev.map((p) => (selectedIds.includes(p.id) ? { ...p, shared: true, selected: false } : p)),
    );
    toast({
      title: 'Shared to Parent Portal',
      description: `${selectedIds.length} media item${selectedIds.length === 1 ? '' : 's'} shared successfully.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Classroom Media</h1>
          <p className="text-sm text-slate-500">Capture, tag, and share moments with parents.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleAction('Filter Media')} className="font-medium bg-white text-slate-700 shadow-sm gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button onClick={() => setIsUploadOpen(true)} className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2">
            <Plus className="w-4 h-4" /> Upload Media
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters & Tools */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-100 shadow-sm">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
               <h3 className="font-medium text-slate-900 text-sm">Media Organization</h3>
             </div>
            <CardContent className="p-4 space-y-1">
               <button 
                 onClick={() => setActiveTab('all')}
                 className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'all' ? 'bg-montessori-primary/10 text-montessori-primary font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                 <span>All Media</span>
                 <span className="bg-white px-2 py-0.5 rounded-full text-xs box-border border">124</span>
               </button>
               <button 
                 onClick={() => setActiveTab('untagged')}
                 className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'untagged' ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                 <span>Needs Tagging</span>
                 <span className="bg-amber-100/50 text-amber-600 px-2 py-0.5 rounded-full text-xs">12</span>
               </button>
               <button 
                 onClick={() => setActiveTab('shared')}
                 className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'shared' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                 <span>Shared with Parents</span>
                 <span className="bg-emerald-100/50 text-emerald-600 px-2 py-0.5 rounded-full text-xs">86</span>
               </button>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
               <h3 className="font-medium text-slate-900 text-sm">Quick Tags</h3>
             </div>
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input placeholder="Find student or lesson..." className="pl-9 h-9 text-sm border-slate-200" />
              </div>
              <div className="flex flex-wrap gap-2">
                 {['Practical Life', 'Outdoor Play', 'Sarah J.', 'Noah W.', 'Sensorial'].map(tag => (
                   <Badge key={tag} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-normal cursor-pointer border-none shadow-none">
                     + {tag}
                   </Badge>
                 ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gallery Grid */}
        <div className="lg:col-span-3">
          
          {/* Action Action Bar (Shows when items selected) */}
           {selectedCount > 0 && (
           <div className="bg-slate-900 text-white rounded-xl p-3 px-5 mb-6 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex items-center gap-3">
               <Badge className="bg-white/20 hover:bg-white/20 text-white border-none font-medium">{selectedCount} Selected</Badge>
                <span className="text-sm font-medium">Apply actions to selected media</span>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsTagOpen(true)} className="text-white hover:bg-white/20 hover:text-white h-8 text-xs gap-1.5 rounded-full px-4">
                  <Tag className="w-3.5 h-3.5" /> Tag Students
                </Button>
                <Button variant="ghost" size="sm" onClick={shareSelectedToPortal} className="bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900 h-8 text-xs gap-1.5 rounded-full px-4 font-medium transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Share to Parent Portal
                </Button>
             </div>
          </div>
           )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {filteredPhotos.map((item) => (
                <div key={item.id} onClick={() => togglePhotoSelection(item.id)} className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${item.selected ? 'border-montessori-primary shadow-md' : 'border-slate-100 hover:border-montessori-primary/50'}`}>
                 <img src={item.imageUrl} alt={`Classroom media ${item.id}`} className="absolute inset-0 h-full w-full object-cover" />
                   
                   {/* Overlay gradients and info */}
                   <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/20 transition-opacity ${item.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                   
                   {/* Selection Checkbox */}
                   <div className="absolute top-3 left-3 z-10">
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.selected ? 'bg-montessori-primary border-montessori-primary text-white' : 'border-white/70 bg-black/20 text-transparent opacity-0 group-hover:opacity-100'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                     </div>
                   </div>
                   
                   {/* Status indicators */}
                   <div className="absolute top-3 right-3 flex gap-2 z-10">
                      {item.shared && (
                         <div className="bg-emerald-500/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center shadow-sm">
                           Shared
                         </div>
                      )}
                      {item.type === 'video' && (
                         <div className="bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm">
                           <Video className="w-3 h-3" />
                         </div>
                      )}
                   </div>
                   
                   {/* Bottom info */}
                   <div className={`absolute bottom-0 left-0 right-0 p-4 z-10 transition-transform duration-300 translate-y-0`}>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                         {item.tags.length > 0 ? (
                           item.tags.map(tag => (
                             <span key={tag} className="bg-white/90 text-slate-800 text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                               {tag}
                             </span>
                           ))
                         ) : (
                           <span className="bg-amber-500/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                             Untagged
                           </span>
                         )}
                      </div>
                      <p className="text-white text-xs font-medium opacity-90">{item.date}</p>
                   </div>
                </div>
             ))}
          </div>
        </div>
        
      </div>

      {/* Upload Media Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Classroom Media</DialogTitle>
            <DialogDescription>
              Add photos or videos to the school gallery. Supported formats: JPG, PNG, MP4.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer block group">
              <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={() => toast({ title: 'File Selected', description: 'Ready to upload.' })} />
              <div className="w-12 h-12 bg-montessori-primary/10 rounded-full flex items-center justify-center text-montessori-primary mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500">Maximum file size 50MB</p>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button onClick={submitUpload} className="bg-montessori-primary text-white hover:bg-montessori-primary/90">Upload Files</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Students Dialog */}
      <Dialog open={isTagOpen} onOpenChange={setIsTagOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Tag Students & Learning Areas</DialogTitle>
            <DialogDescription>
              Assign the selected media to student portfolios and curriculum areas.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Search Students</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input placeholder="Type a name..." className="pl-9 border-slate-200" />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer border-emerald-200 border">Sarah J. ×</Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer border-none shadow-none">+ Noah W.</Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer border-none shadow-none">+ Mia C.</Badge>
              </div>
            </div>
            
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-sm font-medium text-slate-700">Curriculum Area</label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer border-amber-200 border">Practical Life ×</Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer border-none shadow-none">+ Sensorial</Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer border-none shadow-none">+ Language</Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer border-none shadow-none">+ Mathematics</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTagOpen(false)}>Cancel</Button>
            <Button onClick={submitTags} className="bg-montessori-primary text-white hover:bg-montessori-primary/90">Save Tags</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
