"use client";

function inlineText(value: string) {
  const parts = value.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return <span key={index}>{part}</span>;
  });
}

export function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      nodes.push(<ul key={`list-${nodes.length}`}>{listItems.map((item, index) => <li key={index}>{inlineText(item)}</li>)}</ul>);
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      flushList();
      if (inCode) {
        nodes.push(<pre key={`code-${index}`}><code>{codeLines.join("\n")}</code></pre>);
        codeLines = [];
        inCode = false;
      } else inCode = true;
      return;
    }
    if (inCode) { codeLines.push(line); return; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const list = line.match(/^\s*[-*+]\s+(.+)$/);
    if (list) { listItems.push(list[1]); return; }
    flushList();
    if (!line.trim()) return;
    if (heading) {
      const level = heading[1].length;
      const text = inlineText(heading[2]);
      if (level === 1) nodes.push(<h1 key={index}>{text}</h1>);
      else if (level === 2) nodes.push(<h2 key={index}>{text}</h2>);
      else nodes.push(<h3 key={index}>{text}</h3>);
    } else if (line.trim() === "---") nodes.push(<hr key={index} />);
    else nodes.push(<p key={index}>{inlineText(line)}</p>);
  });
  flushList();
  if (inCode) nodes.push(<pre key="code-last"><code>{codeLines.join("\n")}</code></pre>);

  if (!content.trim()) return <div className="preview-empty">Markdown içeriğin burada önizlenecek.</div>;
  return <article className="markdown-preview">{nodes}</article>;
}
