import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  icon: LucideIcon;
}

export function ToolbarButton({ onClick, active, icon: Icon }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "p-2 rounded-lg transition-colors",
        active ? "bg-regif-blue text-white" : "text-gray-500 hover:bg-gray-200"
      )}
    >
      <Icon size={18} />
    </button>
  );
}
