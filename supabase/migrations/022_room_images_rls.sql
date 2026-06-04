-- Enable Row Level Security
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/authenticated/anonymous) to view room images
CREATE POLICY "select_room_images"
ON public.room_images
FOR SELECT
USING (true);

-- Allow staff (admin/employee) to perform all actions on room images
CREATE POLICY "manage_room_images"
ON public.room_images
FOR ALL
TO authenticated
USING (is_staff())
WITH CHECK (is_staff());
