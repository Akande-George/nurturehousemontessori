import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign In | SchoolHub",
  description: "Sign in to your school portal.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex text-slate-900 overflow-hidden">
      {/* Visual Left Side */}
      <div className="hidden lg:flex w-1/2 relative bg-montessori-primary overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-montessori-primary">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-3xl opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-montessori-secondary/10 blur-3xl opacity-50" />
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white font-serif italic text-3xl mb-8">
            M
          </div>
          <h1 className="text-4xl font-serif mb-6 leading-tight">
            One platform for every kind of school.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Sign in to access your school portal — admissions, academics,
            reports, billing, and parent engagement, all in one place.
          </p>
        </div>
      </div>

      {/* Form Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="text-center lg:text-left mb-10">
            <div className="lg:hidden w-12 h-12 rounded-xl bg-montessori-primary mx-auto mb-6 flex items-center justify-center text-white font-serif italic text-xl">
              M
            </div>
            <h2 className="text-3xl font-serif text-slate-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          <LoginForm />

          <div className="mt-8 pt-8 border-t border-slate-100 text-center text-sm text-slate-500 space-y-2">
            <p>
              Run a school?{" "}
              <Link
                href="/get-started"
                className="text-montessori-primary hover:underline font-medium"
              >
                Register your school
              </Link>
            </p>
            <p>
              Applying for a place?{" "}
              <Link
                href="/enrollment"
                className="text-montessori-primary hover:underline font-medium"
              >
                Apply for Enrollment
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
