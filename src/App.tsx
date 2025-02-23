import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";
import { diffLines } from "diff";
import { useEffect, useState } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import "./App.css";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

function App() {
  const [originText, setOriginText] = useState("");
  const [changedText, setChangedText] = useState("");
  const [resultText, setResultText] = useState("");
  useEffect(() => {
    const result = document.getElementById("result");
    const fragment = document.createDocumentFragment();
    const diff = diffLines(changedText, originText);
    for (let i = 0; i < diff.length; i++) {
      if (diff[i].added && diff[i + 1] && diff[i + 1].removed) {
        const swap = diff[i];
        diff[i] = diff[i + 1];
        diff[i + 1] = swap;
      }

      if (diff[i].removed) {
        // Split removed text into individual lines, each with a `-` prefix
        const removedLines = diff[i].value.split("\n").filter((line) => line);
        removedLines.forEach((line) => {
          const lineNode = document.createElement("div");
          lineNode.textContent = `- ${line}`;
          lineNode.style.color = "red"; // Optional: color removed lines
          fragment.appendChild(lineNode);
        });
      } else if (diff[i].added) {
        // Split added text into individual lines, each with a `+` prefix
        const addedLines = diff[i].value.split("\n").filter((line) => line);
        addedLines.forEach((line) => {
          const lineNode = document.createElement("div");
          lineNode.textContent = `+ ${line}`;
          lineNode.style.color = "green"; // Optional: color added lines
          fragment.appendChild(lineNode);
        });
      } else {
        // No change, keep original line
        const unchangedLines = diff[i].value.split("\n").filter((line) => line);
        unchangedLines.forEach((line) => {
          const lineNode = document.createElement("div");
          lineNode.textContent = `  ${line}`;
          fragment.appendChild(lineNode);
        });
      }
    }
    if (result) {
      result.textContent = "";
      result.appendChild(fragment);
      setResultText(result?.innerText || "");
    }
  }, [changedText, originText]);
  const options = {
    // mode: 'xml',
    theme: "material-darker",
    lineNumbers: true,
    lineWrapping: true,
  };
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <main className="p-2 h-screen">
        <h1 className="text-2xl  font-bold mb-4 flex items-center justify-between gap-4">
          <span>
            Markdown Diff Block Generater{" "}
            <img src="/vite.svg" alt="" className="inline-block h-[1em]" />
          </span>
          <a
            href="https://github.com/joisun/markdown-diff-block-generater"
            target="_blank"
          >
            <GitHubLogoIcon width={24} height={24} className="mr-2" />
          </a>
        </h1>
        <section className="h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-full flex flex-col gap-2">
            <Label
              className="font-semibold shrink-0 inline-block h-6"
              htmlFor="message"
            >
              Origin text
            </Label>
            <CodeMirror
              className="border border-gray-400 flex-1"
              value={changedText}
              options={options}
              onBeforeChange={(editor, data, value) => {
                setChangedText(value);
              }}
              onChange={(editor, data, value) => {
                setChangedText(value);
              }}
            />
          </div>
          <div className="h-full flex flex-col gap-2">
            <Label
              className="font-semibold shrink-0 inline-block h-6"
              htmlFor="message"
            >
              Changed text
            </Label>
            <CodeMirror
              className="border border-gray-400 flex-1"
              value={originText}
              options={options}
              onBeforeChange={(editor, data, value) => {
                setOriginText(value);
              }}
              onChange={(editor, data, value) => {
                setOriginText(value);
              }}
            />
          </div>
          <div className="h-full flex flex-col gap-2">
            <div className="inline-block h-6">
              <Label className="font-semibold shrink-0 " htmlFor="message">
                Result
              </Label>
              <CopyButton textToCopy={resultText} />
            </div>
            <pre
              id="result"
              className="border shrink-0 border-gray-400 flex-1 overflow-auto"
            ></pre>
          </div>
        </section>
      </main>
    </ThemeProvider>
  );
}

function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("```diff\n" + textToCopy + "\n```");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2秒后重置复制状态
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <Button
      variant="outline"
      className="h-[1em] mx-4 px-2"
      onClick={handleCopy}
    >
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

export default App;
