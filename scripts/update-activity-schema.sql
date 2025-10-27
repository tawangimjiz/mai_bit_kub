-- เพิ่ม max_cost และ min_cost columns
ALTER TABLE activity 
ADD COLUMN max_cost FLOAT NOT NULL DEFAULT 0 AFTER cost,
ADD COLUMN min_cost FLOAT NOT NULL DEFAULT 0 AFTER max_cost;

-- Copy ค่าจาก cost ไปยัง max_cost และ min_cost
UPDATE activity 
SET max_cost = cost * 1.5, 
    min_cost = cost;

-- ลบ cost column
ALTER TABLE activity DROP COLUMN cost;
