"use client";
import { useToast } from "@/components/ToastContext";
import { app, db, storage } from "@/config";
import {
  Accordion,
  AccordionItem,
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
  Badge,
  Button,
  Divider,
  Image,
  SelectSection,
  Snippet,
  Spinner,
} from "@nextui-org/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  Select,
  SelectItem,
  Input,
} from "@nextui-org/react";
import {
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTheme } from "next-themes";
import Swal from "sweetalert2";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Drawer,
} from "@/components/ui/drawer";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

function getBrandNameByKey(brands: any[], key: string) {
  for (const category of brands) {
    for (const brand of category.brands) {
      if (brand.key === key) {
        return brand.name;
      }
    }
  }
  return key;
}

function getFuelTypeNameByKey(fuelTypes: any[], key: string) {
  const fuelType = fuelTypes.find((fuel) => fuel.fuel.key === key);
  return fuelType ? fuelType.fuel.value : key;
}

function getTransmissionTypeNameByKey(transmissionTypes: any[], key: string) {
  const transmission = transmissionTypes.find(
    (transmission) => transmission.transmission.key === key
  );
  return transmission ? transmission.transmission.value : key;
}

function getBodyTypeNameByKey(bodyTypes: any[], key: string) {
  const bodyType = bodyTypes.find((body) => body.body.key === key);
  return bodyType ? bodyType.body.value : key;
}

function getLocationTypeNameByKey(locations: any[], key: string) {
  const location = locations.find((location) => location.location.key === key);
  return location ? location.location.value : key;
}

export default function Profile() {
  const { theme } = useTheme(); // Access the theme
  const { showToast } = useToast();
  const auth = getAuth(app);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const {
    isOpen: isSellingEditCarModalOpen,
    onOpen: openSellingEditCarModal,
    onOpenChange: setIsSellingEditCarModalOpen,
  } = useDisclosure(); // For edit modal
  const {
    isOpen: isSellingAddCarModalOpen,
    onOpen: openSellingAddCarModal,
    onOpenChange: setIsSellingAddCarModalOpen,
  } = useDisclosure();

  const {
    isOpen: isRentingAddCarModalOpen,
    onOpen: openRentingAddCarModal,
    onOpenChange: setIsRentingAddCarModalOpen,
  } = useDisclosure();

  const {
    isOpen: isRentingEditCarModalOpen,
    onOpen: openRentingEditCarModal,
    onOpenChange: setIsRentingEditCarModalOpen,
  } = useDisclosure(); // For edit modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // For delete modal
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cars, setCars] = useState<any[]>([]); // State to store the fetched cars
  const [rentalcars, setRentalCars] = useState<any[]>([]); // State to store the fetched cars
  const [brands, setBrands] = useState<any[]>([]);
  const [fuelTypes, setFuelTypes] = useState<any[]>([]);
  const [transmissionTypes, setTransmissionTypes] = useState<any[]>([]);
  const [bodyTypes, setBodyTypes] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [engineTypes, setEngineTypes] = useState<any[]>([]);
  const [driveTypes, setDriveTypes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [engineTechs, setEngineTechs] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [selectedCar, setSelectedCar] = useState<any | null>(null);
  const [car, setCar] = useState<any>({});
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [addedCars, setAddedCars] = useState<any[]>([]);
  const [addedRentalCars, setAddedRentalCars] = useState<any[]>([]);
  const [sellingCarToEdit, setSellingCarToEdit] = useState<any | null>(null);
  const [newSellingCar, setNewSellingCar] = useState<any | null>({});
  const [rentingCarToEdit, setRentingCarToEdit] = useState<any | null>(null);
  const [newRentingCar, setNewRentingCar] = useState<any | null>({});
  const [selectedRentingCar, setSelectedRentingCar] = useState<any | null>(
    null
  );
  const [meow, setMeow] = useState<any | null>(null);
  const [reloadData, setReloadData] = useState(false);
  const [userOrders, setUserOrders] = useState<
    {
      id: string;
      modelimg: string;
      brand: string;
      model: string;
      price: number;
      fuel: string;
      transmission: string;
      body: string;
      hp: number;
      orderDate: string;
    }[]
  >([]);
  const [userRentals, setUserRentals] = useState<
    {
      id: string;
      car: {
        brand: string;
        model: string;
        modelimg: string;
        body: string;
        location: string;
        fuel: string;
        transmission: string;
        seats: number;
        pricePerDay: number;
      };
      start: string;
      end: string;
      totalPrice: number;
      orderDate: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchUser = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setUser(user);
          const [
            carDocs,
            brandDocs,
            fuelDocs,
            transmissionDocs,
            bodyDocs,
            colorDocs,
            engineTypeDocs,
            driveTypeDocs,
            engineTechDocs,
            featureDocs,
            locations,
            rentalCars,
            meowDocs,
          ] = await Promise.all([
            getDocs(collection(db, "cars-sell")),
            getDocs(collection(db, "car-brands")),
            getDocs(collection(db, "car-fueltype")),
            getDocs(collection(db, "car-transmission")),
            getDocs(collection(db, "car-bodytype")),
            getDocs(collection(db, "car-colors")),
            getDocs(collection(db, "car-engines")),
            getDocs(collection(db, "car-drivetype")),
            getDocs(collection(db, "car-tech")),
            getDocs(collection(db, "car-features")),
            getDocs(collection(db, "car-locations")),
            getDocs(collection(db, "cars-rent")),
            getDocs(collection(db, "users")),
          ]);

          const foundDoc = meowDocs.docs.find(
            (doc) => doc.data().email == user.email
          );

          if (foundDoc) {
            setMeow({
              id: foundDoc.id,
              ...foundDoc.data(),
            });
          } else {
            console.error("User document not found!");
            setMeow(null); // Ensure meow is set to null if not found
          }

          setRentalCars(
            rentalCars.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setCars(carDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          setBrands(
            brandDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setFuelTypes(
            fuelDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setTransmissionTypes(
            transmissionDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setBodyTypes(
            bodyDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          const wah = colorDocs.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as { arrangement: number; colors: any[] }), // Type assertion for arrangement and colors properties
          }));

          // Sort the array based on the 'arrangement' property
          const sortedColors = wah.sort(
            (a, b) => a.arrangement - b.arrangement
          );

          // Set the sorted colors in the state
          setColors(sortedColors);

          setEngineTypes(
            engineTypeDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setDriveTypes(
            driveTypeDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setEngineTechs(
            engineTechDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setFeatures(
            featureDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          const querySnapshot = await getDocs(collection(db, "cars-sell"));
          let availableCars: any[] = [];

          querySnapshot.forEach((doc) => {
            availableCars.push({ id: doc.id, ...doc.data() });
          });

          setAddedCars(availableCars);
          const ordersCollectionRef = collection(db, `orders/${user.uid}/cars`);
          const orderSnapshot = await getDocs(ordersCollectionRef);

          const userOrders = orderSnapshot.docs.map((doc) => ({
            id: doc.id,
            modelimg: doc.data().modelimg || "",
            brand: doc.data().brand || "",
            model: doc.data().model || "",
            price: doc.data().price || 0,
            fuel: doc.data().fuel || "",
            transmission: doc.data().transmission || "",
            body: doc.data().body || "",
            hp: doc.data().hp,
            orderDate: doc.data().orderDate || "",
          }));

          const rentalsQuery = query(
            collection(db, "car-rental-periods"),
            where("userId", "==", user.uid)
          );

          const rentalsSnapshot = await getDocs(rentalsQuery);

          const userRentalsData = rentalsSnapshot.docs.map((doc) => {
            const data = doc.data();

            return {
              id: doc.id,
              car: {
                brand: data.car.brand,
                model: data.car.model,
                modelimg: data.car.modelImg,
                body: data.car.body,
                location: data.car.location,
                fuel: data.car.fuel,
                transmission: data.car.transmission,
                seats: data.car.seats,
                pricePerDay: data.car.pricePerDay,
              },
              start: data.start,
              end: data.end,
              totalPrice: data.totalPrice,
              orderDate: data.orderDate,
            };
          });

          setUserRentals(userRentalsData);

          setUserOrders(userOrders);
          const querySnapshot2 = await getDocs(collection(db, "cars-rent"));
          let availableCars2: any[] = [];
          querySnapshot2.forEach((doc) =>
            availableCars2.push({ id: doc.id, ...doc.data() })
          );
          setAddedRentalCars(availableCars2);

          setLocations(
            locations.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        } else {
          setUser(null);
        }
      });

      return () => unsubscribe();
    };

    fetchUser();
  }, [reloadData]);
  const handleEditCar = (car: any) => {
    setSelectedCar(car); // Set the selected car to be edited
    setSellingCarToEdit({ ...car }); // Initialize the edited car state with the selected car's data
    openSellingEditCarModal(); // Open the edit modal
  };

  const handleInputChange = (e: any, stateSetter: any) => {
    const { name, value } = e.target;
    stateSetter((prevState: any) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const addCar = async (onClose: () => void) => {
    // Log the form data to check what's being captured
    console.log("Car Data: ", car);
    console.log("Model File: ", modelFile);

    if (!modelFile) {
      showToast("Please provide all required files", {
        type: "error",
        autoClose: 2000,
        position: "bottom-right",
        theme,
      });
      return;
    }

    let toastId;
    try {
      toastId = showToast("Adding car...", {
        autoClose: false,
        position: "bottom-right",
        theme,
      });

      // Proceed with the file uploads and database insertion
      const modelStorageRef = ref(storage, `cars/${modelFile.name}`);
      await uploadBytes(modelStorageRef, modelFile);
      const modelUrl = await getDownloadURL(modelStorageRef);

      const carData = {
        ...car,
        modelimg: modelUrl,
      };

      // Check if all car data fields are populated
      const isFormComplete = Object.values(carData).every(
        (field) => field !== null && field !== ""
      );
      if (!isFormComplete) {
        showToast("Please fill in all required fields.", {
          type: "error",
          autoClose: 2000,
          position: "bottom-right",
          theme,
        });
        return;
      }

      // Add the car data to Firestore
      await addDoc(collection(db, "cars-sell"), carData);
      onClose();

      showToast("Successfully added car!", {
        type: "success",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme,
      });
      setReloadData((prev) => !prev);
    } catch (error) {
      showToast("Error occurred during adding!", {
        type: "error",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme,
      });
      console.error("Error adding car:", error);
    } finally {
      if (toastId) {
        toast.dismiss(toastId);
      }
    }
  };

  const handleDeleteCar = async (carId: string, carType: "sell" | "rent") => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be reverted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        popup:
          theme === "dark"
            ? "bg-black rounded-xl text-white"
            : "bg-white rounded-xl text-black", // Apply your theme's class
        title: "swal-title",
        confirmButton: "swal-confirm",
        cancelButton: "swal-cancel",
      },
    });

    if (result.isConfirmed) {
      let toastId;
      try {
        toastId = showToast("Deleting car...", {
          autoClose: false,
          position: "bottom-right",
          theme,
        });

        if (carType === "sell") {
          // Delete the main car document in 'cars-sell' collection
          const carDocRef = doc(db, "cars-sell", carId);
          await deleteDoc(carDocRef);

          // Delete related documents in 'car-configuration'
          const configQuery = query(
            collection(db, "car-configuration"),
            where("carId", "==", carId)
          );
          const configSnapshot = await getDocs(configQuery);

          // Delete each document found in 'car-configuration'
          configSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });
        } else if (carType === "rent") {
          // Delete the main car document in 'cars-rent' collection
          const carDocRef = doc(db, "cars-rent", carId);
          await deleteDoc(carDocRef);

          // Delete related documents in 'car-rental-period'
          const rentalPeriodQuery = query(
            collection(db, "car-rental-period"),
            where("carId", "==", carId)
          );
          const rentalPeriodSnapshot = await getDocs(rentalPeriodQuery);

          // Delete each document found in 'car-rental-period'
          rentalPeriodSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });
        }

        showToast("Car deleted successfully!", {
          type: "success",
          autoClose: 2000,
          closeOnClick: true,
          position: "bottom-right",
          theme,
        });

        // Refresh the data after deletion
        setReloadData((prev) => !prev);
      } catch (error) {
        showToast("Failed to delete the car. Please try again.", {
          type: "error",
          autoClose: 2000,
          closeOnClick: true,
          position: "bottom-right",
          theme,
        });
        console.error("Error deleting car:", error);
      } finally {
        if (toastId) {
          toast.dismiss(toastId);
        }
      }
    }
  };

  const addRentalCar = async (onClose: () => void) => {
    const { modelimg } = newRentingCar; // Extract the file from the newRentingCar state

    if (!modelimg) {
      showToast("Please provide all required files", {
        type: "error",
        autoClose: 2000,
        position: "bottom-right",
        theme,
      });
      return;
    }

    let toastId;
    try {
      toastId = showToast("Adding car...", {
        autoClose: false,
        position: "bottom-right",
        theme,
      });

      // Proceed with the file uploads and database insertion
      const modelStorageRef = ref(storage, `cars/${modelimg.name}`);
      await uploadBytes(modelStorageRef, modelimg);
      const modelUrl = await getDownloadURL(modelStorageRef);

      const carData = {
        ...newRentingCar,
        modelimg: modelUrl, // Store the file URL in the car data
      };

      // Check if all car data fields are populated
      const isFormComplete = Object.values(carData).every(
        (field) => field !== null && field !== "" && field !== undefined
      );
      if (!isFormComplete) {
        showToast("Please fill in all required fields.", {
          type: "error",
          autoClose: 2000,
          position: "bottom-right",
          theme,
        });
        return;
      }

      // Add the car data to Firestore
      await addDoc(collection(db, "cars-rent"), carData);
      onClose();
      showToast("Successfully added car!", {
        type: "success",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme,
      });
      setReloadData((prev) => !prev);
    } catch (error) {
      showToast("Error occurred during adding!", {
        type: "error",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme,
      });
      console.error("Error adding car:", error);
    } finally {
      if (toastId) {
        toast.dismiss(toastId);
      }
    }
  };

  const handleUpdateCar = async (onClose: () => void) => {
    let toastId;
    try {
      toastId = showToast("Updating car...", {
        autoClose: false,
        position: "bottom-right",
        theme,
      });

      // If there's a model file, upload it and get the URL
      let modelUrl = sellingCarToEdit?.modelimg || ""; // Retain the existing image if no new file is provided

      if (modelFile) {
        const modelStorageRef = ref(storage, `cars/${modelFile.name}`);
        await uploadBytes(modelStorageRef, modelFile);
        modelUrl = await getDownloadURL(modelStorageRef);
      }

      const carData = {
        ...sellingCarToEdit,
        modelimg: modelUrl,
      };

      // Check if all car data fields are populated
      const isFormComplete = Object.values(carData).every(
        (field) => field !== null && field !== ""
      );
      if (!isFormComplete) {
        showToast("Please fill in all required fields.", {
          type: "error",
          autoClose: 2000,
          position: "bottom-right",
          theme,
        });
        return;
      }

      // Update the car data in Firestore using the document ID
      console.log(sellingCarToEdit);
      const carDocRef = doc(db, "cars-sell", sellingCarToEdit.id); // Ensure 'car.id' is correct
      await updateDoc(carDocRef, carData);
      onClose();

      showToast("Successfully updated car!", {
        type: "success",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme,
      });
      setReloadData((prev) => !prev);
    } catch (error) {
      showToast("Error occurred during updating!", {
        type: "error",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme,
      });
      console.error("Error updating car:", error);
    } finally {
      if (toastId !== null) {
        try {
          toast.dismiss(toastId);
        } catch (error) {
          console.error("Failed to dismiss the toast notification:", error);
        }
      }
    }
  };

  const convertToMalaysiaTime = (utcTime: string): string => {
    const date = new Date(utcTime);
    return (
      date
        .toLocaleString("en-MY", {
          timeZone: "Asia/Kuala_Lumpur",
          hour12: true,
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replace("am", "AM")
        .replace("pm", "PM") + " MYT"
    );
  };

  const handleLogout = async () => {
    let toastId;
    try {
      toastId = showToast("Logging out...", {
        autoClose: false,
        position: "bottom-right",
        theme, // Use the theme from context
      });
      await signOut(auth);
      toast.dismiss(toastId);
      showToast("Successfully logged out!", {
        type: "success",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme, // Use the theme from context
      });
      router.push("/");
    } catch (error) {
      toast.dismiss(toastId);
      showToast("Error occurred during logout!", {
        type: "error",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme, // Use the theme from context
      });
    }
  };
  const handleRentalEditCar = (car: any) => {
    setSelectedRentingCar(car);
    setNewRentingCar({ ...car });
    openRentingEditCarModal();
  };

  const handleUpdateRentalCar = async (onClose: () => void) => {
    let toastId;
    try {
      toastId = showToast("Updating Car...", {
        autoClose: false,
        position: "bottom-right",
        theme, // Use the theme from context
      });

      let modelUrl = selectedRentingCar?.modelimg || "";

      if (modelFile) {
        const modelStorageRef = ref(storage, `cars/${modelFile.name}`);
        await uploadBytes(modelStorageRef, modelFile);
        modelUrl = await getDownloadURL(modelStorageRef);
      }

      const carData = {
        ...newRentingCar,
        modelimg: modelUrl,
      };

      const isFormComplete = Object.values(carData).every(
        (field) => field !== null && field !== ""
      );

      if (!isFormComplete) {
        showToast("Please fill in all required fields.", {
          type: "error",
          autoClose: 2000,
          position: "bottom-right",
          theme,
        });
        return;
      }

      const carDocRef = doc(db, "cars-rent", selectedRentingCar.id);
      await updateDoc(carDocRef, carData);
      onClose();

      showToast("Successfully updated car!", {
        type: "success",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme,
      });
      setReloadData((prev) => !prev);
    } catch (error) {
      showToast("Error occurred during updating!", {
        type: "error",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme,
      });
    } finally {
      if (toastId !== null) {
        try {
          toast.dismiss(toastId);
        } catch (error) {
          console.error("Failed to dismiss the toast notification:", error);
        }
      }
    }
  };

  const handleDeleteAcc = async () => {
    let toastId;
    try {
      toastId = showToast("Deleting Account...", {
        autoClose: false,
        position: "bottom-right",
        theme, // Use the theme from context
      });
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await deleteDoc(userDocRef);
        await deleteUser(user);

        toast.dismiss(toastId);
        showToast("Account successfully deleted!", {
          type: "success",
          autoClose: 2000,
          closeOnClick: true,
          position: "bottom-right",
          theme, // Use the theme from context
        });
        router.push("/");
      }
    } catch (error) {
      toast.dismiss(toastId);
      showToast("Failed to delete the account. Please try again.", {
        type: "error",
        autoClose: 2000,
        closeOnClick: true,
        position: "bottom-right",
        theme, // Use the theme from context
      });
      console.error(error);
    }
  };

  const handleMultipleSelectChange = (
    name: any,
    value: any,
    stateSetter: any
  ) => {
    stateSetter((prevState: any) => ({
      ...prevState,
      [name]: Array.from(value), // Convert the selected values into an array
    }));
  };

  function getTextColor(hex: string): string {
    const color = hex.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000" : "#FFF";
  }
  console.log(engineTypes);

  const ProfileInfo = () => (
    <div className="mt-10 w-full overflow-y-hidden ">
      <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-3">
        <div className="w-full sm:w-auto mb-2 sm:mb-0">Display Name:</div>
        <Snippet
          variant="solid"
          hideSymbol
          className="w-full sm:w-auto max-w-full overflow-auto"
        >
          <h1 className="text-sm">{user?.displayName}</h1>
        </Snippet>
      </div>
      <Divider className="my-3"></Divider>
      <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-3">
        <div className="w-full sm:w-auto mb-2 sm:mb-0">Email:</div>
        <Snippet
          variant="solid"
          hideSymbol
          className="w-full sm:w-auto max-w-full overflow-auto"
        >
          {user?.email}
        </Snippet>
      </div>
      <Divider className="my-3"></Divider>
      <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-3">
        <div className="w-full sm:w-auto mb-2 sm:mb-0">Acc ID:</div>
        <Snippet
          variant="solid"
          hideSymbol
          className="w-full sm:w-auto max-w-full overflow-auto"
        >
          {user?.uid}
        </Snippet>
      </div>
      <Divider className="my-3"></Divider>
      <div className="flex flex-col sm:flex-row sm:justify-between items-center">
        <div className="w-full sm:w-auto mb-2 sm:mb-0">Created:</div>
        <Snippet
          variant="solid"
          hideCopyButton
          hideSymbol
          className="w-full sm:w-auto max-w-full overflow-auto"
        >
          {convertToMalaysiaTime(user?.metadata.creationTime || "")}
        </Snippet>
      </div>
    </div>
  );

  const handleModelInputChange = (e: any, stateSetter: any, type: any) => {
    const { value } = e.target;

    // Check if the model already exists based on the type (sell or rent)
    const modelExists =
      type === "sell"
        ? addedCars.some(
            (carItem) => carItem.model.toLowerCase() === value.toLowerCase()
          )
        : addedRentalCars.some(
            (carItem) => carItem.model.toLowerCase() === value.toLowerCase()
          );

    if (modelExists) {
      setModelError("This model already exists in the database.");
    } else {
      setModelError(null);
      stateSetter((prevState: any) => ({
        ...prevState,
        model: value,
      }));
    }
  };

  const handleFileChange = (e: any, stateSetter: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      stateSetter((prevState: any) => ({
        ...prevState,
        [e.target.name]: selectedFile, // Save the file object directly
      }));
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:p-4 rounded-3xl">
      {user && (
        <div className="w-full flex xl:flex-row flex-col justify-between h-full items-center gap-7">
          <div className="bg-neutral-200 w-full xl:w-1/3 flex h-[850px] flex-col justify-between items-center dark:bg-neutral-800 p-4 rounded-3xl">
            <h2 className="text-3xl mb-4 font-extrabold">PROFILE</h2>
            <Image
              isBlurred
              width={150}
              src={`${user?.photoURL || ""}`}
              alt="Profile Picture"
              className="rounded-full mb-4"
            />
            <h3>Last logged in:</h3>
            <span className="font-bold text-blue-700 dark:text-blue-500">
              {convertToMalaysiaTime(user.metadata.lastSignInTime || "")}
            </span>

            <div className="w-full flex flex-col gap-3 mt-5">
              {/* Profile Info and Drawer */}
              <div className="md:hidden w-full">
                {" "}
                {/* Hidden on md and up */}
                <Button
                  className="w-full"
                  variant="shadow"
                  onPress={() => setDrawerOpen(true)}
                >
                  View Account Details
                </Button>
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerContent className="p-4">
                    <DrawerHeader>
                      <DrawerTitle>Profile Information</DrawerTitle>
                      <DrawerDescription>
                        Your account details
                      </DrawerDescription>
                    </DrawerHeader>
                    <ProfileInfo />
                    <DrawerFooter>
                      <DrawerClose>
                        <Button
                          variant="bordered"
                          onPress={() => setDrawerOpen(false)}
                        >
                          Close
                        </Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
              <div className="hidden md:block w-full">
                {" "}
                {/* Visible on md and up */}
                <ProfileInfo />
              </div>
              <Button
                color="warning"
                onPress={handleLogout}
                className="w-full"
                variant="shadow"
              >
                Log Out
              </Button>
              <Button
                color="danger"
                onPress={async () => {
                  const result = await Swal.fire({
                    title: "Are you sure?",
                    text: "This action cannot be reverted!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Yes, delete it!",
                    customClass: {
                      popup:
                        theme === "dark"
                          ? "bg-black rounded-xl text-white"
                          : "bg-white rounded-xl text-black", // Apply your theme's class
                      title: "swal-title",
                      confirmButton: "swal-confirm",
                      cancelButton: "swal-cancel",
                    },
                  });

                  if (result.isConfirmed) {
                    await handleDeleteAcc();
                  }
                }}
                className="w-full"
                variant="shadow"
              >
                Delete Account
              </Button>
            </div>
          </div>
          <div
            className={
              !meow?.isAdmin
                ? "w-full xl:w-2/3 flex flex-col gap-6 bg-neutral-200 justify-between items-start dark:bg-neutral-800 p-7 rounded-3xl align-top"
                : "w-full xl:w-2/3 flex flex-col gap-6 justify-between items-start  rounded-3xl align-top overflow-y-scroll"
            }
          >
            <Tabs
              defaultValue="orders"
              className="w-full flex flex-col items-center"
            >
              {!meow?.isAdmin ? (
                <TabsList className="inline-flex bg-neutral-300 dark:bg-neutral-700 rounded-lg p-1">
                  <TabsTrigger value="orders" className="rounded-lg px-4 py-2">
                    Orders
                  </TabsTrigger>
                  <TabsTrigger value="rents" className="rounded-lg px-4 py-2">
                    Rentals
                  </TabsTrigger>
                </TabsList>
              ) : (
                <></>
              )}
              <div className="flex-grow w-full mt-2">
                {meow?.isAdmin ? (
                  <>
                    <Accordion>
                      <AccordionItem
                        title="Selling Cars"
                        className="bg-neutral-100 dark:bg-neutral-700 px-4 py-4 rounded-xl my-3 oveflow-y-scroll"
                        startContent={
                          <Button
                            color="primary"
                            onPress={openSellingAddCarModal}
                            className="w-full"
                          >
                            Add
                          </Button>
                        }
                      >
                        <div className="grid grid-cols-1 gap-4">
                          {cars.map((car) => (
                            <div
                              key={car.id}
                              className="flex flex-col lg:flex-row items-center justify-between p-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg shadow"
                            >
                              <img
                                src={car.modelimg}
                                width={300}
                                alt={`${getBrandNameByKey(brands, car.brand)} ${car.model}`}
                                className="rounded-lg object-cover h-full"
                              />
                              <div className="lg:ml-4 flex-grow">
                                <h4 className="text-lg font-bold">
                                  {getBrandNameByKey(brands, car.brand)}{" "}
                                  {car.model}
                                </h4>
                                <div className="flex flex-col">
                                  <small>
                                    Price: RM{" "}
                                    {Number(car.price).toLocaleString()}
                                  </small>
                                  <small>
                                    Fuel Type:{" "}
                                    {getFuelTypeNameByKey(fuelTypes, car.fuel)}
                                  </small>
                                  <small>
                                    Transmission:{" "}
                                    {getTransmissionTypeNameByKey(
                                      transmissionTypes,
                                      car.transmission
                                    )}
                                  </small>
                                  <small>
                                    Body Type:{" "}
                                    {getBodyTypeNameByKey(bodyTypes, car.body)}
                                  </small>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 mt-2 lg:mt-0 lg:ml-4">
                                <Button
                                  color="warning"
                                  onPress={() => handleEditCar(car)}
                                  className="w-full"
                                >
                                  Edit
                                </Button>
                                <Button
                                  color="danger"
                                  onPress={() =>
                                    handleDeleteCar(car.id, "sell")
                                  }
                                  className="w-full"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionItem>
                      <AccordionItem
                        title="Renting Cars"
                        className="bg-neutral-100 dark:bg-neutral-700 px-4 py-4 rounded-xl my-3 overflow-y-scroll"
                        startContent={
                          <Button
                            color="primary"
                            onPress={openRentingAddCarModal}
                            className="w-full"
                          >
                            Add
                          </Button>
                        }
                      >
                        <div className="grid grid-cols-1 gap-4">
                          {rentalcars.map((car) => (
                            <div
                              key={car.id}
                              className="flex flex-col lg:flex-row items-center justify-between p-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg shadow"
                            >
                              <img
                                src={car.modelimg}
                                width={300}
                                alt={`${getBrandNameByKey(brands, car.brand)} ${car.model}`}
                                className="rounded-lg object-cover h-full"
                              />
                              <div className="lg:ml-4 flex-grow">
                                <h4 className="text-lg font-bold">
                                  {getBrandNameByKey(brands, car.brand)}{" "}
                                  {car.model}
                                </h4>
                                <div className="flex flex-col">
                                  <small>
                                    Price: RM{" "}
                                    {Number(car.price).toLocaleString()}
                                  </small>
                                  <small>
                                    Fuel Type:{" "}
                                    {getFuelTypeNameByKey(fuelTypes, car.fuel)}
                                  </small>
                                  <small>
                                    Transmission:{" "}
                                    {getTransmissionTypeNameByKey(
                                      transmissionTypes,
                                      car.transmission
                                    )}
                                  </small>
                                  <small>
                                    Body Type:{" "}
                                    {getBodyTypeNameByKey(bodyTypes, car.body)}
                                  </small>
                                  <small>
                                    Location:{" "}
                                    {getLocationTypeNameByKey(
                                      locations,
                                      car.location
                                    )}
                                  </small>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 mt-2 lg:mt-0 lg:ml-4">
                                <Button
                                  color="warning"
                                  onPress={() => handleRentalEditCar(car)}
                                  className="w-full"
                                >
                                  Edit
                                </Button>
                                <Button
                                  color="danger"
                                  onPress={() =>
                                    handleDeleteCar(car.id, "rent")
                                  }
                                  className="w-full"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionItem>
                    </Accordion>
                  </>
                ) : (
                  <>
                    <TabsContent
                      className="bg-neutral-300 dark:bg-neutral-700 rounded-lg p-4 lg:h-[850px] h-full overflow-y-scroll"
                      value="orders"
                    >
                      <div className="h-full overflow-auto">
                        {userOrders.length === 0 ? (
                          <p>No purchase history found.</p>
                        ) : (
                          userOrders.map((order) => (
                            <div
                              key={order.id}
                              className="flex overflow-y-scroll flex-col my-4 lg:flex-row items-center justify-between p-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg shadow"
                            >
                              <img
                                src={order.modelimg}
                                width={200}
                                alt={`${order.brand} ${order.model}`}
                                className="rounded-lg object-cover h-full"
                              />
                              <div className="lg:ml-4 flex-grow">
                                <h4 className="text-lg font-bold">
                                  {getBrandNameByKey(brands, order.brand)}{" "}
                                  {order.model}
                                </h4>
                                <div className="flex flex-col">
                                  <small>
                                    Body Type:{" "}
                                    {getBodyTypeNameByKey(
                                      bodyTypes,
                                      order.body
                                    )}
                                  </small>
                                  <small>
                                    Fuel Type:{" "}
                                    {getFuelTypeNameByKey(
                                      fuelTypes,
                                      order.fuel
                                    )}
                                  </small>
                                  <small>
                                    Transmission:{" "}
                                    {getTransmissionTypeNameByKey(
                                      transmissionTypes,
                                      order.transmission
                                    )}
                                  </small>
                                  <small>Horsepower: {order.hp} hp</small>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <h4 className="text-lg font-bold text-orange-500">
                                  Price: RM {order.price.toLocaleString()}
                                </h4>
                                <small>Ordered Date: {order.orderDate}</small>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent
                      className="bg-neutral-300 dark:bg-neutral-700 rounded-lg p-4 h-full lg:h-[850px] overflow-y-scroll"
                      value="rents"
                    >
                      <div className="h-full overflow-auto">
                        {userRentals.length === 0 ? (
                          <p>No rental history found.</p>
                        ) : (
                          userRentals.map((rental) => (
                            <div
                              key={rental.id}
                              className="flex overflow-y-scroll flex-col my-4 lg:flex-row items-center justify-between p-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg shadow"
                            >
                              <img
                                src={rental.car.modelimg}
                                width={200}
                                alt={`${rental.car.brand} ${rental.car.model}`}
                                className="rounded-lg object-cover h-full"
                              />
                              <div className="lg:ml-4 flex-grow">
                                <h4 className="text-lg font-bold">
                                  {rental.car.brand} {rental.car.model}
                                </h4>
                                <div className="flex flex-col">
                                  <small>Location: {rental.car.location}</small>
                                  <small>Body Type: {rental.car.body}</small>
                                  <small>Fuel Type: {rental.car.fuel}</small>
                                  <small>
                                    Transmission: {rental.car.transmission}
                                  </small>
                                  <small>Seats: {rental.car.seats}</small>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <h4 className="text-lg font-bold text-orange-500">
                                  Total Price: RM{" "}
                                  {rental.totalPrice.toLocaleString()}
                                </h4>
                                <small>Start Time: {rental.start}</small>
                                <small>End Time: {rental.end}</small>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </div>

          {/* Edit Car Modal */}
          <Modal
            scrollBehavior="inside"
            size="5xl"
            isOpen={isSellingEditCarModalOpen}
            onOpenChange={setIsSellingEditCarModalOpen}
          >
            <ModalContent>
              <ModalHeader>Edit Car Details</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-5">
                  {/* Brand Selection */}
                  <Autocomplete
                    isRequired
                    label="Brand"
                    selectedKey={sellingCarToEdit?.brand}
                    name="brand"
                    onSelectionChange={(value) =>
                      setSellingCarToEdit({
                        ...sellingCarToEdit,
                        brand: value,
                      })
                    }
                    labelPlacement="outside"
                    placeholder="Choose a brand..."
                    className="w-full"
                  >
                    {brands.map((section) => (
                      <AutocompleteSection
                        key={section.id}
                        title={section.id}
                        classNames={{
                          heading:
                            "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                        }}
                      >
                        {section.brands.map((brand: any) => (
                          <AutocompleteItem key={brand.key} value={brand.key}>
                            {brand.name}
                          </AutocompleteItem>
                        ))}
                      </AutocompleteSection>
                    ))}
                  </Autocomplete>

                  {/* Model Input */}
                  <Input
                    isRequired
                    label="Model"
                    labelPlacement="outside"
                    placeholder="Enter a model name..."
                    name="model"
                    value={sellingCarToEdit?.model || ""}
                    onChange={(e) => handleInputChange(e, setSellingCarToEdit)}
                  />

                  {/* Price Input */}
                  <Input
                    isRequired
                    label="Price"
                    labelPlacement="outside"
                    placeholder="0.00"
                    name="price"
                    type="number"
                    value={sellingCarToEdit?.price || ""}
                    onChange={(e) => handleInputChange(e, setSellingCarToEdit)}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">RM</span>
                      </div>
                    }
                  />

                  <Input
                    isRequired
                    type="number"
                    name="units"
                    onChange={(e) => handleInputChange(e, setSellingCarToEdit)}
                    label="Number of Units"
                    placeholder="1"
                    value={sellingCarToEdit?.units}
                    labelPlacement="outside"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">
                          units
                        </span>
                      </div>
                    }
                  />

                  <Input
                    type="file"
                    name="modelimg"
                    label="Model Image"
                    placeholder=""
                    labelPlacement="outside"
                    onChange={(e) => handleFileChange(e, setSellingCarToEdit)}
                  />

                  {/* Fuel Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Fuel Type"
                    placeholder="Select Fuel Type"
                    selectedKey={sellingCarToEdit?.fuel}
                    onSelectionChange={(value) =>
                      setSellingCarToEdit({
                        ...sellingCarToEdit,
                        fuel: value, // Store only the key
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {fuelTypes.map((section) => (
                      <AutocompleteItem
                        key={section.fuel.key}
                        value={section.fuel.key}
                      >
                        {section.fuel.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Transmission Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Transmission Type"
                    placeholder="Select Transmission Type"
                    selectedKey={sellingCarToEdit?.transmission}
                    onSelectionChange={(value) =>
                      setSellingCarToEdit({
                        ...sellingCarToEdit,
                        transmission: value, // Store only the key
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {transmissionTypes.map((section) => (
                      <AutocompleteItem
                        key={section.transmission.key}
                        value={section.transmission.key}
                      >
                        {section.transmission.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Body Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Body Type"
                    placeholder="Select Body Type"
                    selectedKey={sellingCarToEdit?.body}
                    onSelectionChange={(value) =>
                      setSellingCarToEdit({
                        ...sellingCarToEdit,
                        body: value, // Store only the key
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {bodyTypes.map((section) => (
                      <AutocompleteItem
                        key={section.body.key}
                        value={section.body.key}
                      >
                        {section.body.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Colors Selection */}
                  <Select
                    isRequired
                    selectionMode="multiple"
                    label="Colors"
                    name="colors"
                    selectedKeys={sellingCarToEdit?.colors || []} // Set the selected keys
                    onSelectionChange={(value) =>
                      handleMultipleSelectChange(
                        "colors",
                        value,
                        setSellingCarToEdit
                      )
                    }
                    placeholder="Choose the colors..."
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {colors.map((section) => (
                      <SelectSection
                        key={section.id}
                        title={section.id}
                        classNames={{
                          heading:
                            "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                        }}
                      >
                        {section.colors.map((color: any) => (
                          <SelectItem
                            key={color.key}
                            value={color.key}
                            startContent={
                              <div
                                style={{
                                  backgroundColor: color.hex,
                                  width: "70px",
                                  height: "20px",
                                  borderRadius: "4px",
                                  marginRight: "8px",
                                  border: "1px solid rgba(0, 0, 0, 0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: getTextColor(color.hex), // Dynamically set text color based on background
                                  fontWeight: "bold",
                                  fontSize: "12px",
                                }}
                              >
                                {color.hex}
                              </div>
                            }
                          >
                            {color.name}
                          </SelectItem>
                        ))}
                      </SelectSection>
                    ))}
                  </Select>

                  {/* Engine Type Selection */}
                  <Select
                    isRequired
                    selectionMode="multiple"
                    label="Engine Type"
                    name="enginetype"
                    selectedKeys={new Set(sellingCarToEdit?.enginetype || [])} // Handles selected keys as a Set
                    onSelectionChange={(selectedKeys) =>
                      setSellingCarToEdit({
                        ...sellingCarToEdit,
                        enginetype: Array.from(selectedKeys), // Converts the Set back to an array
                      })
                    }
                    placeholder="Choose the engine..."
                    labelPlacement="outside"
                    className="w-full col-span-2 lg:col-span-1"
                  >
                    {engineTypes.map((section) => (
                      <SelectSection
                        key={section.id}
                        title={section.id} // Use the title for the section
                        classNames={{
                          heading:
                            "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                        }}
                      >
                        {section.engines.map((engine: any) => (
                          <SelectItem key={engine.key} value={engine.key}>
                            {engine.name}
                          </SelectItem>
                        ))}
                      </SelectSection>
                    ))}
                  </Select>

                  {/* Drive Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Drive Type"
                    placeholder="Choose the driving type..."
                    selectedKey={sellingCarToEdit?.driving}
                    onSelectionChange={(value) =>
                      setSellingCarToEdit({
                        ...sellingCarToEdit,
                        driving: value, // Store only the key
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {driveTypes.map((type) => (
                      <AutocompleteItem
                        key={type.drive.key}
                        value={type.drive.key}
                      >
                        {type.drive.name}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Engine Technology Selection */}
                  <Select
                    isRequired
                    selectionMode="multiple"
                    label="Engine Technology"
                    name="engineTech"
                    selectedKeys={new Set(sellingCarToEdit?.engineTech || [])}
                    onSelectionChange={(selectedKeys) =>
                      setSellingCarToEdit({
                        ...sellingCarToEdit,
                        engineTech: Array.from(selectedKeys), // Converts the Set back to an array
                      })
                    }
                    placeholder="Choose the technology..."
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {engineTechs.map((section) => (
                      <SelectItem
                        key={section.tech.key}
                        value={section.tech.key}
                      >
                        {section.tech.name}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Features Selection */}
                  <Select
                    isRequired
                    selectionMode="multiple"
                    label="Features"
                    name="features"
                    selectedKeys={new Set(sellingCarToEdit?.features || [])} // Handles selected keys as a Set
                    onSelectionChange={(selectedKeys) =>
                      setSellingCarToEdit({
                        ...sellingCarToEdit,
                        features: Array.from(selectedKeys), // Converts the Set back to an array
                      })
                    }
                    placeholder="Choose the features..."
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {features.map((section) => (
                      <SelectSection
                        key={section.id}
                        title={section.id}
                        classNames={{
                          heading:
                            "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                        }}
                      >
                        {section.features.map((feature: any) => (
                          <SelectItem key={feature.key} value={feature.key}>
                            {feature.name}
                          </SelectItem>
                        ))}
                      </SelectSection>
                    ))}
                  </Select>

                  <Input
                    isRequired
                    type="number"
                    name="seats"
                    onChange={(e) => handleInputChange(e, setSellingCarToEdit)}
                    label="Number of Seats"
                    placeholder="1"
                    value={sellingCarToEdit?.seats}
                    labelPlacement="outside"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">
                          seats
                        </span>
                      </div>
                    }
                  />

                  <Input
                    isRequired
                    type="number"
                    name="warranty"
                    onChange={(e) => handleInputChange(e, setSellingCarToEdit)}
                    label="Warranty"
                    value={sellingCarToEdit?.warranty}
                    placeholder="0"
                    labelPlacement="outside"
                    min={1}
                    max={10}
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">
                          years
                        </span>
                      </div>
                    }
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={setIsSellingEditCarModalOpen}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => handleUpdateCar(openSellingEditCarModal)}
                >
                  Edit
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Add Car Modal */}
          <Modal
            scrollBehavior="inside"
            size="5xl"
            isOpen={isSellingAddCarModalOpen}
            onOpenChange={setIsSellingAddCarModalOpen}
          >
            <ModalContent>
              <ModalHeader>Add Car Details</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-5">
                  {/* Brand Selection */}
                  <Autocomplete
                    isRequired
                    label="Brand"
                    name="brand"
                    onSelectionChange={(value) =>
                      setNewSellingCar({
                        ...newSellingCar,
                        brand: value,
                      })
                    }
                    labelPlacement="outside"
                    placeholder="Choose a brand..."
                    className="w-full"
                  >
                    {brands.map((section) => (
                      <AutocompleteSection
                        key={section.id}
                        title={section.id}
                        classNames={{
                          heading:
                            "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                        }}
                      >
                        {section.brands.map((brand: any) => (
                          <AutocompleteItem key={brand.key} value={brand.key}>
                            {brand.name}
                          </AutocompleteItem>
                        ))}
                      </AutocompleteSection>
                    ))}
                  </Autocomplete>

                  {/* Model Input */}
                  <Input
                    isRequired
                    label="Model"
                    name="model"
                    labelPlacement="outside"
                    placeholder="Enter model name..."
                    onChange={(e) =>
                      handleModelInputChange(e, setNewSellingCar, "sell")
                    }
                  />
                  {modelError && <p style={{ color: "red" }}>{modelError}</p>}

                  {/* Price Input */}
                  <Input
                    isRequired
                    label="Price"
                    labelPlacement="outside"
                    placeholder="0.00"
                    name="price"
                    type="number"
                    onChange={(e) => handleInputChange(e, setNewSellingCar)}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">RM</span>
                      </div>
                    }
                  />

                  <Input
                    isRequired
                    type="number"
                    name="units"
                    onChange={(e) => handleInputChange(e, setNewSellingCar)}
                    label="Number of Units"
                    placeholder="1"
                    labelPlacement="outside"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">
                          units
                        </span>
                      </div>
                    }
                  />

                  <Input
                    isRequired
                    type="file"
                    name="modelimg"
                    label="Model Image"
                    placeholder=""
                    labelPlacement="outside"
                    onChange={(e) => handleFileChange(e, setNewSellingCar)}
                  />

                  {/* Fuel Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Fuel Type"
                    placeholder="Select Fuel Type"
                    onSelectionChange={(value) =>
                      setNewSellingCar({
                        ...newSellingCar,
                        fuel: value,
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {fuelTypes.map((section) => (
                      <AutocompleteItem
                        key={section.fuel.key}
                        value={section.fuel.key}
                      >
                        {section.fuel.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Transmission Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Transmission Type"
                    placeholder="Select Transmission Type"
                    onSelectionChange={(value) =>
                      setNewSellingCar({
                        ...newSellingCar,
                        transmission: value,
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {transmissionTypes.map((section) => (
                      <AutocompleteItem
                        key={section.transmission.key}
                        value={section.transmission.key}
                      >
                        {section.transmission.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Body Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Body Type"
                    placeholder="Select Body Type"
                    onSelectionChange={(value) =>
                      setNewSellingCar({
                        ...newSellingCar,
                        body: value,
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {bodyTypes.map((section) => (
                      <AutocompleteItem
                        key={section.body.key}
                        value={section.body.key}
                      >
                        {section.body.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Colors Selection */}
                  <Select
                    isRequired
                    selectionMode="multiple"
                    label="Colors"
                    name="colors"
                    onSelectionChange={(value) =>
                      handleMultipleSelectChange(
                        "colors",
                        value,
                        setNewSellingCar
                      )
                    }
                    placeholder="Choose the colors..."
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {colors.map((section) => (
                      <SelectSection
                        key={section.id}
                        title={section.id}
                        classNames={{
                          heading:
                            "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                        }}
                      >
                        {section.colors.map((color: any) => (
                          <SelectItem
                            key={color.key}
                            value={color.key}
                            startContent={
                              <div
                                style={{
                                  backgroundColor: color.hex,
                                  width: "70px",
                                  height: "20px",
                                  borderRadius: "4px",
                                  marginRight: "8px",
                                  border: "1px solid rgba(0, 0, 0, 0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: getTextColor(color.hex),
                                  fontWeight: "bold",
                                  fontSize: "12px",
                                }}
                              >
                                {color.hex}
                              </div>
                            }
                          >
                            {color.name}
                          </SelectItem>
                        ))}
                      </SelectSection>
                    ))}
                  </Select>

                  {/* Engine Type Selection */}
                  <Select
                    isRequired
                    selectionMode="multiple"
                    label="Engine Type"
                    name="enginetype"
                    onSelectionChange={(selectedKeys) =>
                      setNewSellingCar({
                        ...newSellingCar,
                        enginetype: Array.from(selectedKeys),
                      })
                    }
                    placeholder="Choose the engine..."
                    labelPlacement="outside"
                    className="w-full col-span-2 lg:col-span-1"
                  >
                    {engineTypes.map((section) => (
                      <SelectSection
                        key={section.id}
                        title={section.id}
                        classNames={{
                          heading:
                            "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                        }}
                      >
                        {section.engines.map((engine: any) => (
                          <SelectItem key={engine.key} value={engine.key}>
                            {engine.name}
                          </SelectItem>
                        ))}
                      </SelectSection>
                    ))}
                  </Select>

                  {/* Drive Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Drive Type"
                    placeholder="Choose the driving type..."
                    onSelectionChange={(value) =>
                      setNewSellingCar({
                        ...newSellingCar,
                        driving: value,
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {driveTypes.map((type) => (
                      <AutocompleteItem
                        key={type.drive.key}
                        value={type.drive.key}
                      >
                        {type.drive.name}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Engine Technology Selection */}
                  <Select
                    isRequired
                    selectionMode="multiple"
                    label="Engine Technology"
                    name="engineTech"
                    onSelectionChange={(selectedKeys) =>
                      setNewSellingCar({
                        ...newSellingCar,
                        engineTech: Array.from(selectedKeys),
                      })
                    }
                    placeholder="Choose the technology..."
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {engineTechs.map((section) => (
                      <SelectItem
                        key={section.tech.key}
                        value={section.tech.key}
                      >
                        {section.tech.name}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Features Selection */}
                  <Select
                    isRequired
                    selectionMode="multiple"
                    label="Features"
                    name="features"
                    onSelectionChange={(selectedKeys) =>
                      setNewSellingCar({
                        ...newSellingCar,
                        features: Array.from(selectedKeys),
                      })
                    }
                    placeholder="Choose the features..."
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {features.map((section) => (
                      <SelectSection
                        key={section.id}
                        title={section.id}
                        classNames={{
                          heading:
                            "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                        }}
                      >
                        {section.features.map((feature: any) => (
                          <SelectItem key={feature.key} value={feature.key}>
                            {feature.name}
                          </SelectItem>
                        ))}
                      </SelectSection>
                    ))}
                  </Select>

                  <Input
                    isRequired
                    type="number"
                    name="seats"
                    onChange={(e) => handleInputChange(e, setNewSellingCar)}
                    label="Number of Seats"
                    placeholder="1"
                    labelPlacement="outside"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">
                          seats
                        </span>
                      </div>
                    }
                  />

                  <Input
                    isRequired
                    type="number"
                    name="warranty"
                    onChange={(e) => handleInputChange(e, setNewSellingCar)}
                    label="Warranty"
                    placeholder="0"
                    labelPlacement="outside"
                    min={1}
                    max={10}
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">
                          years
                        </span>
                      </div>
                    }
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={setIsSellingAddCarModalOpen}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => addCar(setIsSellingAddCarModalOpen)}
                >
                  Add
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* edit rent car model */}
          <Modal
            scrollBehavior="inside"
            size="5xl"
            isOpen={isRentingEditCarModalOpen}
            onOpenChange={setIsRentingEditCarModalOpen}
          >
            <ModalContent>
              <ModalHeader>Edit Rental Car Details</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-5">
                  <Input
                    isRequired
                    label="Brand"
                    name="brand"
                    value={newRentingCar?.brand || ""}
                    onChange={(e) => handleInputChange(e, setNewRentingCar)}
                    placeholder="Enter brand name..."
                    labelPlacement="outside"
                  />

                  <Input
                    isRequired
                    label="Model"
                    name="model"
                    value={newRentingCar?.model || ""}
                    onChange={(e) => handleInputChange(e, setNewRentingCar)}
                    placeholder="Enter model name..."
                    labelPlacement="outside"
                  />

                  <Input
                    isRequired
                    label="Number of Seats"
                    name="seats"
                    type="number"
                    value={newRentingCar?.seats || ""}
                    onChange={(e) => handleInputChange(e, setNewRentingCar)}
                    labelPlacement="outside"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">
                          seats
                        </span>
                      </div>
                    }
                  />

                  <Input
                    isRequired
                    label="Price per Day"
                    name="price"
                    type="number"
                    value={newRentingCar?.price || ""}
                    onChange={(e) => handleInputChange(e, setNewRentingCar)}
                    placeholder="0.00"
                    labelPlacement="outside"
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">RM</span>
                      </div>
                    }
                  />

                  <Autocomplete
                    isRequired
                    label="Location"
                    selectedKey={newRentingCar?.location || ""}
                    onSelectionChange={(value) =>
                      setNewRentingCar({
                        ...newRentingCar,
                        location: value,
                      })
                    }
                    placeholder="Select Location"
                    labelPlacement="outside"
                  >
                    {locations.map((section) => (
                      <AutocompleteItem
                        key={section.location.key}
                        value={section.location.key}
                      >
                        {section.location.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  <Input
                    type="file"
                    name="modelimg"
                    label="Model Image"
                    labelPlacement="outside"
                    onChange={(e) => handleFileChange(e, setNewRentingCar)}
                  />

                  <Autocomplete
                    isRequired
                    label="Fuel Type"
                    selectedKey={newRentingCar?.fuel || ""}
                    onSelectionChange={(value) =>
                      setNewRentingCar({
                        ...newRentingCar,
                        fuel: value,
                      })
                    }
                    placeholder="Select Fuel Type"
                    labelPlacement="outside"
                  >
                    {fuelTypes.map((section) => (
                      <AutocompleteItem
                        key={section.fuel.key}
                        value={section.fuel.key}
                      >
                        {section.fuel.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  <Autocomplete
                    isRequired
                    label="Transmission Type"
                    selectedKey={newRentingCar?.transmission || ""}
                    onSelectionChange={(value) =>
                      setNewRentingCar({
                        ...newRentingCar,
                        transmission: value,
                      })
                    }
                    placeholder="Select Transmission Type"
                    labelPlacement="outside"
                  >
                    {transmissionTypes.map((section) => (
                      <AutocompleteItem
                        key={section.transmission.key}
                        value={section.transmission.key}
                      >
                        {section.transmission.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  <Autocomplete
                    isRequired
                    label="Body Type"
                    selectedKey={newRentingCar?.body || ""}
                    onSelectionChange={(value) =>
                      setNewRentingCar({
                        ...newRentingCar,
                        body: value,
                      })
                    }
                    placeholder="Select Body Type"
                    labelPlacement="outside"
                  >
                    {bodyTypes.map((section) => (
                      <AutocompleteItem
                        key={section.body.key}
                        value={section.body.key}
                      >
                        {section.body.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  <Select
                    isRequired
                    selectionMode="multiple"
                    label="Features"
                    selectedKeys={new Set(newRentingCar?.features || [])}
                    onSelectionChange={(selectedKeys) =>
                      setNewRentingCar({
                        ...newRentingCar,
                        features: Array.from(selectedKeys),
                      })
                    }
                    placeholder="Choose the features..."
                    labelPlacement="outside"
                  >
                    {features.map((section) => (
                      <SelectSection
                        key={section.id}
                        title={section.id}
                        classNames={{
                          heading:
                            "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                        }}
                      >
                        {section.features.map((feature: any) => (
                          <SelectItem key={feature.key} value={feature.key}>
                            {feature.name}
                          </SelectItem>
                        ))}
                      </SelectSection>
                    ))}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={setIsRentingEditCarModalOpen}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() =>
                    handleUpdateRentalCar(setIsRentingEditCarModalOpen)
                  }
                >
                  Edit
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* add rent car model */}
          <Modal
            scrollBehavior="inside"
            size="5xl"
            isOpen={isRentingAddCarModalOpen}
            onOpenChange={setIsRentingAddCarModalOpen}
          >
            <ModalContent>
              <ModalHeader>Add Rental Car Details</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-5">
                  {/* Brand Selection */}
                  <Input
                    isRequired
                    type="text"
                    name="brand"
                    onChange={(e) => handleInputChange(e, setNewRentingCar)}
                    label="Brand"
                    placeholder="Enter brand name..."
                    labelPlacement="outside"
                  />
                  {/* Model Input */}
                  <Input
                    isRequired
                    label="Model"
                    name="model"
                    labelPlacement="outside"
                    placeholder="Enter model name..."
                    onChange={(e) =>
                      handleModelInputChange(e, setNewRentingCar, "rent")
                    }
                  />
                  {modelError && <p style={{ color: "red" }}>{modelError}</p>}

                  {/* Seats Input */}
                  <Input
                    isRequired
                    type="number"
                    name="seats"
                    onChange={(e) => handleInputChange(e, setNewRentingCar)}
                    label="Number of Seats"
                    placeholder="1"
                    labelPlacement="outside"
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">
                          seats
                        </span>
                      </div>
                    }
                  />

                  {/* Price per Day Input */}
                  <Input
                    isRequired
                    label="Price per Day"
                    labelPlacement="outside"
                    placeholder="0.00"
                    name="price"
                    type="number"
                    onChange={(e) => handleInputChange(e, setNewRentingCar)}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">RM</span>
                      </div>
                    }
                  />

                  {/* Location Input */}
                  <Autocomplete
                    isRequired
                    label="Location"
                    placeholder="Select Location"
                    onSelectionChange={(value) =>
                      setNewRentingCar({
                        ...newRentingCar,
                        location: value,
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {locations.map((section) => (
                      <AutocompleteItem
                        key={section.location.key}
                        value={section.location.key}
                      >
                        {section.location.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Model Image Input */}
                  <Input
                    isRequired
                    type="file"
                    name="modelimg"
                    label="Model Image"
                    labelPlacement="outside"
                    onChange={(e) => handleFileChange(e, setNewRentingCar)}
                  />

                  {/* Fuel Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Fuel Type"
                    placeholder="Select Fuel Type"
                    onSelectionChange={(value) =>
                      setNewRentingCar({
                        ...newRentingCar,
                        fuel: value,
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {fuelTypes.map((section) => (
                      <AutocompleteItem
                        key={section.fuel.key}
                        value={section.fuel.key}
                      >
                        {section.fuel.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Transmission Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Transmission Type"
                    placeholder="Select Transmission Type"
                    onSelectionChange={(value) =>
                      setNewRentingCar({
                        ...newRentingCar,
                        transmission: value,
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {transmissionTypes.map((section) => (
                      <AutocompleteItem
                        key={section.transmission.key}
                        value={section.transmission.key}
                      >
                        {section.transmission.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Body Type Selection */}
                  <Autocomplete
                    isRequired
                    label="Body Type"
                    placeholder="Select Body Type"
                    onSelectionChange={(value) =>
                      setNewRentingCar({
                        ...newRentingCar,
                        body: value,
                      })
                    }
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {bodyTypes.map((section) => (
                      <AutocompleteItem
                        key={section.body.key}
                        value={section.body.key}
                      >
                        {section.body.value}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Features Selection */}
                  <Select
                    isRequired
                    selectionMode="multiple"
                    label="Features"
                    name="features"
                    onSelectionChange={(selectedKeys) =>
                      setNewRentingCar({
                        ...newRentingCar,
                        features: Array.from(selectedKeys), // Converts the Set back to an array
                      })
                    }
                    placeholder="Choose the features..."
                    labelPlacement="outside"
                    className="w-full"
                  >
                    {features.map((section) => (
                      <SelectSection
                        key={section.id}
                        title={section.id}
                        classNames={{
                          heading:
                            "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                        }}
                      >
                        {section.features.map((feature: any) => (
                          <SelectItem key={feature.key} value={feature.key}>
                            {feature.name}
                          </SelectItem>
                        ))}
                      </SelectSection>
                    ))}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={setIsRentingAddCarModalOpen}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => addRentalCar(setIsRentingAddCarModalOpen)}
                >
                  Add
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      )}
    </div>
  );
}
