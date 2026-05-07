"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function WaitlistPage() {
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

  const nextFilter = () => {
    const statuses = ["All", "Reviewing", "Waitlist", "Accepted"];
    const nextIdx = (statuses.indexOf(filterStatus) + 1) % statuses.length;
    setFilterStatus(statuses[nextIdx]);
    toast({
      title: "Filter Applied",
      description: `Showing ${statuses[nextIdx]} applications.`,
    });
  };

  const handleAction = (actionName: string) => {
    toast({
      title: actionName,
      description:
        "The enrollment workflow has been updated in this demo queue.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Waitlist Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage prospective students and admission pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search applicants..."
              className="pl-9 w-64 border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <Button
            variant={filterStatus === "All" ? "outline" : "default"}
            onClick={nextFilter}
            className={
              filterStatus === "All"
                ? "border-slate-200 text-slate-700 font-medium"
                : "bg-montessori-primary hover:bg-montessori-primary/90 text-white font-medium"
            }
          >
            <Filter className="w-4 h-4 mr-2" />
            {filterStatus === "All" ? "Filter" : filterStatus}
          </Button>
        </div>
      </div>

      {/* Program Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            name: "Infant Community (Nurture Bloomers)",
            age: "6 months - 18 months",
            count: 8,
            capacity: "12 spaces",
            bg: "bg-blue-50 border-blue-100",
            text: "text-blue-700",
          },
          {
            name: "Toddler Community (Nurture Buds)",
            age: "18 months - 3 years",
            count: 12,
            capacity: "20 spaces",
            bg: "bg-emerald-50 border-emerald-100",
            text: "text-emerald-700",
          },
          {
            name: "Children's House (Nurture Explorers)",
            age: "3 - 6 years",
            count: 18,
            capacity: "30 spaces",
            bg: "bg-amber-50 border-amber-100",
            text: "text-amber-700",
          },
        ].map((program, i) => (
          <Card key={i} className={`${program.bg} shadow-none`}>
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <h3 className={`font-medium ${program.text} mb-1`}>
                  {program.name}
                </h3>
                <p className="text-xs text-slate-500 mb-4">{program.age}</p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-serif text-slate-900">
                    {program.count}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    waitlisted
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">
                    {program.capacity}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    next fall
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Waitlist Table */}
      <Card className="border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">All Applicants</h2>
          <Button
            variant="link"
            onClick={() => handleAction("Export CSV")}
            className="text-sm text-montessori-primary font-medium p-0 h-auto"
          >
            Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                  Student Name
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                  Parent Contact
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                  Program
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                  Application Date
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                  Status
                </TableHead>
                <TableHead className="font-medium text-right text-xs uppercase tracking-wider text-slate-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Oliver Smith",
                  parent: "Sarah Smith",
                  email: "sarah@example.com",
                  program: "Children's House (Nurture Explorers)",
                  status: "Reviewing",
                  date: "Oct 24, 2023",
                  initial: "O",
                  statusBg:
                    "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80",
                },
                {
                  name: "Emma Johnson",
                  parent: "Mike Johnson",
                  email: "mike@example.com",
                  program: "Toddler Community (Nurture Buds)",
                  status: "Waitlist",
                  date: "Oct 23, 2023",
                  initial: "E",
                  statusBg: "bg-amber-100 text-amber-700 hover:bg-amber-100/80",
                },
                {
                  name: "Noah Williams",
                  parent: "Jessica Williams",
                  email: "jess@example.com",
                  program: "Infant Community (Nurture Bloomers)",
                  status: "Accepted",
                  date: "Oct 21, 2023",
                  initial: "N",
                  statusBg: "bg-blue-100 text-blue-700 hover:bg-blue-100/80",
                },
                {
                  name: "Ava Brown",
                  parent: "David Brown",
                  email: "david@example.com",
                  program: "Children's House (Nurture Explorers)",
                  status: "Reviewing",
                  date: "Oct 20, 2023",
                  initial: "A",
                  statusBg:
                    "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80",
                },
                {
                  name: "Lucas Miller",
                  parent: "Anna Miller",
                  email: "anna@example.com",
                  program: "Toddler Community (Nurture Buds)",
                  status: "Waitlist",
                  date: "Oct 19, 2023",
                  initial: "L",
                  statusBg: "bg-amber-100 text-amber-700 hover:bg-amber-100/80",
                },
              ]
                .filter(
                  (app) =>
                    filterStatus === "All" || app.status === filterStatus,
                )
                .map((app, i) => (
                  <TableRow
                    key={i}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-medium text-xs">
                          {app.initial}
                        </div>
                        <span className="font-medium text-slate-900">
                          {app.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900">{app.parent}</p>
                      <p className="text-xs text-slate-400">{app.email}</p>
                    </TableCell>
                    <TableCell>{app.program}</TableCell>
                    <TableCell className="text-slate-500">{app.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${app.statusBg} font-medium border-none`}
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedApp(app);
                          setIsReviewOpen(true);
                        }}
                        className="text-montessori-primary hover:text-montessori-primary/80 hover:bg-montessori-primary/5 opacity-0 group-hover:opacity-100 transition-all font-medium h-8 px-2"
                      >
                        Review File
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Review Applicant Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Applicant: {selectedApp?.name}</DialogTitle>
            <DialogDescription>
              View application details and update admission status.
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Parent / Guardian
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedApp.parent}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Contact Email
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedApp.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Program Selected
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedApp.program}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Received On
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedApp.date}
                  </p>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Current Status
                  </p>
                  <Badge
                    variant="secondary"
                    className={`${selectedApp.statusBg} font-medium border-none`}
                  >
                    {selectedApp.status}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-900 mb-3">
                  Update Admission Status
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleAction("Status: Reviewing");
                      setIsReviewOpen(false);
                    }}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Keep in Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleAction("Status: Waitlisted");
                      setIsReviewOpen(false);
                    }}
                    className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                  >
                    Move to Waitlist
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleAction("Status: Accepted");
                      setIsReviewOpen(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Accept Student
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between border-t border-slate-100 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsReviewOpen(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
