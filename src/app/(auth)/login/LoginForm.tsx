"use client";

import { useState, useTransition } from "react";
import { Mail, Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signInWithPassword,
  requestOtp,
  verifyOtp,
} from "@/lib/actions/auth";

type Mode = "password" | "otp";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      if (mode === "password") {
        const res = await signInWithPassword(email, password);
        if (res?.error) setError(res.error);
        return;
      }
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
            disabled={mode === "otp" && otpSent}
            className="pl-11 py-6 rounded-xl border-slate-200 focus-visible:ring-montessori-primary placeholder:text-slate-400"
            placeholder="name@example.com"
          />
          <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {mode === "password" && (
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-11 py-6 rounded-xl border-slate-200 focus-visible:ring-montessori-primary placeholder:text-slate-400"
              placeholder="••••••••"
            />
            <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}

      {mode === "otp" && otpSent && (
        <div className="space-y-2">
          <Label htmlFor="code" className="text-slate-700">
            6-digit code
          </Label>
          <div className="relative">
            <Input
              id="code"
              inputMode="numeric"
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
          : mode === "password"
            ? "Sign In"
            : otpSent
              ? "Verify & Sign In"
              : "Email me a code"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "password" ? "otp" : "password");
            setOtpSent(false);
            setError(null);
            setInfo(null);
          }}
          className="text-sm text-montessori-primary hover:underline font-medium"
        >
          {mode === "password"
            ? "Sign in with an email code instead"
            : "Use a password instead"}
        </button>
      </div>
    </form>
  );
}
