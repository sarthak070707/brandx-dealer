"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadCarPhoto } from "@/app/admin/cars/actions";
import { Button } from "@/components/ui/button";
import { compressPhoto } from "@/lib/image-compress";

type Props = { value: string; onChange: (url: string) => void; label: string; error?: string };

// Picks a photo, shrinks it in the browser, stores it, and hands back its address.
export function PhotoUpload({ value, onChange, label, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const upload = (file: File) =>
    startTransition(async () => {
      setProblem(null);
      try {
        const form = new FormData();
        form.set("photo", await compressPhoto(file), "photo");
        const result = await uploadCarPhoto(form);
        if (result.ok) onChange(result.url);
        else setProblem(result.error);
      } catch (failure) {
        setProblem(failure instanceof Error ? failure.message : "The photo couldn't be uploaded.");
      }
    });

  const shownProblem = problem ?? error;

  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted">
        {value ? <Image src={value} alt="" fill sizes="64px" className="object-cover" /> : <ImageIcon aria-hidden="true" className="size-5 text-muted-foreground" />}
      </div>
      <div className="flex flex-col items-start gap-1">
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => input.current?.click()}>
          {pending ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
        </Button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={label}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) upload(file);
          }}
        />
        {shownProblem && (
          <p role="alert" className="text-sm text-destructive">
            {shownProblem}
          </p>
        )}
      </div>
    </div>
  );
}
