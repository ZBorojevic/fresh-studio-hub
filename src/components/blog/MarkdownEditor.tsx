import { forwardRef, useImperativeHandle, useRef, type KeyboardEvent } from "react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type MarkdownEditorHandle = {
  /** Insert text at the caret (e.g. an image picked from the media library). */
  insert: (text: string) => void;
  focus: () => void;
};

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

/**
 * Markdown writing surface: a plain textarea (fast, native undo, paste works)
 * with a toolbar and the usual shortcuts — ⌘B bold, ⌘I italic, ⌘K link.
 * Formatting edits go through execCommand("insertText") so ⌘Z still undoes
 * them.
 */
const MarkdownEditor = forwardRef<
  MarkdownEditorHandle,
  { value: string; onChange: (v: string) => void; onPickImage: () => void; placeholder: string; label: string }
>(function MarkdownEditor({ value, onChange, onPickImage, placeholder, label }, ref) {
  const ta = useRef<HTMLTextAreaElement>(null);

  /** Replace the selection and keep native undo. */
  const replace = (start: number, end: number, text: string, selStart?: number, selEnd?: number) => {
    const el = ta.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(start, end);
    const ok = document.execCommand?.("insertText", false, text);
    if (!ok) {
      const next = el.value.slice(0, start) + text + el.value.slice(end);
      onChange(next);
    }
    requestAnimationFrame(() => {
      if (selStart != null) el.setSelectionRange(selStart, selEnd ?? selStart);
    });
  };

  const wrap = (before: string, after: string, fallback: string) => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = el.value.slice(s, e) || fallback;
    replace(s, e, before + sel + after, s + before.length, s + before.length + sel.length);
  };

  /** Toggle a prefix on every selected line ("## ", "> ", "- ", "1. "). */
  const linePrefix = (prefix: string | ((i: number) => string)) => {
    const el = ta.current;
    if (!el) return;
    const v = el.value;
    const ls = v.lastIndexOf("\n", el.selectionStart - 1) + 1;
    let le = v.indexOf("\n", el.selectionEnd);
    if (le === -1) le = v.length;
    const lines = v.slice(ls, le).split("\n");
    const pre = (i: number) => (typeof prefix === "string" ? prefix : prefix(i));
    const all = lines.every((l, i) => l.startsWith(pre(i)));
    const out = lines
      .map((l, i) => (all ? l.slice(pre(i).length) : pre(i) + l.replace(/^(#{1,6} |> |- |\d+\. )/, "")))
      .join("\n");
    replace(ls, le, out, ls, ls + out.length);
  };

  const link = () => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = el.value.slice(s, e) || "link text";
    const text = `[${sel}](https://)`;
    replace(s, e, text, s + sel.length + 3, s + text.length - 1);
  };

  useImperativeHandle(ref, () => ({
    insert: (text: string) => {
      const el = ta.current;
      if (!el) return;
      const s = el.selectionStart;
      const needsBreak = s > 0 && el.value[s - 1] !== "\n";
      const block = (needsBreak ? "\n\n" : "") + text + "\n\n";
      replace(s, el.selectionEnd, block, s + block.length);
    },
    focus: () => ta.current?.focus(),
  }));

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (!mod || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "b") {
      e.preventDefault();
      wrap("**", "**", "bold");
    } else if (k === "i") {
      e.preventDefault();
      wrap("_", "_", "italic");
    } else if (k === "k") {
      e.preventDefault();
      link();
    }
  };

  const tools: Array<{ icon: typeof Bold; label: string; key?: string; run: () => void } | "sep"> = [
    { icon: Heading2, label: "Heading", run: () => linePrefix("## ") },
    { icon: Heading3, label: "Subheading", run: () => linePrefix("### ") },
    "sep",
    { icon: Bold, label: "Bold", key: `${MOD} B`, run: () => wrap("**", "**", "bold") },
    { icon: Italic, label: "Italic", key: `${MOD} I`, run: () => wrap("_", "_", "italic") },
    { icon: Link2, label: "Link", key: `${MOD} K`, run: link },
    "sep",
    { icon: Quote, label: "Quote", run: () => linePrefix("> ") },
    { icon: List, label: "Bulleted list", run: () => linePrefix("- ") },
    { icon: ListOrdered, label: "Numbered list", run: () => linePrefix((i) => `${i + 1}. `) },
    { icon: Code, label: "Code", run: () => wrap("`", "`", "code") },
    { icon: Minus, label: "Divider", run: () => replace(ta.current!.selectionStart, ta.current!.selectionEnd, "\n\n---\n\n") },
    "sep",
    { icon: ImageIcon, label: "Image from Media Library", run: onPickImage },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="toolbar" aria-label="Formatting" className="flex shrink-0 items-center gap-0.5 border-b bg-card/80 px-3 py-1.5 backdrop-blur">
        {tools.map((t, i) =>
          t === "sep" ? (
            <span key={i} className="mx-1.5 h-5 w-px bg-border" aria-hidden />
          ) : (
            <Tooltip key={t.label}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={t.run}
                  aria-label={t.key ? `${t.label} (${t.key})` : t.label}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <t.icon className="h-4 w-4" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t.label}
                {t.key && <span className="ml-2 text-muted-foreground">{t.key}</span>}
              </TooltipContent>
            </Tooltip>
          )
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">Markdown</span>
      </div>
      <label htmlFor="md-body" className="sr-only">
        {label}
      </label>
      <textarea
        id="md-body"
        ref={ta}
        name="content"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        spellCheck
        autoComplete="off"
        className="min-h-0 flex-1 resize-none bg-transparent px-6 py-5 font-mono text-[15px] leading-7 text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:bg-card/40"
      />
    </div>
  );
});

export default MarkdownEditor;
