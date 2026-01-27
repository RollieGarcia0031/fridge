"use client";

import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login(){
  const router = useRouter();

  return (
    <div className="card-screen">
      <main>
        <form onSubmit={e=>handleSubmit(e)}>
          <h1 className="text-center my-8">
            Log in to your account
          </h1>
          <fieldset className="flex-ccl gap-1">
            <label>Email:</label>
            <input type="email" name="email" required />
            <br/>
            <label>Password</label>
            <input type="password" name="password" required />
          </fieldset>
          
          <div className="flex-cc mt-8 gap-4">
            <button type="submit" className="btn-primary py-1 px-2 rounded-md w-full mx-2">
              Log in
            </button>

            <Link href="/auth/signup">Create Account</Link>
          </div>

        </form>
      </main>
    </div>
  );

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>){
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const {email, password}: any = Object.fromEntries(formData) || {};

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email, password
      });

      if (error) throw new Error(error.message);

      router.push("/");
    } catch (error) {
      if (error instanceof Error)
        console.error(error.message);
    }
  }
}