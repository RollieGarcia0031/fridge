"use client";

import Link from "next/link";
import { IoCloseOutline, IoPersonOutline } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AppHeader(){

  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathName = usePathname();

  useEffect(()=>{
    setIsCollapsed(true);
  },[pathName]);

  if (pathName == "/auth/login" || pathName == "/auth/signup") return null;

  return (
    <header className="border-border border-b border-solid
      px-4 py-2 bg-bg-dark 
      grid grid-cols-[1fr_auto_auto] justify-center items-center"
    >
      <div>
        <p className="text-lg font-extrabold">
          Fridge
        </p>
      </div>

      <button
        className="sm:hidden"
        onClick={()=>setIsCollapsed(false)}
      >
        <RxHamburgerMenu  className="fill-text-muted text-2xl"/>
      </button>

      <nav className={`[&>a]:flex [&>a]:gap-1 [&>a]:items-center [&>a]:text-text-muted [&>a]:justify-start
        fixed top-0 w-50 h-full bg-bg-dark
        ${isCollapsed? "-right-full" : "right-0"}
        sm:static sm:flex sm:flex-row sm:justify-end sm:gap-1
        py-4 sm:py-0 sm:px-0 px-4
        border-l-border border-l border-solid
        sm:border-none
        z-10 transition-all ease-in-out duration-300`}
        aria-label="main navigation"
      >
        <button className="w-full flex flex-row justify-end static sm:hidden
          mb-4 sm:mb-0"
          onClick={()=>setIsCollapsed(true)}
        >
          <IoCloseOutline className="fill-text-muted text-2xl"/>
        </button>
        <Link href="/auth/logout">
          <IoPersonOutline className="fill-text-muted text-2xl"/>
          <span>Logout</span>
        </Link>
      </nav>
    </header>
  )
}