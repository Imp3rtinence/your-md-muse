
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_submission_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_challenge_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.are_friends(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_friends(UUID, UUID) TO authenticated;
