import { Type } from "@google/genai";

export interface PlanData {
  diet: { title: string; description: string; benefits: string }[];
  exercise: { title: string; description: string; duration: string }[];
  rest: { title: string; description: string; when: string }[];
  tips: string[];
  encouragingMessage: string;
  weeklyRoutine: {
    monday: { earlyMorning: string; morning: string; noon: string; afternoon: string; lateAfternoon: string; evening: string; night: string };
    tuesday: { earlyMorning: string; morning: string; noon: string; afternoon: string; lateAfternoon: string; evening: string; night: string };
    wednesday: { earlyMorning: string; morning: string; noon: string; afternoon: string; lateAfternoon: string; evening: string; night: string };
    thursday: { earlyMorning: string; morning: string; noon: string; afternoon: string; lateAfternoon: string; evening: string; night: string };
    friday: { earlyMorning: string; morning: string; noon: string; afternoon: string; lateAfternoon: string; evening: string; night: string };
    saturday: { earlyMorning: string; morning: string; noon: string; afternoon: string; lateAfternoon: string; evening: string; night: string };
    sunday: { earlyMorning: string; morning: string; noon: string; afternoon: string; lateAfternoon: string; evening: string; night: string };
  };
  healthMilestones: { time: string; benefit: string; description: string }[];
  moneySavedPerMonth: number;
}

export async function generateQuitPlan(
  age: number,
  weight: number,
  height: number,
  vapeFrequency: number,
  vapeDurationMonths: number,
  smokesCigarettes: boolean,
  hobbies: string,
  motivation: string,
  testData?: { vapeTriggers: string; previousAttempts: string; commitmentLevel: number; dailyRoutine: string; biggestFear: string; socialVaping: string },
  relapseContext?: { reason: string; action: string }
): Promise<PlanData> {
  const prompt = `
    Actúa como experto en deshabituación tabáquica y de vapeo.
    Crea un plan ULTRA-DETALLADO y PERSONALIZADO en Español para:
    - Perfil: ${age} años, ${weight}kg, ${height}cm.
    - Hábito: ${vapeFrequency} caladas/día, durante ${vapeDurationMonths} meses${smokesCigarettes ? ', también fuma tabaco' : ''}.
    - Hobbies: ${hobbies}.
    - Motivación: ${motivation}.
    ${testData ? `
    - TEST DE ADAPTACIÓN:
      * Momentos críticos: ${testData.vapeTriggers}
      * Disparador principal: ${testData.dailyRoutine}
      * Intentos previos: ${testData.previousAttempts}
      * Nivel de compromiso: ${testData.commitmentLevel}/10
      * Mayor miedo: ${testData.biggestFear}
      * Contexto social: ${testData.socialVaping}
    ` : ''}
    ${relapseContext ? `- CONTEXTO DE RECAÍDA: "${relapseContext.reason}". Acción correctiva: "${relapseContext.action}".` : ''}

    REQUISITOS DEL PLAN (Sé muy específico y práctico):
    1. Nutrición: Alimentos que reduzcan la ansiedad y mejoren la salud pulmonar.
    2. Actividades: Integrar ${hobbies} como herramientas de distracción.
    3. Manejo de estrés: Técnicas específicas para los momentos de mayor antojo.
    4. Consejos de abstinencia: Cómo manejar el síndrome de abstinencia físico y psicológico.
    5. Mensaje motivador: Una frase potente basada en su motivación (${motivation}).
    6. RUTINA SEMANAL EXTENSA: Proporciona 7 actividades diarias por día (Madrugada, Mañana, Mediodía, Tarde, Tarde-Noche, Noche, Antes de dormir).
    7. 5 hitos de salud: Evolución del cuerpo desde las 2h hasta los 3 meses.
    8. Ahorro mensual: Estimación realista en Euros.

    Respuesta: SOLO JSON. Sin explicaciones. Máxima brevedad en los textos pero con contenido útil.
  `;

  const daySchema = {
    type: Type.OBJECT,
    properties: {
      earlyMorning: { type: Type.STRING, description: "Actividad al despertar" },
      morning: { type: Type.STRING, description: "Actividad media mañana" },
      noon: { type: Type.STRING, description: "Actividad mediodía/comida" },
      afternoon: { type: Type.STRING, description: "Actividad tarde" },
      lateAfternoon: { type: Type.STRING, description: "Actividad tarde-noche" },
      evening: { type: Type.STRING, description: "Actividad cena/noche" },
      night: { type: Type.STRING, description: "Actividad antes de dormir" }
    },
    required: ["earlyMorning", "morning", "noon", "afternoon", "lateAfternoon", "evening", "night"]
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      diet: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            benefits: { type: Type.STRING }
          },
          required: ["title", "description", "benefits"]
        }
      },
      exercise: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            duration: { type: Type.STRING }
          },
          required: ["title", "description", "duration"]
        }
      },
      rest: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            when: { type: Type.STRING }
          },
          required: ["title", "description", "when"]
        }
      },
      tips: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      encouragingMessage: { type: Type.STRING },
      weeklyRoutine: {
        type: Type.OBJECT,
        properties: {
          monday: daySchema,
          tuesday: daySchema,
          wednesday: daySchema,
          thursday: daySchema,
          friday: daySchema,
          saturday: daySchema,
          sunday: daySchema
        },
        required: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      },
      healthMilestones: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            benefit: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["time", "benefit", "description"]
        }
      },
      moneySavedPerMonth: { type: Type.NUMBER }
    },
    required: ["diet", "exercise", "rest", "tips", "encouragingMessage", "weeklyRoutine", "healthMilestones", "moneySavedPerMonth"]
  };

  const res = await fetch("/api/gemini/generate-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, responseSchema })
  });

  if (!res.ok) throw new Error("Error generating plan");
  const data = await res.json();
  return JSON.parse(data.text || "{}") as PlanData;
}

export async function generateDailyRecommendation(
  daysQuit: number,
  age: number,
  hobbies: string,
  motivation: string
): Promise<{ activity: string; tip: string; motivation: string }> {
  const prompt = `
    Día ${daysQuit} sin vapear. Edad: ${age}. Hobbies: ${hobbies}. Motivación: ${motivation}.
    Genera JSON:
    1. activity: Basada en hobbies.
    2. tip: Para síntomas del día ${daysQuit}.
    3. motivation: Frase corta.
    Respuesta: SOLO JSON. Español. Máxima brevedad.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      activity: { type: Type.STRING },
      tip: { type: Type.STRING },
      motivation: { type: Type.STRING }
    },
    required: ["activity", "tip", "motivation"]
  };

  const res = await fetch("/api/gemini/daily-recommendation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, responseSchema })
  });

  if (!res.ok) throw new Error("Error generating daily recommendation");
  const data = await res.json();
  return JSON.parse(data.text || "{}");
}

export function getChatSession() {
  const systemInstruction = `
    Asistente empático para dejar de vapear.
    Objetivo: Escuchar, validar y dar consejos breves y prácticos.
    Tono: Cercano, motivador, sin juzgar.
    
    REGLA DE ORO: Respuestas MUY BREVES (máx 3 frases).
    
    ESPECIALIDADES:
    1. GANAS DE FUMAR/VAPEAR: Si el usuario tiene un antojo repentino, ofrece una técnica de distracción inmediata de 1 minuto (ej: respiración 4-7-8, beber agua fría, cambiar de habitación).
    2. ESTRÉS: Si el usuario está estresado, ofrece una solución rápida de relajación o cambio de foco mental.
    3. MOMENTOS ESPECÍFICOS: Si menciona un momento (ej: "después de comer", "con amigos"), da un consejo táctico para ese contexto.

    SEGURIDAD: Si detectas ansiedad severa o depresión, recomienda ayuda profesional (España: Teléfono Esperanza 717003717, FAD 900161515).
    
    IDIOMA: Español.
  `;

  let history: { role: string; parts: { text: string }[] }[] = [];

  return {
    async sendMessage({ message }: { message: string }) {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, systemInstruction })
      });

      if (!res.ok) throw new Error("Error in chat session");
      const data = await res.json();
      
      // Update history
      history.push({ role: "user", parts: [{ text: message }] });
      history.push({ role: "model", parts: [{ text: data.text }] });
      
      return { text: data.text };
    }
  };
}

