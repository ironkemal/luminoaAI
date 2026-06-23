"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Todo } from "@/types";

export default function TodoItem({ todo }: { todo: Todo }) {
  const [checked, setChecked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleCheck = async () => {
    if (isUpdating || checked) return;
    setChecked(true);
    setIsUpdating(true);

    try {
      const supabase = createClient();
      await supabase
        .from("todos")
        .update({ completed: true })
        .eq("id", todo.id);

      // Short delay for the check animation, then refresh
      setTimeout(() => {
        router.refresh();
      }, 600);
    } catch (err) {
      console.error("Todo update error:", err);
      setChecked(false);
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
      style={{
        background: checked ? "#f0fdf4" : "transparent",
        opacity: checked ? 0.7 : 1,
      }}
    >
      {/* Custom checkbox */}
      <button
        onClick={handleCheck}
        disabled={isUpdating}
        className="mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          width: "18px",
          height: "18px",
          minWidth: "18px",
          background: checked ? "#16a34a" : "transparent",
          border: checked ? "2px solid #16a34a" : "2px solid #cbd5e1",
          cursor: isUpdating ? "not-allowed" : "pointer",
          borderRadius: "5px",
        }}
        onMouseEnter={(e) => {
          if (!checked) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#94a3b8";
            (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
          }
        }}
        onMouseLeave={(e) => {
          if (!checked) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#cbd5e1";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }
        }}
        aria-label="Todo erledigen"
      >
        {checked && (
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
            <path d="m1.5 5 2.5 2.5 4.5-4.5" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <span
        className="text-sm leading-relaxed flex-1 transition-all duration-300"
        style={{
          color: checked ? "#64748b" : "#374151",
          textDecoration: checked ? "line-through" : "none",
        }}
      >
        {todo.content}
      </span>
    </div>
  );
}
