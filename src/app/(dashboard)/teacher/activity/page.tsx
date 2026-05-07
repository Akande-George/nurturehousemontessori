"use client";

import Image from "next/image";
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  addActivityPost,
  formatDateTime,
  getActivityPostsForStudent,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { Camera, Heart, ImageIcon, Plus, Search } from "lucide-react";

const CATEGORIES = [
  "Practical Life",
  "Sensorial",
  "Language",
  "Mathematics",
  "Cultural",
  "Art",
  "Outdoor",
  "Music",
  "Circle Time",
  "General",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Practical Life": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Sensorial: "bg-violet-100 text-violet-700 border-violet-200",
  Language: "bg-sky-100 text-sky-700 border-sky-200",
  Mathematics: "bg-amber-100 text-amber-700 border-amber-200",
  Cultural: "bg-rose-100 text-rose-700 border-rose-200",
  Art: "bg-pink-100 text-pink-700 border-pink-200",
  Outdoor: "bg-lime-100 text-lime-700 border-lime-200",
  Music: "bg-orange-100 text-orange-700 border-orange-200",
  "Circle Time": "bg-teal-100 text-teal-700 border-teal-200",
  General: "bg-slate-100 text-slate-600 border-slate-200",
};

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
  const [category, setCategory] = useState("General");
  const [postCategoryFilter, setPostCategoryFilter] = useState("All");
  const [imageSeed, setImageSeed] = useState(IMAGE_SEEDS[0]);

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
    postCategoryFilter === "All"
      ? posts
      : posts.filter((p) => p.category === postCategoryFilter);

  const handlePost = () => {
    if (!caption.trim() || !selectedStudentId) return;
    addActivityPost({
      studentId: selectedStudentId,
      caption: caption.trim(),
      imageUrl: `https://picsum.photos/seed/${imageSeed}/600/400`,
      category,
    });
    toast({
      title: "Activity posted",
      description: `${selectedStudent?.name}'s activity feed has been updated and is visible to their parent.`,
    });
    setCaption("");
    setCategory("General");
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
                {["All", ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPostCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      postCategoryFilter === cat
                        ? cat === "All"
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : (CATEGORY_COLORS[cat] ??
                            "bg-slate-100 text-slate-700 border-slate-300")
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {cat}
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
                        : `No ${postCategoryFilter} posts yet for ${selectedStudent.name}.`}
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
                        alt={`${selectedStudent.name} — ${post.category}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 60vw"
                      />
                    </div>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.General}`}
                        >
                          {post.category}
                        </Badge>
                        <span className="text-xs text-slate-400">
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
        <DialogContent className="sm:max-w-[540px]">
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

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      category === cat
                        ? (CATEGORY_COLORS[cat] ??
                          "bg-slate-100 text-slate-700 border-slate-200")
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

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
              disabled={!caption.trim()}
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
