'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export default function EnrollmentForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Application submitted successfully!');
    }, 1500);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border-slate-100 overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
        <h2 className="font-serif text-xl text-slate-900">Digital Enrollment</h2>
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                step >= s ? "bg-montessori-primary w-6" : "bg-slate-200"
              )} 
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        
        {/* Step 1: Parent Info */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Parent/Guardian Information</h3>
              <p className="text-sm text-slate-500 mb-6">Let's start with your contact details.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
                <Input id="firstName" required className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5" placeholder="Jane" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-700">Last Name</Label>
                <Input id="lastName" required className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5" placeholder="Doe" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <Input id="email" type="email" required className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5" placeholder="jane@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700">Phone Number</Label>
              <Input id="phone" type="tel" required className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5" placeholder="(555) 123-4567" />
            </div>
          </div>
        )}

        {/* Step 2: Child Info */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Child Information</h3>
              <p className="text-sm text-slate-500 mb-6">Tell us about the prospective student.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childFirstName" className="text-slate-700">First Name</Label>
                <Input id="childFirstName" required className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5" placeholder="Child's First Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="childLastName" className="text-slate-700">Last Name</Label>
                <Input id="childLastName" required className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5" placeholder="Child's Last Name" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-slate-700">Date of Birth</Label>
              <Input id="dob" type="date" required className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary py-5" />
            </div>
          </div>
        )}

        {/* Step 3: Additional Details */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Additional Details</h3>
              <p className="text-sm text-slate-500 mb-6">Any special considerations we should know about.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allergies" className="text-slate-700">Allergies or Medical Conditions</Label>
              <Textarea id="allergies" className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[100px] resize-none" placeholder="Please list any allergies or medical conditions we should be aware of..."></Textarea>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interest" className="text-slate-700">Why are you interested in a Montessori education?</Label>
              <Textarea id="interest" className="rounded-xl border-slate-200 focus-visible:ring-montessori-primary min-h-[100px] resize-none" placeholder="Briefly explain your interest..."></Textarea>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            className="rounded-full font-medium"
            disabled={step === 1 || isSubmitting}
          >
            Back
          </Button>
          
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
              step === 3 ? 'Submit Application' : 'Continue'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
