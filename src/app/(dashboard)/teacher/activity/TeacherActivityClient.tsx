"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CURRICULUM, type Leaf } from "@/lib/curriculum/curriculum";
import { addActivityPost } from "@/lib/actions/montessori";
import { uploadActivityImage } from "@/lib/actions/media";
import { Camera, Heart, ImageIcon, Plus, Search, Upload } from "lucide-react";
import type { Student } from "@/lib/db/types";

type Post = {
  id: string;
  student_id: string;
  caption: string | null;
  image_url: string | null;
  created_at: string;
  like_count: number;
  leaf: Leaf | null;
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("");
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function TeacherActivityClient({ students, posts }: { students: Student[]; posts: Post[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("All");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");

  const [areaId, setAreaId] = useState(CURRICULUM[0].id);
  const area = CURRICULUM.find((a) => a.id === areaId) ?? CURRICULUM[0];
  const flatActivities = useMemo(
    () => area.subcategories.flatMap((sub) => sub.activities.map((act) => ({ sub, act }))),
    [area],
  );
  const [activityId, setActivityId] = useState(flatActivities[0]?.act.id ?? "");
  const currentActivity = flatActivities.find((e) => e.act.id === activityId) ?? flatActivities[0];
  const activityVariations = currentActivity?.act.variations ?? [];
  const hasVariations = activityVariations.length > 0;
  const [variationId, setVariationId] = useState<string>("");

  const handleAreaChange = (value: string) => {
    setAreaId(value);
    const nextArea = CURRICULUM.find((a) => a.id === value) ?? CURRICULUM[0];
    const firstAct = nextArea.subcategories.flatMap((s) => s.activities)[0];
    setActivityId(firstAct?.id ?? "");
    setVariationId("");
  };
  const handleActivityChange = (value: string) => {
    setActivityId(value);
    setVariationId("");
  };

  const leafId = hasVariations ? variationId || activityVariations[0].id : activityId;

  const filteredStudents = students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const postsByStudent = useMemo(() => {
    const m: Record<string, Post[]> = {};
    for (const p of posts) (m[p.student_id] = m[p.student_id] ?? []).push(p);
    return m;
  }, [posts]);

  const studentPosts = selectedStudentId ? postsByStudent[selectedStudentId] ?? [] : [];
  const filteredPosts =
    areaFilter === "All" ? studentPosts : studentPosts.filter((p) => p.leaf?.areaName === areaFilter);

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageDataUrl(dataUrl);
    } catch {
      toast({ title: "Could not read image", variant: "destructive" });
    }
  };

  const resetDialog = () => {
    setCaption("");
    setImageDataUrl("");
    setAreaId(CURRICULUM[0].id);
    setActivityId(CURRICULUM[0].subcategories.flatMap((s) => s.activities)[0]?.id ?? "");
    setVariationId("");
  };

  const handlePost = () => {
    if (!caption.trim() || !selectedStudentId || !leafId) return;
    start(async () => {
      let imageUrl = "";
      if (imageDataUrl) {
        const up = await uploadActivityImage(imageDataUrl);
        if (up.error) {
          toast({ title: up.error, variant: "destructive" });
          return;
        }
        imageUrl = up.url ?? "";
      }
      const res = await addActivityPost({
        studentId: selectedStudentId,
        caption: caption.trim(),
        imageUrl,
        leafId,
      });
      if (res.ok) {
        toast({
          title: "Activity posted",
          description: `${selectedStudent?.name}'s activity feed has been updated and is visible to their parent.`,
        });
        resetDialog();
        setIsPostOpen(false);
        router.refresh();
      } else {
        toast({ title: res.error ?? "Failed to post", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Activity Feed</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Post photos and moments for each child — parents see these in their real-time feed.
          </p>
        </div>
        <Button
          onClick={() => setIsPostOpen(true)}
          disabled={!selectedStudentId}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
        >
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className="pl-9 bg-white border-slate-200"
            />
          </div>

          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-medium">All Students</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {filteredStudents.map((student) => {
                const count = postsByStudent[student.id]?.length ?? 0;
                const isActive = student.id === selectedStudentId;
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                      isActive ? "bg-montessori-primary/8 text-montessori-primary" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${student.avatar_color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                      {initials(student.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-montessori-primary" : "text-slate-900"}`}>
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{student.classroom ?? "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-montessori-primary/15 text-montessori-primary" : "bg-slate-100 text-slate-500"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-5">
          {selectedStudent ? (
            <>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${selectedStudent.avatar_color} text-white flex items-center justify-center text-sm font-bold`}>
                  {initials(selectedStudent.name)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{selectedStudent.name}</p>
                  <p className="text-sm text-slate-500">{selectedStudent.classroom ?? "—"}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsPostOpen(true)} className="ml-auto gap-1.5 bg-white">
                  <Camera className="w-3.5 h-3.5" /> Add moment
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAreaFilter("All")}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    areaFilter === "All"
                      ? "bg-slate-100 text-slate-700 border-slate-300"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  All
                </button>
                {CURRICULUM.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAreaFilter(a.name)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      areaFilter === a.name
                        ? `${a.tone.soft} ${a.tone.text} ${a.tone.border}`
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>

              {filteredPosts.length === 0 ? (
                <Card className="border-dashed border-slate-200 shadow-none">
                  <CardContent className="py-16 text-center space-y-3">
                    <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500">
                      {studentPosts.length === 0
                        ? `No activity posts yet for ${selectedStudent.name}.`
                        : `No ${areaFilter} posts yet for ${selectedStudent.name}.`}
                    </p>
                    <Button onClick={() => setIsPostOpen(true)} className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2">
                      <Plus className="w-4 h-4" /> Post first moment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredPosts.map((post) => (
                  <Card key={post.id} className="border-slate-100 shadow-sm overflow-hidden">
                    {post.image_url && (
                      <div className="relative w-full aspect-video bg-slate-100">
                        <Image
                          src={post.image_url}
                          alt={`${selectedStudent.name} — ${post.leaf?.activityName ?? "activity"}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 60vw"
                          unoptimized
                        />
                      </div>
                    )}
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {post.leaf && (
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${post.leaf.areaTone.soft} ${post.leaf.areaTone.text} ${post.leaf.areaTone.border}`}
                          >
                            {post.leaf.areaName} · {post.leaf.activityName}
                            {post.leaf.leafName !== post.leaf.activityName && (
                              <span className="opacity-60">{" · "}{post.leaf.leafName}</span>
                            )}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400 shrink-0">{formatDateTime(post.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{post.caption}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <Heart className={`w-4 h-4 ${post.like_count > 0 ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
                        <span className="text-xs text-slate-500">
                          {post.like_count} {post.like_count === 1 ? "like" : "likes"} from parent
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          ) : (
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="py-16 text-center text-sm text-slate-500">
                Select a student to view or post to their activity feed.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isPostOpen} onOpenChange={setIsPostOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post to {selectedStudent?.name}&apos;s Activity Feed</DialogTitle>
            <DialogDescription>Parents will see this immediately in their feed.</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Photo</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
              {imageDataUrl ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageDataUrl} alt="Preview" className="object-cover w-full h-full" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-3 right-3 bg-white/90 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm"
                  >
                    Change photo
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-montessori-primary/10 rounded-full flex items-center justify-center text-montessori-primary mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">Click to choose a photo</p>
                  <p className="text-xs text-slate-500 mt-1">Optional — a caption alone is fine too</p>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Area</label>
                <Select value={areaId} onValueChange={handleAreaChange}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRICULUM.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Activity</label>
                <Select value={activityId} onValueChange={handleActivityChange}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {area.subcategories.map((sub) => (
                      <SelectGroup key={sub.id}>
                        <SelectLabel className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                          {sub.name}
                        </SelectLabel>
                        {sub.activities.map((act) => (
                          <SelectItem key={act.id} value={act.id}>{act.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Variation</label>
                <Select
                  value={hasVariations ? variationId || activityVariations[0].id : ""}
                  onValueChange={setVariationId}
                  disabled={!hasVariations}
                >
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder={hasVariations ? "Select variation" : "—"} />
                  </SelectTrigger>
                  <SelectContent>
                    {activityVariations.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {currentActivity?.act.description && (
              <p className="text-xs text-slate-500 italic">{currentActivity.act.description}</p>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Caption</label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Describe what ${selectedStudent?.name ?? "the child"} was doing…`}
                className="min-h-[120px] border-slate-200 focus-visible:ring-montessori-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostOpen(false)}>Cancel</Button>
            <Button
              onClick={handlePost}
              disabled={!caption.trim() || !leafId || pending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2"
            >
              <Camera className="w-4 h-4" /> {pending ? "Posting…" : "Post to Feed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
