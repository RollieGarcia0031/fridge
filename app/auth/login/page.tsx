"use client";

import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

export default function Login(){
  const router = useRouter();

  return (
    <div className="card-screen px-2">
      <main className="sm:w-120 w-full h-auto
        sm:p-10 p-4 py-10 bg-bg-light border border-border rounded-xl "
      >
        <form onSubmit={e=>handleSubmit(e)}
          className="grid grid-rows-[auto_1fr_auto] gap-8 sm:gap-10
            h-full"  
        >
          <h1 className="text-center font-semibold text-xl">
            Log in to your account
          </h1>
          <fieldset
            className="flex-ccl gap-4"
          >
            <label>Email:</label>
            <input type="email" name="email" required
              placeholder="example@email.com"
              className="w-full rounded-sm sm:px-4 px-2 py-2"
            />
            <label>Password:</label>
            <input type="password" name="password" required
              className="w-full rounded-sm sm:px-4 px-2 py-2"
            />
          </fieldset>
          
          <div className="flex-cc gap-2">
            <button type="submit" className="btn-primary hover:bg-secondary duration-300
              py-1 px-2 rounded-md w-full mx-2
            ">
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
        if (error instanceof Error){
          toast(error.message, {
            type: "error"
          });
          console.error(error.message);
        }
    }
  }
}