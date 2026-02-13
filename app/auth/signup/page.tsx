"use client";

import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "react-toastify";
import { useState } from "react";
import { TailSpin } from "react-loader-spinner";

export default function SignUp(){

  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="card-screen sm:p-0 p-2">
      <form onSubmit={e=>handleSubmit(e)}
        className="flex-cc
        bg-bg-light border-border border border-solid rounded-md
        sm:px-10 py-10 px-4 w-120
        grid-grid-rows-[auto_1fr_auto] gap-8 sm:gap-10"
      >
        <h1
          className="font-semibold text-xl"
        >
          Create A new Account
        </h1>
        <fieldset className="flex-ccl gap-4 w-full">
            <label>
              Email:
            </label>
            <input type="email" name="email" required
              className="w-full rounded-sm sm:px-4 px-2 py-2"
              placeholder="example@email.com"
            />
            <label>
              Password:
            </label>
            <input type="password" name="password" required
              className="w-full rounded-sm sm:px-4 px-2 py-2"
            />
        </fieldset>

        <div className="flex-cc gap-2 w-full">
          <button type="submit" className="w-full px-2 py-1 rounded-md
            bg-primary text-white dark:text-black hover:bg-secondary hover:p-2 duration-400 transition-all
            flex-cc
          ">
            {
              isLoading &&
              <TailSpin
                visible={true}
                height="20"
                width="20"
                color="#5e03fc"
                ariaLabel="tail-spin-loading"
                radius="3"
                wrapperClass=""
              />
            }
            {!isLoading &&
              <span>
                Create Account
              </span>
            }
          </button>
          <Link href="/auth/login">Log in instead</Link>
        </div>
      </form>
    </div>
  );

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>){
    e.preventDefault();
    if (isLoading) return;
    
    try {
      setIsLoading(true);

      const formData = new FormData(e.currentTarget);
      const {email, password}: any = Object.fromEntries(formData);

      const {data, error} = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw new Error(error.message);

      toast("Please check your email to confirm", {
        type: "info"
      });
    } catch (error) {
      if (error instanceof Error){
        toast(error.message, {
          type: "error"
        })
        console.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }

  }
}