"use client";

import { useState, useTransition } from "react";
import { Mail, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestOtp, verifyOtp } from "@/lib/actions/auth";

export function LoginForm() {
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      if (!otpSent) {
        const res = await requestOtp(email);
        if (res?.error) setError(res.error);
        else {
          setOtpSent(true);
          setInfo(`We sent a 6-digit code to ${email}.`);
        }
        return;
      }
      const res = await verifyOtp(email, code.trim());
      if (res?.error) setError(res.error);
    });
  };

  const resend = () => {
    setError(null);
    setCode("");
    startTransition(async () => {
      const res = await requestOtp(email);
      if (res?.error) setError(res.error);
      else setInfo(`We sent a new code to ${email}.`);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5 animate-pop-in">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-700">
          Email Address
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={otpSent}
            className="pl-11 py-6 rounded-xl border-slate-200 focus-visible:ring-montessori-primary placeholder:text-slate-400 disabled:opacity-70"
            placeholder="name@example.com"
          />
          <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {otpSent && (
        <div className="space-y-2">
          <Label htmlFor="code" className="text-slate-700">
            6-digit code
          </Label>
          <div className="relative">
            <Input
              id="code"
              inputMode="numeric"
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="pl-11 py-6 rounded-xl border-slate-200 tracking-[0.4em] font-mono focus-visible:ring-montessori-primary"
              placeholder="000000"
            />
            <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-emerald-600">{info}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="w-full py-6 bg-montessori-primary text-white rounded-xl font-medium hover:bg-montessori-primary/90 transition-all shadow-md disabled:opacity-60"
      >
        {pending
          ? "Please wait…"
          : otpSent
            ? "Verify & Sign In"
            : "Email me a sign-in code"}
      </Button>

      {otpSent ? (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setCode("");
              setError(null);
              setInfo(null);
            }}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Use a different email
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={pending}
            className="text-montessori-primary hover:underline font-medium disabled:opacity-60"
          >
            Resend code
          </button>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400">
          No password needed — we&apos;ll email you a one-time code.
        </p>
      )}
    </form>
  );
}
