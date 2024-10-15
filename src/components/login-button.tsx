"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function LoginButton() {
  const { data: session } = useSession();

  if (session?.user) {
    return (
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src={session.user.image} alt={session.user.name} />
          <AvatarFallback>{session.user.name[0]}</AvatarFallback>
        </Avatar>
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
