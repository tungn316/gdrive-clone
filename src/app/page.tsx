'use client'

import { FileBrowser } from "@/components/file-browser"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { UploadButton } from "@/components/upload-button"
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <>
      <Authenticated>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </>
  );
}

function Content() {
  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-white">My Drive</h1>
            <UploadButton />
          </div>
          <FileBrowser />
        </main>
      </div>
    </div>
  )
}
