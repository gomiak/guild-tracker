import Link from "next/link";
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/guild');
  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-center p-8 sm:p-20 gap-8">
      <h1 className="text-lg text-center">Welcome to guild tracker</h1>
      <div className="flex gap-4 items-center flex-col sm:flex-row">
        <Link
          href="#" 
          className="rounded-xl border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
        >
          Login
        </Link>

        <Link
          href="/guild"
          className="rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[200px]"
        >
          Acesso sem login
        </Link>
      </div>
    </div>
  );
}
