"use client";

/**
 * MarkdownRenderer — drop-in replacement for <MessageResponse> that:
 * 1. Intercepts rendered <pre> blocks and adds a Preview button for HTML/CSS/JS/TS
 * 2. Parses [font:style] ... [/font] tags and renders styled spans with live Google Fonts
 */

import {
  CodeBlockActions,
  CodeBlockContainer,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockPreviewButton,
  CodeBlockTitle,
  isPreviewable,
} from "@/components/ai-elements/code-block";
import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { BundledLanguage } from "shiki";
import {
  Fragment,
  memo,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Streamdown } from "streamdown";

const streamdownPlugins = { cjk, code, math, mermaid };

// ─── Font tag definitions ────────────────────────────────────────────────────

type FontStyle = {
  className?: string;
  style?: React.CSSProperties;
  /** Google Font family name to lazy-load, e.g. "Fredoka One" */
  googleFont?: string;
};

const FONT_MAP: Record<string, FontStyle> = {
  italic:      { className: "italic" },
  bold:        { className: "font-bold" },
  mono:        { className: "font-mono" },
  large:       { className: "text-lg leading-relaxed" },
  small:       { className: "text-xs" },
  highlight:   { className: "bg-yellow-200 dark:bg-yellow-800/50 text-foreground rounded px-0.5" },
  cartoon:     { style: { fontFamily: "'Fredoka One', cursive" }, googleFont: "Fredoka+One" },
  elegant:     { style: { fontFamily: "'Playfair Display', serif" }, googleFont: "Playfair+Display" },
  handwriting: { style: { fontFamily: "'Caveat', cursive" }, googleFont: "Caveat" },
};

// Track which fonts have already been injected to avoid duplicates
const loadedFonts = new Set<string>();

function loadGoogleFont(family: string) {
  if (typeof document === "undefined") return;
  if (loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  document.head.appendChild(link);
}

// ─── Font tag parser ─────────────────────────────────────────────────────────

/**
 * Parses a string containing [font:X] ... [/font] tags and returns
 * an array of ReactNode segments with appropriate styling applied.
 *
 * Supports nesting by recursive processing.
 */
function parseFontTags(text: string, depth = 0): ReactNode[] {
  // Safety: cap recursion
  if (depth > 8) return [text];

  const TAG_OPEN = /\[font:([a-z]+)\]/i;
  const TAG_CLOSE = "[/font]";
  const nodes: ReactNode[] = [];
  let remaining = text;
  let i = 0;

  while (remaining.length > 0) {
    const match = TAG_OPEN.exec(remaining);
    if (!match) {
      // No more open tags — push remaining literal text
      nodes.push(<Fragment key={i++}>{remaining}</Fragment>);
      break;
    }

    // Text before the tag
    if (match.index > 0) {
      nodes.push(<Fragment key={i++}>{remaining.slice(0, match.index)}</Fragment>);
    }

    const styleName = match[1].toLowerCase();
    const afterOpen = remaining.slice(match.index + match[0].length);

    // Find the matching [/font]
    const closeIdx = afterOpen.indexOf(TAG_CLOSE);
    if (closeIdx === -1) {
      // Unclosed tag — render rest as plain text
      nodes.push(<Fragment key={i++}>{remaining.slice(match.index)}</Fragment>);
      break;
    }

    const inner = afterOpen.slice(0, closeIdx);
    remaining = afterOpen.slice(closeIdx + TAG_CLOSE.length);

    const fontDef = FONT_MAP[styleName];

    if (!fontDef) {
      // Unknown style — just render inner text without wrapping
      nodes.push(<Fragment key={i++}>{parseFontTags(inner, depth + 1)}</Fragment>);
    } else {
      if (fontDef.googleFont) loadGoogleFont(fontDef.googleFont);
      nodes.push(
        <span
          className={fontDef.className}
          key={i++}
          style={fontDef.style}
        >
          {parseFontTags(inner, depth + 1)}
        </span>
      );
    }
  }

  return nodes;
}

// ─── Custom Streamdown components ────────────────────────────────────────────

type PreProps = ComponentProps<"pre"> & {
  "data-language"?: string;
  "data-code"?: string;
  children?: ReactNode;
};

const CustomPre = ({
  "data-language": language = "text",
  "data-code": rawCode = "",
  children,
  ...rest
}: PreProps) => {
  const codeStr = rawCode.replace(/\n$/, "");
  const lang = language as BundledLanguage;
  const canPreview = isPreviewable(language);

  return (
    <CodeBlockContainer
      className="not-prose my-3"
      language={language}
      {...(rest as object)}
    >
      <CodeBlockHeader>
        <CodeBlockTitle>
          <span className="font-mono text-xs text-muted-foreground">
            {language}
          </span>
        </CodeBlockTitle>
        <CodeBlockActions>
          {canPreview && (
            <CodeBlockPreviewButton
              className="size-7"
              code={codeStr}
              language={language}
            />
          )}
          <CodeBlockCopyButton className="size-7" />
        </CodeBlockActions>
      </CodeBlockHeader>
      {children ?? <CodeBlockContent code={codeStr} language={lang} />}
    </CodeBlockContainer>
  );
};

type ParagraphProps = ComponentProps<"p">;

/**
 * Custom <p> renderer that scans text content for [font:X] tags and renders
 * styled spans. Falls back to normal rendering when no tags are present.
 */
const CustomParagraph = ({ children, className, ...rest }: ParagraphProps) => {
  // Only process string children — complex children (nested elements) pass through
  if (typeof children === "string" && children.includes("[font:")) {
    return (
      <p className={className} {...rest}>
        {parseFontTags(children)}
      </p>
    );
  }
  return <p className={className} {...rest}>{children}</p>;
};

const streamdownComponents = {
  pre: CustomPre,
  p: CustomParagraph,
};

// ─── MarkdownRenderer ─────────────────────────────────────────────────────────

export type MarkdownRendererProps = ComponentProps<typeof Streamdown>;

export const MarkdownRenderer = memo(
  ({ className, ...props }: MarkdownRendererProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={streamdownComponents}
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

MarkdownRenderer.displayName = "MarkdownRenderer";
