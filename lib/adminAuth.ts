/** Basic Auth check against ADMIN_PASSWORD, in constant time. No password configured means nobody gets in. */
export function basicOk(header: string | null, pass: string | undefined) {
  if (!pass || !header?.startsWith("Basic ")) return false;
  let given = "";
  try { given = atob(header.slice(6)).split(":").slice(1).join(":"); } catch { return false; }
  let diff = given.length ^ pass.length;
  for (let i = 0; i < Math.max(given.length, pass.length); i++) diff |= (given.charCodeAt(i) || 0) ^ (pass.charCodeAt(i) || 0);
  return diff === 0;
}
