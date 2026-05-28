
-- Deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'qualification',
  expected_close_date DATE,
  assigned_to UUID,
  customer_id UUID REFERENCES public.customers(id),
  lead_id UUID REFERENCES public.leads(id),
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view deals" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update deals" ON public.deals FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can delete deals" ON public.deals FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'task',
  due_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  assigned_to UUID NOT NULL,
  related_to_type TEXT,
  related_to_id UUID,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update activities" ON public.activities FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can delete activities" ON public.activities FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helpdesk tickets
CREATE TABLE public.helpdesk_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  customer_id UUID REFERENCES public.customers(id),
  assigned_to UUID,
  resolved_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view tickets" ON public.helpdesk_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create tickets" ON public.helpdesk_tickets FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update tickets" ON public.helpdesk_tickets FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can delete tickets" ON public.helpdesk_tickets FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.helpdesk_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Attendance
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Users can mark own attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.attendance FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Holidays
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  holiday_type TEXT NOT NULL DEFAULT 'company',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view holidays" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage holidays" ON public.holidays FOR ALL USING (has_role(auth.uid(), 'admin'));

-- File uploads table
CREATE TABLE public.file_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID NOT NULL,
  related_to_type TEXT,
  related_to_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view files" ON public.file_uploads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upload files" ON public.file_uploads FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can delete own files" ON public.file_uploads FOR DELETE USING (auth.uid() = uploaded_by OR has_role(auth.uid(), 'admin'));

-- Storage bucket for CRM files
INSERT INTO storage.buckets (id, name, public) VALUES ('crm-files', 'crm-files', true);
CREATE POLICY "Authenticated can upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'crm-files');
CREATE POLICY "Anyone can view crm files" ON storage.objects FOR SELECT USING (bucket_id = 'crm-files');
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'crm-files');
