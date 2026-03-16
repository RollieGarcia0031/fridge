'use client';

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation";
import { Puff } from "react-loader-spinner";

export default function Logout(){

  const router = useRouter();

  useEffect(()=>{
    const logout = async ()=>{
      await getSupabaseClient().auth.signOut();
      router.push("/auth/login");
    }

    logout();

    return ()=>{
      logout();
    }
  },[]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-4">
      <Puff
        visible={true}
        height="80"
        width="80"
        color="#f57e42"
        ariaLabel="puff-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
      <p className="text-text-muted">
        Logging out ...
      </p>
    </div>
  )
}