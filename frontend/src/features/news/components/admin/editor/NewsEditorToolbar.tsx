// src/features/news/components/admin/editor/NewsEditorToolbar.tsx
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import type { Editor } from "@tiptap/react"; // Adicione 'type' aqui também

interface Props {
  editor: Editor | null;
}

function ToolBtn({ onClick, active, icon: Icon }: { onClick: () => void; active: boolean; icon: LucideIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx("p-2 rounded-lg transition-colors", active ? "bg-regif-blue text-white" : "text-gray-500 hover:bg-gray-200")}
    >
      <Icon size={18} />
    </button>
  );
}

export function NewsEditorToolbar({ editor }: Props) {
  if (!editor) return null;
  return (
    <div className="p-2 bg-gray-50 border-b flex flex-wrap gap-1">
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        icon={Heading1}
      />
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        icon={Heading2}
      />
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} icon={Bold} />
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} icon={Italic} />
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} icon={Underline} />
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} icon={List} />
      <ToolBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        icon={ListOrdered}
      />
      <ToolBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        icon={Quote}
      />
      <ToolBtn
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        icon={AlignLeft}
      />
      <ToolBtn
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        icon={AlignCenter}
      />
      <ToolBtn
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        icon={AlignRight}
      />
      <ToolBtn
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        active={editor.isActive({ textAlign: "justify" })}
        icon={AlignJustify}
      />
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} active={false} icon={Undo2} />
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} active={false} icon={Redo2} />
    </div>
  );
}