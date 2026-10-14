WITH duplicates AS (
  SELECT id, name, sort_order,
    row_number() OVER (PARTITION BY sort_order ORDER BY name, id) AS occurrence
  FROM materials
), renumbered AS (
  SELECT id,
    (SELECT COALESCE(MAX(sort_order), -1) FROM materials)
      + row_number() OVER (ORDER BY sort_order, name, id) AS new_order
  FROM duplicates
  WHERE occurrence > 1
)
UPDATE materials AS material
SET sort_order = renumbered.new_order
FROM renumbered
WHERE material.id = renumbered.id;
--> statement-breakpoint
CREATE UNIQUE INDEX "materials_sort_order_unique" ON "materials" USING btree ("sort_order");
