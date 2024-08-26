"use client";
import {
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
} from "@nextui-org/react";
import { useToast } from "./ToastContext";
import { ThemeSwitcher } from "@/components/theme-switch";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { app, db } from "@/config";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { UserCircle2Icon } from "lucide-react";

export const Navbar = ({ theme }: { theme: string }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Track loading state
  const router = useRouter();
  const pathname = usePathname(); // Get the current route
  const auth = getAuth(app);
  const [userData, setUserData] = useState<any | null>(null);
  const [imageError, setImageError] = useState(false);
  const { showToast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setUser(user); // Set the user state if a user is logged in
          const querySnapshot = await getDocs(collection(db, "users"));
          let data: any = null;
          querySnapshot.forEach((doc) => {
            if (doc.id === user.uid) data = doc.data();
          });
          setUserData(data);
          setLoading(false); // Set loading to false after checking user state
        } else {
          setUser(null); // Clear the user state if no user is logged in
          setLoading(false); // Also set loading to false if no user is found
        }
      });

      // Cleanup the subscription when the component unmounts
      return () => unsubscribe();
    };

    // Call the async function inside the useEffect
    fetchUser();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const querySnapshot = await getDocs(collection(db, "users"));
    const data: any[] = [];
    querySnapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));

    let toastId: string | number | undefined;

    try {
      toastId = showToast("Signing in / Registering user ...", {
        autoClose: false,
        position: "bottom-right",
        theme: theme,
      });

      const result = await signInWithPopup(auth, provider);
      const signedInUser = result.user;

      if (signedInUser.email === "logan842008@gmail.com") {
        setIsAdmin(true);
      }

      // Define a list of random gradients
      const gradients = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
        "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
        "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
        "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
        "linear-gradient(135deg, #fbc2eb 0%, #a18cd1 100%)",
        "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
        "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
        "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
      ];

      // Select a random gradient
      const randomGradient =
        gradients[Math.floor(Math.random() * gradients.length)];

      if (data.find((doc) => doc.id === signedInUser.uid)) {
        toast.dismiss(toastId);
        showToast("Successfully signed in!", {
          type: "success",
          autoClose: 2000,
          closeOnClick: true,
          position: "bottom-right",
          theme: theme,
        });
      } else {
        await setDoc(doc(db, "users", signedInUser.uid), {
          isAdmin: isAdmin,
          name: signedInUser.displayName,
          email: signedInUser.email,
          createdTime: signedInUser.metadata.creationTime,
          profilePicGradient: randomGradient, // Add the gradient to the user document
        });
        toast.dismiss(toastId);
        showToast("Successfully registered!", {
          type: "success",
          autoClose: 2000,
          closeOnClick: true,
          position: "bottom-right",
          theme: theme,
        });
      }

      router.push("/");
    } catch (error) {
      toast.dismiss(toastId);
      showToast("Error occurred during sign-in!", {
        type: "error",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme: theme,
      });
    }
  };

  const handleLogout = async () => {
    let toastId: string | number | undefined;
    try {
      toastId = showToast("Logging out...", {
        autoClose: false,
        position: "bottom-right",
        theme: theme,
      });
      await signOut(auth);
      toast.dismiss(toastId);
      showToast("Successfully logged out!", {
        type: "success",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme: theme,
      });
      router.push("/");
    } catch (error) {
      toast.dismiss(toastId);
      showToast("Error occurred during logout!", {
        type: "error",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme: theme,
      });
    }
  };

  const menuItems = [
    { label: "Buy", route: "/buy" },
    { label: "Rent", route: "/rent" },
  ];

  // Don't show anything until we know whether the user is logged in or not
  if (loading) {
    return null;
  }

  console.log(isAdmin);

  return (
    <NextUINavbar
      maxWidth="xl"
      position="sticky"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <p className="font-bold text-inherit">LOGAN EXPRESS</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {menuItems.map((item) => (
          <NavbarItem key={item.route} isActive={pathname === item.route}>
            <Link
              color={pathname === item.route ? "primary" : "foreground"}
              href={item.route}
            >
              {item.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      {!user ? (
        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              as={Link}
              color="primary"
              onClick={signInWithGoogle}
              variant="flat"
            >
              Sign In / Register
            </Button>
          </NavbarItem>
        </NavbarContent>
      ) : (
        <NavbarContent as="div" justify="end">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <div
                style={{
                  background: imageError
                    ? userData?.profilePicGradient ||
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "transparent",
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2px", // For bordered effect
                  width: "40px", // Adjust size as needed
                  height: "40px", // Adjust size as needed
                  cursor: "pointer", // Make the cursor a pointer when hovered
                }}
              >
                {imageError ? (
                  // Display a user icon in the center if the image fails to load
                  <UserCircle2Icon />
                ) : (
                  <Avatar
                    as="button"
                    className="transition-transform hover:cursor-pointer"
                    color="primary"
                    name="User Avatar"
                    size="sm"
                    src={`${user?.photoURL}`}
                    onError={() => setImageError(true)} // Set the error state when the image fails to load
                    style={{
                      visibility: imageError ? "hidden" : "visible", // Hide the image if it has failed to load
                    }}
                  />
                )}
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold">{user.email}</p>
              </DropdownItem>
              <DropdownItem key="settings" href="/settings">
                Settings
              </DropdownItem>
              <DropdownItem key="history" href="/settings">
                History
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onClick={handleLogout}>
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      )}

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.label}-${index}`}>
            <Link
              color={pathname === item.route ? "primary" : "foreground"}
              className="w-full"
              href={item.route}
              size="lg"
            >
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
      <ThemeSwitcher />
    </NextUINavbar>
  );
};
