import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type RelationshipLevel = "A+" | "A" | "B" | "C";

export interface IhsanTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RelationshipCard {
  id: string;
  user_id: string;
  name: string;
  contact_phone: string | null;
  contact_messenger: string | null;
  level: RelationshipLevel;
  tasks: IhsanTask[];
  created_at: string;
  updated_at: string;
}

const LEVEL_ORDER: Record<RelationshipLevel, number> = {
  "A+": 0,
  "A": 1,
  "B": 2,
  "C": 3,
};

export const useRelationshipCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<RelationshipCard[]>([]);
  const [loading, setLoading] = useState(true);

  const sortCards = (list: RelationshipCard[]) =>
    [...list].sort((a, b) => {
      const levelDiff = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
      if (levelDiff !== 0) return levelDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const loadCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("relationship_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: RelationshipCard[] = (data || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        contact_phone: row.contact_phone,
        contact_messenger: row.contact_messenger,
        level: row.level as RelationshipLevel,
        tasks: Array.isArray(row.tasks) ? (row.tasks as IhsanTask[]) : [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      setCards(sortCards(mapped));
    } catch (err) {
      console.error("Error loading relationship cards:", err);
      toast.error("خطأ في تحميل بطاقات العلاقات");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const addCard = async (data: {
    name: string;
    contact_phone?: string;
    contact_messenger?: string;
    level: RelationshipLevel;
  }) => {
    if (!user) return;
    try {
      const { data: inserted, error } = await supabase
        .from("relationship_cards")
        .insert({
          user_id: user.id,
          name: data.name,
          contact_phone: data.contact_phone || null,
          contact_messenger: data.contact_messenger || null,
          level: data.level,
          tasks: [],
        })
        .select()
        .single();

      if (error) throw error;

      const newCard: RelationshipCard = {
        id: inserted.id,
        user_id: inserted.user_id,
        name: inserted.name,
        contact_phone: inserted.contact_phone,
        contact_messenger: inserted.contact_messenger,
        level: inserted.level as RelationshipLevel,
        tasks: [],
        created_at: inserted.created_at,
        updated_at: inserted.updated_at,
      };

      setCards((prev) => sortCards([...prev, newCard]));
      toast.success("تمت إضافة البطاقة");
    } catch (err) {
      console.error("Error adding card:", err);
      toast.error("خطأ في إضافة البطاقة");
    }
  };

  const updateCard = async (
    id: string,
    updates: Partial<Pick<RelationshipCard, "name" | "contact_phone" | "contact_messenger" | "level">>
  ) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("relationship_cards")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setCards((prev) =>
        sortCards(prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
      );
      toast.success("تم التحديث");
    } catch (err) {
      console.error("Error updating card:", err);
      toast.error("خطأ في التحديث");
    }
  };

  const deleteCard = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("relationship_cards")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success("تم حذف البطاقة");
    } catch (err) {
      console.error("Error deleting card:", err);
      toast.error("خطأ في حذف البطاقة");
    }
  };

  const updateTasks = async (cardId: string, tasks: IhsanTask[]) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("relationship_cards")
        .update({ tasks: tasks as any })
        .eq("id", cardId)
        .eq("user_id", user.id);

      if (error) throw error;

      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, tasks } : c))
      );
    } catch (err) {
      console.error("Error updating tasks:", err);
      toast.error("خطأ في تحديث المهام");
    }
  };

  const addTask = async (cardId: string, title: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const newTask: IhsanTask = {
      id: Date.now().toString(),
      title,
      completed: false,
    };
    await updateTasks(cardId, [...card.tasks, newTask]);
  };

  const toggleTask = async (cardId: string, taskId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const updated = card.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    await updateTasks(cardId, updated);
  };

  const deleteTask = async (cardId: string, taskId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    await updateTasks(cardId, card.tasks.filter((t) => t.id !== taskId));
  };

  return {
    cards,
    loading,
    addCard,
    updateCard,
    deleteCard,
    addTask,
    toggleTask,
    deleteTask,
    refetch: loadCards,
  };
};
