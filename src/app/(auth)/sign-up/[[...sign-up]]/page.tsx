import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900">
      <SignUp />
    </div>
  );
}
