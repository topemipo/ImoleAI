import React from "react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { PiTerminalThin } from "react-icons/pi";
import { icons } from "@/lib/icons";
import CopyButton from "./CopyButton";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  readonly content: string;
}

interface CodeBlockProps {
  language: string;
  meta?: string;
  children: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, meta, children }) => {
  const id = `code-${crypto.randomUUID()}`;
  const Icon = icons[language as keyof typeof icons] || PiTerminalThin;

  return (
    <div className="bg-gradient-dark text-gray-300 border-[0.5px] rounded-md border-zinc-500">
      <div className="flex items-center justify-between px-5 py-2 border-b-[0.5px] border-zinc-500">
        <div className="flex items-center gap-2">
          <Icon />
          {meta && <p className="text-sm text-gray-400">{meta}</p>}
        </div>
        {/* <CopyButton id={id}/> */}
      </div>
      <div className="overflow-x-auto w-full">
        <div className="p-5" id={id}>{children}</div>
      </div>
    </div>
  );
};

const InlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="text-lg break-words bg-zinc-700 px-1 rounded-sm">{children}</code>
);

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const components: Components = {
    h1: (props) => <h1 {...props} className="text-3xl font-bold" />,
    h2: (props) => <h2 {...props} className="text-2xl font-bold mt-10 mb-10" />,
    h3: (props) => <h3 {...props} className="text-xl font-bold mt-10 mb-10" />,
    p: (props) => <p {...props} className="text-base hyphens-auto" />,
    html: ({ children }) => (
      <div dangerouslySetInnerHTML={{ __html: children as string }} />
    ),
    code: ({ node, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className ?? "");
      const codeContent = children?.toString() ?? "";
      
      if (codeContent.startsWith("<!DOCTYPE html>") || codeContent.startsWith("<html")) {
        return (
          <div className="overflow-x-auto max-h-[500px] border border-zinc-500 rounded-md">
            <iframe srcDoc={codeContent} className="w-full h-[500px] border-none" title="HTML Preview" />
          </div>
        );
      }

      return match ? (
        <CodeBlock language={match[1]} meta={node?.data?.meta as string}>
          {children}
        </CodeBlock>
      ) : (
        <InlineCode {...props}>{children}</InlineCode>
      );
    },
  };

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      className="prose w-full text-pretty react"
      components={components}
    >
      {content}
    </Markdown>
  );
};

export default MarkdownRenderer;
