import { createClient } from "@supabase/supabase-js";

const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function internalEmail(loginId, domain) {
  const normalized = loginId.trim().toLowerCase();
  const normalizedDomain = domain.trim().toLowerCase();
  if (!LOGIN_ID_PATTERN.test(normalized)) throw new Error("Invalid Login ID");
  if (!normalizedDomain || normalizedDomain.includes("@")) throw new Error("Invalid login domain");
  return `${normalized}@${normalizedDomain}`;
}

const [, , loginId] = process.argv;
if (!loginId) {
  throw new Error("Usage: node scripts/admin/create-user.mjs <login_id>");
}

const password = requiredEnvironment("N3_INITIAL_PASSWORD");

const supabase = createClient(
  requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const email = internalEmail(loginId, requiredEnvironment("AUTH_LOGIN_DOMAIN"));
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) throw error;
process.stdout.write(`Created Auth user ${data.user.id} for Login ID ${loginId.trim().toLowerCase()}\n`);
