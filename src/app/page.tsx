import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed w-full z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex-shrink-0 flex items-center gap-3">
              <Image
                src="/logo2.png"
                alt="Nurture House Montessori Logo"
                width={82}
                height={82}
                className=""
              />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-slate-600 hover:text-montessori-primary transition-colors text-sm font-medium"
              >
                Features
              </Link>
              <Link
                href="#values"
                className="text-slate-600 hover:text-montessori-primary transition-colors text-sm font-medium"
              >
                Our Approach
              </Link>
              <Link
                href="/login"
                className="text-montessori-primary hover:text-montessori-primary/80 font-medium text-sm transition-colors"
              >
                Sign In
              </Link>
              <Button
                asChild
                className="bg-montessori-primary hover:bg-montessori-primary/90 text-white rounded-full hover-lift shadow-sm"
              >
                <Link href="/enrollment">Enroll Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex-1 flex flex-col justify-center">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-50">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-montessori-secondary/20 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-montessori-earth/20 blur-3xl" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-montessori-sky/10 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-montessori-primary/10 text-montessori-primary text-sm font-medium mb-8 shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-montessori-accent animate-pulse" />
            Nurturing independence, one child at a time
          </div>

          <h1 className="text-5xl md:text-7xl font-serif text-slate-900 mb-8 tracking-tight leading-tight max-w-4xl mx-auto">
            Empowering{" "}
            <span className="text-montessori-primary italic">
              child-centered
            </span>{" "}
            education through connection.
          </h1>

          <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            A comprehensive, centralized platform for progressive Montessori
            institutions to streamline operations, enhance teacher workflows,
            and build lasting trust with families.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto px-8 py-6 bg-montessori-primary hover:bg-montessori-primary/90 text-white rounded-full text-lg font-medium transition-all hover-lift shadow-md"
            >
              <Link href="/enrollment">
                Start Application
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-2"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-8 py-6 bg-white text-slate-700 hover:text-montessori-primary border-slate-200 rounded-full text-lg font-medium transition-all hover-lift shadow-sm"
            >
              <Link href="/login">Parent Portal Access</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Feature Highlights */}
      <section className="bg-white py-20 border-t border-slate-100 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 rounded-2xl bg-slate-50 border-slate-100 hover-lift shadow-none">
              <div className="w-12 h-12 rounded-xl bg-montessori-secondary/20 text-montessori-secondary flex items-center justify-center mb-6">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-medium text-slate-900 mb-3">
                Daily Activity Feed
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Stay connected with your child's day through photos, milestones,
                and daily logs directly on your device.
              </p>
            </Card>

            <Card className="p-8 rounded-2xl bg-slate-50 border-slate-100 hover-lift shadow-none">
              <div className="w-12 h-12 rounded-xl bg-montessori-primary/10 text-montessori-primary flex items-center justify-center mb-6">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-medium text-slate-900 mb-3">
                Montessori Progress
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Detailed tracking of individual growth, highlighting specific
                Montessori materials and developmental milestones.
              </p>
            </Card>

            <Card className="p-8 rounded-2xl bg-slate-50 border-slate-100 hover-lift shadow-none">
              <div className="w-12 h-12 rounded-xl bg-montessori-earth/10 text-montessori-earth flex items-center justify-center mb-6">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-medium text-slate-900 mb-3">
                Streamlined Enrollment
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Hassle-free digital pipelines for waitlists, acceptance letters,
                and parent portal activation.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
