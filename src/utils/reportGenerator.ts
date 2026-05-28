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

interface ReportData {
  userEmail: string | undefined;
  generatedAt: string;
  spiritualValues: {
    name: string;
    balancePercentage: number;
    selectedFeelings: string[];
    positiveFeelings: string[];
    notes: string;
    isPinned: boolean;
  }[];
  milestones: MilestoneRecord[];
  selfDialogue: {
    date: string;
    dateStr: string;
    timeStr: string;
    sender: string;
    message: string;
  }[];
  cleansingTasks: {
    text: string;
    intensity: number;
    tags: string[];
  }[];
  purificationTasks: {
    title: string;
    progress: number;
    tags: string[];
  }[];
}

function escapeMd(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function parseMilestone(msg: { created_at: string; message: string }): MilestoneRecord | null {
  const date = new Date(msg.created_at);
  const dateStr = date.toLocaleDateString("ar-EG");
  const timeStr = date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  if (msg.message === "__KISS__") {
    return { date: msg.created_at, dateStr, timeStr, type: "قبلة حميمية", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  }
  if (msg.message === "__TOUCH__") {
    return { date: msg.created_at, dateStr, timeStr, type: "لمس حنون", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  }
  if (msg.message === "__SHOWER__") {
    return { date: msg.created_at, dateStr, timeStr, type: "دش دافئ حميمي", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  }
  if (msg.message === "__SELFHUG__") {
    return { date: msg.created_at, dateStr, timeStr, type: "حضن ذاتي", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  }
  if (msg.message === "__REALITY__" || msg.message.startsWith("__REALITY__|")) {
    const parts = msg.message.split('|');
    const eventDate = parts.length > 2 ? parts[1] : '';
    const notes = parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : '');
    const displayNotes = eventDate && notes ? `${eventDate} - ${notes}` : (eventDate || notes || '-');
    return { date: msg.created_at, dateStr, timeStr, type: "حدث في الواقع", rating: "-", duration: "-", output: "-", notes: displayNotes, intention: "-" };
  }
  if (msg.message === "__DREAM__" || msg.message.startsWith("__DREAM__|")) {
    const parts = msg.message.split('|');
    const eventDate = parts.length > 2 ? parts[1] : '';
    const notes = parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : '');
    const displayNotes = eventDate && notes ? `${eventDate} - ${notes}` : (eventDate || notes || '-');
    return { date: msg.created_at, dateStr, timeStr, type: "حلم", rating: "-", duration: "-", output: "-", notes: displayNotes, intention: "-" };
  }
  if (msg.message.startsWith("__FALL__")) {
    const fallContent = msg.message.replace("__FALL__|", "");
    const fallParts = fallContent.split("|");
    const description = fallParts[1] || "";
    return { date: msg.created_at, dateStr, timeStr, type: "سقوط", rating: "0", duration: "-", output: "-", notes: description, intention: "-" };
  }
  if (msg.message.startsWith("__MILESTONE__")) {
    const content = msg.message.replace("__MILESTONE__", "");
    const parts = content.split("|");
    const isSacred = parts.length > 8;
    const notes = isSacred ? "" : (parts[2] || "");
    const intention = isSacred ? (parts[9] || "") : (parts[4] || "");
    const duration = !isSacred && parts[5]
      ? (parts[5] === "long" ? "طويل" : parts[5] === "medium" ? "متوسط" : "قصير")
      : "-";
    const output = !isSacred && parts[6]
      ? (parts[6] === "full" ? "كامل" : parts[6] === "simple" ? "بسيط" : "محفوظ")
      : "-";
    return {
      date: msg.created_at, dateStr, timeStr,
      type: parts[0] || "",
      rating: parts[1] || "",
      duration, output, notes, intention,
    };
  }
  return null;
}

function tableRow(cells: string[]): string {
  return "| " + cells.join(" | ") + " |";
}

function tableSep(count: number): string {
  return "|" + " --- |".repeat(count);
}

function generateReportMarkdown(data: ReportData): string {
  const feelingsTotal = FEELINGS.reduce((acc, f) => {
    const count = data.spiritualValues.filter(v => v.selectedFeelings.includes(f)).length;
    acc[f] = count;
    return acc;
  }, {} as Record<string, number>);

  const avgBalance = data.spiritualValues.length
    ? (data.spiritualValues.reduce((s, v) => s + v.balancePercentage, 0) / data.spiritualValues.length).toFixed(1)
    : "0";

  const feelingsLine = Object.entries(feelingsTotal)
    .filter(([_, count]) => count > 0)
    .map(([f, c]) => `${f}: ${c}`)
    .join(" — ");

  let md = "";

  md += "# التقرير الشامل\n\n";
  md += `مقياس الاتزان الروحي والنفسي — تم الإنشاء: ${data.generatedAt}`;
  md += "\n\n";

  md += "## القيم الروحانية\n\n";
  md += tableRow(["القيمة", "نسبة الاتزان", "المشاعر السلبية", "المشاعر الإيجابية", "ملاحظات"]) + "\n";
  md += tableSep(5) + "\n";
  for (const v of data.spiritualValues) {
    md += tableRow([
      escapeMd(v.name),
      v.balancePercentage + "%",
      v.selectedFeelings.length ? v.selectedFeelings.join("، ") : "-",
      v.positiveFeelings.length ? v.positiveFeelings.join("، ") : "-",
      v.notes ? escapeMd(v.notes) : "-",
    ]) + "\n";
  }
  md += "\n";

  md += "## تظهير القيم شعوريا\n\n";
  md += (feelingsLine || "لا توجد مشاعر مسجلة") + "\n\n";

  md += "## سجل العلاقة الحميمية (الجماعات)\n\n";
  if (data.milestones.length) {
    md += tableRow(["التاريخ", "الوقت", "النوع", "التقييم", "المدة", "القذف", "الملاحظات", "النية"]) + "\n";
    md += tableSep(8) + "\n";
    for (const m of [...data.milestones].reverse()) {
      md += tableRow([
        escapeMd(m.dateStr), escapeMd(m.timeStr), escapeMd(m.type),
        escapeMd(m.rating), escapeMd(m.duration), escapeMd(m.output),
        escapeMd(m.notes), escapeMd(m.intention),
      ]) + "\n";
    }
  } else {
    md += "لا توجد سجلات حميمية\n";
  }
  md += "\n";

  md += "## التطهير\n\n";
  if (data.cleansingTasks.length) {
    md += tableRow(["المهمة", "التقدم", "الشدة", "التاجات"]) + "\n";
    md += tableSep(4) + "\n";
    for (const t of data.cleansingTasks) {
      const bar = "█".repeat(Math.round(t.intensity)) + "░".repeat(10 - Math.round(t.intensity));
      const tagsStr = t.tags.length ? t.tags.join("، ") : "-";
      md += tableRow([escapeMd(t.text), bar, t.intensity.toFixed(1) + "/10", escapeMd(tagsStr)]) + "\n";
    }
  } else {
    md += "لا توجد مهام تطهير\n";
  }
  md += "\n";

  md += "## التذكية\n\n";
  if (data.purificationTasks.length) {
    md += tableRow(["المهمة", "التقدم", "المستوى", "التاجات"]) + "\n";
    md += tableSep(4) + "\n";
    for (const t of data.purificationTasks) {
      const bar = "█".repeat(Math.round(t.progress)) + "░".repeat(10 - Math.round(t.progress));
      const tagsStr = t.tags.length ? t.tags.join("، ") : "-";
      md += tableRow([escapeMd(t.title), bar, t.progress.toFixed(1) + "/10", escapeMd(tagsStr)]) + "\n";
    }
  } else {
    md += "لا توجد مهام تذكية\n";
  }
  md += "\n";

  md += "## المحادثة مع النفس\n\n";
  if (data.selfDialogue.length) {
    md += tableRow(["التاريخ", "الوقت", "المرسل", "الرسالة"]) + "\n";
    md += tableSep(4) + "\n";
    for (const m of data.selfDialogue) {
      md += tableRow([escapeMd(m.dateStr), escapeMd(m.timeStr), escapeMd(m.sender), escapeMd(m.message)]) + "\n";
    }
  } else {
    md += "لا توجد رسائل محادثة\n";
  }
  md += "\n";

  md += "---\n\n";
  md += "*تم إنشاء هذا التقرير تلقائياً بواسطة مقياس الاتزان الروحي والنفسي*\n";

  return md;
}

export async function downloadComprehensiveReport(userId: string, userEmail: string | undefined): Promise<void> {
  try {
    const [valuesRes, dialogueRes, calendarRes] = await Promise.all([
      supabase.from("spiritual_values").select("*").eq("user_id", userId),
      supabase.from("self_dialogue_messages").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("anima_calendar").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    ]);

    const spiritualValues: ReportData["spiritualValues"] = [];
    const valuesSeen = new Set<string>();

    if (valuesRes.data) {
      for (const item of valuesRes.data) {
        if (item.value_id === "0" || !item.value_id) continue;
        const valueIndex = parseInt(item.value_id);
        const name = !isNaN(valueIndex) && valueIndex >= 0 && valueIndex < VALUES.length
          ? VALUES[valueIndex] : item.value_name || "غير معروف";
        if (valuesSeen.has(name)) continue;
        valuesSeen.add(name);

        spiritualValues.push({
          name,
          balancePercentage: item.balance_percentage || 50,
          selectedFeelings: Array.isArray(item.selected_feelings) ? item.selected_feelings as string[] : [],
          positiveFeelings: Array.isArray(item.positive_feelings) ? item.positive_feelings as string[] : [],
          notes: item.notes || "",
          isPinned: item.is_pinned || false,
        });
      }
    }

    VALUES.forEach((name) => {
      if (!valuesSeen.has(name)) {
        spiritualValues.push({
          name,
          balancePercentage: 50,
          selectedFeelings: [],
          positiveFeelings: [],
          notes: "",
          isPinned: false,
        });
      }
    });

    const milestones: ReportData["milestones"] = [];
    const selfDialogue: ReportData["selfDialogue"] = [];

    for (const m of dialogueRes.data || []) {
      const parsed = parseMilestone(m);
      if (parsed) {
        milestones.push(parsed);
      } else if (!m.message.startsWith("__SPACER__")) {
        selfDialogue.push({
          date: m.created_at,
          dateStr: new Date(m.created_at).toLocaleDateString("ar-EG"),
          timeStr: new Date(m.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          sender: m.sender === "me" ? "أنا" : m.sender === "anima" ? "النفس" : m.sender || "غير معروف",
          message: m.message || "",
        });
      }
    }

    const cleansingTasks: ReportData["cleansingTasks"] = [];
    if (valuesRes.data) {
      const cleansingRecord = valuesRes.data.find(item => item.value_id === "0");
      if (cleansingRecord && Array.isArray(cleansingRecord.feeling_tasks)) {
        for (const task of cleansingRecord.feeling_tasks as any[]) {
          cleansingTasks.push({
            text: task.text || task.title || "",
            intensity: typeof task.intensity === "number" ? task.intensity : 0,
            tags: Array.isArray(task.tags) ? task.tags : [],
          });
        }
      }
    }

    const purificationTasks: ReportData["purificationTasks"] = (calendarRes.data || []).map(t => ({
      title: t.title || "",
      progress: typeof t.progress === "number" ? t.progress : 0,
      tags: Array.isArray((t as any).tags) ? (t as any).tags : [],
    }));

    const data: ReportData = {
      userEmail,
      generatedAt: new Date().toLocaleString("ar-EG"),
      spiritualValues,
      milestones,
      selfDialogue,
      cleansingTasks,
      purificationTasks,
    };

    const md = generateReportMarkdown(data);
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
