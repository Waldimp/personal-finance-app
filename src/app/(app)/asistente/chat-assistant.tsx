"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizonal, Sparkles } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "¿Cuánto me queda este mes?",
  "¿En qué se me va más el pisto?",
  "¿Cómo voy con mis presupuestos?",
  "¿Cuánto llevo en gastos hormiga?",
  "¿Cuándo termino de pagar mis cuotas?",
  "Dame un consejo para ahorrar",
];

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [kbOffset, setKbOffset] = useState(0);
  const [focused, setFocused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, kbOffset, focused]);

  // Compensación de teclado:
  // - PWA instalada (iOS standalone): la VENTANA se redimensiona con el
  //   teclado → el contenedor fixed sube solo; offset medido ≈ 0. ✔
  // - Safari navegador: la ventana NO cambia, el visualViewport sí →
  //   offset = alto del teclado y lo compensamos con padding. ✔
  useEffect(() => {
    const vv = window.visualViewport;
    const measure = () => {
      const visible = vv ? vv.height + vv.offsetTop : window.innerHeight;
      setKbOffset(Math.max(0, window.innerHeight - visible));
      window.scrollTo(0, 0); // evita que iOS desplace el documento
    };
    measure();
    const timer = setInterval(measure, 400); // cubre la animación del teclado
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    return () => {
      clearInterval(timer);
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const effectiveOffset = kbOffset > 40 ? kbOffset : 0;

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.ok
            ? data.reply
            : (data.error ?? "Algo salió mal, probá de nuevo 🙏"),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sin conexión con el asistente 😔 probá de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-x-0 z-30 mx-auto flex w-full max-w-md flex-col bg-background px-4 pt-2"
      style={{
        top: "env(safe-area-inset-top)",
        bottom: 0,
        // Teclado abierto: la barra queda justo encima del teclado.
        // Teclado cerrado: queda encima del tab bar (que no se mueve).
        // Teclado visible (medido o ventana redimensionada con foco):
        // pegado arriba del teclado. Sin teclado: libra el tab bar y el "+".
        paddingBottom:
          effectiveOffset > 0
            ? effectiveOffset + 8
            : focused
              ? 12
              : "calc(8.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center gap-2 pb-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">Fina</h1>
          <p className="text-xs text-muted-foreground">
            Tu asistente financiera · solo habla de tu pisto
          </p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain pb-3">
        {messages.length === 0 && (
          <div className="space-y-4 pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Preguntame lo que querás sobre tus finanzas 💸
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-accent active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`animate-fade-up flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        className="flex gap-2 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="¿Cuánto gasté en salidas?"
          className="h-11 flex-1 rounded-full px-4"
          maxLength={500}
        />
        <Button
          type="submit"
          size="icon"
          className="size-11 rounded-full"
          disabled={loading || !input.trim()}
        >
          <SendHorizonal className="size-5" />
        </Button>
      </form>
    </div>
  );
}
