export default defineNuxtRouteMiddleware(() => {
  const { isSuperadmin } = useAuth();
  if (!isSuperadmin.value) {
    return navigateTo('/');
  }
});
