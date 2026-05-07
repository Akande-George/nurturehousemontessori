"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const PROGRAM_OPTIONS = [
  "Infant Community (Nurture Bloomers) - 6 months to 18 months",
  "Toddler Community (Nurture Buds) - 18 months to 3 years",
  "Children's House (Nurture Explorers) - 3 to 6 years",
] as const;

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function calculateAge(dob: string) {
  if (!dob) return "";

  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "";

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (now.getDate() < birth.getDate()) {
    months = Math.max(0, months - 1);
  }

  return `${years} years ${months} months`;
}

export default function EnrollmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [applicationDate, setApplicationDate] = useState(getTodayDate());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      alert(
        "Waitlist form submitted successfully. Our admissions team will contact you soon.",
      );
    }, 1500);
  };

  const handleDobChange = (value: string) => {
    setDob(value);
    setAge(calculateAge(value));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border-slate-100 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-8 py-5">
        <h2 className="font-serif text-xl text-slate-900">
          Waitlist Application
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Complete this form to join the Nurture House Montessori waitlist.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="space-y-5">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                Contact
              </h3>
              <p className="text-sm text-slate-500">
                Parent or guardian primary contact details.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                placeholder="name@example.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentName" className="text-slate-700">
                  Parent/Guardian Name
                </Label>
                <Input
                  id="parentName"
                  required
                  className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship" className="text-slate-700">
                  Relationship to Child
                </Label>
                <Input
                  id="relationship"
                  required
                  className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                  placeholder="Mother, Father, Guardian..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                  placeholder="0801 234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-slate-700">
                  WhatsApp Number
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  required
                  className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                  placeholder="0801 234 5678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation" className="text-slate-700">
                Occupation
              </Label>
              <Input
                id="occupation"
                required
                className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                placeholder="Occupation"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="preferredCommunication"
                className="text-slate-700"
              >
                Preferred Method of Communication
              </Label>
              <select
                id="preferredCommunication"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-montessori-primary"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a method
                </option>
                <option value="phone-call">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                Child Information
              </h3>
              <p className="text-sm text-slate-500">
                Prospective learner details.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="childName" className="text-slate-700">
                Child's Name
              </Label>
              <Input
                id="childName"
                required
                className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                placeholder="Full name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-slate-700">
                  Gender
                </Label>
                <select
                  id="gender"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-montessori-primary"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-slate-700">
                  Date of Birth
                </Label>
                <Input
                  id="dob"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="childAge" className="text-slate-700">
                Child's Age
              </Label>
              <Input
                id="childAge"
                value={age}
                readOnly
                placeholder="Calculated from date of birth"
                className="rounded-xl border-slate-200 bg-slate-50 text-slate-700 py-5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationality" className="text-slate-700">
                  Nationality
                </Label>
                <Input
                  id="nationality"
                  required
                  className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                  placeholder="Nationality"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredStartDate" className="text-slate-700">
                  Preferred Start Date
                </Label>
                <Input
                  id="preferredStartDate"
                  type="date"
                  required
                  className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-700">
                Address
              </Label>
              <Textarea
                id="address"
                required
                className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[90px] resize-none"
                placeholder="Home address"
              />
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                Programme & Background
              </h3>
              <p className="text-sm text-slate-500">
                Help us place your child in the right programme.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program" className="text-slate-700">
                Which program are you interested in?
              </Label>
              <select
                id="program"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-montessori-primary"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a program
                </option>
                {PROGRAM_OPTIONS.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstSchool" className="text-slate-700">
                Is this your child&apos;s first school experience?
              </Label>
              <select
                id="firstSchool"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-montessori-primary"
                defaultValue=""
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnerSupport" className="text-slate-700">
                Are you willing to partner with the school in supporting your
                child&apos;s independence and development?
              </Label>
              <select
                id="partnerSupport"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-montessori-primary"
                defaultValue=""
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tourDate" className="text-slate-700">
                  Preferred Tour/Interview Date
                </Label>
                <Input
                  id="tourDate"
                  type="date"
                  required
                  className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicationDate" className="text-slate-700">
                  Date
                </Label>
                <Input
                  id="applicationDate"
                  type="date"
                  required
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestReason" className="text-slate-700">
                Why are you interested in Nurture House Montessori School?
              </Label>
              <Textarea
                id="interestReason"
                required
                className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[110px] resize-none"
                placeholder="Share what drew you to our Montessori environment."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralSource" className="text-slate-700">
                How did you hear about us?
              </Label>
              <Input
                id="referralSource"
                required
                className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5"
                placeholder="Friend, Instagram, Google, community event..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="text-slate-700">
                Any Additional Information
              </Label>
              <Textarea
                id="additionalInfo"
                className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[110px] resize-none"
                placeholder="Share anything else that would help our admissions team understand your child and family better."
              />
            </div>
          </section>
        </div>

        <div className="mt-8 flex items-center justify-end pt-6 border-t border-slate-100">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-montessori-primary hover:bg-montessori-primary/90 text-white font-medium hover-lift disabled:opacity-70 disabled:hover-lift-none flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              "Submit Waitlist Application"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
