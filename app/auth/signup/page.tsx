"use client";

import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignUp(){

  return (
    <div className="card-screen">
      <form onSubmit={e=>handleSubmit(e)} className="flex-cc">
        <h1>Create A new Account</h1>
        <fieldset className="flex-ccl gap-4">
            <label>
              Email: <br/>
              <input type="email" name="email" required />
            </label>
            <label>
              Password: <br/>
              <input type="password" name="password" required />
            </label>
        </fieldset>

        <div className="flex-cc gap-2 mt-4">
          <button type="submit" className="bg-primary text-black px-2 py-1 rounded-md">
            Create Account
          </button>
          <Link href="/auth/login">Log in instead</Link>
        </div>
      </form>
    </div>
  );

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>){
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);
      const {email, password}: any = Object.fromEntries(formData);

      const {data, error} = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw new Error(error.message);

      alert("Please check your email to confirm");
    } catch (error) {
      if (error instanceof Error)
        console.error(error.message);
    }

  }
}