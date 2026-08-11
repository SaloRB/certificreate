import { Editor } from "@/components/editor/Editor";

export default function Home() {
  return (
    <>
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border px-6 py-4">
        <span className="text-[15px] font-semibold tracking-[-0.01em]">
          Certifi<span className="text-accent">create</span>
        </span>
        <span className="text-xs text-faint">
          Name, course, date - certificate in seconds
        </span>
      </header>

      <Editor />
    </>
  );
}
