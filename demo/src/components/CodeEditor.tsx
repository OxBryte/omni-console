import { useState } from 'react';

interface CodeEditorProps {
  code: string;
  tabName: string;
}

export default function CodeEditor({ code, tabName }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-editor">
      <div className="code-editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="code-editor-tabs">
          <div className="code-editor-tab">{tabName}</div>
        </div>
        <button
          onClick={handleCopy}
          className="btn-copy"
          style={{ position: 'static' }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="code-block">
        <code>{code}</code>
      </pre>
    </div>
  );
}
