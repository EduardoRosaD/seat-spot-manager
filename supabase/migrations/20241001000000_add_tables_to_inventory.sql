-- Add tables fields to inventory table
ALTER TABLE public.inventory 
ADD COLUMN total_tables INTEGER NOT NULL DEFAULT 0,
ADD COLUMN available_tables INTEGER NOT NULL DEFAULT 0;

-- Add item_type to rentals table to distinguish between chairs and tables
ALTER TABLE public.rentals 
ADD COLUMN item_type VARCHAR(10) NOT NULL DEFAULT 'chairs';
