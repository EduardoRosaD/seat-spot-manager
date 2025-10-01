-- Add chair_quantity and table_quantity fields to rentals table
ALTER TABLE public.rentals 
ADD COLUMN chair_quantity INTEGER NOT NULL DEFAULT 0,
ADD COLUMN table_quantity INTEGER NOT NULL DEFAULT 0,
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;

-- Remove the old rental_date column and its index
DROP INDEX IF EXISTS idx_rentals_date;
ALTER TABLE public.rentals DROP COLUMN rental_date;

-- Remove available quantities from inventory (will be calculated dynamically)
ALTER TABLE public.inventory DROP COLUMN IF EXISTS available_chairs;
ALTER TABLE public.inventory DROP COLUMN IF EXISTS available_tables;

-- Create new indexes for the date fields
CREATE INDEX idx_rentals_start_date ON public.rentals(start_date);
CREATE INDEX idx_rentals_end_date ON public.rentals(end_date);
