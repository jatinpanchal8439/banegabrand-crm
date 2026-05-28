
-- Post Sales (AMC / Renewal / EMI tracking)
CREATE TABLE public.post_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  sale_type text NOT NULL DEFAULT 'amc',
  total_amount numeric NOT NULL DEFAULT 0,
  due_amount numeric NOT NULL DEFAULT 0,
  tenure text,
  sale_date date,
  due_date date,
  observer text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  allocated_to uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view post_sales" ON public.post_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create post_sales" ON public.post_sales FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own post_sales" ON public.post_sales FOR UPDATE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can delete post_sales" ON public.post_sales FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_post_sales_updated_at BEFORE UPDATE ON public.post_sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Call Logs
CREATE TYPE public.call_type AS ENUM ('incoming', 'outgoing', 'missed');
CREATE TABLE public.call_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  phone text,
  call_type call_type NOT NULL DEFAULT 'outgoing',
  duration_seconds integer DEFAULT 0,
  outcome text,
  notes text,
  called_by uuid NOT NULL,
  called_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view call_logs" ON public.call_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create call_logs" ON public.call_logs FOR INSERT WITH CHECK (auth.uid() = called_by);
CREATE POLICY "Users can update own call_logs" ON public.call_logs FOR UPDATE USING (auth.uid() = called_by OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can delete call_logs" ON public.call_logs FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Expenses
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  receipt_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can delete expenses" ON public.expenses FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Lead Sources Config (admin-managed)
CREATE TABLE public.lead_sources_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_sources_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view lead_sources_config" ON public.lead_sources_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage lead_sources_config" ON public.lead_sources_config FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Lead Categories Config (admin-managed)
CREATE TABLE public.lead_categories_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_categories_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view lead_categories_config" ON public.lead_categories_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage lead_categories_config" ON public.lead_categories_config FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Expense Heads Config (admin-managed)
CREATE TABLE public.expense_heads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_heads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view expense_heads" ON public.expense_heads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage expense_heads" ON public.expense_heads FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Custom Fields
CREATE TABLE public.custom_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  options jsonb,
  applies_to text NOT NULL DEFAULT 'leads',
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view custom_fields" ON public.custom_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage custom_fields" ON public.custom_fields FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Terms & Conditions templates
CREATE TABLE public.terms_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  content text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.terms_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view terms_conditions" ON public.terms_conditions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage terms_conditions" ON public.terms_conditions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_terms_conditions_updated_at BEFORE UPDATE ON public.terms_conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add birthday field to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birthday date;

-- Seed default lead sources
INSERT INTO public.lead_sources_config (name) VALUES ('Website'), ('Facebook'), ('Google'), ('Referral'), ('Walk-in'), ('Phone'), ('WhatsApp'), ('Other');

-- Seed default expense heads
INSERT INTO public.expense_heads (name) VALUES ('Travel'), ('Office Supplies'), ('Marketing'), ('Software'), ('Miscellaneous');
