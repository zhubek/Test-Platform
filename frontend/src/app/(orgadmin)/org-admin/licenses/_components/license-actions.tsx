"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link2, KeyRound, Copy, Check, RefreshCw } from "lucide-react";
import { magicUrl } from "./mock-data";
import type { OrgLicense } from "./mock-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Generate a readable temporary password (mock).
function genPassword(): string {
  const animals = ["tiger", "eagle", "wolf", "fox", "bear", "hawk", "lynx", "puma"];
  const a = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${a}-${num}`;
}

export function LicenseActions({ license }: { license: OrgLicense }) {
  const [urlOpen, setUrlOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState<string>("");

  const url = magicUrl(license.code);
  const who = license.name || license.code;

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openPassword() {
    setPassword(genPassword());
    setPwOpen(true);
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setUrlOpen(true)}
          title="Generate access URL"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={openPassword}
          title="Reset password"
        >
          <KeyRound className="h-4 w-4" />
        </Button>
      </div>

      {/* Generate URL dialog */}
      <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Access link</DialogTitle>
            <DialogDescription>
              Share this link with {who}. Opening it signs them in directly — no
              code or password needed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-xl border bg-card p-4">
              <QRCodeSVG value={url} size={160} />
            </div>
            <div className="flex w-full items-center gap-2">
              <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">
                {url}
              </code>
              <Button size="sm" variant="outline" onClick={() => copy(url)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              A new temporary password for {who}. Read it to the student — they can
              change it after signing in.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-3">
            <div className="rounded-lg border bg-muted px-6 py-4 text-center">
              <p className="font-mono text-2xl font-bold tracking-wide">{password}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copy(password)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPassword(genPassword())}>
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
