import React, { useState, useMemo, useEffect, useRef } from "react";

// ============================================================================
// VixiOn — Cuestionario del Perfil Visual v6
// Sistema interactivo de Perfiles Visuales para iOPR
// 15 preguntas en 4 secciones · 3 flags clínicos · UX optimizado
// ============================================================================
// MEJORAS v6:
// 1. Auto-save con recuperación (window.storage)
// 2. Animaciones de transición entre preguntas
// 3. Indicador de tiempo restante + mensajes cálidos
// 4. Modo accesibilidad / texto grande (A+)
// 6. Compartir resultados (descargar/imprimir/email)
// 8. Sound feedback opcional (toggle)
// 12. Opening reordenado: razón de visita primero
// 13. Healing Teal como color de acción primaria
// 14. Micro-pantalla transición entre secciones
// 15. Modo "vista clínico" via ?clinico=true
// ============================================================================

const C = {
  navy: "#2B5F8A",
  navyDark: "#1E4463",
  navyDeep: "#0F2A40",
  azure: "#4A90C4",
  teal: "#00A889",         // Acción primaria
  tealSoft: "#E6F7F3",
  tealDeep: "#007A63",
  tealDark: "#006653",
  gold: "#B8964E",
  goldSoft: "#F5EDDC",
  goldDeep: "#8C6F33",
  sand: "#F8F6F1",
  cloud: "#F5F7FA",
  slate: "#4A5568",
  slateLight: "#718096",
  ink: "#1A2332",
  white: "#FFFFFF",
  line: "#E8EEF4",
  lineSoft: "#F0F4F8",
  coral: "#D97757",
  amber: "#E8A547",
  amberSoft: "#FDF4E3",
};

const FONT_DISPLAY = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const STORAGE_KEY = "vixion_questionnaire_progress";

// ─── Definición del cuestionario (orden reordenado para mejor flow) ─────────
const SECTIONS = [
  {
    id: 1,
    title: "Su situación",
    subtitle: "Empecemos por entender qué le trae aquí hoy",
    questions: [
      {
        // REORDENADO: razón de visita PRIMERO (mayor relevancia emocional)
        id: "q1_reason",
        type: "single",
        text: "¿Cuál es la razón principal de su visita hoy?",
        options: [
          { v: "catarata", label: "Me diagnosticaron cataratas y necesito cirugía" },
          { v: "refractivo", label: "Quiero dejar de usar espejuelos o lentes de contacto" },
          { v: "borroso", label: "Veo borroso o distorsionado y quiero saber qué opciones tengo" },
          { v: "seguimiento", label: "Consulta de seguimiento o evaluación general" },
        ],
      },
      {
        id: "q2_age",
        type: "single",
        text: "¿Qué edad tiene?",
        options: [
          { v: "under40", label: "Menor de 40 años" },
          { v: "40-54", label: "40 – 54 años" },
          { v: "55-64", label: "55 – 64 años" },
          { v: "65-74", label: "65 – 74 años" },
          { v: "75plus", label: "75 años o más" },
        ],
      },
      {
        id: "q3_correction",
        type: "multi",
        text: "¿Qué tipo de corrección visual usa actualmente?",
        helper: "Marque todas las que apliquen",
        options: [
          { v: "espejuelos_lejos", label: "Espejuelos para ver de lejos" },
          { v: "espejuelos_cerca", label: "Espejuelos para leer / ver de cerca" },
          { v: "bifocales", label: "Bifocales o progresivos" },
          { v: "contactos", label: "Lentes de contacto" },
          { v: "ninguno", label: "No uso ninguna corrección" },
        ],
      },
      {
        id: "q4_refractive_history",
        type: "single",
        text: "¿Se ha sometido anteriormente a alguna cirugía para corregir su visión?",
        helper: "Si fue hace muchos años y no recuerda el tipo exacto, seleccione la opción más cercana",
        options: [
          { v: "lasik_prk", label: "Sí — LASIK o PRK (cirugía con láser sobre la córnea)" },
          { v: "icl", label: "Sí — Lente implantable (ICL u otro implante intraocular)" },
          { v: "catarata_previa", label: "Sí — Cirugía de cataratas en el otro ojo" },
          { v: "rk", label: "Sí — Queratotomía radial (cortes radiales en la córnea, años 80–90)" },
          { v: "ninguna", label: "No, nunca me he operado los ojos" },
          { v: "no_estoy_seguro", label: "No estoy seguro/a" },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Su día a día",
    subtitle: "Su estilo de vida nos ayuda a entender qué visión necesita",
    questions: [
      {
        id: "q5_occupation",
        type: "single",
        text: "¿Cuál de las siguientes describe mejor su ocupación o actividad principal?",
        options: [
          { v: "alta_precision", label: "Profesión de alta exigencia visual (médico, dentista, joyero, cirujano, técnico de precisión)" },
          { v: "oficina", label: "Trabajo de oficina con uso intensivo de computadora" },
          { v: "chofer_profesional", label: "Conductor profesional o trabajo que requiere mucho manejo, especialmente de noche" },
          { v: "manual", label: "Trabajo manual, construcción, oficios o exteriores" },
          { v: "retirado", label: "Retirado/a o dedicado/a al hogar" },
          { v: "otro", label: "Otra ocupación" },
        ],
      },
      {
        id: "q6_activities",
        type: "multi",
        text: "¿Qué actividades son importantes en su vida diaria?",
        helper: "Marque todas las que apliquen",
        options: [
          { v: "leer", label: "Leer libros, documentos o el celular" },
          { v: "computadora", label: "Trabajar en computadora" },
          { v: "deportes", label: "Practicar deportes o actividad física" },
          { v: "manualidades", label: "Manualidades, costura, tejer, pintar" },
          { v: "social", label: "Vida social activa y eventos" },
          { v: "viajar", label: "Viajar con frecuencia" },
          { v: "cocinar", label: "Cocinar y actividades del hogar" },
        ],
      },
      {
        id: "q7_night_driving",
        type: "single",
        text: "¿Conduce de noche con frecuencia?",
        options: [
          { v: "frecuente", label: "Sí, frecuentemente — es parte importante de mi rutina" },
          { v: "ocasional", label: "Ocasionalmente, cuando es necesario" },
          { v: "raro", label: "Casi nunca o nunca conduzco de noche" },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Su salud visual",
    subtitle: "Información clave para personalizar su perfil",
    questions: [
      {
        id: "q8_progressive_adaptation",
        type: "single",
        text: "Si alguna vez ha usado lentes progresivos o bifocales, ¿cómo fue su experiencia?",
        helper: "Si nunca los ha usado, seleccione la última opción",
        options: [
          { v: "facil", label: "Me adapté fácilmente y los uso sin problema" },
          { v: "dificultad", label: "Me costó trabajo adaptarme pero finalmente lo logré" },
          { v: "nunca_adapte", label: "No pude adaptarme y dejé de usarlos" },
          { v: "molestias", label: "Los uso pero todavía me molestan o no me gustan" },
          { v: "nunca_use", label: "Nunca he usado progresivos ni bifocales" },
        ],
      },
      {
        id: "q9_dry_eye",
        type: "single",
        text: "¿Con qué frecuencia experimenta alguno de estos síntomas: ardor, picor, sensación de arena, ojos cansados o visión que fluctúa durante el día?",
        options: [
          { v: "nunca", label: "Nunca o muy rara vez" },
          { v: "ocasional", label: "Ocasionalmente, no me molesta mucho" },
          { v: "frecuente", label: "Frecuentemente, varias veces por semana" },
          { v: "constante", label: "Constantemente, todos los días" },
        ],
      },
      {
        // Q9b: Conditional follow-up. Only shown if Q9 = frecuente or constante.
        // Distinguishes "screen positive sin tratamiento" vs "diagnóstico activo"
        id: "q9b_dry_eye_diagnosis",
        type: "single",
        text: "¿Le han diagnosticado ojo seco previamente, o usa gotas lubricantes (lágrimas artificiales como Refresh, Systane, Hylo, Theratears, etc.) regularmente?",
        helper: "No incluya gotas para alergia, glaucoma, infecciones u otras condiciones",
        condition: { questionId: "q9_dry_eye", values: ["frecuente", "constante"] },
        options: [
          { v: "diagnostico_y_gotas", label: "Sí — tengo diagnóstico previo de ojo seco y uso gotas lubricantes regularmente" },
          { v: "solo_gotas", label: "Sí — uso gotas lubricantes con frecuencia, pero sin diagnóstico formal" },
          { v: "solo_diagnostico", label: "Sí — me han mencionado ojo seco antes, pero no uso gotas regularmente" },
          { v: "ninguno", label: "No — nunca me han hablado de eso ni uso gotas lubricantes" },
          { v: "no_seguro", label: "No estoy seguro/a" },
        ],
      },
      {
        id: "q10_satisfaction_history",
        type: "single",
        text: "Pensando en su historia con espejuelos o lentes, ¿qué tan satisfecho/a ha estado con su visión a lo largo de los años?",
        options: [
          { v: "muy_satisfecho", label: "Muy satisfecho/a — siempre he visto bien con mi corrección" },
          { v: "satisfecho", label: "Satisfecho/a en general, con algunos cambios menores" },
          { v: "frecuente_cambios", label: "He tenido que cambiar mi receta con mucha frecuencia" },
          { v: "nunca_perfecto", label: "Nunca he sentido que veo perfectamente, aunque he probado de todo" },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Sus expectativas",
    subtitle: "Lo que espera de su nueva visión",
    questions: [
      {
        id: "q11_independence",
        type: "likert",
        text: "¿Qué tan importante es para usted dejar de depender de espejuelos después del procedimiento?",
        leftLabel: "No me importa seguir usándolos",
        rightLabel: "Es muy importante no usarlos",
      },
      {
        id: "q12_distance_priority",
        type: "single",
        text: "Si tuviera que elegir UNA distancia donde quiere ver perfectamente sin espejuelos, ¿cuál sería?",
        options: [
          { v: "lejos", label: "Lejos — para conducir, ver televisión, deportes" },
          { v: "intermedio_corto", label: "Intermedio cercano (40–60 cm) — laptop, dashboard del carro" },
          { v: "intermedio_largo", label: "Intermedio amplio (60–90 cm) — computadora de escritorio" },
          { v: "cerca", label: "Cerca — para leer libros, ver el celular" },
          { v: "todas", label: "TODAS las distancias por igual — quiero independencia total" },
        ],
      },
      {
        id: "q13_halos_tolerance",
        type: "likert",
        text: "Algunos lentes premium pueden producir halos alrededor de las luces durante la noche. ¿Qué tan cómodo/a se sentiría con esto?",
        helper: "Los halos suelen disminuir con el tiempo gracias a la adaptación cerebral",
        leftLabel: "No lo aceptaría",
        rightLabel: "Sin ningún problema",
      },
      {
        id: "q14_reversibility",
        type: "likert",
        text: "¿Qué tan importante es para usted que el procedimiento sea reversible o ajustable en el futuro?",
        leftLabel: "No es relevante para mí",
        rightLabel: "Muy importante",
      },
      {
        id: "q15_tradeoff",
        type: "single",
        text: "Si tuviera que escoger entre estas dos opciones, ¿cuál preferiría?",
        helper: "No hay respuesta correcta — esta pregunta nos ayuda a entender sus prioridades",
        options: [
          { v: "perfecto_compromiso", label: "Visión perfectamente nítida en todo momento, aunque tenga que usar espejuelos para algunas tareas" },
          { v: "independencia_halos", label: "Independencia total de espejuelos, aceptando algunos halos nocturnos como compromiso" },
          { v: "balance", label: "Un balance entre ambas — máxima nitidez con la mayor independencia posible" },
          { v: "no_seguro", label: "No estoy seguro/a — me gustaría discutirlo con el médico" },
        ],
      },
    ],
  },
];

// Lista plana de TODAS las preguntas (incluyendo condicionales)
const ALL_QUESTIONS_FULL = SECTIONS.flatMap((s) =>
  s.questions.map((q) => ({ ...q, sectionId: s.id, sectionTitle: s.title }))
);

// Devuelve las preguntas activas según las respuestas actuales.
// Filtra preguntas condicionales que no cumplen su condición.
function getActiveQuestions(answers) {
  return ALL_QUESTIONS_FULL.filter((q) => {
    if (!q.condition) return true;
    const triggerValue = answers[q.condition.questionId];
    if (!triggerValue) return false;
    return q.condition.values.includes(triggerValue);
  });
}

// ─── Motor de Scoring ───────────────────────────────────────────────────────
function computeProfile(answers) {
  const score = { Vital: 0, Intacta: 0, Xelecta: 0, Infinita: 0, Orbita: 0, Nova: 0 };
  // dryEye: false | "yellow" (síntomas) | "red" (diagnóstico+gotas confirmado)
  const flags = { novaPlus: false, dryEye: false, dryEyeDetail: null, perfectionist: false };

  // Q2: Edad (era q1 en v5)
  const age = answers.q2_age;
  if (age === "under40") {
    score.Intacta += 8; score.Nova += 7; score.Vital -= 5;
  } else if (age === "40-54") {
    score.Nova += 5; score.Intacta += 4; score.Infinita += 2;
  } else if (age === "55-64") {
    score.Infinita += 4; score.Orbita += 3; score.Nova += 1;
  } else if (age === "65-74") {
    score.Vital += 3; score.Infinita += 4; score.Orbita += 4;
  } else if (age === "75plus") {
    score.Vital += 5; score.Orbita += 3; score.Infinita += 1;
  }

  // Q1: Razón de visita (era q2 en v5)
  const reason = answers.q1_reason;
  if (reason === "catarata") {
    score.Vital += 4; score.Infinita += 3; score.Orbita += 3;
  } else if (reason === "refractivo") {
    score.Nova += 7; score.Intacta += 5;
  } else if (reason === "borroso") {
    score.Vital += 2; score.Infinita += 2; score.Orbita += 2;
  }

  // Q4: Cirugía refractiva previa → Nova+ flag
  const refHist = answers.q4_refractive_history;
  if (refHist === "lasik_prk" || refHist === "rk" || refHist === "no_estoy_seguro") {
    flags.novaPlus = true;
    score.Infinita += 5;
    score.Orbita += 4;
    score.Vital -= 3;
    score.Intacta -= 5;
    score.Nova -= 10;
  } else if (refHist === "icl") {
    score.Intacta += 3;
  } else if (refHist === "catarata_previa") {
    score.Vital += 2; score.Infinita += 2; score.Orbita += 2;
  }

  // Q5: Ocupación
  const occ = answers.q5_occupation;
  if (occ === "alta_precision") {
    score.Orbita += 5; score.Vital += 2; score.Infinita -= 2;
  } else if (occ === "oficina") {
    score.Infinita += 4; score.Orbita += 3;
  } else if (occ === "chofer_profesional") {
    score.Vital += 4; score.Orbita += 3; score.Infinita -= 5;
  } else if (occ === "manual") {
    score.Vital += 3; score.Nova += 2;
  } else if (occ === "retirado") {
    score.Vital += 3; score.Infinita += 2;
  }

  // Q6: Actividades
  const acts = answers.q6_activities || [];
  if (acts.includes("leer")) { score.Infinita += 2; score.Orbita += 1; }
  if (acts.includes("computadora")) { score.Infinita += 3; score.Orbita += 2; }
  if (acts.includes("deportes")) { score.Nova += 3; score.Intacta += 2; }
  if (acts.includes("manualidades")) { score.Infinita += 2; score.Orbita += 1; }
  if (acts.includes("viajar")) { score.Infinita += 2; score.Nova += 1; }

  // Q7: Conducción nocturna
  const night = answers.q7_night_driving;
  if (night === "frecuente") {
    score.Vital += 3; score.Orbita += 2; score.Infinita -= 4;
  } else if (night === "ocasional") {
    score.Orbita += 1;
  }

  // Q8: Adaptación a progresivos
  const prog = answers.q8_progressive_adaptation;
  if (prog === "facil") {
    score.Infinita += 4; score.Orbita += 2;
  } else if (prog === "nunca_adapte" || prog === "molestias") {
    score.Vital += 4; score.Orbita += 2; score.Infinita -= 4;
    flags.perfectionist = true;
  } else if (prog === "dificultad") {
    score.Orbita += 2;
  }

  // Q9 + Q9b: Ojo seco (sistema de flag amarillo/rojo)
  const dry = answers.q9_dry_eye;
  const dryDx = answers.q9b_dry_eye_diagnosis;

  if (dry === "frecuente" || dry === "constante") {
    // Default: flag amarillo por síntomas
    flags.dryEye = "yellow";
    flags.dryEyeDetail = "symptoms_only";
    score.Vital += 2;
    score.Infinita -= 3;

    // Si Q9b confirma diagnóstico + tratamiento activo → flag rojo
    if (dryDx === "diagnostico_y_gotas") {
      flags.dryEye = "red";
      flags.dryEyeDetail = "confirmed_treated";
      score.Vital += 2;          // refuerzo conservador
      score.Infinita -= 3;       // mayor penalización a multifocales
      score.Orbita += 2;         // IC-8 más tolerante
    } else if (dryDx === "solo_gotas" || dryDx === "solo_diagnostico") {
      flags.dryEye = "red";
      flags.dryEyeDetail = "confirmed_partial";
      score.Vital += 1;
      score.Infinita -= 2;
      score.Orbita += 1;
    }
    // Si dryDx === "ninguno" o "no_seguro", queda en yellow (solo síntomas)
  }

  // Q10: Satisfacción histórica
  const sat = answers.q10_satisfaction_history;
  if (sat === "frecuente_cambios" || sat === "nunca_perfecto") {
    flags.perfectionist = true;
    score.Vital += 2;
    score.Orbita += 2;
    score.Infinita -= 3;
  }

  // Q11: Independencia
  const indep = parseInt(answers.q11_independence) || 3;
  if (indep >= 4) { score.Infinita += 5; score.Nova += 4; score.Intacta += 3; score.Vital -= 3; }
  else if (indep <= 2) { score.Vital += 5; score.Infinita -= 3; }

  // Q12: Distancia
  const dist = answers.q12_distance_priority;
  if (dist === "lejos") { score.Vital += 4; score.Nova += 3; }
  else if (dist === "intermedio_corto" || dist === "intermedio_largo") { score.Orbita += 4; score.Infinita += 2; }
  else if (dist === "cerca") { score.Orbita += 2; score.Vital += 1; }
  else if (dist === "todas") { score.Infinita += 6; }

  // Q13: Halos
  const halos = parseInt(answers.q13_halos_tolerance) || 3;
  if (halos >= 4) { score.Infinita += 4; }
  else if (halos <= 2) {
    score.Infinita -= 5; score.Orbita += 3; score.Vital += 3;
    flags.perfectionist = true;
  }

  // Q14: Reversibilidad
  const rev = parseInt(answers.q14_reversibility) || 3;
  if (rev >= 4) { score.Intacta += 5; score.Infinita -= 2; }

  // Q15: Trade-off
  const trade = answers.q15_tradeoff;
  if (trade === "perfecto_compromiso") {
    score.Vital += 4; score.Orbita += 3; score.Infinita -= 3;
  } else if (trade === "independencia_halos") {
    score.Infinita += 5;
  } else if (trade === "balance") {
    score.Orbita += 4; score.Infinita += 2;
  }

  const primaryCandidates = ["Vital", "Intacta", "Infinita", "Orbita", "Nova"];
  const sorted = primaryCandidates
    .map((p) => ({ profile: p, score: score[p] }))
    .sort((a, b) => b.score - a.score);

  const primary = sorted[0];
  const secondary = sorted[1];
  const gap = primary.score - secondary.score;
  const hasComplementary = gap <= 3 && secondary.score > 0;

  return {
    primary: primary.profile,
    primaryScore: primary.score,
    complementary: hasComplementary ? secondary.profile : null,
    complementaryScore: hasComplementary ? secondary.score : null,
    allScores: score,
    flags,
  };
}

const PROFILES = {
  Vital: {
    letter: "V", color: C.azure, fullName: "Visión Vital",
    tagline: "Claridad esencial",
    description: "Su perfil refleja a alguien que valora una visión clara, estable y confiable. Vital le devuelve nitidez en una distancia principal con un lente probado por décadas.",
    techNote: "Lente monofocal Alcon Clareon",
  },
  Intacta: {
    letter: "I", color: C.teal, fullName: "Visión Intacta",
    tagline: "Preservar la córnea",
    description: "Su perfil refleja a alguien que busca corrección potente sin modificar la estructura natural de su ojo. Intacta es la filosofía de la preservación y la reversibilidad.",
    techNote: "EVO ICL — Lente colamer implantable",
  },
  Infinita: {
    letter: "I", color: C.navyDark, fullName: "Visión Infinita",
    tagline: "Independencia sin límites",
    description: "Su perfil refleja a alguien que aspira a independencia visual completa en todas las distancias. Infinita es la máxima sofisticación tecnológica del sistema VixiOn.",
    techNote: "Lente trifocal Alcon PanOptix Pro",
  },
  Orbita: {
    letter: "O", color: C.coral, fullName: "Visión Órbita",
    tagline: "Visión continua inteligente",
    description: "Su perfil refleja a alguien que valora visión continua de lejos a intermedio sin los compromisos de los multifocales tradicionales. Órbita es la elección sofisticada y equilibrada.",
    techNote: "Lente Apthera IC-8 — pinhole de pequeña apertura",
  },
  Nova: {
    letter: "N", color: C.gold, fullName: "Visión Nova",
    tagline: "Visión nueva con láser",
    description: "Su perfil refleja a alguien activo, candidato a corrección refractiva con láser que busca eliminar la dependencia de espejuelos de manera definitiva.",
    techNote: "LASIK / PRK — Cirugía refractiva con láser",
  },
  Xelecta: {
    letter: "X", color: C.gold, fullName: "Visión Xelecta",
    tagline: "Precisión angular exacta",
    description: "Componente de corrección angular del astigmatismo. Siempre acompaña al perfil primario.",
    techNote: "Lente tórico — corrección de astigmatismo",
  },
};

// ─── Sound Manager (Web Audio API tones, no external files) ────────────────
function playTone(type) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "select") {
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    } else if (type === "advance") {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(); osc.stop(ctx.currentTime + 0.18);
    } else if (type === "section") {
      [523, 659, 784].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
        o.start(ctx.currentTime + i * 0.1);
        o.stop(ctx.currentTime + i * 0.1 + 0.2);
      });
    }
  } catch (e) { /* silent */ }
}

// ─── Storage Helpers ────────────────────────────────────────────────────────
async function saveProgress(state) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) { /* silent */ }
}

async function loadProgress() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) { /* silent — key may not exist */ }
  return null;
}

async function clearProgress() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) { /* silent */ }
}

// ─── Detect clinical mode from URL ──────────────────────────────────────────
function isClinicalMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("clinico") === "true" || params.get("clinical") === "true";
  } catch (e) {
    return false;
  }
}

// ─── Componente principal ───────────────────────────────────────────────────
export default function VixiOnCuestionarioV6() {
  const [phase, setPhase] = useState("loading");
  const [patientName, setPatientName] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showSectionTransition, setShowSectionTransition] = useState(false);
  const [transitionToSection, setTransitionToSection] = useState(null);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [savedState, setSavedState] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  // Settings
  const [textSize, setTextSize] = useState(1); // 1, 1.15, 1.3
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [clinicalMode] = useState(isClinicalMode());

  // Lista dinámica de preguntas (se recalcula cuando cambian respuestas)
  const activeQuestions = useMemo(() => getActiveQuestions(answers), [answers]);
  const totalQuestions = activeQuestions.length;
  const currentQuestion = activeQuestions[currentQ];
  const currentSectionId = currentQuestion?.sectionId;

  // Safety: si la lista activa se redujo y currentQ quedó fuera de rango,
  // ajustar al último válido. Cubre el caso "usuario regresa y cambia Q9 a 'nunca'
  // después de haber visto Q9b".
  useEffect(() => {
    if (phase === "quiz" && currentQ >= totalQuestions && totalQuestions > 0) {
      setCurrentQ(totalQuestions - 1);
    }
  }, [totalQuestions, currentQ, phase]);

  // ─── Load saved progress on mount ────────────────────────────────────────
  useEffect(() => {
    if (clinicalMode) {
      setPhase("intro");
      return;
    }
    (async () => {
      const saved = await loadProgress();
      if (saved && saved.answers && Object.keys(saved.answers).length > 0) {
        setSavedState(saved);
        setHasSavedProgress(true);
        setPhase("recover");
      } else {
        setPhase("intro");
      }
    })();
  }, [clinicalMode]);

  // ─── Auto-save on answers/position change ────────────────────────────────
  useEffect(() => {
    if (phase === "quiz" && Object.keys(answers).length > 0) {
      saveProgress({ answers, currentQ, patientName, timestamp: Date.now() });
    }
  }, [answers, currentQ, phase, patientName]);

  const result = useMemo(() => {
    if (phase !== "results") return null;
    return computeProfile(answers);
  }, [phase, answers]);

  // ─── Estimated time remaining ────────────────────────────────────────────
  const timeRemaining = useMemo(() => {
    const remaining = totalQuestions - (currentQ + 1);
    const minutes = Math.ceil(remaining * 0.5); // ~30s per question
    return minutes;
  }, [currentQ, totalQuestions]);

  const isAnswered = (q) => {
    const a = answers[q.id];
    if (q.type === "multi") return Array.isArray(a) && a.length > 0;
    return a !== undefined && a !== null && a !== "";
  };

  const canAdvance = currentQuestion ? isAnswered(currentQuestion) : false;

  const handleSelect = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    if (soundEnabled) playTone("select");
  };

  const handleMulti = (qid, value) => {
    setAnswers((prev) => {
      const current = prev[qid] || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [qid]: exists ? current.filter((v) => v !== value) : [...current, value],
      };
    });
    if (soundEnabled) playTone("select");
  };

  const next = () => {
    if (isAnimating) return;

    if (currentQ < totalQuestions - 1) {
      const nextSectionId = activeQuestions[currentQ + 1].sectionId;
      const isSectionChange = nextSectionId !== currentSectionId;

      if (isSectionChange) {
        setTransitionToSection(SECTIONS.find(s => s.id === nextSectionId));
        setShowSectionTransition(true);
        if (soundEnabled) playTone("section");
        setTimeout(() => {
          setCurrentQ(currentQ + 1);
          setShowSectionTransition(false);
        }, 1800);
      } else {
        if (soundEnabled) playTone("advance");
        setTransitionDirection("forward");
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentQ(currentQ + 1);
          setIsAnimating(false);
        }, 200);
      }
    } else {
      if (soundEnabled) playTone("section");
      clearProgress();
      setPhase("results");
    }
  };

  const back = () => {
    if (isAnimating || currentQ === 0) return;
    setTransitionDirection("backward");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentQ(currentQ - 1);
      setIsAnimating(false);
    }, 200);
  };

  const reset = () => {
    setPhase("intro");
    setCurrentQ(0);
    setAnswers({});
    setPatientName("");
    clearProgress();
  };

  const recoverProgress = () => {
    if (savedState) {
      setAnswers(savedState.answers || {});
      setCurrentQ(savedState.currentQ || 0);
      setPatientName(savedState.patientName || "");
      setPhase("quiz");
    }
  };

  const startFresh = () => {
    clearProgress();
    setSavedState(null);
    setHasSavedProgress(false);
    setPhase("intro");
  };

  // Loading state
  if (phase === "loading") {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.sand,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_BODY,
      }}>
        <div style={{ color: C.slateLight, fontSize: 14 }}>Cargando…</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.sand} 0%, ${C.cloud} 100%)`,
      fontFamily: FONT_BODY,
      color: C.ink,
      padding: "24px 16px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        @keyframes checkmarkDraw {
          from { stroke-dashoffset: 30; }
          to { stroke-dashoffset: 0; }
        }
        .slide-forward { animation: slideInRight 0.3s ease-out; }
        .slide-backward { animation: slideInLeft 0.3s ease-out; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Top toolbar — accessibility, sound, mode indicator (NO se escala) */}
        {phase !== "loading" && (
          <TopToolbar
            textSize={textSize}
            setTextSize={setTextSize}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            clinicalMode={clinicalMode}
          />
        )}

        {/* Contenido escalable — zoom afecta texto, padding, márgenes y botones */}
        <div style={{ zoom: textSize, MozTransform: `scale(${textSize})`, MozTransformOrigin: "0 0" }}>
          <Header />

          {phase === "recover" && (
            <RecoverScreen
              savedState={savedState}
              onRecover={recoverProgress}
              onStartFresh={startFresh}
            />
          )}

          {phase === "intro" && (
            <IntroScreen
              patientName={patientName}
              setPatientName={setPatientName}
              onStart={() => setPhase("quiz")}
              clinicalMode={clinicalMode}
            />
          )}

          {phase === "quiz" && !showSectionTransition && (
            <QuizScreen
              question={currentQuestion}
              sectionId={currentSectionId}
              sections={SECTIONS}
              answers={answers}
              currentQ={currentQ}
              totalQuestions={totalQuestions}
              timeRemaining={timeRemaining}
              patientName={patientName}
              canAdvance={canAdvance}
              onSelect={handleSelect}
              onMulti={handleMulti}
              onNext={next}
              onBack={back}
              transitionDirection={transitionDirection}
              isAnimating={isAnimating}
            />
          )}

          {phase === "quiz" && showSectionTransition && transitionToSection && (
            <SectionTransition section={transitionToSection} />
          )}

          {phase === "results" && result && (
            <ResultsScreen
              result={result}
              patientName={patientName}
              answers={answers}
              onReset={reset}
              clinicalMode={clinicalMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Top Toolbar ────────────────────────────────────────────────────────────
function TopToolbar({ textSize, setTextSize, soundEnabled, setSoundEnabled, clinicalMode }) {
  return (
    <div className="no-print" style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      gap: 8,
    }}>
      {clinicalMode && (
        <div style={{
          background: C.navyDark,
          color: C.white,
          padding: "6px 12px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
        }}>
          MODO CLÍNICO
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
        {/* Text size toggle */}
        <div style={{
          display: "flex",
          background: C.white,
          borderRadius: 8,
          padding: 4,
          border: `1px solid ${C.line}`,
          gap: 2,
        }}>
          {[
            { v: 1, label: "A", size: 11 },
            { v: 1.15, label: "A+", size: 13 },
            { v: 1.3, label: "A++", size: 15 },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setTextSize(opt.v)}
              title={`Tamaño de texto ${opt.label}`}
              aria-label={`Cambiar tamaño de texto a ${opt.label}`}
              style={{
                background: textSize === opt.v ? C.teal : "transparent",
                color: textSize === opt.v ? C.white : C.slate,
                border: "none",
                padding: "6px 10px",
                borderRadius: 6,
                fontSize: opt.size,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: FONT_BODY,
                transition: "all 0.15s",
                minWidth: 32,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? "Sonido activado" : "Sonido desactivado"}
          aria-label={soundEnabled ? "Desactivar sonido" : "Activar sonido"}
          style={{
            background: C.white,
            border: `1px solid ${C.line}`,
            borderRadius: 8,
            padding: "8px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: soundEnabled ? C.teal : C.slateLight,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {soundEnabled ? (
              <>
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M15.54 8.46a5 5 0 010 7.07"/>
                <path d="M19.07 4.93a10 10 0 010 14.14"/>
              </>
            ) : (
              <>
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────
function Header() {
  return (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <div style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily: FONT_DISPLAY,
        fontWeight: 600,
        letterSpacing: "-0.02em",
      }}>
        <span style={{ fontSize: 38, color: C.navy }}>Vixi</span>
        <span style={{ fontSize: 44, color: C.gold }}>O</span>
        <span style={{ fontSize: 38, color: C.navy }}>n</span>
      </div>
      <div style={{
        fontSize: 10,
        letterSpacing: "0.25em",
        color: C.slateLight,
        marginTop: 4,
        fontWeight: 500,
      }}>
        SISTEMA DE PERFILES VISUALES
      </div>
    </div>
  );
}

// ─── Recover Progress Screen ───────────────────────────────────────────────
function RecoverScreen({ savedState, onRecover, onStartFresh }) {
  const completed = Object.keys(savedState?.answers || {}).length;
  const timestamp = savedState?.timestamp ? new Date(savedState.timestamp) : null;
  const timeAgo = timestamp ? formatTimeAgo(timestamp) : "";

  return (
    <div className="fade-in" style={{
      background: C.white,
      borderRadius: 20,
      padding: "44px 36px",
      boxShadow: `0 4px 24px rgba(43,95,138,0.08)`,
      border: `1px solid ${C.line}`,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: C.tealSoft,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.tealDeep} strokeWidth="2.5" strokeLinecap="round">
          <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
          <polyline points="3 3 3 8 8 8"/>
        </svg>
      </div>

      <div style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 26,
        fontWeight: 600,
        color: C.navyDark,
        marginBottom: 12,
        letterSpacing: "-0.01em",
        lineHeight: 1.25,
      }}>
        Tenemos sus respuestas guardadas
      </div>

      <p style={{ fontSize: 15, color: C.slate, lineHeight: 1.6, marginBottom: 24 }}>
        {savedState?.patientName ? `${savedState.patientName}, comenzó` : "Comenzó"} este cuestionario {timeAgo} y completó {completed} de 15 preguntas. ¿Desea continuar donde lo dejó?
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onRecover}
          style={{
            padding: "16px",
            background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
            color: C.white,
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: FONT_BODY,
            cursor: "pointer",
          }}
        >
          Continuar donde lo dejé →
        </button>
        <button
          onClick={onStartFresh}
          style={{
            padding: "14px",
            background: C.white,
            color: C.slate,
            border: `1.5px solid ${C.line}`,
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            fontFamily: FONT_BODY,
            cursor: "pointer",
          }}
        >
          Comenzar de nuevo
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "hace unos segundos";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days > 1 ? "s" : ""}`;
}

// ─── Intro Screen ──────────────────────────────────────────────────────────
function IntroScreen({ patientName, setPatientName, onStart, clinicalMode }) {
  return (
    <div className="fade-in" style={{
      background: C.white,
      borderRadius: 20,
      padding: "48px 36px",
      boxShadow: `0 4px 24px rgba(43,95,138,0.08)`,
      border: `1px solid ${C.line}`,
    }}>
      <div style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 32,
        fontWeight: 600,
        color: C.navyDark,
        lineHeight: 1.2,
        marginBottom: 16,
        letterSpacing: "-0.02em",
      }}>
        Descubrimos su perfil visual.
      </div>

      <p style={{
        fontSize: 16,
        color: C.slate,
        lineHeight: 1.6,
        marginBottom: 28,
      }}>
        Cada persona tiene una manera única de usar su visión. Este cuestionario nos ayuda a entender su estilo de vida, sus expectativas y sus prioridades para diseñar un plan visual personalizado.
      </p>

      <div style={{
        background: C.tealSoft,
        borderLeft: `3px solid ${C.teal}`,
        padding: "16px 20px",
        borderRadius: 8,
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 13, color: C.tealDeep, fontWeight: 600, marginBottom: 6 }}>
          ANTES DE COMENZAR
        </div>
        <div style={{ fontSize: 14, color: C.slate, lineHeight: 1.5 }}>
          Conteste con honestidad — no hay respuestas correctas o incorrectas. Tomará entre 6 y 8 minutos. Sus respuestas se guardan automáticamente.
        </div>
      </div>

      {!clinicalMode && (
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: C.slate,
            marginBottom: 8,
            letterSpacing: "0.02em",
          }}>
            Su nombre (opcional)
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Ej: María Rodríguez"
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 15,
              fontFamily: FONT_BODY,
              border: `1.5px solid ${C.line}`,
              borderRadius: 10,
              outline: "none",
              transition: "border-color 0.2s",
              color: C.ink,
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = C.teal)}
            onBlur={(e) => (e.target.style.borderColor = C.line)}
          />
        </div>
      )}

      <button
        onClick={onStart}
        style={{
          width: "100%",
          padding: "18px",
          background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
          color: C.white,
          border: "none",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          fontFamily: FONT_BODY,
          letterSpacing: "0.02em",
          cursor: "pointer",
          transition: "transform 0.15s",
          boxShadow: `0 4px 14px rgba(0,168,137,0.25)`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        Comenzar cuestionario →
      </button>

      <div style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: `1px solid ${C.line}`,
        textAlign: "center",
        fontSize: 12,
        color: C.slateLight,
        lineHeight: 1.6,
      }}>
        Cuestionario exclusivo del Instituto de Ojos de Puerto Rico
        <br/>
        15 preguntas · 4 secciones · Resultado personalizado
      </div>
    </div>
  );
}

// ─── Section Transition Screen ──────────────────────────────────────────────
function SectionTransition({ section }) {
  return (
    <div className="fade-in" style={{
      background: C.white,
      borderRadius: 20,
      padding: "80px 36px",
      boxShadow: `0 4px 24px rgba(43,95,138,0.08)`,
      border: `1px solid ${C.line}`,
      textAlign: "center",
      minHeight: 320,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: C.tealSoft,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12 L10 17 L20 7"
            stroke={C.teal}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="30"
            style={{ animation: "checkmarkDraw 0.5s ease-out forwards" }}
          />
        </svg>
      </div>

      <div style={{
        fontSize: 11,
        letterSpacing: "0.25em",
        color: C.tealDeep,
        fontWeight: 600,
        marginBottom: 12,
      }}>
        SECCIÓN COMPLETA
      </div>

      <div style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 28,
        fontWeight: 600,
        color: C.navyDark,
        marginBottom: 12,
        letterSpacing: "-0.02em",
        lineHeight: 1.2,
      }}>
        Ahora hablemos de
      </div>
      <div style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 32,
        fontWeight: 600,
        color: C.teal,
        fontStyle: "italic",
        letterSpacing: "-0.02em",
      }}>
        {section.title.toLowerCase()}.
      </div>
    </div>
  );
}

// ─── Quiz Screen ────────────────────────────────────────────────────────────
function QuizScreen({
  question, sectionId, sections, answers, currentQ, totalQuestions,
  timeRemaining, patientName, canAdvance, onSelect, onMulti,
  onNext, onBack, transitionDirection, isAnimating,
}) {
  const currentSection = sections.find((s) => s.id === sectionId);

  // Mensaje cálido de progreso
  const getProgressMessage = () => {
    const halfway = Math.floor(totalQuestions / 2);
    if (currentQ === halfway && patientName) {
      return `Va por la mitad, ${patientName.split(" ")[0]}.`;
    } else if (currentQ === halfway) {
      return `Va por la mitad.`;
    } else if (currentQ === totalQuestions - 3 && patientName) {
      return `Casi terminamos, ${patientName.split(" ")[0]}.`;
    } else if (currentQ === totalQuestions - 3) {
      return `Casi terminamos.`;
    }
    return null;
  };

  const progressMessage = getProgressMessage();
  const animationClass = isAnimating ? "" : (transitionDirection === "forward" ? "slide-forward" : "slide-backward");

  return (
    <div style={{
      background: C.white,
      borderRadius: 20,
      boxShadow: `0 4px 24px rgba(43,95,138,0.08)`,
      border: `1px solid ${C.line}`,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "24px 32px 16px", borderBottom: `1px solid ${C.line}` }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            color: C.tealDeep,
            fontWeight: 600,
          }}>
            SECCIÓN {sectionId} DE 4
          </div>
          <div style={{
            fontSize: 12,
            color: C.slateLight,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span>{currentQ + 1} de {totalQuestions}</span>
            {timeRemaining > 0 && (
              <>
                <span style={{ color: C.line }}>·</span>
                <span>~{timeRemaining} min</span>
              </>
            )}
          </div>
        </div>

        <div style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 22,
          fontWeight: 600,
          color: C.navyDark,
          marginBottom: 4,
          letterSpacing: "-0.01em",
        }}>
          {currentSection.title}
        </div>
        <div style={{ fontSize: 13, color: C.slateLight, marginBottom: 16 }}>
          {currentSection.subtitle}
        </div>

        {/* Mensaje cálido si aplica */}
        {progressMessage && (
          <div style={{
            background: C.tealSoft,
            color: C.tealDeep,
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 16,
            display: "inline-block",
            fontStyle: "italic",
          }}>
            ✨ {progressMessage}
          </div>
        )}

        {/* Progress bar segmentado */}
        <div style={{ display: "flex", gap: 4 }}>
          {sections.map((s) => {
            const sectionQuestions = s.questions.length;
            const sectionStartIdx = sections
              .filter((sec) => sec.id < s.id)
              .reduce((acc, sec) => acc + sec.questions.length, 0);
            const sectionEndIdx = sectionStartIdx + sectionQuestions - 1;
            const inProgress = currentQ >= sectionStartIdx && currentQ <= sectionEndIdx;
            const completed = currentQ > sectionEndIdx;
            const sectionProgress = inProgress
              ? ((currentQ - sectionStartIdx + 1) / sectionQuestions) * 100
              : completed ? 100 : 0;

            return (
              <div key={s.id} style={{
                flex: sectionQuestions,
                height: 4,
                background: C.line,
                borderRadius: 2,
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${sectionProgress}%`,
                  height: "100%",
                  background: completed ? C.teal : (inProgress ? C.teal : "transparent"),
                  transition: "width 0.4s ease-out",
                }}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pregunta con animación */}
      <div key={currentQ} className={animationClass} style={{ padding: "32px" }}>
        <div style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 22,
          fontWeight: 500,
          color: C.ink,
          lineHeight: 1.35,
          marginBottom: question.helper ? 8 : 24,
          letterSpacing: "-0.01em",
        }}>
          {question.text}
        </div>

        {question.helper && (
          <div style={{
            fontSize: 13,
            color: C.slateLight,
            fontStyle: "italic",
            marginBottom: 24,
          }}>
            {question.helper}
          </div>
        )}

        {question.type === "single" && (
          <SingleSelect
            question={question}
            value={answers[question.id]}
            onChange={(v) => onSelect(question.id, v)}
          />
        )}

        {question.type === "multi" && (
          <MultiSelect
            question={question}
            values={answers[question.id] || []}
            onToggle={(v) => onMulti(question.id, v)}
          />
        )}

        {question.type === "likert" && (
          <LikertScale
            question={question}
            value={answers[question.id]}
            onChange={(v) => onSelect(question.id, v)}
          />
        )}
      </div>

      {/* Navegación */}
      <div style={{
        padding: "20px 32px",
        background: C.cloud,
        borderTop: `1px solid ${C.line}`,
        display: "flex",
        gap: 12,
      }}>
        {currentQ > 0 && (
          <button
            onClick={onBack}
            disabled={isAnimating}
            style={{
              flex: 1,
              padding: "16px",
              background: C.white,
              color: C.slate,
              border: `1.5px solid ${C.line}`,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: FONT_BODY,
              cursor: isAnimating ? "wait" : "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!isAnimating) e.currentTarget.style.borderColor = C.slate; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line; }}
          >
            ← Anterior
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!canAdvance || isAnimating}
          style={{
            flex: currentQ > 0 ? 2 : 1,
            padding: "16px",
            background: canAdvance && !isAnimating
              ? `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`
              : C.line,
            color: canAdvance && !isAnimating ? C.white : C.slateLight,
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: FONT_BODY,
            cursor: canAdvance && !isAnimating ? "pointer" : "not-allowed",
            transition: "all 0.15s",
            boxShadow: canAdvance && !isAnimating ? `0 4px 14px rgba(0,168,137,0.25)` : "none",
          }}
        >
          {currentQ === totalQuestions - 1
            ? "Ver mi Perfil VixiOn →"
            : "Siguiente →"}
        </button>
      </div>
    </div>
  );
}

// ─── Single Select ──────────────────────────────────────────────────────────
function SingleSelect({ question, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {question.options.map((opt) => {
        const selected = value === opt.v;
        return (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "16px 18px",
              background: selected ? C.tealSoft : C.white,
              border: selected ? `2px solid ${C.teal}` : `1.5px solid ${C.line}`,
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: FONT_BODY,
              fontSize: 14,
              color: selected ? C.tealDark : C.slate,
              fontWeight: selected ? 600 : 400,
              transition: "all 0.15s",
              lineHeight: 1.4,
            }}
            onMouseEnter={(e) => {
              if (!selected) e.currentTarget.style.borderColor = C.teal;
            }}
            onMouseLeave={(e) => {
              if (!selected) e.currentTarget.style.borderColor = C.line;
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              flexShrink: 0,
              background: selected ? C.teal : C.white,
              border: selected ? `2px solid ${C.teal}` : `2px solid ${C.line}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {selected && (
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: C.white }}/>
              )}
            </div>
            <span style={{ flex: 1 }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Multi Select ──────────────────────────────────────────────────────────
function MultiSelect({ question, values, onToggle }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {question.options.map((opt) => {
        const selected = values.includes(opt.v);
        return (
          <button
            key={opt.v}
            onClick={() => onToggle(opt.v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "16px 18px",
              background: selected ? C.tealSoft : C.white,
              border: selected ? `2px solid ${C.teal}` : `1.5px solid ${C.line}`,
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: FONT_BODY,
              fontSize: 14,
              color: selected ? C.tealDark : C.slate,
              fontWeight: selected ? 600 : 400,
              transition: "all 0.15s",
              lineHeight: 1.4,
            }}
            onMouseEnter={(e) => {
              if (!selected) e.currentTarget.style.borderColor = C.teal;
            }}
            onMouseLeave={(e) => {
              if (!selected) e.currentTarget.style.borderColor = C.line;
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 5,
              flexShrink: 0,
              background: selected ? C.teal : C.white,
              border: selected ? `2px solid ${C.teal}` : `2px solid ${C.line}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {selected && (
                <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>✓</span>
              )}
            </div>
            <span style={{ flex: 1 }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Likert Scale ──────────────────────────────────────────────────────────
function LikertScale({ question, value, onChange }) {
  const levels = [1, 2, 3, 4, 5];
  const numValue = parseInt(value);

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 18,
        gap: 16,
      }}>
        <span style={{ fontSize: 12, color: C.slateLight, fontWeight: 500, maxWidth: "45%" }}>
          {question.leftLabel}
        </span>
        <span style={{ fontSize: 12, color: C.slateLight, fontWeight: 500, textAlign: "right", maxWidth: "45%" }}>
          {question.rightLabel}
        </span>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        padding: "0 8px",
      }}>
        {levels.map((level) => {
          const selected = numValue === level;
          const size = 32 + level * 4;
          return (
            <button
              key={level}
              onClick={() => onChange(String(level))}
              style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: selected ? C.teal : C.white,
                border: selected ? `2px solid ${C.teal}` : `2px solid ${C.line}`,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: selected ? C.white : C.slateLight,
                fontWeight: 600,
                fontSize: 13,
                fontFamily: FONT_BODY,
                boxShadow: selected ? `0 2px 8px rgba(0,168,137,0.3)` : "none",
              }}
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.borderColor = C.teal;
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.borderColor = C.line;
              }}
            >
              {level}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Results Screen ────────────────────────────────────────────────────────
function ResultsScreen({ result, patientName, answers, onReset, clinicalMode }) {
  const primary = PROFILES[result.primary];
  const complementary = result.complementary ? PROFILES[result.complementary] : null;
  const [shareOpen, setShareOpen] = useState(false);

  const handleShare = (method) => {
    const subject = `Mi Perfil VixiOn: ${primary.fullName}`;
    const body = `${patientName ? `Nombre: ${patientName}\n` : ""}Perfil principal: ${primary.fullName} — ${primary.tagline}\n${complementary ? `Perfil complementario: ${complementary.fullName}\n` : ""}\nResultado del cuestionario VixiOn del Instituto de Ojos de Puerto Rico.`;

    if (method === "email") {
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else if (method === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(subject + "\n\n" + body)}`, "_blank");
    } else if (method === "copy") {
      navigator.clipboard.writeText(subject + "\n\n" + body);
      alert("Resultado copiado al portapapeles");
    }
    setShareOpen(false);
  };

  return (
    <div className="fade-in">
      {/* Tarjeta principal */}
      <div style={{
        background: `linear-gradient(135deg, ${primary.color} 0%, ${C.navyDark} 100%)`,
        borderRadius: 20,
        padding: "48px 36px",
        color: C.white,
        boxShadow: `0 8px 32px rgba(43,95,138,0.16)`,
        marginBottom: 20,
      }}>
        <div style={{
          fontSize: 11,
          letterSpacing: "0.25em",
          color: C.goldSoft,
          fontWeight: 600,
          marginBottom: 16,
        }}>
          {patientName ? `${patientName.toUpperCase()} · ` : ""}SU PERFIL VIXION
        </div>

        <div style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 48,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: 12,
        }}>
          {primary.fullName}
        </div>

        <div style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 20,
          fontStyle: "italic",
          color: C.goldSoft,
          marginBottom: 28,
          fontWeight: 400,
        }}>
          {primary.tagline}
        </div>

        <p style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: C.white,
          opacity: 0.92,
          marginBottom: 24,
        }}>
          {primary.description}
        </p>

        <div style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          padding: "12px 16px",
          borderRadius: 8,
          fontSize: 13,
          color: C.goldSoft,
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}>
          Tecnología asociada: {primary.techNote}
        </div>
      </div>

      {/* Complementario */}
      {complementary && (
        <div style={{
          background: C.white,
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 20,
          border: `1px solid ${C.line}`,
          borderLeft: `4px solid ${complementary.color}`,
        }}>
          <div style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            color: C.slateLight,
            fontWeight: 600,
            marginBottom: 8,
          }}>
            PERFIL COMPLEMENTARIO
          </div>
          <div style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: 600,
            color: C.navyDark,
            marginBottom: 4,
          }}>
            {complementary.fullName}
          </div>
          <div style={{ fontSize: 13, color: C.slate, lineHeight: 1.5 }}>
            Su perfil tiene también afinidad con esta opción. Su médico evaluará si combinarlas o priorizar una sobre la otra.
          </div>
        </div>
      )}

      {/* Flags clínicos */}
      {result.flags.novaPlus && (
        <FlagCard
          color={C.gold}
          bg={C.goldSoft}
          label="NOVA+ · SU PERFIL EVOLUCIONA"
          title="Detectamos historia de cirugía refractiva previa"
          description="Hace años usted invirtió en su visión con cirugía láser. Ahora su perfil natural ha evolucionado — esto NO significa que su LASIK 'se gastó'. Su cristalino interno está cambiando, y esto abre nuevas oportunidades. Pacientes como usted suelen ser excelentes candidatos para perfiles premium con tecnología avanzada."
        />
      )}

      {result.flags.dryEye === "red" && (
        <FlagCard
          color={C.coral}
          bg="#FDECE6"
          label="OPTIMIZACIÓN PRE-QUIRÚRGICA · PRIORITARIA"
          title="Tiene ojo seco confirmado — lo manejaremos con prioridad"
          description={
            result.flags.dryEyeDetail === "confirmed_treated"
              ? "Sus respuestas confirman que ya tiene diagnóstico de ojo seco y está usando gotas lubricantes. Esto es información valiosa: nos permite preparar un plan de optimización agresivo desde el primer día. Tratar la superficie ocular antes de cualquier procedimiento es lo que asegura los mejores resultados visuales y previene complicaciones."
              : "Sus respuestas indican antecedentes de ojo seco que requieren atención antes de cualquier procedimiento. Coordinaremos pruebas adicionales y un plan de optimización personalizado para su superficie ocular."
          }
        />
      )}

      {result.flags.dryEye === "yellow" && (
        <FlagCard
          color={C.teal}
          bg={C.tealSoft}
          label="EVALUACIÓN DE SUPERFICIE OCULAR"
          title="Sus síntomas merecen una evaluación adicional"
          description="Sus respuestas sugieren posibles síntomas de ojo seco que aún no han sido diagnosticados formalmente. Durante su evaluación, su médico realizará pruebas específicas de superficie ocular. Si se confirma, es una condición totalmente tratable — y tratarla antes de cualquier procedimiento es lo que asegura los mejores resultados visuales."
        />
      )}

      {result.flags.perfectionist && (
        <FlagCard
          color={C.amber}
          bg={C.amberSoft}
          label="PERFIL DE ALTA EXIGENCIA"
          title="Usted aprecia los detalles de su visión"
          description="Sus respuestas reflejan a alguien con expectativas precisas y atención fina a los detalles visuales. Esto es valioso — pero también significa que su médico priorizará perfiles que ofrecen visión nítida y estable, evitando opciones que podrían generar pequeñas distorsiones que personas como usted suelen percibir más intensamente."
        />
      )}

      {/* Próximo paso */}
      <div style={{
        background: C.white,
        borderRadius: 16,
        padding: "28px",
        marginBottom: 20,
        border: `1px solid ${C.line}`,
      }}>
        <div style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 20,
          fontWeight: 600,
          color: C.navyDark,
          marginBottom: 12,
        }}>
          Próximo paso
        </div>
        <p style={{ fontSize: 14, color: C.slate, lineHeight: 1.6, marginBottom: 0 }}>
          Este perfil es preliminar. Durante su evaluación, el equipo del Instituto de Ojos de Puerto Rico complementará estos resultados con datos clínicos objetivos (biometría, topografía corneal, evaluación retiniana) para confirmar y refinar su Perfil Visual personalizado.
        </p>
      </div>

      {/* Desglose clínico */}
      <details
        open={clinicalMode}
        style={{
          background: C.cloud,
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 20,
          border: `1px solid ${C.line}`,
        }}
      >
        <summary style={{
          cursor: "pointer",
          fontSize: 12,
          letterSpacing: "0.18em",
          color: C.navy,
          fontWeight: 600,
          outline: "none",
        }}>
          DESGLOSE PARA EL CLÍNICO ▾
        </summary>
        <div style={{ marginTop: 16 }}>
          <div style={{
            fontSize: 11,
            color: C.slateLight,
            marginBottom: 10,
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}>
            PUNTAJES POR PERFIL
          </div>
          {Object.entries(result.allScores)
            .sort((a, b) => b[1] - a[1])
            .map(([profile, score]) => {
              const profileData = PROFILES[profile];
              const maxScore = Math.max(...Object.values(result.allScores), 1);
              const pct = Math.max(0, (score / maxScore) * 100);
              return (
                <div key={profile} style={{ marginBottom: 8 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 4,
                  }}>
                    <span style={{ color: C.slate, fontWeight: 500 }}>{profileData.fullName}</span>
                    <span style={{ color: C.slateLight, fontVariantNumeric: "tabular-nums" }}>{score} pts</span>
                  </div>
                  <div style={{
                    height: 6,
                    background: C.line,
                    borderRadius: 3,
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: profileData.color,
                      borderRadius: 3,
                      transition: "width 0.6s ease-out",
                    }}/>
                  </div>
                </div>
              );
            })}
          {(result.flags.novaPlus || result.flags.dryEye || result.flags.perfectionist) && (
            <div style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: `1px solid ${C.line}`,
              fontSize: 12,
              color: C.slate,
            }}>
              <strong style={{ color: C.navy }}>Flags activos:</strong>{" "}
              {[
                result.flags.novaPlus && "Nova+ (scoring ajustado)",
                result.flags.dryEye === "red" && `Ojo seco ROJO (${result.flags.dryEyeDetail === "confirmed_treated" ? "Dx + gotas activas" : "Dx parcial"} — optimización prioritaria)`,
                result.flags.dryEye === "yellow" && "Ojo seco AMARILLO (síntomas sin Dx — evaluar superficie)",
                result.flags.perfectionist && "Personalidad alta exigencia (precaución multifocal)",
              ].filter(Boolean).join(" · ")}
            </div>
          )}

          {clinicalMode && (
            <div style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: `1px solid ${C.line}`,
            }}>
              <div style={{
                fontSize: 11,
                color: C.slateLight,
                marginBottom: 10,
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}>
                RESPUESTAS DEL PACIENTE
              </div>
              <div style={{ fontSize: 12, color: C.slate, lineHeight: 1.8 }}>
                {ALL_QUESTIONS_FULL.map((q) => {
                  const a = answers[q.id];
                  if (!a) return null;
                  const display = Array.isArray(a)
                    ? a.map(v => q.options.find(o => o.v === v)?.label).filter(Boolean).join(", ")
                    : (q.type === "likert" ? `${a}/5` : q.options?.find(o => o.v === a)?.label || a);
                  return (
                    <div key={q.id} style={{ marginBottom: 6 }}>
                      <strong style={{ color: C.navy }}>{q.id}:</strong> {display}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Acciones */}
      <div className="no-print" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => window.print()}
          style={{
            flex: "1 1 30%",
            minWidth: 140,
            padding: "14px",
            background: C.white,
            color: C.navy,
            border: `1.5px solid ${C.navy}`,
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: FONT_BODY,
            cursor: "pointer",
          }}
        >
          🖨️ Imprimir
        </button>
        <button
          onClick={() => setShareOpen(!shareOpen)}
          style={{
            flex: "1 1 30%",
            minWidth: 140,
            padding: "14px",
            background: C.white,
            color: C.tealDeep,
            border: `1.5px solid ${C.teal}`,
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: FONT_BODY,
            cursor: "pointer",
          }}
        >
          📤 Compartir
        </button>
        <button
          onClick={onReset}
          style={{
            flex: "1 1 30%",
            minWidth: 140,
            padding: "14px",
            background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
            color: C.white,
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: FONT_BODY,
            cursor: "pointer",
            boxShadow: `0 4px 14px rgba(0,168,137,0.25)`,
          }}
        >
          ↻ Comenzar de nuevo
        </button>
      </div>

      {/* Share menu */}
      {shareOpen && (
        <div className="fade-in no-print" style={{
          marginTop: 12,
          background: C.white,
          borderRadius: 12,
          padding: 16,
          border: `1px solid ${C.line}`,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}>
          <button
            onClick={() => handleShare("email")}
            style={shareButtonStyle}
          >
            ✉️ Email
          </button>
          <button
            onClick={() => handleShare("whatsapp")}
            style={shareButtonStyle}
          >
            💬 WhatsApp
          </button>
          <button
            onClick={() => handleShare("copy")}
            style={shareButtonStyle}
          >
            📋 Copiar texto
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 32,
        textAlign: "center",
        fontSize: 11,
        color: C.slateLight,
        lineHeight: 1.6,
        letterSpacing: "0.02em",
      }}>
        Cuestionario VixiOn v6 · Instituto de Ojos de Puerto Rico
        <br/>
        No vendemos lentes. Descubrimos perfiles visuales.
      </div>
    </div>
  );
}

const shareButtonStyle = {
  flex: "1 1 30%",
  minWidth: 100,
  padding: "12px",
  background: C.cloud,
  color: C.slate,
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  fontFamily: FONT_BODY,
  cursor: "pointer",
};

// ─── Flag Card ─────────────────────────────────────────────────────────────
function FlagCard({ color, bg, label, title, description }) {
  return (
    <div style={{
      background: bg,
      borderRadius: 16,
      padding: "24px 28px",
      marginBottom: 16,
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{
        fontSize: 11,
        letterSpacing: "0.2em",
        color: color,
        fontWeight: 700,
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 18,
        fontWeight: 600,
        color: C.navyDark,
        marginBottom: 8,
        lineHeight: 1.3,
      }}>
        {title}
      </div>
      <p style={{ fontSize: 14, color: C.slate, lineHeight: 1.6, margin: 0 }}>
        {description}
      </p>
    </div>
  );
}
