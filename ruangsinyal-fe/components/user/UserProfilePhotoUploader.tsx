"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";

type UserProfilePhotoUploaderProps = {
  name: string;
  email: string;
  phone: string;
  initials: string;
  profilePhotoURL?: string;
};

function resizeProfilePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File harus berupa gambar."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca foto profil."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Foto profil tidak valid."));
      img.onload = () => {
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Browser tidak bisa memproses foto."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export function UserProfilePhotoUploader({
  name,
  phone,
  initials,
  profilePhotoURL = "",
}: UserProfilePhotoUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [photo, setPhoto] = useState(profilePhotoURL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function savePhoto(file?: File) {
    if (!file || loading) return;
    setError("");
    setLoading(true);
    try {
      const dataUrl = await resizeProfilePhoto(file);
      if (dataUrl.length > 800000) {
        throw new Error("Foto terlalu besar. Coba pakai foto lain.");
      }
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: name,
          phone,
          profile_photo_url: dataUrl,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Gagal menyimpan foto profil.");
      }
      setPhoto(dataUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan foto profil.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex w-16 shrink-0 flex-col items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        aria-busy={loading}
        title="Ubah foto profil"
        className="relative block cursor-pointer rounded-full outline-none transition focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-wait"
        aria-label="Pilih foto profil"
      >
        <span className="relative grid h-16 w-16 overflow-hidden rounded-full border border-sky-100 bg-sky-50 text-xl font-bold text-sky-700 shadow-[0_3px_10px_rgba(8,118,206,0.10)]">
          {photo ? (
            <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }} />
          ) : (
            <span className="grid h-full w-full place-items-center">{initials}</span>
          )}
          {loading ? <span className="absolute inset-0 grid place-items-center bg-black/30"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /></span> : null}
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#0876CE] text-white shadow-sm">
          <Camera className="h-3 w-3" strokeWidth={2.4} />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void savePhoto(event.target.files?.[0])}
      />
      {error ? <p role="alert" className="mt-2 w-full break-words text-center text-xs leading-4 text-rose-700">{error}</p> : null}
    </div>
  );
}
