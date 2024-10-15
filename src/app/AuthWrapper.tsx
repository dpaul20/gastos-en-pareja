"use client";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

function AuthWrapper({ children }: Readonly<Props>) {
  return <SessionProvider>{children}</SessionProvider>;
}

export default AuthWrapper;
