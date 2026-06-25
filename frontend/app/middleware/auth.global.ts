export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ['/login', '/register', '/forced-setup'];
  const { isLoggedIn, fetchMe, token } = useAuth();

  if (publicPaths.includes(to.path)) {
    if (isLoggedIn.value) return navigateTo('/');
    return;
  }

  if (!token.value) return navigateTo('/login');

  if (!useState('admin_user').value) {
    await fetchMe();
  }
});
