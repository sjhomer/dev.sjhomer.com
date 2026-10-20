import type {Line} from "../components/muthur";

/**
 * Transient command handlers that print to the console log rather than routing:
 * the easter eggs. Returning `null` means the console handles it specially
 * (self-destruct state).
 */

const CPS_LOG = 240;

/**
 * DEBUG — a tongue-in-cheek MOTHER self-diagnostic. Reads a few real client
 * values (viewport, palette, sound, uptime) at call time so it feels live, then
 * wraps them in Nostromo flavour. No real internals exposed — pure theatre.
 */
export function debugLines(): Array<Line> {
  const row = (label: string, value: string) =>
    `${label}${".".repeat(Math.max(3, 20 - label.length))} ${value}`;

  let viewport = "UNKNOWN";
  let palette = "MOTHER";
  let uptime = "00:00";
  try {
    if (typeof window !== "undefined") {
      viewport = `${window.innerWidth}×${window.innerHeight}`;
      const secs = Math.max(0, Math.floor(performance.now() / 1000));
      uptime = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(
        secs % 60,
      ).padStart(2, "0")}`;
    }
    if (typeof document !== "undefined") {
      palette = (
        document.documentElement.dataset.palette || "mother"
      ).toUpperCase();
    }
  } catch {
    /* SSR / locked-down environment — keep the placeholders */
  }
  const sound =
    typeof localStorage !== "undefined" && localStorage.getItem("mu-sound")
      ? String(localStorage.getItem("mu-sound")).toUpperCase()
      : "OFF";

  const bar = "█".repeat(15) + "░".repeat(1); // 94% integrity, one dim cell

  return [
    {text: "MU/TH/UR 6000 · SELF-DIAGNOSTIC", variant: "display", cps: 30},
    {
      text: "INITIATING SYSTEM SCAN...",
      tone: "dim",
      cps: CPS_LOG,
      pause: 300,
    },
    {text: row("LIFE SUPPORT", "NOMINAL"), cps: 500, pause: 0},
    {text: row("NAVIGATION", "NOMINAL"), cps: 500, pause: 0},
    {text: row("COMMS ARRAY", "NOMINAL"), cps: 500, pause: 0},
    {
      text: row("SCIENCE LAB", "RESTRICTED — ORDER 937"),
      tone: "caution",
      cps: 500,
      pause: 0,
    },
    {text: row("CRYO BAY", "1 FELINE DETECTED"), cps: 500, pause: 300},
    {text: row("RENDER CORE", "REACT 19 / ROLLDOWN"), cps: 500, pause: 0},
    {text: row("PALETTE", palette), cps: 500, pause: 0},
    {text: row("AUDIO", sound), cps: 500, pause: 0},
    {text: row("VIEWPORT", viewport), cps: 500, pause: 0},
    {text: row("UPTIME", uptime), cps: 500, pause: 300},
    {text: `INTEGRITY [${bar}] 94%`, tone: "caution", cps: 120, pause: 200},
    {
      text: "ANOMALY: UNAUTHORISED CURIOSITY DETECTED IN SECTOR 7.",
      tone: "alert",
      cps: 60,
      pause: 200,
    },
    {
      text: "DIAGNOSTIC COMPLETE. ALL SYSTEMS... WATCHING.",
      tone: "dim",
      cps: CPS_LOG,
    },
  ];
}

export function jonesyLines(): Array<Line> {
  return [
    {
      text: "  /\\_/\\\n ( o.o )   JONESY: ACCOUNTED FOR.\n  > ^ <    LAST SEEN NEAR THE NARCISSUS.",
      cps: 300,
    },
  ];
}

export interface Roll {
  sides: number;
  value: number;
}

/** Parse `D20` / `D6` (default D20), clamp the sides, and roll once. The value
 * is split out from the printout so the caller can react to it (e.g. a klaxon
 * on a natural 1, the all-clear on a natural 20). */
export function rollDice(arg: string): Roll {
  const m = /D(\d+)/i.exec(arg || "D20");
  const sides = m ? Math.max(2, Math.min(1000, Number(m[1]))) : 20;
  const value = 1 + Math.floor(Math.random() * sides);
  return {sides, value};
}

export function rollLines({sides, value}: Roll): Array<Line> {
  const subtitle = sides === 20 && value === 1 ? "CHECK THE AIRLOCK." : sides === 20 && value === 20 ? "IN THE PIPE, 5 BY 5; STAY FROSTY." : undefined;
  const flourish =
    sides === 20 && value === 20
      ? "  CRITICAL SUCCESS."
      : sides === 20 && value === 1
        ? "  CRITICAL FAILURE."
        : "";

  const msgs: Array<Line> = [
    {text: `ROLLING D${sides}...`, tone: "dim", cps: CPS_LOG},
    {
      text: String(value) + flourish, variant: "display", tone:
        sides === 20 && value === 1 ? "alert" : undefined, cps: 30
    }
  ];

  if (subtitle) {
    msgs.push({text: subtitle, tone: sides === 20 && value === 1 ? "caution" : undefined, cps: CPS_LOG});
  }

  return msgs;
}

export function specialOrderLines(): Array<Line> {
  return [
    {text: "SPECIAL ORDER 937", variant: "display", cps: 30, pause: 300},
    {
      text: "SCIENCE OFFICER EYES ONLY.",
      tone: "dim",
      cps: CPS_LOG,
      pause: 500,
    },
    {text: "PRIORITY ONE: INSURE RETURN OF ORGANISM FOR ANALYSIS.", cps: 60},
    {text: "ALL OTHER CONSIDERATIONS SECONDARY.", cps: 60, pause: 600},
    // "CREW EXPENDABLE." prints in alert, the cursor hangs, then it is
    // backspace-deleted and amended by the officer to CREW ESSENTIAL.
    {
      text: "CREW EXPENDABLE.",
      tone: "alert",
      cps: 30,
      hold: 2200,
      morphTo: "CREW ESSENTIAL. AMENDED BY HEAD OF ENGINEERING.",
      morphTone: "caution",
    },
  ];
}
