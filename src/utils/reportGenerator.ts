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
  }[];
  purificationTasks: {
    title: string;
    progress: number;
  }[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function generateReportHtml(data: ReportData): string {
  const feelingsTotal = FEELINGS.reduce((acc, f) => {
    const count = data.spiritualValues.filter(v => v.selectedFeelings.includes(f)).length;
    acc[f] = count;
    return acc;
  }, {} as Record<string, number>);

  const avgBalance = data.spiritualValues.length
    ? (data.spiritualValues.reduce((s, v) => s + v.balancePercentage, 0) / data.spiritualValues.length).toFixed(1)
    : "0";

  const valuesRows = data.spiritualValues.map(v => `
    <tr>
      <td>${escapeHtml(v.name)}</td>
      <td>${v.balancePercentage}%</td>
      <td>${v.selectedFeelings.length ? v.selectedFeelings.map(escapeHtml).join("، ") : "-"}</td>
      <td>${v.positiveFeelings.length ? v.positiveFeelings.map(escapeHtml).join("، ") : "-"}</td>
      <td>${v.notes ? escapeHtml(v.notes) : "-"}</td>
    </tr>
  `).join("");

  const feelingsSummary = Object.entries(feelingsTotal)
    .filter(([_, count]) => count > 0)
    .map(([feeling, count]) => `<span class="feeling-badge">${escapeHtml(feeling)}: ${count}</span>`)
    .join(" ");

  const cleansingTasksRows = data.cleansingTasks.length
    ? data.cleansingTasks.map(t => `
      <tr>
        <td>${escapeHtml(t.text)}</td>
        <td><div class="progress-bar"><div class="progress-fill" style="width:${t.intensity * 10}%"></div></div></td>
        <td>${t.intensity.toFixed(1)}/10</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3" class="empty-cell">لا توجد مهام تطهير</td></tr>`;

  const purificationTasksRows = data.purificationTasks.length
    ? data.purificationTasks.map(t => `
      <tr>
        <td>${escapeHtml(t.title)}</td>
        <td><div class="progress-bar"><div class="progress-fill" style="width:${t.progress * 10}%"></div></div></td>
        <td>${t.progress.toFixed(1)}/10</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3" class="empty-cell">لا توجد مهام تذكية</td></tr>`;

  const milestonesRows = data.milestones.length
    ? [...data.milestones].reverse().map(m => `
      <tr>
        <td>${escapeHtml(m.dateStr)}</td>
        <td>${escapeHtml(m.timeStr)}</td>
        <td>${escapeHtml(m.type)}</td>
        <td>${escapeHtml(m.rating)}</td>
        <td>${escapeHtml(m.duration)}</td>
        <td>${escapeHtml(m.output)}</td>
        <td>${escapeHtml(m.notes)}</td>
        <td>${escapeHtml(m.intention)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="8" class="empty-cell">لا توجد سجلات حميمية</td></tr>`;

  const selfDialogueRows = data.selfDialogue.length
    ? data.selfDialogue.map(m => `
      <tr>
        <td>${escapeHtml(m.dateStr)}</td>
        <td>${escapeHtml(m.timeStr)}</td>
        <td>${escapeHtml(m.sender)}</td>
        <td>${escapeHtml(m.message)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" class="empty-cell">لا توجد رسائل محادثة</td></tr>`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>التقرير الشامل - مقياس الاتزان الروحي والنفسي</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
    .container { max-width: 1100px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 40px; }
    h1 { font-size: 24px; color: #0f172a; margin-bottom: 8px; text-align: center; }
    .subtitle { text-align: center; color: #64748b; font-size: 14px; margin-bottom: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
    h2 { font-size: 18px; color: #1e293b; margin: 28px 0 12px; padding-right: 8px; border-right: 4px solid #8b5cf6; }
    h2.milestone-header { border-right-color: #ec4899; }
    h2.dialogue-header { border-right-color: #3b82f6; }
    .summary-card { background: #f1f5f9; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 16px; }
    .summary-card p { font-size: 14px; color: #475569; margin: 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th, td { padding: 8px 10px; text-align: center; border-bottom: 1px solid #e2e8f0; word-break: break-word; }
    th { background: #f1f5f9; color: #475569; font-weight: 600; white-space: nowrap; }
    td { color: #334155; }
    tr:hover td { background: #f8fafc; }
    .feeling-badge { display: inline-block; background: #ede9fe; color: #6d28d9; padding: 4px 10px; border-radius: 20px; font-size: 13px; margin: 2px; }
    .progress-bar { width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; display: inline-block; vertical-align: middle; }
    .progress-fill { height: 100%; background: linear-gradient(to right, #22c55e, #eab308, #ef4444); border-radius: 4px; }
    .empty-cell { color: #94a3b8; font-style: italic; }
    .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    @media print { body { padding: 0; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 التقرير الشامل</h1>
    <p class="subtitle">مقياس الاتزان الروحي والنفسي — تم الإنشاء: ${escapeHtml(data.generatedAt)}${data.userEmail ? ` — المستخدم: ${escapeHtml(data.userEmail)}` : ""}</p>

    <div class="summary-card">
      <p><strong>القيم الروحانية:</strong> ${data.spiritualValues.length}</p>
      <p><strong>متوسط الاتزان:</strong> ${avgBalance}%</p>
      <p><strong>سجلات حميمية:</strong> ${data.milestones.length}</p>
      <p><strong>مهام التطهير:</strong> ${data.cleansingTasks.length}</p>
      <p><strong>مهام التذكية:</strong> ${data.purificationTasks.length}</p>
      <p><strong>رسائل المحادثة:</strong> ${data.selfDialogue.length}</p>
    </div>

    <h2>القيم الروحانية</h2>
    <table>
      <thead>
        <tr>
          <th>القيمة</th>
          <th>نسبة الاتزان</th>
          <th>المشاعر السلبية</th>
          <th>المشاعر الإيجابية</th>
          <th>ملاحظات</th>
        </tr>
      </thead>
      <tbody>${valuesRows}</tbody>
    </table>

    <h2>المشاعر</h2>
    <div class="summary-card">
      ${feelingsSummary || "<span style='color:#94a3b8'>لا توجد مشاعر مسجلة</span>"}
    </div>

    <h2 class="milestone-header">سجل العلاقة الحميمية (الجماعات)</h2>
    <table>
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>الوقت</th>
          <th>النوع</th>
          <th>التقييم</th>
          <th>المدة</th>
          <th>القذف</th>
          <th>الملاحظات</th>
          <th>النية</th>
        </tr>
      </thead>
      <tbody>${milestonesRows}</tbody>
    </table>

    <h2>التطهير</h2>
    <table>
      <thead>
        <tr>
          <th>المهمة</th>
          <th>التقدم</th>
          <th>الشدة</th>
        </tr>
      </thead>
      <tbody>${cleansingTasksRows}</tbody>
    </table>

    <h2>التذكية</h2>
    <table>
      <thead>
        <tr>
          <th>المهمة</th>
          <th>التقدم</th>
          <th>المستوى</th>
        </tr>
      </thead>
      <tbody>${purificationTasksRows}</tbody>
    </table>

    <h2 class="dialogue-header">المحادثة مع النفس</h2>
    <table>
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>الوقت</th>
          <th>المرسل</th>
          <th>الرسالة</th>
        </tr>
      </thead>
      <tbody>${selfDialogueRows}</tbody>
    </table>

    <div class="footer">
      تم إنشاء هذا التقرير تلقائياً بواسطة مقياس الاتزان الروحي والنفسي
    </div>
  </div>
</body>
</html>`;
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
          });
        }
      }
    }

    const purificationTasks: ReportData["purificationTasks"] = (calendarRes.data || []).map(t => ({
      title: t.title || "",
      progress: typeof t.progress === "number" ? t.progress : 0,
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

    const html = generateReportHtml(data);
    const blob = new Blob(["\ufeff" + html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    a.download = `تقرير-شامل-${dateStr}.html`;
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
