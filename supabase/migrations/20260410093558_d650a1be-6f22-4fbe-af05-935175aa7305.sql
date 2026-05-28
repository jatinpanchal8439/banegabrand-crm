
-- Create scheduled_calls table for call reminders
CREATE TABLE public.scheduled_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  phone TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scheduled calls" ON public.scheduled_calls
  FOR SELECT USING (
    auth.uid() = created_by 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Users can create scheduled calls" ON public.scheduled_calls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own scheduled calls" ON public.scheduled_calls
  FOR UPDATE USING (
    auth.uid() = created_by 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins can delete scheduled calls" ON public.scheduled_calls
  FOR DELETE USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  );

-- Update existing RLS policies to include owner role
DROP POLICY IF EXISTS "Admins can delete activities" ON public.activities;
CREATE POLICY "Admins and owners can delete activities" ON public.activities
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Users can update activities" ON public.activities;
CREATE POLICY "Users can update activities" ON public.activities
  FOR UPDATE USING (
    auth.uid() = created_by OR auth.uid() = assigned_to 
    OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
  );

DROP POLICY IF EXISTS "Admins can delete deals" ON public.deals;
CREATE POLICY "Admins and owners can delete deals" ON public.deals
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Users can update deals" ON public.deals;
CREATE POLICY "Users can update deals" ON public.deals
  FOR UPDATE USING (
    auth.uid() = created_by OR auth.uid() = assigned_to
    OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
  );

DROP POLICY IF EXISTS "Admins can delete call_logs" ON public.call_logs;
CREATE POLICY "Admins and owners can delete call_logs" ON public.call_logs
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Users can update own call_logs" ON public.call_logs;
CREATE POLICY "Users can update call_logs" ON public.call_logs
  FOR UPDATE USING (
    auth.uid() = called_by OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
  );

DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Admins and owners can delete leads" ON public.leads
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can delete expenses" ON public.expenses;
CREATE POLICY "Admins and owners can delete expenses" ON public.expenses
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can delete tickets" ON public.helpdesk_tickets;
CREATE POLICY "Admins and owners can delete tickets" ON public.helpdesk_tickets
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can delete post_sales" ON public.post_sales;
CREATE POLICY "Admins and owners can delete post_sales" ON public.post_sales
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins and owners can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can manage lead_sources_config" ON public.lead_sources_config;
CREATE POLICY "Admins and owners can manage lead_sources_config" ON public.lead_sources_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can manage lead_categories_config" ON public.lead_categories_config;
CREATE POLICY "Admins and owners can manage lead_categories_config" ON public.lead_categories_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can manage expense_heads" ON public.expense_heads;
CREATE POLICY "Admins and owners can manage expense_heads" ON public.expense_heads
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can manage custom_fields" ON public.custom_fields;
CREATE POLICY "Admins and owners can manage custom_fields" ON public.custom_fields
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can manage terms_conditions" ON public.terms_conditions;
CREATE POLICY "Admins and owners can manage terms_conditions" ON public.terms_conditions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can manage holidays" ON public.holidays;
CREATE POLICY "Admins and owners can manage holidays" ON public.holidays
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can manage templates" ON public.message_templates;
CREATE POLICY "Admins and owners can manage templates" ON public.message_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Users can delete own files" ON public.file_uploads;
CREATE POLICY "Users can delete own files" ON public.file_uploads
  FOR DELETE USING (auth.uid() = uploaded_by OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));
