-- Add sort_order column to relationship_cards for manual reordering
ALTER TABLE public.relationship_cards
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize existing rows with an order based on level and created_at
WITH ordered AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        CASE level
          WHEN 'A+' THEN 0
          WHEN 'A' THEN 1
          WHEN 'B' THEN 2
          WHEN 'C' THEN 3
        END,
        created_at DESC
    ) * 10 AS new_order
  FROM public.relationship_cards
)
UPDATE public.relationship_cards rc
SET sort_order = ordered.new_order
FROM ordered
WHERE rc.id = ordered.id;
