import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SelfDialogueChat } from "@/components/SelfDialogueChat";
import { ChatWidget } from "@/components/ChatWidget";
import { CalendarTaskList } from "@/components/CalendarTaskList";
import { ShadowsList } from "@/components/ShadowsList";
import { DivineCommandsTaskList } from "@/components/DivineCommandsTaskList";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadComprehensiveReport, downloadMasculineValuesReport } from "@/utils/reportGenerator";
import { useAuth } from "@/hooks/useAuth";


// 25 masculine sovereign values (sourced from spiritual_values)
// NOTE: The masculine value cards were moved to the Anima (feminine) page.
//       This list is kept & exported for reuse by other modules (e.g. Index).
export const MASCULINE_VALUE_NAMES = [
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

const Behavioral = () => {
  const [monologueOpen, setMonologueOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">جاري التحميل...</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* قائمة التذكيرية (Reminders List) */}
        <section className="mb-6" dir="rtl">
          <CalendarTaskList />
        </section>

        <ShadowsList />

        <section className="mb-6" dir="rtl">
          <DivineCommandsTaskList />
        </section>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-8">
          <Button
            onClick={async () => { if (user) await downloadComprehensiveReport(user.id, user.email || undefined); }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            تحميل التقرير الشامل
          </Button>
          <Button
            onClick={async () => { if (user) await downloadMasculineValuesReport(user.id, user.email || undefined); }}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            تحميل تقرير القيم الذكورية
          </Button>
        </div>
      </div>

      <div className="pb-32" />

      <SelfDialogueChat onLongPress={() => setMonologueOpen(true)} />
      <ChatWidget externalOpen={monologueOpen} onExternalClose={() => setMonologueOpen(false)} />
    </div>
  );
};

export default Behavioral;
