"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitParentReportComment } from "@/lib/actions/conference";
import { formatReportDate } from "@/lib/montessori/conference";

const MAX = 4000;

/**
 * The family's reply to a published report. Sits outside the printable
 * document (print:hidden on the wrapper in the page) — what they save here is
 * what prints above the signature line.
 */
export function ParentCommentCard({
  reportId,
  childFirstName,
  initialComment,
  savedAt,
}: {
  reportId: string;
  childFirstName: string;
  initialComment: string;
  savedAt: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [comment, setComment] = useState(initialComment);

  const trimmed = comment.trim();
  const unchanged = trimmed === initialComment.trim();

  const handleSave = () =>
    start(async () => {
      const res = await submitParentReportComment({ reportId, comment });
      if (!res.ok) {
        toast({
          title: res.error ?? "Could not save your comment",
          variant: "destructive",
        });
        return;
      }
      toast(
        trimmed
          ? {
              title: "Comment saved",
              description: `It now appears on ${childFirstName}'s report.`,
            }
          : { title: "Comment removed" },
      );
      router.refresh();
    });

  return (
    <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm print:hidden">
      <div className="mb-1 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-montessori-primary" />
        <h2 className="text-base font-semibold text-slate-800">Your comment</h2>
      </div>
      <p className="mb-3 text-sm text-slate-500">
        Write your reply to {childFirstName}&apos;s report. It appears above the
        signature line on the report itself, and their teacher is told you have
        written it.
      </p>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, MAX))}
        placeholder={`What you'd like ${childFirstName}'s guide to know — how things are at home, what you've noticed, anything you'd like to discuss.`}
        className="min-h-32 border-slate-200 focus-visible:ring-montessori-primary"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          {savedAt
            ? `Saved ${formatReportDate(savedAt.slice(0, 10))}. You can edit it at any time.`
            : "Not sent yet."}
        </p>
        <Button
          onClick={handleSave}
          disabled={pending || unchanged}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
        >
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {trimmed ? "Save comment" : "Remove comment"}
        </Button>
      </div>
    </section>
  );
}
