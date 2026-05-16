"use client";

/**
 * MarkdownRenderer — drop-in replacement for <MessageResponse> that
 * intercepts rendered <pre> blocks and adds a Preview button to code fences
 * for HTML / CSS / JS / TS when the language is previewable.
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
import { memo, type ComponentProps, type ReactNode } from "react";
import { Streamdown } from "streamdown";

const streamdownPlugins = { cjk, code, math, mermaid };

type PreProps = ComponentProps<"pre"> & {
  "data-language"?: string;
  "data-code"?: string;
  children?: ReactNode;
};

/**
 * Custom <pre> renderer injected into Streamdown via its `components` prop.
 * Streamdown's code plugin adds `data-language` and `data-code` attributes.
 */
const CustomPre = ({ "data-language": language = "text", "data-code": rawCode = "", children, ...rest }: PreProps) => {
  // Strip any trailing newline that syntax highlighters add
  const code = rawCode.replace(/\n$/, "");
  const lang = language as BundledLanguage;
  const canPreview = isPreviewable(language);

  return (
    <CodeBlockContainer language={language} className="not-prose my-3" {...(rest as object)}>
      <CodeBlockHeader>
        <CodeBlockTitle>
          <span className="font-mono text-xs text-muted-foreground">{language}</span>
        </CodeBlockTitle>
        <CodeBlockActions>
          {canPreview && (
            <CodeBlockPreviewButton
              code={code}
              language={language}
              className="size-7"
            />
          )}
          <CodeBlockCopyButton className="size-7" />
        </CodeBlockActions>
      </CodeBlockHeader>
      {/* Render children as-is (Streamdown already syntax-highlighted) */}
      {children ?? <CodeBlockContent code={code} language={lang} />}
    </CodeBlockContainer>
  );
};

const streamdownComponents = { pre: CustomPre };

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
