"use client";

import { useState } from "react";
import { Mail, CheckCircle2, Clock, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type LetterStatus = "draft" | "sent" | "pending";

interface Applicant {
  id: string;
  name: string;
  program: string;
  status: LetterStatus;
  date: string;
  parent: string;
  email: string;
}

export default function AcceptanceLettersPage() {
  const [activeTab, setActiveTab] = useState<"all" | "drafts" | "sent">(
    "drafts",
  );
  const [selectedApp, setSelectedApp] = useState<Applicant | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const { toast } = useToast();

  const handleAction = (actionName: string) => {
    toast({
      title: actionName,
      description: "Letter queue has been updated for the selected applicant.",
    });
  };

  const applicants: Applicant[] = [
    {
      id: "1",
      name: "Noah Williams",
      program: "Infant Community (Nurture Bloomers)",
      status: "draft",
      date: "Oct 25, 2023",
      parent: "Jessica W.",
      email: "jess@example.com",
    },
    {
      id: "2",
      name: "Ava Brown",
      program: "Children's House (Nurture Explorers)",
      status: "draft",
      date: "Oct 25, 2023",
      parent: "David B.",
      email: "david@example.com",
    },
    {
      id: "3",
      name: "Sophia Chen",
      program: "Toddler Community (Nurture Buds)",
      status: "sent",
      date: "Oct 20, 2023",
      parent: "Michael C.",
      email: "michael@example.com",
    },
    {
      id: "4",
      name: "James Wilson",
      program: "Children's House (Nurture Explorers)",
      status: "sent",
      date: "Oct 19, 2023",
      parent: "Sarah W.",
      email: "sarah@example.com",
    },
  ];

  const filteredApplicants = applicants.filter((app) => {
    if (activeTab === "all") return true;
    if (activeTab === "drafts")
      return app.status === "draft" || app.status === "pending";
    if (activeTab === "sent") return app.status === "sent";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Acceptance Letters
          </h1>
          <p className="text-sm text-slate-500">
            Review and dispatch automated welcome packets.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-[300px]"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="drafts">Drafts (2)</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Applicants List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-medium text-slate-900 text-sm">
                Automated Queue
              </h2>
              {activeTab === "drafts" && (
                <Button
                  variant="link"
                  onClick={() => handleAction("Send All Drafts")}
                  className="text-sm font-medium text-montessori-primary p-0 h-auto"
                >
                  <Send className="w-4 h-4 mr-1.5" /> Send All Drafts (2)
                </Button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {filteredApplicants.map((app) => (
                <div
                  key={app.id}
                  className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        app.status === "sent"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {app.status === "sent" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900 mb-0.5">
                        {app.name}
                      </h3>
                      <p className="text-xs text-slate-500 mb-2">
                        To: {app.parent} ({app.email})
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 hover:bg-slate-100 font-medium border-none"
                        >
                          {app.program}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {app.status === "sent"
                            ? `Sent on ${app.date}`
                            : `Drafted on ${app.date}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedApp(app);
                        setIsViewOpen(true);
                      }}
                      className="text-slate-400 hover:text-montessori-primary"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {app.status === "draft" && (
                      <Button
                        onClick={() => handleAction("Send Letter")}
                        className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
                      >
                        <Send className="w-4 h-4" /> Send
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Template Settings & Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="font-serif text-lg text-slate-900">
                Letter Template
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 leading-relaxed">
                Acceptance emails automatically pull variables such as student
                name, program, and start dates.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative mb-6">
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-xs font-medium text-slate-400">
                  Subject: Welcome to Nurture House Montessori
                </p>
                <div className="w-full h-px bg-slate-200" />
                <p className="text-xs text-slate-600">
                  Dear [Parent First Name],
                </p>
                <p className="text-xs text-slate-600">
                  We are delighted to offer [Student Name] a place in our
                  [Program Name] program for the upcoming school year...
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => handleAction("Edit Master Template")}
                className="w-full font-medium"
              >
                Edit Master Template
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-montessori-earth/10 border-montessori-earth/20 shadow-none">
            <CardContent className="p-6">
              <h3 className="font-medium text-montessori-earth mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Send Action Notice
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                When you send an acceptance letter, it automatically updates the
                student's status to 'Accepted' and triggers the Parent Portal
                Activation workflow.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View/Edit Draft Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Letter Draft: {selectedApp?.name}</DialogTitle>
            <DialogDescription>
              Preview or customize the acceptance letter before sending.
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-slate-500">To:</span>
                <span className="text-slate-900">
                  {selectedApp.parent} &lt;{selectedApp.email}&gt;
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm border-b pb-4">
                <span className="font-medium text-slate-500">Subject:</span>
                <span className="text-slate-900 font-medium">
                  Welcome to Nurture House Montessori - {selectedApp.program}
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 text-sm text-slate-700 space-y-4 font-serif leading-relaxed">
                <p>Dear {selectedApp.parent.split(" ")[0]},</p>
                <p>
                  We are delighted to offer <strong>{selectedApp.name}</strong>{" "}
                  a place in our <strong>{selectedApp.program}</strong> program
                  for the upcoming school year.
                </p>
                <p>
                  We enjoyed having your family visit our campus and feel that{" "}
                  {selectedApp.name} will be a wonderful addition to our
                  Montessori community.
                </p>
                <p>
                  To secure this placement, please log in to the Parent Portal
                  to complete the enrollment packet and submit the required
                  deposit by next week.
                </p>
                <p>
                  Warm regards,
                  <br />
                  <span className="font-medium">Admissions Team</span>
                  <br />
                  Nurture House Montessori
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between border-t border-slate-100 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsViewOpen(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Button>
            {selectedApp?.status === "draft" && (
              <Button
                onClick={() => {
                  handleAction("Send Letter");
                  setIsViewOpen(false);
                }}
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
              >
                <Send className="w-4 h-4" /> Send Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
