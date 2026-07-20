import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: string;
}

function Toolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  const btn = (action: () => void, active: boolean, label: string) => (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); action(); }}
      className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${active ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50/50 px-3 py-2">
      {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), 'B')}
      {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), 'I')}
      {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), 'U')}
      <span className="mx-1 h-4 w-px bg-gray-200" />
      {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), '•')}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), '1.')}
      <span className="mx-1 h-4 w-px bg-gray-200" />
      {btn(() => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }), 'L')}
      {btn(() => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }), 'C')}
      {btn(() => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }), 'R')}
    </div>
  );
}

export default function RichTextEditor({ value, onChange, placeholder, editable = true, minHeight = '120px' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className={`rounded-lg border border-gray-200 bg-white overflow-hidden ${editable ? '' : 'border-transparent bg-transparent'}`} style={{ minHeight }}>
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className={`prose prose-sm max-w-none px-3 py-2 ${editable ? '' : 'p-0'}`} />
    </div>
  );
}
