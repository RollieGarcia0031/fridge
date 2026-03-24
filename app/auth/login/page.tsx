"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { useState } from "react";
import { TailSpin } from "react-loader-spinner";
import { motion } from "framer-motion";

export default function Login() {
  const router = useRouter();
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
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
              <span className="text-white text-3xl font-black">F</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome Back</h1>
            <p className="text-text-muted">Enter your credentials to access your fridge</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold ml-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@company.com"
                  className="input px-4 py-3"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold ml-1">Password</label>
                  <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="input px-4 py-3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <TailSpin height="20" width="20" color="currentColor" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-text-muted">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-primary font-bold hover:underline">
                Join the kitchen
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-text-muted/60">
          &copy; {new Date().getFullYear()} Fridge AI. All rights reserved.
        </p>
      </motion.main>
    </div>
  );

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;

    const formData = new FormData(e.currentTarget);
    const { email, password }: any = Object.fromEntries(formData);

    try {
      setIsLoading(true);
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(error.message);
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }
}
