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
  sort_order: number;
  avatar_url: string | null;
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
  const [manualOrder, setManualOrder] = useState<boolean>(false);

  const sortCards = (list: RelationshipCard[]) =>
    [...list].sort((a, b) => {
      const levelDiff = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
      if (levelDiff !== 0) return levelDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const sortByManual = (list: RelationshipCard[]) =>
    [...list].sort((a, b) => {
      const levelDiff = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
      if (levelDiff !== 0) return levelDiff;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
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

      const mapped: RelationshipCard[] = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        contact_phone: row.contact_phone,
        contact_messenger: row.contact_messenger,
        level: row.level as RelationshipLevel,
        tasks: Array.isArray(row.tasks) ? (row.tasks as IhsanTask[]) : [],
        sort_order: row.sort_order ?? 0,
        avatar_url: row.avatar_url ?? null,
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
      // Compute next sort_order: max in the same level + 10
      const sameLevel = cards.filter((c) => c.level === data.level);
      const maxOrder = sameLevel.reduce(
        (max, c) => Math.max(max, c.sort_order ?? 0),
        0
      );
      const nextOrder = maxOrder + 10;

      const { data: inserted, error } = await supabase
        .from("relationship_cards")
        .insert({
          user_id: user.id,
          name: data.name,
          contact_phone: data.contact_phone || null,
          contact_messenger: data.contact_messenger || null,
          level: data.level,
          tasks: [],
          sort_order: nextOrder,
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
        sort_order: (inserted as any).sort_order ?? nextOrder,
        avatar_url: (inserted as any).avatar_url ?? null,
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

  // Upload avatar image to Supabase Storage and persist URL on the card
  const uploadAvatar = async (cardId: string, file: File): Promise<string | null> => {
    if (!user) return null;
    // Validate file type and size (max 2MB)
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار ملف صورة");
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يتجاوز 2MB");
      return null;
    }

    const card = cards.find((c) => c.id === cardId);
    if (!card) return null;

    // Path: {user_id}/{card_id}.{ext}
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${cardId}.${ext}`;

    try {
      // Remove old avatar if any (best-effort)
      if (card.avatar_url) {
        try {
          const oldPath = card.avatar_url.split("/relationship-avatars/")[1];
          if (oldPath) {
            await supabase.storage.from("relationship-avatars").remove([oldPath]);
          }
        } catch {
          /* ignore */
        }
      }

      const { error: uploadErr } = await supabase.storage
        .from("relationship-avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) throw uploadErr;

      // Persist a signed URL (bucket is private) valid for 1 year
      const { data: signedData, error: signedErr } = await supabase.storage
        .from("relationship-avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      if (signedErr) throw signedErr;

      const publicUrl = signedData.signedUrl;

      const { error: dbErr } = await supabase
        .from("relationship_cards")
        .update({ avatar_url: publicUrl })
        .eq("id", cardId)
        .eq("user_id", user.id);

      if (dbErr) throw dbErr;

      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, avatar_url: publicUrl } : c))
      );
      toast.success("تم تحديث الصورة");
      return publicUrl;
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error("خطأ في رفع الصورة");
      return null;
    }
  };

  // Remove avatar from storage and clear the URL on the card
  const removeAvatar = async (cardId: string) => {
    if (!user) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card?.avatar_url) return;

    try {
      const oldPath = card.avatar_url.split("/relationship-avatars/")[1];
      if (oldPath) {
        await supabase.storage.from("relationship-avatars").remove([oldPath]);
      }

      const { error: dbErr } = await supabase
        .from("relationship_cards")
        .update({ avatar_url: null })
        .eq("id", cardId)
        .eq("user_id", user.id);

      if (dbErr) throw dbErr;

      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, avatar_url: null } : c))
      );
      toast.success("تم حذف الصورة");
    } catch (err) {
      console.error("Error removing avatar:", err);
      toast.error("خطأ في حذف الصورة");
    }
  };

  // Move a card up or down within its level group, using sort_order swap
  const moveCard = async (cardId: string, direction: "up" | "down") => {
    if (!user) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    // Build the manual-ordered list grouped by level
    const ordered = sortByManual(cards);
    const sameLevel = ordered.filter((c) => c.level === card.level);
    const idx = sameLevel.findIndex((c) => c.id === cardId);
    if (idx === -1) return;
    const swapWith =
      direction === "up" ? sameLevel[idx - 1] : sameLevel[idx + 1];
    if (!swapWith) return; // already at boundary

    const a = card.sort_order ?? 0;
    const b = swapWith.sort_order ?? 0;

    // Swap their sort_order values (so no need to renumber the whole list)
    try {
      const updates = [
        supabase
          .from("relationship_cards")
          .update({ sort_order: b })
          .eq("id", card.id)
          .eq("user_id", user.id),
        supabase
          .from("relationship_cards")
          .update({ sort_order: a })
          .eq("id", swapWith.id)
          .eq("user_id", user.id),
      ];
      const results = await Promise.all(updates);
      const firstErr = results.find((r) => r.error);
      if (firstErr?.error) throw firstErr.error;

      setCards((prev) =>
        prev.map((c) => {
          if (c.id === card.id) return { ...c, sort_order: b };
          if (c.id === swapWith.id) return { ...c, sort_order: a };
          return c;
        })
      );
    } catch (err) {
      console.error("Error reordering card:", err);
      toast.error("خطأ في إعادة الترتيب");
    }
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
    moveCard,
    uploadAvatar,
    removeAvatar,
    refetch: loadCards,
  };
};
