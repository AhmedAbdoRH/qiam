import { supabase } from "@/integrations/supabase/client";
import { VALUES, FEELINGS } from "@/types/value";
import { toast } from "sonner";

interface MilestoneRecord {
  date: string;
  dateStr: string;
  timeStr: string;
  type: string;
  rating: string;
  duration: string;
  output: string;
  notes: string;
  intention: string;
}

function escapeMd(text: string): string {
  return (text ?? "").toString().replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function parseMilestone(msg: { created_at: string; message: string }): MilestoneRecord | null {
  const date = new Date(msg.created_at);
  const dateStr = date.toLocaleDateString("en-US");
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  if (msg.message === "__KISS__") return { date: msg.created_at, dateStr, timeStr, type: "قبلة حميمية", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  if (msg.message === "__TOUCH__") return { date: msg.created_at, dateStr, timeStr, type: "لمس حنون", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  if (msg.message === "__SHOWER__") return { date: msg.created_at, dateStr, timeStr, type: "دش دافئ حميمي", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  if (msg.message === "__SELFHUG__") return { date: msg.created_at, dateStr, timeStr, type: "حضن ذاتي", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  if (msg.message.startsWith("__REALITY__")) {
    // Format: __REALITY__|<eventDate>|<eventTime>|<notes>
    //   2 parts: __REALITY__|<notes>           (legacy)
    //   3 parts: __REALITY__|<date>|<notes>
    //   4 parts: __REALITY__|<date>|<time>|<notes>
    const parts = msg.message.split('|');
    const eventDate = parts.length >= 4 ? parts[1] : (parts.length === 3 ? parts[1] : '');
    const eventTime = parts.length >= 4 ? parts[2] : '';
    const notes = parts.length >= 4 ? parts[3] : (parts.length === 3 ? parts[2] : (parts.length > 1 ? parts[1] : ''));
    const dateTimeLabel = [eventDate, eventTime].filter(Boolean).join(' ');
    const combined = [dateTimeLabel, notes].filter(Boolean).join(' - ');
    return { date: msg.created_at, dateStr, timeStr, type: "حدث في الواقع", rating: "-", duration: "-", output: "-", notes: combined || '-', intention: "-" };
  }
  if (msg.message.startsWith("__DREAM__")) {
    const parts = msg.message.split('|');
    const eventDate = parts.length >= 4 ? parts[1] : (parts.length === 3 ? parts[1] : '');
    const eventTime = parts.length >= 4 ? parts[2] : '';
    const notes = parts.length >= 4 ? parts[3] : (parts.length === 3 ? parts[2] : (parts.length > 1 ? parts[1] : ''));
    const dateTimeLabel = [eventDate, eventTime].filter(Boolean).join(' ');
    const combined = [dateTimeLabel, notes].filter(Boolean).join(' - ');
    return { date: msg.created_at, dateStr, timeStr, type: "حلم", rating: "-", duration: "-", output: "-", notes: combined || '-', intention: "-" };
  }
  if (msg.message.startsWith("__FALL__")) {
    // Format: __FALL__|<id>|<description>  (where <id> is a uuid-ish placeholder)
    // Strip the prefix safely, then take the LAST part as description to be robust to either ordering
    const stripped = msg.message.replace(/^__FALL__\|?/, "");
    const parts = stripped.split('|');
    const description = parts[parts.length - 1] || parts[0] || "";
    return { date: msg.created_at, dateStr, timeStr, type: "سقوط", rating: "0", duration: "-", output: "-", notes: description, intention: "-" };
  }
  if (msg.message.startsWith("__MILESTONE__")) {
    const parts = msg.message.replace("__MILESTONE__", "").split("|");
    const isSacred = parts.length > 8;
    const notes = isSacred ? "" : (parts[2] || "");
    const intention = isSacred ? (parts[9] || "") : (parts[4] || "");
    const duration = !isSacred && parts[5] ? (parts[5] === "long" ? "طويل" : parts[5] === "medium" ? "متوسط" : "قصير") : "-";
    const output = !isSacred && parts[6] ? (parts[6] === "full" ? "كامل" : parts[6] === "simple" ? "بسيط" : "محفوظ") : "-";
    return { date: msg.created_at, dateStr, timeStr, type: parts[0] || "", rating: parts[1] || "", duration, output, notes, intention };
  }
  return null;
}

const tableRow = (cells: string[]): string => "| " + cells.join(" | ") + " |";
const tableSep = (n: number): string => "|" + " --- |".repeat(n);

/**
 * Build a Markdown report for a single value.
 * Exported so it can be reused (e.g. by ValueSheet's per-value download button).
 */
export function buildValueMarkdown(input: {
  valueId: string;
  valueName: string;
  balancePercentage: number;
  isPinned?: boolean;
  feelingsBeingHealed?: string[];
  feelingsHealed?: string[];
  feelingsHealedDates?: Record<string, string>;
  beliefs?: Record<string, string>;
  notes?: string;
  exportedAt?: string;
}): string {
  const {
    valueId,
    valueName,
    balancePercentage,
    isPinned = false,
    feelingsBeingHealed = [],
    feelingsHealed = [],
    feelingsHealedDates = {},
    beliefs = {},
    notes = "",
    exportedAt = new Date().toISOString(),
  } = input;

  const parseTasks = (raw: string) => {
    if (!raw) return [] as Array<{ text: string; severity: number; healed: boolean; completed?: boolean }>;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((t: any) => ({
          text: t.text || "",
          severity: typeof t.severity === "number" ? t.severity : 0,
          healed: t.healed === true || t.completed === true,
        }));
      }
      return [{ text: String(parsed), severity: 0, healed: false }];
    } catch {
      return raw.trim() ? [{ text: raw.trim(), severity: 0, healed: false }] : [];
    }
  };

  const stateLabel = (feeling: string): string =>
    feelingsBeingHealed.includes(feeling)
      ? "جاري العلاج"
      : feelingsHealed.includes(feeling)
      ? "تم علاجه"
      : "غير مُفعّل";

  const severityLabel = (sev: number): string => {
    // Mirrors SEVERITY_DISPLAY in TaskList.tsx (1 -> 2 -> 3 -> ... -> 10 -> 1)
    const display = (sev % 10) + 1;
    return `${display}/10`;
  };

  const sanitize = (s: string): string =>
    (s ?? "").toString().replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

  let md = "";
  md += `# ${valueName}\n\n`;
  md += `> تقرير تفصيلي للقيمة\n\n`;

  md += `## نظرة عامة\n\n`;
  md += `| الحقل | القيمة |\n`;
  md += `| --- | --- |\n`;
  md += `| المعرّف | \`${sanitize(valueId || "-")}\` |\n`;
  md += `| نسبة الاتزان | **${balancePercentage}%** |\n`;
  md += `| مثبّتة | ${isPinned ? "نعم" : "لا"} |\n`;
  md += `| تاريخ التصدير | ${sanitize(exportedAt)} |\n`;
  md += `\n`;

  // Feelings summary
  md += `## المشاعر\n\n`;
  if (feelingsBeingHealed.length === 0 && feelingsHealed.length === 0) {
    md += `_لا توجد مشاعر مُسجّلة لهذه القيمة._\n\n`;
  } else {
    if (feelingsBeingHealed.length > 0) {
      md += `**جاري العلاج:** ${feelingsBeingHealed.map(sanitize).join("، ")}\n\n`;
    }
    if (feelingsHealed.length > 0) {
      const healedWithDates = feelingsHealed.map((f) => {
        const d = feelingsHealedDates?.[f];
        return d ? `${sanitize(f)} _(بتاريخ ${sanitize(new Date(d).toLocaleDateString("en-US"))})_` : sanitize(f);
      });
      md += `**تم علاجها:** ${healedWithDates.join("، ")}\n\n`;
    }
  }

  // Per-feeling beliefs (one section per feeling, each task as a table row)
  md += `## المعتقدات حسب الشعور\n\n`;
  FEELINGS.forEach((feeling) => {
    const tasks = parseTasks(beliefs[feeling] || "");
    const state = stateLabel(feeling);
    const healedDate = feelingsHealedDates?.[feeling];
    const headerSuffix =
      state === "غير مُفعّل" ? "" : ` — _${state}${healedDate ? ` • ${sanitize(new Date(healedDate).toLocaleDateString("en-US"))}` : ""}_`;
    md += `### ${sanitize(feeling)}${headerSuffix}\n\n`;
    if (tasks.length === 0) {
      md += `_لا توجد معتقدات مسجلة._\n\n`;
    } else {
      md += `| # | المعتقد | الشدة | تم علاجه |\n`;
      md += `| --- | --- | --- | --- |\n`;
      tasks.forEach((t, i) => {
        md += `| ${i + 1} | ${sanitize(t.text) || "_(فارغ)_"} | ${severityLabel(t.severity)} | ${t.healed ? "✅" : "—"} |\n`;
      });
      md += `\n`;
    }
  });

  // Notes
  md += `## ملاحظات وتأملات\n\n`;
  md += notes && notes.trim()
    ? `${notes.trim()}\n\n`
    : `_لا توجد ملاحظات._\n\n`;

  md += `---\n\n*تم إنشاء هذا التقرير تلقائياً — ${new Date().toLocaleString("en-US")}*\n`;
  return md;
}

export async function downloadComprehensiveReport(userId: string, userEmail: string | undefined): Promise<void> {
  try {
    const [
      valuesRes, dialogueRes, calendarRes, divineNamesRes,
      animaTasksRes, animaWishesRes, sexualWishesRes,
      animaCardsRes, ahmedCardsRes, ahmedMessagesRes,
      animaNotesRes, animaCapabilitiesRes, animaQualityRes,
      behavioralRes, divineCommandsRes,
      relationshipCardsRes, sovereignShadowsRes
    ] = await Promise.all([
      supabase.from("spiritual_values").select("*").eq("user_id", userId),
      supabase.from("self_dialogue_messages").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      supabase.from("anima_calendar").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("divine_names").select("*").eq("user_id", userId),
      supabase.from("anima_tasks").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("anima_wishes").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("anima_sexual_wishes").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("anima_page_cards").select("*").eq("user_id", userId).order("order_index", { ascending: true }),
      supabase.from("ahmed_page_cards").select("*").eq("user_id", userId).order("order_index", { ascending: true }),
      supabase.from("ahmed_messages").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      supabase.from("anima_notes").select("*").eq("user_id", userId),
      supabase.from("anima_capabilities").select("*").eq("user_id", userId),
      supabase.from("anima_quality_rating").select("*").eq("user_id", userId),
      supabase.from("behavioral_values").select("*").eq("user_id", userId),
      (supabase as any).from("divine_commands_tasks").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("relationship_cards").select("*").eq("user_id", userId).order("level", { ascending: true }).order("sort_order", { ascending: true }),
      (supabase as any).from("sovereign_shadows").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    // Spiritual values
    const spiritualValues: { name: string; balancePercentage: number; feelingsBeingHealed: string[]; feelingsHealed: string[]; feelingsHealedDates: Record<string, string>; beliefs: Record<string, string>; notes: string; isPinned: boolean }[] = [];
    const valuesSeen = new Set<string>();
    (valuesRes.data || []).forEach((item: any) => {
      if (item.value_id === "0" || !item.value_id) return;
      const idx = parseInt(item.value_id);
      const name = !isNaN(idx) && idx >= 0 && idx < VALUES.length ? VALUES[idx] : item.value_name || "غير معروف";
      if (valuesSeen.has(name)) return;
      valuesSeen.add(name);
      spiritualValues.push({
        name,
        balancePercentage: item.balance_percentage || 50,
        feelingsBeingHealed: Array.isArray(item.feelings_being_healed) ? item.feelings_being_healed as string[] : [],
        feelingsHealed: Array.isArray(item.feelings_healed) ? item.feelings_healed as string[] : [],
        feelingsHealedDates: (item.feelings_healed_dates && typeof item.feelings_healed_dates === "object") ? item.feelings_healed_dates as Record<string, string> : {},
        beliefs: (item.beliefs && typeof item.beliefs === "object") ? item.beliefs as Record<string, string> : {},
        notes: item.notes || "",
        isPinned: item.is_pinned || false,
      });
    });
    VALUES.forEach((name) => {
      if (!valuesSeen.has(name)) spiritualValues.push({ name, balancePercentage: 50, feelingsBeingHealed: [], feelingsHealed: [], feelingsHealedDates: {}, beliefs: {}, notes: "", isPinned: false });
    });

    // Self-dialogue messages and milestones (limit to last 100 messages, last 10 milestones)
    const allDialogue = (dialogueRes.data || []).slice().reverse(); // chronological
    const milestonesAll: MilestoneRecord[] = [];
    const selfDialogue: { dateStr: string; timeStr: string; sender: string; message: string }[] = [];
    for (const m of allDialogue) {
      const parsed = parseMilestone(m);
      if (parsed) {
        milestonesAll.push(parsed);
      } else if (!m.message?.startsWith("__SPACER__")) {
        const speakerLabel = (() => {
          if (m.chat_mode === "nafs") return "النفس";
          if (m.chat_mode === "anima" || m.chat_mode === "nurturing") return "الأنيما";
          if (m.chat_mode === "sovereign" || m.sender === "me") return "الذات السيادية";
          // Legacy fallback
          if (m.sender === "me") return "الذات السيادية";
          if (m.sender === "anima") return "النفس";
          return m.sender || "الأنيما";
        })();
        selfDialogue.push({
          dateStr: new Date(m.created_at).toLocaleDateString("en-US"),
          timeStr: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          sender: speakerLabel,
          message: m.message || "",
        });
      }
    }
    const lastMessages = selfDialogue.slice(-100);
    const lastMilestones = milestonesAll.slice(-10);

    // Cleansing/feeling tasks
    const cleansingTasks: { text: string; intensity: number; tags: string[] }[] = [];
    const cleansingRecord = (valuesRes.data || []).find((it: any) => it.value_id === "0");
    if (cleansingRecord && Array.isArray(cleansingRecord.feeling_tasks)) {
      for (const t of cleansingRecord.feeling_tasks as any[]) {
        cleansingTasks.push({ text: t.text || t.title || "", intensity: typeof t.intensity === "number" ? t.intensity : 0, tags: Array.isArray(t.tags) ? t.tags : [] });
      }
    }

    const feelingsTotal = FEELINGS.reduce((acc, f) => {
      acc[f] = spiritualValues.filter(v => v.feelingsBeingHealed.includes(f)).length;
      return acc;
    }, {} as Record<string, number>);
    const feelingsLine = Object.entries(feelingsTotal).filter(([_, c]) => c > 0).map(([f, c]) => `${f}: ${c}`).join(" — ");

    let md = "";
    md += "# التقرير الشامل\n\n";
    md += `المستخدم: ${userEmail || "-"}  \n`;
    md += `تاريخ التوليد: ${new Date().toLocaleString("en-US")}\n\n`;

    // ===== Spiritual values =====
    md += "## القيم الروحانية\n\n";
    md += tableRow(["القيمة", "نسبة الاتزان", "مشاعر جاري علاجها", "مشاعر تم علاجها", "مثبّتة", "ملاحظات"]) + "\n";
    md += tableSep(6) + "\n";
    for (const v of spiritualValues) {
      md += tableRow([escapeMd(v.name), v.balancePercentage + "%", v.feelingsBeingHealed.length ? v.feelingsBeingHealed.join("، ") : "-", v.feelingsHealed.length ? v.feelingsHealed.join("، ") : "-", v.isPinned ? "نعم" : "-", v.notes ? escapeMd(v.notes) : "-"]) + "\n";
    }
    md += "\n## تظهير القيم شعوريا\n\n" + (feelingsLine || "لا توجد مشاعر مسجلة") + "\n\n";

    // ===== Per-value detail sheets =====
    md += "## تفاصيل شيت كل قيمة\n\n";
    for (const v of spiritualValues) {
      md += `### ${v.name}${v.isPinned ? " 📌" : ""}\n\n`;
      md += `- نسبة الاتزان: **${v.balancePercentage}%**\n`;
      md += `- مشاعر جاري علاجها: ${v.feelingsBeingHealed.length ? v.feelingsBeingHealed.join("، ") : "-"}\n`;
      md += `- مشاعر تم علاجها: ${v.feelingsHealed.length ? v.feelingsHealed.join("، ") : "-"}\n\n`;

      md += `**الارتباطات حسب المشاعر:**\n\n`;
      const hasAny = FEELINGS.some(f => (v.beliefs[f] && v.beliefs[f].trim()) || v.feelingsBeingHealed.includes(f) || v.feelingsHealed.includes(f));
      if (hasAny) {
        for (const f of FEELINGS) {
          const note = (v.beliefs[f] || "").trim();
          const state = v.feelingsBeingHealed.includes(f) ? "جاري العلاج" : v.feelingsHealed.includes(f) ? "تم علاجه" : "محايد";
          const date = v.feelingsHealedDates[f] ? ` — ${new Date(v.feelingsHealedDates[f]).toLocaleDateString("en-US")}` : "";
          if (!note && state === "محايد") continue;
          md += `- **${f}** (${state}${date}): ${note || "-"}\n`;
        }
      } else {
        md += `- لا توجد ارتباطات\n`;
      }
      md += `\n**ملاحظات وتأملات:** ${v.notes ? "\n\n" + v.notes : "-"}\n\n---\n\n`;
    }


    // ===== Behavioral values =====
    md += "## القيم السلوكية\n\n";
    if (behavioralRes.data && behavioralRes.data.length) {
      md += tableRow(["القيمة", "نسبة الاتزان", "ملاحظات"]) + "\n" + tableSep(3) + "\n";
      for (const b of behavioralRes.data as any[]) {
        md += tableRow([escapeMd(b.value_name || b.value_id || "-"), (b.balance_percentage ?? "-") + "%", b.notes ? escapeMd(b.notes) : "-"]) + "\n";
      }
    } else md += "لا توجد قيم سلوكية\n";
    md += "\n";

    // ===== Divine names =====
    md += "## أسماء الله الحسنى\n\n";
    if (divineNamesRes.data && divineNamesRes.data.length) {
      md += tableRow(["الاسم", "نسبة الحفظ", "رابط الآيات", "ملاحظات"]) + "\n" + tableSep(4) + "\n";
      for (const d of divineNamesRes.data as any[]) {
        md += tableRow([escapeMd(d.divine_name), (d.progress ?? 0) + "%", d.verses_link ? escapeMd(d.verses_link) : "-", d.notes ? escapeMd(d.notes) : "-"]) + "\n";
      }
    } else md += "لا توجد بيانات لأسماء الله الحسنى\n";
    md += "\n";

    // ===== Divine commands tasks =====
    md += "## تنفيذ الأوامر والنواهي الإلهية\n\n";
    if (divineCommandsRes.data && (divineCommandsRes.data as any[]).length) {
      md += tableRow(["المهمة", "التقدم"]) + "\n" + tableSep(2) + "\n";
      for (const t of divineCommandsRes.data as any[]) {
        const p = Number(t.progress) || 0;
        md += tableRow([escapeMd(t.title), "█".repeat(Math.round(p)) + "░".repeat(10 - Math.round(p)) + ` ${p.toFixed(1)}/10`]) + "\n";
      }
    } else md += "لا توجد مهام\n";
    md += "\n";

    // ===== Anima cards =====
    md += "## بطاقات الأنيما\n\n";
    if (animaCardsRes.data && animaCardsRes.data.length) {
      md += tableRow(["العنوان", "الوصف"]) + "\n" + tableSep(2) + "\n";
      for (const c of animaCardsRes.data as any[]) md += tableRow([escapeMd(c.title), c.description ? escapeMd(c.description) : "-"]) + "\n";
    } else md += "لا توجد بطاقات\n";
    md += "\n";

    // ===== Ahmed cards =====
    md += "## بطاقات أحمد\n\n";
    if (ahmedCardsRes.data && ahmedCardsRes.data.length) {
      md += tableRow(["العنوان", "الوصف"]) + "\n" + tableSep(2) + "\n";
      for (const c of ahmedCardsRes.data as any[]) md += tableRow([escapeMd(c.title), c.description ? escapeMd(c.description) : "-"]) + "\n";
    } else md += "لا توجد بطاقات\n";
    md += "\n";

    // ===== Anima wishes =====
    md += "## أمنيات الأنيما\n\n";
    if (animaWishesRes.data && animaWishesRes.data.length) {
      md += tableRow(["الأمنية", "التقدم", "مكتملة"]) + "\n" + tableSep(3) + "\n";
      for (const w of animaWishesRes.data as any[]) md += tableRow([escapeMd(w.title), (Number(w.progress) || 0).toFixed(1) + "/10", w.completed ? "نعم" : "-"]) + "\n";
    } else md += "لا توجد أمنيات\n";
    md += "\n";

    // ===== Sexual wishes =====
    md += "## الأمنيات الحميمية\n\n";
    if (sexualWishesRes.data && sexualWishesRes.data.length) {
      md += tableRow(["الأمنية", "التقدم", "مكتملة"]) + "\n" + tableSep(3) + "\n";
      for (const w of sexualWishesRes.data as any[]) md += tableRow([escapeMd(w.title), (Number(w.progress) || 0).toFixed(1) + "/10", w.completed ? "نعم" : "-"]) + "\n";
    } else md += "لا توجد أمنيات حميمية\n";
    md += "\n";

    // ===== Anima tasks =====
    md += "## مهام الأنيما\n\n";
    if (animaTasksRes.data && animaTasksRes.data.length) {
      md += tableRow(["المهمة", "التقدم", "التاجات"]) + "\n" + tableSep(3) + "\n";
      for (const t of animaTasksRes.data as any[]) {
        const p = Number(t.progress) || 0;
        const tags = Array.isArray((t as any).tags) ? (t as any).tags.join("، ") : "-";
        md += tableRow([escapeMd(t.title), "█".repeat(Math.round(p)) + "░".repeat(10 - Math.round(p)) + ` ${p.toFixed(1)}/10`, tags || "-"]) + "\n";
      }
    } else md += "لا توجد مهام\n";
    md += "\n";

    // ===== Calendar (التذكيرية / الطفل الداخلي) =====
    md += "## القائمة التذكيرية\n\n";
    if (calendarRes.data && calendarRes.data.length) {
      md += tableRow(["المهمة", "التقدم", "التاجات"]) + "\n" + tableSep(3) + "\n";
      for (const t of calendarRes.data as any[]) {
        const p = Number(t.progress) || 0;
        const tags = Array.isArray((t as any).tags) ? (t as any).tags.join("، ") : "-";
        md += tableRow([escapeMd(t.title), "█".repeat(Math.round(p)) + "░".repeat(10 - Math.round(p)) + ` ${p.toFixed(1)}/10`, tags || "-"]) + "\n";
      }
    } else md += "لا توجد عناصر\n";
    md += "\n";

    // ===== Cleansing tasks =====
    md += "## التطهير (مهام شعورية)\n\n";
    if (cleansingTasks.length) {
      md += tableRow(["المهمة", "الشدة", "التاجات"]) + "\n" + tableSep(3) + "\n";
      for (const t of cleansingTasks) md += tableRow([escapeMd(t.text), t.intensity.toFixed(1) + "/10", t.tags.length ? t.tags.join("، ") : "-"]) + "\n";
    } else md += "لا توجد مهام\n";
    md += "\n";

    // ===== Anima capabilities =====
    md += "## قدرات الأنيما\n\n";
    if (animaCapabilitiesRes.data && animaCapabilitiesRes.data.length) {
      for (const c of animaCapabilitiesRes.data as any[]) md += `- ${escapeMd((c as any).title || (c as any).name || (c as any).text || "-")}\n`;
    } else md += "لا توجد بيانات\n";
    md += "\n";

    // ===== Anima notes =====
    md += "## ملاحظات الأنيما\n\n";
    if (animaNotesRes.data && animaNotesRes.data.length) {
      for (const n of animaNotesRes.data as any[]) md += `- ${escapeMd((n as any).note || (n as any).content || (n as any).text || "-")}\n`;
    } else md += "لا توجد ملاحظات\n";
    md += "\n";

    // ===== Anima quality rating =====
    md += "## تقييم جودة الأنيما\n\n";
    if (animaQualityRes.data && animaQualityRes.data.length) {
      for (const r of animaQualityRes.data as any[]) md += `- ${escapeMd((r as any).rating ?? "-")} (${new Date((r as any).created_at).toLocaleString("en-US")})\n`;
    } else md += "لا توجد تقييمات\n";
    md += "\n";

    // ===== Ahmed messages (last 100) =====
    md += "## رسائل أحمد (آخر 100)\n\n";
    const ahmedSorted = (ahmedMessagesRes.data || []).slice().reverse();
    if (ahmedSorted.length) {
      md += tableRow(["التاريخ", "الوقت", "الرسالة", "إعجابات"]) + "\n" + tableSep(4) + "\n";
      for (const m of ahmedSorted as any[]) {
        const d = new Date(m.created_at);
        md += tableRow([d.toLocaleDateString("en-US"), d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), escapeMd(m.text || ""), String(m.likes ?? 0)]) + "\n";
      }
    } else md += "لا توجد رسائل\n";
    md += "\n";

    // ===== Self-dialogue messages (last 100) =====
    md += "## محادثة الأنيما (آخر 100 رسالة)\n\n";
    if (lastMessages.length) {
      md += tableRow(["التاريخ", "الوقت", "المرسل", "الرسالة"]) + "\n" + tableSep(4) + "\n";
      for (const m of lastMessages) md += tableRow([escapeMd(m.dateStr), escapeMd(m.timeStr), escapeMd(m.sender), escapeMd(m.message)]) + "\n";
    } else md += "لا توجد رسائل\n";
    md += "\n";

    // ===== Milestones (last 10) =====
    md += "## آخر 10 مايلستونز\n\n";
    if (lastMilestones.length) {
      md += tableRow(["التاريخ", "الوقت", "النوع", "التقييم", "المدة", "القذف", "الملاحظات", "النية"]) + "\n" + tableSep(8) + "\n";
      for (const m of [...lastMilestones].reverse()) {
        md += tableRow([escapeMd(m.dateStr), escapeMd(m.timeStr), escapeMd(m.type), escapeMd(m.rating), escapeMd(m.duration), escapeMd(m.output), escapeMd(m.notes), escapeMd(m.intention)]) + "\n";
      }
    } else md += "لا توجد سجلات\n";
    md += "\n";

    // ===== Relationship cards =====
    md += "## العلاقات\n\n";
    const relationshipCards = (relationshipCardsRes.data || []) as any[];
    if (relationshipCards.length) {
      const LEVEL_LABEL: Record<string, string> = { "A+": "أقرب الناس", A: "علاقة وثيقة", B: "علاقة جيدة", C: "معرفة" };
      md += tableRow(["الاسم", "المستوى", "الهاتف", "Messenger", "مهام الإحسان المكتملة", "إجمالي المهام"]) + "\n" + tableSep(6) + "\n";
      for (const r of relationshipCards) {
        const tasks: any[] = Array.isArray(r.tasks) ? r.tasks : [];
        const completed = tasks.filter((t: any) => t?.completed).length;
        md += tableRow([
          escapeMd(r.name || "-"),
          escapeMd(r.level || "-"),
          r.contact_phone ? escapeMd(r.contact_phone) : "-",
          r.contact_messenger ? escapeMd(r.contact_messenger) : "-",
          String(completed),
          String(tasks.length),
        ]) + "\n";

        // Per-card Ihsan tasks detail
        if (tasks.length) {
          md += `\n### مهام الإحسان لـ ${escapeMd(r.name || "")}\n\n`;
          for (const t of tasks) {
            const mark = t?.completed ? "✅" : "⬜";
            md += `- ${mark} ${escapeMd(t?.title || t?.text || "-")}\n`;
          }
          md += "\n";
        }
      }
    } else {
      md += "لا توجد علاقات مسجلة\n\n";
    }

    // ===== Sovereign shadows =====
    md += "## ظلال الذات السيادية\n\n";
    const sovereignShadows = (sovereignShadowsRes.data || []) as any[];
    if (sovereignShadows.length) {
      for (const s of sovereignShadows) {
        const stamp = s.created_at ? new Date(s.created_at).toLocaleString("en-US") : "";
        md += `- ${escapeMd(s.content || s.shadow || s.text || "-")}${stamp ? `  \n  <sub>${stamp}</sub>` : ""}\n`;
      }
    } else {
      md += "لا توجد ظلال مسجلة\n";
    }
    md += "\n";

    md += "---\n\n*تم إنشاء هذا التقرير تلقائياً*\n";

    const blob = new Blob(["\ufeff" + md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    a.download = `تقرير-شامل-${dateStr}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تحميل التقرير الشامل");
  } catch (error) {
    console.error("Error generating report:", error);
    toast.error("حدث خطأ أثناء إنشاء التقرير");
  }
}

const MASCULINE_VALUE_NAMES_REPORT = [
  "القوة",
  "الهيمنة",
  "القهارية",
  "العظمة",
  "العزة",
  "القدر",
  "الولاية",
  "الملك",
  "المتانة",
  "الحكمة",
  "الرزق",
  "التعالي",
  "الواحدية",
  "الصمدية",
  "البصر",
  "الظهور",
  "التكبر",
  "الخلق",
  "القيومية",
  "الحق",
  "الأولية",
  "الكرامة",
  "التبيين",
  "البر",
  "الفتح",
];

export async function downloadMasculineValuesReport(userId: string, userEmail: string | undefined): Promise<void> {
  try {
    const [valuesRes, shadowsRes, divineCommandsRes] = await Promise.all([
      supabase.from("spiritual_values").select("*").eq("user_id", userId),
      (supabase as any).from("sovereign_shadows").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      (supabase as any).from("divine_commands_tasks").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    ]);

    const masculineValuesMap = new Map<string, any>();
    for (const item of (valuesRes.data || []) as any[]) {
      if (!item.value_id) continue;
      const idx = parseInt(item.value_id);
      const name = !isNaN(idx) && idx >= 0 && idx < VALUES.length ? VALUES[idx] : item.value_name || "غير معروف";
      if (MASCULINE_VALUE_NAMES_REPORT.includes(name)) {
        masculineValuesMap.set(name, item);
      }
    }

    let md = "";
    md += "# تقرير القيم الذكورية\n\n";
    md += `المستخدم: ${userEmail || "-"}  \n`;
    md += `تاريخ التوليد: ${new Date().toLocaleString("en-US")}\n\n`;

    md += "## القيم الذكورية\n\n";
    md += tableRow(["القيمة", "نسبة الاتزان", "مشاعر جاري علاجها", "مشاعر تم علاجها", "مثبّتة", "ملاحظات"]) + "\n";
    md += tableSep(6) + "\n";
    for (const name of MASCULINE_VALUE_NAMES_REPORT) {
      const item = masculineValuesMap.get(name);
      const balancePercentage = item?.balance_percentage || 50;
      const selectedFeelings = Array.isArray(item?.feelings_being_healed) ? (item.feelings_being_healed as string[]).join("، ") : "-";
      const positiveFeelings = Array.isArray(item?.feelings_healed) ? (item.feelings_healed as string[]).join("، ") : "-";
      const isPinned = item?.is_pinned ? "نعم" : "-";
      const notes = item?.notes ? escapeMd(item.notes) : "-";
      md += tableRow([escapeMd(name), balancePercentage + "%", selectedFeelings, positiveFeelings, isPinned, notes]) + "\n";
    }
    md += "\n";

    md += "## الظلال\n\n";
    if (shadowsRes.data && (shadowsRes.data as any[]).length) {
      for (const s of shadowsRes.data as any[]) {
        md += `- ${escapeMd(s.content || "-")} (${new Date(s.created_at).toLocaleString("en-US")})\n`;
      }
    } else {
      md += "لا توجد ظلال مسجلة\n";
    }
    md += "\n";

    md += "## تنفيذ الأوامر والنواهي الإلهية\n\n";
    if (divineCommandsRes.data && (divineCommandsRes.data as any[]).length) {
      md += tableRow(["المهمة", "التقدم"]) + "\n" + tableSep(2) + "\n";
      for (const t of divineCommandsRes.data as any[]) {
        const p = Number(t.progress) || 0;
        md += tableRow([escapeMd(t.title), "█".repeat(Math.round(p)) + "░".repeat(10 - Math.round(p)) + ` ${p.toFixed(1)}/10`]) + "\n";
      }
    } else {
      md += "لا توجد مهام\n";
    }
    md += "\n";

    md += "## تفاصيل شيت كل قيمة\n\n";
    for (const name of MASCULINE_VALUE_NAMES_REPORT) {
      const item = masculineValuesMap.get(name);
      const balance = item?.balance_percentage ?? 50;
      const selected: string[] = Array.isArray(item?.feelings_being_healed) ? item.feelings_being_healed : [];
      const positive: string[] = Array.isArray(item?.feelings_healed) ? item.feelings_healed : [];
      const dates: Record<string, string> = (item?.feelings_healed_dates && typeof item.feelings_healed_dates === "object") ? item.feelings_healed_dates : {};
      const fNotes: Record<string, string> = (item?.beliefs && typeof item.beliefs === "object") ? item.beliefs : {};
      const pinned = item?.is_pinned;
      const notes = item?.notes || "";

      md += `### ${name}${pinned ? " 📌" : ""}\n\n`;
      md += `- نسبة الاتزان: **${balance}%**\n`;
      md += `- مشاعر جاري علاجها: ${selected.length ? selected.join("، ") : "-"}\n`;
      md += `- مشاعر تم علاجها: ${positive.length ? positive.join("، ") : "-"}\n\n`;

      md += `**الارتباطات حسب المشاعر:**\n\n`;
      let any = false;
      for (const f of FEELINGS) {
        const note = (fNotes[f] || "").trim();
        const state = selected.includes(f) ? "سلبي" : positive.includes(f) ? "إيجابي" : "محايد";
        const date = dates[f] ? ` — ${new Date(dates[f]).toLocaleDateString("en-US")}` : "";
        if (!note && state === "محايد") continue;
        md += `- **${f}** (${state}${date}): ${note || "-"}\n`;
        any = true;
      }
      if (!any) md += `- لا توجد ارتباطات\n`;
      md += `\n**ملاحظات وتأملات:** ${notes ? "\n\n" + notes : "-"}\n\n---\n\n`;
    }

    md += "---\n\n*تم إنشاء هذا التقرير تلقائياً*\n";

    const blob = new Blob(["\ufeff" + md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    a.download = `تقرير-القيم-الذكورية-${dateStr}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تحميل تقرير القيم الذكورية");
  } catch (error) {
    console.error("Error generating masculine report:", error);
    toast.error("حدث خطأ أثناء إنشاء التقرير");
  }
}

const MASCULINE_VALUE_NAMES_ALL = [
  "القوة", "الهيمنة", "القهارية", "العظمة", "العزة", "القدر", "الولاية", "الملك",
  "المتانة", "الحكمة", "الرزق", "التعالي", "الواحدية", "الصمدية", "البصر", "الظهور",
  "التكبر", "الخلق", "القيومية", "الحق", "الأولية", "الكرامة", "التبيين", "البر", "الفتح",
];
const MASCULINE_SET = new Set(MASCULINE_VALUE_NAMES_ALL);

export async function downloadAllValuesReport(userId: string, userEmail: string | undefined): Promise<void> {
  try {
    const valuesRes = await supabase.from("spiritual_values").select("*").eq("user_id", userId);

    // Build map of saved value data by name
    const valuesMap = new Map<string, any>();
    for (const item of (valuesRes.data || []) as any[]) {
      if (!item.value_id) continue;
      const idx = parseInt(item.value_id);
      const name = !isNaN(idx) && idx >= 0 && idx < VALUES.length ? VALUES[idx] : item.value_name || "غير معروف";
      valuesMap.set(name, item);
    }

    // Split VALUES into masculine and feminine (preserving VALUES order)
    const masculineValues = VALUES.filter((name) => MASCULINE_SET.has(name));
    const feminineValues = VALUES.filter((name) => !MASCULINE_SET.has(name));

    let md = "";
    md += "# تقرير كل القيم\n\n";
    md += `المستخدم: ${userEmail || "-"}  \n`;
    md += `تاريخ التوليد: ${new Date().toLocaleString("en-US")}\n\n`;

    // ===== Masculine values section =====
    md += "## القيم الذكورية\n\n";
    for (const name of masculineValues) {
      const item = valuesMap.get(name);
      
      // Basic info table
      md += `### ${escapeMd(name)}${item?.is_pinned ? " 📌" : ""}\n\n`;
      md += `| الحقل | القيمة |\n`;
      md += `| --- | --- |\n`;
      md += `| نسبة الاتزان | **${(item?.balance_percentage || 50) + "%"} |\n`;
      md += `| مشاعر جاري علاجها | ${Array.isArray(item?.feelings_being_healed) && item.feelings_being_healed.length ? (item.feelings_being_healed as string[]).join("، ") : "-"} |\n`;
      md += `| مشاعر تم علاجها | ${Array.isArray(item?.feelings_healed) && item.feelings_healed.length ? (item.feelings_healed as string[]).join("، ") : "-"} |\n`;
      md += `| مثبّتة | ${item?.is_pinned ? "نعم" : "-"} |\n`;
      md += `| ملاحظات | ${item?.notes ? escapeMd(item.notes) : "-"} |\n\n`;

      // Beliefs section
      const hasBeliefs = FEELINGS.some(f => (item?.beliefs && item.beliefs[f] && item.beliefs[f].trim()));
      if (hasBeliefs) {
        md += `**المعتقدات حسب الشعور:**\n\n`;
        for (const f of FEELINGS) {
          const belief = (item?.beliefs && item.beliefs[f]) || "";
          if (belief.trim()) {
            md += `- **${f}**: ${escapeMd(belief)}\n`;
          }
        }
        md += "\n";
      }

      // Tasks section (feeling_tasks)
      const hasTasks = item?.feeling_tasks && Array.isArray(item.feeling_tasks) && item.feeling_tasks.length > 0;
      if (hasTasks) {
        md += `**المهام حسب الشعور:**\n\n`;
        // feeling_tasks is array of objects with text, intensity, tags
        // We need to map by feeling? The structure in cleansingRecord is array of tasks, each with text, intensity, tags.
        // It doesn't specify which feeling. In the comprehensive report, they treat cleansingRecord as general feeling tasks not tied to a specific feeling.
        // For simplicity, we'll list all tasks under a general heading.
        for (const t of item.feeling_tasks as any[]) {
          const text = t.text || "";
          const intensity = typeof t.intensity === "number" ? t.intensity : 0;
          const tags = Array.isArray(t.tags) ? t.tags : [];
          md += `- ${escapeMd(text)} (الشدة: ${intensity}/10${tags.length ? `, العلامات: ${tags.map(escapeMd).join(", ")}` : ""})\n`;
        }
        md += "\n";
      }

      // Feelings status section
      const feelingsBeingHealed = Array.isArray(item?.feelings_being_healed) ? item.feelings_being_healed : [];
      const feelingsHealed = Array.isArray(item?.feelings_healed) ? item.feelings_healed : [];
      if (feelingsBeingHealed.length > 0 || feelingsHealed.length > 0) {
        md += `**الحالة العاطفية:**\n\n`;
        if (feelingsBeingHealed.length > 0) {
          md += `- **جاري العلاج:** ${feelingsBeingHealed.map(escapeMd).join("، ")}\n`;
        }
        if (feelingsHealed.length > 0) {
          md += `- **تم علاجها:** ${feelingsHealed.map(escapeMd).join("، ")}\n`;
        }
        md += "\n";
      }

      md += "---\n\n";
    }

    // ===== Feminine values section =====
    md += "## القيم الأنثوية\n\n";
    for (const name of feminineValues) {
      const item = valuesMap.get(name);
      
      // Basic info table
      md += `### ${escapeMd(name)}${item?.is_pinned ? " 📌" : ""}\n\n`;
      md += `| الحقل | القيمة |\n`;
      md += `| --- | --- |\n`;
      md += `| نسبة الاتزان | **${(item?.balance_percentage || 50) + "%"} |\n`;
      md += `| مشاعر جاري علاجها | ${Array.isArray(item?.feelings_being_healed) && item.feelings_being_healed.length ? (item.feelings_being_healed as string[]).join("، ") : "-"} |\n`;
      md += `| مشاعر تم علاجها | ${Array.isArray(item?.feelings_healed) && item.feelings_healed.length ? (item.feelings_healed as string[]).join("، ") : "-"} |\n`;
      md += `| مثبّتة | ${item?.is_pinned ? "نعم" : "-"} |\n`;
      md += `| ملاحظات | ${item?.notes ? escapeMd(item.notes) : "-"} |\n\n`;

      // Beliefs section
      const hasBeliefs = FEELINGS.some(f => (item?.beliefs && item.beliefs[f] && item.beliefs[f].trim()));
      if (hasBeliefs) {
        md += `**المعتقدات حسب الشعور:**\n\n`;
        for (const f of FEELINGS) {
          const belief = (item?.beliefs && item.beliefs[f]) || "";
          if (belief.trim()) {
            md += `- **${f}**: ${escapeMd(belief)}\n`;
          }
        }
        md += "\n";
      }

      // Tasks section (feeling_tasks)
      const hasTasks = item?.feeling_tasks && Array.isArray(item.feeling_tasks) && item.feeling_tasks.length > 0;
      if (hasTasks) {
        md += `**المهام حسب الشعور:**\n\n`;
        for (const t of item.feeling_tasks as any[]) {
          const text = t.text || "";
          const intensity = typeof t.intensity === "number" ? t.intensity : 0;
          const tags = Array.isArray(t.tags) ? t.tags : [];
          md += `- ${escapeMd(text)} (الشدة: ${intensity}/10${tags.length ? `, العلامات: ${tags.map(escapeMd).join(", ")}` : ""})\n`;
        }
        md += "\n";
      }

      // Feelings status section
      const feelingsBeingHealed = Array.isArray(item?.feelings_being_healed) ? item.feelings_being_healed : [];
      const feelingsHealed = Array.isArray(item?.feelings_healed) ? item.feelings_healed : [];
      if (feelingsBeingHealed.length > 0 || feelingsHealed.length > 0) {
        md += `**الحالة العاطفية:**\n\n`;
        if (feelingsBeingHealed.length > 0) {
          md += `- **جاري العلاج:** ${feelingsBeingHealed.map(escapeMd).join("، ")}\n`;
        }
        if (feelingsHealed.length > 0) {
          md += `- **تم علاجها:** ${feelingsHealed.map(escapeMd).join("، ")}\n`;
        }
        md += "\n";
      }

      md += "---\n\n";
    }

    md += "*تم إنشاء هذا التقرير تلقائياً*\n";

    const blob = new Blob(["\ufeff" + md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    a.download = `تقرير-كل-القيم-${dateStr}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تحميل تقرير كل القيم");
  } catch (error) {
    console.error("Error generating all-values report:", error);
    toast.error("حدث خطأ أثناء إنشاء التقرير");
  }
}
