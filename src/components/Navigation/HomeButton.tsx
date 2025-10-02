"use client";

import Link from "next/link";
import { MdHome } from "react-icons/md";
import { toast } from "sonner";

export default function HomeButton() {
  return (
    <Link href="/">
      <button
        onClick={() => toast.info("Navigating to home")}
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        title="Go to home"
      >
        <MdHome className="w-5 h-5" />
      </button>
    </Link>
  );
}
