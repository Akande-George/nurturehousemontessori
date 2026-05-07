import EnrollmentForm from "@/components/enrollment/EnrollmentForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Enrollment | Nurture House Montessori",
  description: "Apply for admission to our progressive Montessori program.",
};

export default function EnrollmentPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Minimal Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-montessori-primary flex items-center justify-center text-white font-serif italic text-sm">
              M
            </div>
            <span className="font-serif font-medium text-slate-900 hidden sm:block">
              Nurture House Montessori
            </span>
          </Link>
          <Button
            asChild
            variant="ghost"
            className="text-sm font-medium text-slate-600 hover:text-montessori-primary hover:bg-transparent transition-colors"
          >
            <Link href="/login">Already applied? Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Soft Background Accents */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-montessori-secondary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-montessori-primary/5 rounded-full blur-3xl -z-10" />

        <div className="w-full max-w-2xl text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 mb-4">
            Begin Your{" "}
            <span className="text-montessori-primary italic">Journey</span>
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">
            We're thrilled you're considering our Montessori community. Please
            complete the initial application below to join our prospective
            student waitlist.
          </p>
        </div>

        <EnrollmentForm />

        <div className="mt-12 text-center text-sm text-slate-500">
          <p>
            Questions? Contact our admissions team at{" "}
            <a
              href="mailto:admissions@nurturehouse.edu"
              className="text-montessori-primary hover:underline"
            >
              admissions@nurturehouse.edu
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
