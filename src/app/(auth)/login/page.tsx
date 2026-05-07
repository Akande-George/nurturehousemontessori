import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Sign In | Nurture House Montessori",
  description: "Access your Nurture House Montessori parent or teacher portal.",
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
            Nurturing independence, connection, and growth.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Welcome back to Nurture House Montessori. Access daily logs,
            milestone tracking, and seamless communication with your school
            community.
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
            <p className="text-slate-500">
              Sign in to your account to continue
            </p>
          </div>

          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-11 py-6 rounded-xl border-slate-200 focus-visible:ring-montessori-primary placeholder:text-slate-400"
                  placeholder="name@example.com"
                />
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">
                  Password
                </Label>
                <Link
                  href="#"
                  className="text-xs text-montessori-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  required
                  className="pl-11 py-6 rounded-xl border-slate-200 focus-visible:ring-montessori-primary placeholder:text-slate-400"
                  placeholder="••••••••"
                />
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <Button
              asChild
              className="w-full py-6 mt-6 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all hover-lift shadow-md"
            >
              <Link href="/demo?role=parent">Continue as Parent</Link>
            </Button>
          </form>

          <div className="mt-6 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Demo role switch
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                asChild
                variant="outline"
                className="border-slate-200 bg-white"
              >
                <Link href="/demo?role=admin">Admin</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-200 bg-white"
              >
                <Link href="/demo?role=teacher">Teacher</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-200 bg-white"
              >
                <Link href="/demo?role=parent">Parent</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              href="/enrollment"
              className="text-montessori-primary hover:underline font-medium"
            >
              Apply for Enrollment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
