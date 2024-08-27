"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@nextui-org/react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/config";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setLoading(false); // Stop loading once the user state is determined
    });
    return () => unsubscribe();
  }, [auth]);

  return loading ? (
    <div className="flex justify-center items-center h-screen">
      <Spinner label="Loading..." color="primary" labelColor="primary" />
    </div>
  ) : (
    <>{children}</>
  );
}
