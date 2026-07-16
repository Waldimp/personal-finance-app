"use client";

import { useEffect, useState } from "react";

const QUIPS = [
  "Buscando de dónde sacar más dinero… 🕵️",
  "Si pensás que de verdad es un gasto hormiga, no lo comprés 🐜",
  "Spoiler: no te clonaron la tarjeta, todos esos gastos los hiciste vos 💳",
  "Consultando si el café de la mañana era necesario… ☕",
  "Negociando con el banco… mentira, solo cargando 🏦",
  "Tu yo del futuro te agradece estar aquí 🙌",
  "Revisando si ya te cayó el sueldo… 💵",
  "Los números no mienten (ojalá) 🔢",
  "Diciéndole que no a tus compras impulsivas… de nada 🙅",
  "Regando la plantita de tus ahorros 🌱",
  "Calculando a cuántos cafés equivale ese gasto ☕➗",
  "La paz financiera está cargando… 🧘",
  "Detectando gastos hormiga en el perímetro 🐜🔎",
  "Tu tarjeta pidió cinco minutitos más 💳😴",
  "Sumando, restando y juzgando un poquito 👀",
  "El cine no se va a pagar solo 🍿",
  "Convirtiendo tus taps en gráficos bonitos 📊",
  "Contando centavos con mucho cariño 🪙",
  "Tu quincena viene en camino… en teoría 🛣️",
  "Haciendo las cuentas que no querés hacer vos 🤓",
];

/**
 * Frase graciosa aleatoria para los skeletons de carga.
 * Se elige en el cliente (post-mount) para evitar mismatch de hidratación.
 */
export function LoadingQuip() {
  const [quip, setQuip] = useState<string | null>(null);

  useEffect(() => {
    setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
  }, []);

  return (
    <p
      className="min-h-5 text-center text-xs text-muted-foreground transition-opacity duration-300"
      style={{ opacity: quip ? 1 : 0 }}
    >
      {quip}
    </p>
  );
}
