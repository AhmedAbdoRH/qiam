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
    const parts = msg.message.split('|');
    const eventDate = parts.length > 2 ? parts[1] : '';
    const notes = parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : '');
    return { date: msg.created_at, dateStr, timeStr, type: "حدث في الواقع", rating: "-", duration: "-", output: "-", notes: eventDate && notes ? `${eventDate} - ${notes}` : (eventDate || notes || '-'), intention: "-" };
  }
  if (msg.message.startsWith("__DREAM__")) {
    const parts = msg.message.split('|');
    const eventDate = parts.length > 2 ? parts[1] : '';
    const notes = parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : '');
    return { date: msg.created_at, dateStr, timeStr, type: "حلم", rating: "-", duration: "-", output: "-", notes: eventDate && notes ? `${eventDate} - ${notes}` : (eventDate || notes || '-'), intention: "-" };
  }
  if (msg.message.startsWith("__FALL__")) {
    const parts = msg.message.replace("__FALL__|", "").split("|");
    return { date: msg.created_at, dateStr, timeStr, type: "سقوط", rating: "0", duration: "-", output: "-", notes: parts[1] || "", intention: "-" };
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

export async function downloadComprehensiveReport(userId: string, userEmail: string | undefined): Promise<void> {
  try {
    const [
      valuesRes, dialogueRes, calendarRes, divineNamesRes,
      animaTasksRes, animaWishesRes, sexualWishesRes,
      animaCardsRes, ahmedCardsRes, ahmedMessagesRes,
      animaNotesRes, animaCapabilitiesRes, animaQualityRes,
      behavioralRes, divineCommandsRes
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
    ]);

    // Spiritual values
    const spiritualValues: { name: string; balancePercentage: number; selectedFeelings: string[]; positiveFeelings: string[]; positiveFeelingDates: Record<string, string>; feelingNotes: Record<string, string>; notes: string; isPinned: boolean }[] = [];
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
        selectedFeelings: Array.isArray(item.selected_feelings) ? item.selected_feelings as string[] : [],
        positiveFeelings: Array.isArray(item.positive_feelings) ? item.positive_feelings as string[] : [],
        positiveFeelingDates: (item.positive_feeling_dates && typeof item.positive_feeling_dates === "object") ? item.positive_feeling_dates as Record<string, string> : {},
        feelingNotes: (item.feeling_notes && typeof item.feeling_notes === "object") ? item.feeling_notes as Record<string, string> : {},
        notes: item.notes || "",
        isPinned: item.is_pinned || false,
      });
    });
    VALUES.forEach((name) => {
      if (!valuesSeen.has(name)) spiritualValues.push({ name, balancePercentage: 50, selectedFeelings: [], positiveFeelings: [], positiveFeelingDates: {}, feelingNotes: {}, notes: "", isPinned: false });
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
        selfDialogue.push({
          dateStr: new Date(m.created_at).toLocaleDateString("en-US"),
          timeStr: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          sender: m.sender === "me" ? "أنا" : m.sender === "anima" ? "النفس" : m.sender || "غير معروف",
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
      acc[f] = spiritualValues.filter(v => v.selectedFeelings.includes(f)).length;
      return acc;
    }, {} as Record<string, number>);
    const feelingsLine = Object.entries(feelingsTotal).filter(([_, c]) => c > 0).map(([f, c]) => `${f}: ${c}`).join(" — ");

    let md = "";
    md += "# التقرير الشامل\n\n";
    md += `المستخدم: ${userEmail || "-"}  \n`;
    md += `تاريخ التوليد: ${new Date().toLocaleString("en-US")}\n\n`;

    // ===== Spiritual values =====
    md += "## القيم الروحانية\n\n";
    md += tableRow(["القيمة", "نسبة الاتزان", "المشاعر السلبية", "المشاعر الإيجابية", "مثبّتة", "ملاحظات"]) + "\n";
    md += tableSep(6) + "\n";
    for (const v of spiritualValues) {
      md += tableRow([escapeMd(v.name), v.balancePercentage + "%", v.selectedFeelings.length ? v.selectedFeelings.join("، ") : "-", v.positiveFeelings.length ? v.positiveFeelings.join("، ") : "-", v.isPinned ? "نعم" : "-", v.notes ? escapeMd(v.notes) : "-"]) + "\n";
    }
    md += "\n## تظهير القيم شعوريا\n\n" + (feelingsLine || "لا توجد مشاعر مسجلة") + "\n\n";

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
    md += tableRow(["القيمة", "نسبة الاتزان", "المشاعر السلبية", "المشاعر الإيجابية", "مثبّتة", "ملاحظات"]) + "\n";
    md += tableSep(6) + "\n";
    for (const name of MASCULINE_VALUE_NAMES_REPORT) {
      const item = masculineValuesMap.get(name);
      const balancePercentage = item?.balance_percentage || 50;
      const selectedFeelings = Array.isArray(item?.selected_feelings) ? (item.selected_feelings as string[]).join("، ") : "-";
      const positiveFeelings = Array.isArray(item?.positive_feelings) ? (item.positive_feelings as string[]).join("، ") : "-";
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
