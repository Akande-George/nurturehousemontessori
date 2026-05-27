"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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
import {
  addActivityPost,
  formatDateTime,
  getActivityPostsForStudent,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { CURRICULUM } from "@/lib/curriculum/curriculum";
import { Camera, Heart, ImageIcon, Plus, Search } from "lucide-react";

const IMAGE_SEEDS = [
  "classroom1",
  "classroom2",
  "montessori3",
  "learning4",
  "children5",
  "school6",
  "art7",
  "outdoor8",
  "music9",
  "reading10",
];

export default function TeacherActivityPage() {
  const snapshot = useDemoStore();
  const { toast } = useToast();

  const [selectedStudentId, setSelectedStudentId] = useState(
    snapshot.students[0]?.id ?? "",
  );
  const [search, setSearch] = useState("");
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("All");
  const [imageSeed, setImageSeed] = useState(IMAGE_SEEDS[0]);

  // Curriculum-anchored leaf picker for the New Post dialog
  const [areaId, setAreaId] = useState(CURRICULUM[0].id);
  const area = CURRICULUM.find((a) => a.id === areaId) ?? CURRICULUM[0];
  const flatActivities = useMemo(
    () =>
      area.subcategories.flatMap((sub) =>
        sub.activities.map((act) => ({ sub, act })),
      ),
    [area],
  );
  const [activityId, setActivityId] = useState(flatActivities[0]?.act.id ?? "");
  const currentActivity =
    flatActivities.find((entry) => entry.act.id === activityId) ??
    flatActivities[0];
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

  const leafId = hasVariations
    ? variationId || activityVariations[0].id
    : activityId;

  const filteredStudents = snapshot.students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedStudent = snapshot.students.find(
    (s) => s.id === selectedStudentId,
  );
  const posts = selectedStudentId
    ? getActivityPostsForStudent(selectedStudentId)
    : [];
  const filteredPosts =
    areaFilter === "All"
      ? posts
      : posts.filter((p) => p.leaf.areaName === areaFilter);

  const handlePost = () => {
    if (!caption.trim() || !selectedStudentId || !leafId) return;
    addActivityPost({
      studentId: selectedStudentId,
      caption: caption.trim(),
      imageUrl: `https://picsum.photos/seed/${imageSeed}/600/400`,
      leafId,
    });
    toast({
      title: "Activity posted",
      description: `${selectedStudent?.name}'s activity feed has been updated and is visible to their parent.`,
    });
    setCaption("");
    setAreaId(CURRICULUM[0].id);
    setActivityId(
      CURRICULUM[0].subcategories.flatMap((s) => s.activities)[0]?.id ?? "",
    );
    setVariationId("");
    setImageSeed(IMAGE_SEEDS[Math.floor(Math.random() * IMAGE_SEEDS.length)]);
    setIsPostOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Activity Feed
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Post photos and moments for each child — parents see these in their
            real-time feed.
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
        {/* Student sidebar */}
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
              <CardTitle className="text-sm font-medium">
                All Students
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {filteredStudents.map((student) => {
                const count = getActivityPostsForStudent(student.id).length;
                const isActive = student.id === selectedStudentId;
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                      isActive
                        ? "bg-montessori-primary/8 text-montessori-primary"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${student.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                    >
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium truncate ${isActive ? "text-montessori-primary" : "text-slate-900"}`}
                      >
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {student.classroom}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-montessori-primary/15 text-montessori-primary" : "bg-slate-100 text-slate-500"}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Posts */}
        <div className="lg:col-span-2 space-y-5">
          {selectedStudent ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${selectedStudent.avatarColor} text-white flex items-center justify-center text-sm font-bold`}
                >
                  {selectedStudent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {selectedStudent.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedStudent.classroom} · {selectedStudent.ageGroup}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPostOpen(true)}
                  className="ml-auto gap-1.5 bg-white"
                >
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
                      {posts.length === 0
                        ? `No activity posts yet for ${selectedStudent.name}.`
                        : `No ${areaFilter} posts yet for ${selectedStudent.name}.`}
                    </p>
                    <Button
                      onClick={() => setIsPostOpen(true)}
                      className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2"
                    >
                      <Plus className="w-4 h-4" /> Post first moment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="border-slate-100 shadow-sm overflow-hidden"
                  >
                    <div className="relative w-full aspect-video bg-slate-100">
                      <Image
                        src={post.imageUrl}
                        alt={`${selectedStudent.name} — ${post.leaf.activityName}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 60vw"
                      />
                    </div>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${post.leaf.areaTone.soft} ${post.leaf.areaTone.text} ${post.leaf.areaTone.border}`}
                        >
                          {post.leaf.areaName} · {post.leaf.activityName}
                          {post.leaf.leafName !== post.leaf.activityName && (
                            <span className="opacity-60">
                              {" · "}
                              {post.leaf.leafName}
                            </span>
                          )}
                        </Badge>
                        <span className="text-xs text-slate-400 shrink-0">
                          {formatDateTime(post.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {post.caption}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <Heart
                          className={`w-4 h-4 ${post.likedByParent ? "fill-rose-500 text-rose-500" : "text-slate-400"}`}
                        />
                        <span className="text-xs text-slate-500">
                          {post.likes} {post.likes === 1 ? "like" : "likes"}{" "}
                          from parent
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

      {/* New post dialog */}
      <Dialog open={isPostOpen} onOpenChange={setIsPostOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Post to {selectedStudent?.name}&apos;s Activity Feed
            </DialogTitle>
            <DialogDescription>
              Parents will see this immediately in their feed.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {/* Image preview */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Photo
              </label>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <Image
                  src={`https://picsum.photos/seed/${imageSeed}/600/400`}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="540px"
                />
                <div className="absolute inset-0 flex items-end p-3">
                  <div className="flex gap-2 flex-wrap">
                    {IMAGE_SEEDS.map((seed) => (
                      <button
                        key={seed}
                        onClick={() => setImageSeed(seed)}
                        className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${imageSeed === seed ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"}`}
                      >
                        <Image
                          src={`https://picsum.photos/seed/${seed}/80/80`}
                          alt={seed}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Select a photo tile above to change the image.
              </p>
            </div>

            {/* Curriculum picker */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Area
                </label>
                <Select value={areaId} onValueChange={handleAreaChange}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRICULUM.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Activity
                </label>
                <Select
                  value={activityId}
                  onValueChange={handleActivityChange}
                >
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
                          <SelectItem key={act.id} value={act.id}>
                            {act.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Variation
                </label>
                <Select
                  value={
                    hasVariations ? (variationId || activityVariations[0].id) : ""
                  }
                  onValueChange={setVariationId}
                  disabled={!hasVariations}
                >
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue
                      placeholder={hasVariations ? "Select variation" : "—"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {activityVariations.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {currentActivity?.act.description && (
              <p className="text-xs text-slate-500 italic">
                {currentActivity.act.description}
              </p>
            )}

            {/* Caption */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Caption
              </label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Describe what ${selectedStudent?.name ?? "the child"} was doing…`}
                className="min-h-[120px] border-slate-200 focus-visible:ring-montessori-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePost}
              disabled={!caption.trim() || !leafId}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2"
            >
              <Camera className="w-4 h-4" /> Post to Feed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
