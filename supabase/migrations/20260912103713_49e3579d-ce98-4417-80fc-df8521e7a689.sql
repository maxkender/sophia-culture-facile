CREATE TYPE public.author_legal_status AS ENUM ('droits_auteur','independant');
CREATE TYPE public.payment_kind AS ENUM ('acompte','solde','complement');
CREATE TYPE public.payment_state AS ENUM ('a_venir','paye');
CREATE TYPE public.assignment_state AS ENUM ('attribue','en_cours','soumis','termine','annule');
CREATE TYPE public.application_state AS ENUM ('pending','accepted','rejected');

CREATE TABLE public.author_payment_details (
  user_id uuid PRIMARY KEY,
  legal_name text NOT NULL,
  address text NOT NULL,
  legal_status public.author_legal_status NOT NULL DEFAULT 'droits_auteur',
  siret text,
  iban text NOT NULL,
  bic text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.author_payment_details TO authenticated;
GRANT ALL ON public.author_payment_details TO service_role;
ALTER TABLE public.author_payment_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_details_read ON public.author_payment_details FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.has_role('admin'::app_role));
CREATE POLICY payment_details_insert ON public.author_payment_details FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY payment_details_update ON public.author_payment_details FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER author_payment_details_updated_at BEFORE UPDATE ON public.author_payment_details FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_version text NOT NULL DEFAULT 'v1-2026',
  signed_name text NOT NULL,
  accepted boolean NOT NULL DEFAULT true,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, contract_version)
);
GRANT SELECT, INSERT ON public.contract_signatures TO authenticated;
GRANT ALL ON public.contract_signatures TO service_role;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY contract_read ON public.contract_signatures FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.has_role('admin'::app_role));
CREATE POLICY contract_sign ON public.contract_signatures FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND accepted = true);

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  brief text,
  deadline date,
  status public.assignment_state NOT NULL DEFAULT 'attribue',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topic_id, teacher_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assignments_read ON public.assignments FOR SELECT TO authenticated USING (teacher_id = auth.uid() OR private.has_role('admin'::app_role));
CREATE POLICY assignments_insert_admin ON public.assignments FOR INSERT TO authenticated WITH CHECK (private.has_role('admin'::app_role));
CREATE POLICY assignments_update ON public.assignments FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR private.has_role('admin'::app_role)) WITH CHECK (teacher_id = auth.uid() OR private.has_role('admin'::app_role));
CREATE POLICY assignments_delete_admin ON public.assignments FOR DELETE TO authenticated USING (private.has_role('admin'::app_role));
CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.topic_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  message text,
  status public.application_state NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topic_id, teacher_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_applications TO authenticated;
GRANT ALL ON public.topic_applications TO service_role;
ALTER TABLE public.topic_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY applications_read ON public.topic_applications FOR SELECT TO authenticated USING (teacher_id = auth.uid() OR private.has_role('admin'::app_role));
CREATE POLICY applications_insert_own ON public.topic_applications FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND status = 'pending'::application_state);
CREATE POLICY applications_update_admin ON public.topic_applications FOR UPDATE TO authenticated USING (private.has_role('admin'::app_role)) WITH CHECK (private.has_role('admin'::app_role));
CREATE POLICY applications_delete ON public.topic_applications FOR DELETE TO authenticated USING ((teacher_id = auth.uid() AND status = 'pending'::application_state) OR private.has_role('admin'::app_role));
CREATE TRIGGER topic_applications_updated_at BEFORE UPDATE ON public.topic_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL,
  label text NOT NULL,
  kind public.payment_kind NOT NULL DEFAULT 'acompte',
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  due_date date,
  status public.payment_state NOT NULL DEFAULT 'a_venir',
  paid_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_read ON public.payments FOR SELECT TO authenticated USING (teacher_id = auth.uid() OR private.has_role('admin'::app_role));
CREATE POLICY payments_insert_admin ON public.payments FOR INSERT TO authenticated WITH CHECK (private.has_role('admin'::app_role));
CREATE POLICY payments_update_admin ON public.payments FOR UPDATE TO authenticated USING (private.has_role('admin'::app_role)) WITH CHECK (private.has_role('admin'::app_role));
CREATE POLICY payments_delete_admin ON public.payments FOR DELETE TO authenticated USING (private.has_role('admin'::app_role));
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();