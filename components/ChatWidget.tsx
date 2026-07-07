"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Check } from "lucide-react";

const HCAPTCHA_SITE_KEY = "d5505d72-aa1a-4b50-a746-a1b0175c9092";

declare global {
  interface Window {
    hcaptcha: {
      render: (el: HTMLElement, options: object) => string;
      execute: (id: string) => void;
      reset: (id: string) => void;
    };
    onChatHcaptchaVerify: (token: string) => void;
  }
}

export default function ChatWidget() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaId, setCaptchaId] = useState<string | null>(null);

  const captchaRef = useRef<HTMLDivElement>(null);

  // Ref na aktuální hodnoty formuláře — hCaptcha callback běží mimo běžný
  // React cyklus, takže by jinak viděl "zamrzlé" (stale) hodnoty z okamžiku vykreslení.
  const formRef = useRef({ name, email, message });
  formRef.current = { name, email, message };

  const submitWithToken = useCallback(async (token: string) => {
    const { name, email, message } = formRef.current;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, text: message, captchaToken: token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Nepodařilo se odeslat zprávu.");
      }

      setSent(true);
      setTimeout(() => {
        setSent(false);
        setName("");
        setEmail("");
        setMessage("");
        setOpen(false);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se odeslat zprávu.");
    } finally {
      setSending(false);
    }
  }, []);

  // hCaptcha — neviditelný režim, žádný viditelný widget. Spustí se až
  // při kliknutí na "Odeslat dotaz" (viz handleSubmitClick).
  useEffect(() => {
    if (!open) {
      // Formulář (a s ním i <div ref={captchaRef}>) zmizel z DOM, takže i
      // vykreslený widget je pryč — při dalším otevření se musí vykreslit znovu.
      setCaptchaId(null);
      return;
    }

    window.onChatHcaptchaVerify = (token: string) => submitWithToken(token);

    function initCaptcha() {
      if (captchaRef.current && window.hcaptcha) {
        const id = window.hcaptcha.render(captchaRef.current, {
          sitekey: HCAPTCHA_SITE_KEY,
          size: "invisible",
          callback: "onChatHcaptchaVerify",
        });
        setCaptchaId(id);
      }
    }

    if (document.getElementById("hcaptcha-script")) {
      initCaptcha();
      return;
    }
    const script = document.createElement("script");
    script.id = "hcaptcha-script";
    script.src = "https://js.hcaptcha.com/1/api.js?render=explicit&onload=onChatHcaptchaLoad";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    (window as any).onChatHcaptchaLoad = initCaptcha;
  }, [open, submitWithToken]);

  const canSubmit = !!name && !!email && !!message && !sending;

  function handleSubmitClick() {
    if (!canSubmit) return;
    setError(null);

    if (captchaId && window.hcaptcha) {
      window.hcaptcha.execute(captchaId);
    } else {
      setError("Ověření se ještě načítá, zkuste to prosím za chvíli znovu.");
    }
  }

  // V adminu widget vůbec nevykreslujeme.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Formulář */}
      {open && (
        <div className="bg-white rounded-2xl shadow-xl border border-border w-80 overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">Máš dotaz?</p>
              <p className="text-white/70 text-xs mt-0.5">Odpovíme co nejdříve</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Obsah */}
          <div className="p-5">
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={22} className="text-green-600" />
                </div>
                <p className="text-text-base font-semibold text-sm">Dotaz odeslán!</p>
                <p className="text-text-muted text-xs">Ozveme se ti co nejdříve.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tvoje jméno"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/50 transition-colors bg-surface"
                />
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Tvůj e-mail"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/50 transition-colors bg-surface"
                />
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Napiš svůj dotaz..."
                  rows={4}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/50 transition-colors resize-none bg-surface"
                />

                {/* hCaptcha — neviditelný kontejner, nic vizuálně nezabírá */}
                <div ref={captchaRef} />

                <button
                  onClick={handleSubmitClick}
                  disabled={!canSubmit}
                  className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    !canSubmit
                      ? "bg-border text-text-subtle cursor-not-allowed"
                      : "bg-primary text-dark hover:brightness-105"
                  }`}
                >
                  <Send size={14} />
                  <span>{sending ? "Odesílám…" : "Odeslat dotaz"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tlačítko */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open ? "bg-text-base text-white" : "bg-primary text-dark hover:brightness-105 hover:scale-105"
        }`}
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>

    </div>
  );
}