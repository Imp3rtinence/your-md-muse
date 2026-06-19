
REVOKE EXECUTE ON FUNCTION public.list_dm_threads() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_dm_thread_read(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_users(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_friend_request(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.respond_friend_request(uuid, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.list_dm_threads() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_dm_thread_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_friend_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_friend_request(uuid, boolean) TO authenticated;
