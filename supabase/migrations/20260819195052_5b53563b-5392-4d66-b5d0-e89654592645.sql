CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY "users view own profile" ON public.profiles;
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY "admin insert profile" ON public.profiles;
CREATE POLICY "admin insert profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "view own roles" ON public.user_roles;
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY "admin manage roles" ON public.user_roles;
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "admin write products" ON public.products;
CREATE POLICY "admin write products" ON public.products FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "view own investments" ON public.investments;
CREATE POLICY "view own investments" ON public.investments FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY "admin manage investments" ON public.investments;
CREATE POLICY "admin manage investments" ON public.investments FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "view own tx" ON public.transactions;
CREATE POLICY "view own tx" ON public.transactions FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY "admin manage tx" ON public.transactions;
CREATE POLICY "admin manage tx" ON public.transactions FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "view own deposits" ON public.deposits;
CREATE POLICY "view own deposits" ON public.deposits FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY "admin update deposits" ON public.deposits;
CREATE POLICY "admin update deposits" ON public.deposits FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "view own withdrawals" ON public.withdrawals;
CREATE POLICY "view own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY "admin update withdrawals" ON public.withdrawals;
CREATE POLICY "admin update withdrawals" ON public.withdrawals FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "view own spins" ON public.spin_history;
CREATE POLICY "view own spins" ON public.spin_history FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));
DROP POLICY "admin write spins" ON public.spin_history;
CREATE POLICY "admin write spins" ON public.spin_history FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);