CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_phone TEXT;
  v_invited_by UUID;
  v_invite_code_in TEXT;
BEGIN
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_invite_code_in := NULLIF(NEW.raw_user_meta_data->>'invite_code', '');

  IF v_invite_code_in IS NOT NULL THEN
    SELECT id INTO v_invited_by FROM public.profiles WHERE invite_code = v_invite_code_in LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, phone, email, invite_code, invited_by, spin_chances)
  VALUES (NEW.id, v_phone, NEW.email, public.gen_invite_code(), v_invited_by, 1);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_plain;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;