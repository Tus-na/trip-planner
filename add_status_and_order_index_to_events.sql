ALTER TABLE events
ADD COLUMN status TEXT DEFAULT 'Sắp tới';

ALTER TABLE events
ADD COLUMN order_index INTEGER;

-- Optionally, update existing events with an initial order_index
-- This assumes you want to order them by start_time initially
UPDATE events
SET order_index = sub.row_num
FROM (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY start_time ASC) as row_num
    FROM events
) as sub
WHERE events.id = sub.id;