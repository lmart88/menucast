import { Suspense } from "react";
import { AuthShell } from "../components/auth-shell";
import { RegisterForm } from "./register-form";
import { RegistrationClosedCard } from "./registration-closed-card";

interface RegisterPageProps {
  searchParams: Promise<{ key?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = await searchParams;
  const keyParam = resolvedSearchParams?.key;

  const registrationEnabled =
    process.env.REGISTRATION_ENABLED !== "false" &&
    process.env.REGISTRATION_ENABLED !== "0";

  const configuredBypassKey = process.env.REGISTRATION_BYPASS_KEY?.trim();
  const hasValidBypassKey = Boolean(
    configuredBypassKey && keyParam && configuredBypassKey === keyParam.trim()
  );

  const isRegistrationAllowed = registrationEnabled || hasValidBypassKey;

  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="w-full max-w-[380px] bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl p-8 shadow-sm flex items-center justify-center min-h-[380px]">
            <div className="w-8 h-8 border-2 border-[var(--accent-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        }
      >
        {isRegistrationAllowed ? (
          <RegisterForm bypassKey={hasValidBypassKey ? keyParam : undefined} />
        ) : (
          <RegistrationClosedCard />
        )}
      </Suspense>
    </AuthShell>
  );
}
