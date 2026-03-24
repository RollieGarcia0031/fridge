"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "react-toastify";
import { useState } from "react";
import { TailSpin } from "react-loader-spinner";
import { motion } from "framer-motion";

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-(--bg)">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="card p-8 md:p-12 shadow-2xl space-y-8 bg-linear-to-b from-bg-card to-bg-subtle/50">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/20">
              <span className="text-white text-3xl font-black">F</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Create Account</h1>
            <p className="text-text-muted">Join our community of home chefs today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold ml-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="chef@example.com"
                  className="input px-4 py-3"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold ml-1">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="input px-4 py-3"
                />
                <p className="text-[10px] text-text-muted px-1">Must be at least 8 characters long</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-3 bg-accent border-none text-white hover:brightness-110 shadow-accent/20"
            >
              {isLoading ? (
                <TailSpin height="20" width="20" color="currentColor" />
              ) : (
                "Get Started"
              )}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-text-muted">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-accent font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-text-muted/60">
          By signing up, you agree to our Terms of Service.
        </p>
      </motion.main>
    </div>
  );

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      const formData = new FormData(e.currentTarget);
      const { email, password }: any = Object.fromEntries(formData);

      const { error } = await getSupabaseClient().auth.signUp({
        email,
        password,
      });

      if (error) throw new Error(error.message);

      toast.info("Success! Please check your email to confirm your account.");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }
}
