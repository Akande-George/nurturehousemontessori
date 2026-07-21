"use client";

import { SchoolForm } from "../SchoolForm";

export default function NewSchoolPage() {
  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-slate-900 mb-1">
          Add a School
        </h1>
        <p className="text-sm text-slate-500">
          Provision a new school on the platform and its first School Admin.
        </p>
      </div>
      <SchoolForm />
    </div>
  );
}
