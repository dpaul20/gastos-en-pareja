"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LoginButton() {
  const { data: session } = useSession();

  if (session?.user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {session.user.name}
        </span>
        <Button onClick={() => signOut()} variant="outline">
          Cerrar sesión
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn("google")} variant="outline">
      Iniciar sesión con Google
    </Button>
  );
}
