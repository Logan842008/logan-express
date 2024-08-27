"use client";
import { app, db } from "@/config";
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  Spinner,
} from "@nextui-org/react";
import { doc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  today,
  parseDateTime,
  getLocalTimeZone,
} from "@internationalized/date";
import { toast } from "react-toastify";
import { useTheme } from "next-themes";
import Swal from "sweetalert2";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Utility functions for mapping keys to names using fetched data
function getBodyTypeNameByKey(bodyTypes: any[], key: string) {
  const bodyType = bodyTypes.find((body) => body.key === key);
  return bodyType ? bodyType.value : key;
}

function getTransmissionTypeNameByKey(transmissions: any[], key: string) {
  const transmission = transmissions.find(
    (transmissions) => transmissions.key === key
  );
  return transmission ? transmission.value : key;
}

function getFuelTypeNameByKey(fuels: any[], key: string) {
  const fuel = fuels.find((fuel) => fuel.key === key);
  return fuel ? fuel.value : key;
}

function getLocationNameByKey(locations: any[], key: string) {
  const location = locations.find((location) => location.key === key);
  return location ? location.value : key;
}

export default function CarDetails() {
  const { theme } = useTheme(); // Access the theme
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const carId = params.id as string;

  const [car, setCar] = useState<any | null>(null);
  const [bodyTypes, setBodyTypes] = useState<any[]>([]);
  const [transmissions, setTransmissions] = useState<any[]>([]);
  const [fuels, setFuels] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [features, setFeatures] = useState<{
    exteriorFeatures: any[];
    interiorFeatures: any[];
  }>({
    exteriorFeatures: [],
    interiorFeatures: [],
  });

  const [exteriorFeatures, setExteriorFeatures] = useState<any[]>([]);
  const [interiorFeatures, setInteriorFeatures] = useState<any[]>([]);

  const [totalCost, setTotalCost] = useState<number>(0);
  const auth = getAuth(app);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If user is not authenticated, redirect and show a toast
        toast.error("Access denied", {
          autoClose: 2000,
          closeOnClick: true,
          position: "bottom-right",
          theme,
        });
        router.push("/");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCarData = async () => {
      try {
        const carDocRef = doc(db, "cars-rent", carId);
        const carDoc = await getDoc(carDocRef);

        if (carDoc.exists()) {
          const carData = carDoc.data();
          setCar(carData);

          // Fetch additional data for body types, transmissions, fuels, etc.
          const bodyTypesSnapshot = await getDocs(
            collection(db, "car-bodytype")
          );
          const fetchedBodyTypes = bodyTypesSnapshot.docs.map((doc) => ({
            key: doc.id,
            value: doc.data().body.value,
          }));
          setBodyTypes(fetchedBodyTypes);

          const transmissionSnapshot = await getDocs(
            collection(db, "car-transmission")
          );
          const fetchTransmissionTypes = transmissionSnapshot.docs.map(
            (doc) => ({
              key: doc.id,
              value: doc.data().transmission.value,
            })
          );
          setTransmissions(fetchTransmissionTypes);

          const locationSnapshot = await getDocs(
            collection(db, "car-locations")
          );
          const fetchLocationTypes = locationSnapshot.docs.map((doc) => ({
            key: doc.id,
            value: doc.data().location.value,
          }));
          setLocations(fetchLocationTypes);

          const fuelSnapshot = await getDocs(collection(db, "car-fueltype"));
          const fuelTypes = fuelSnapshot.docs.map((doc) => ({
            key: doc.id,
            value: doc.data().fuel.value,
          }));
          setFuels(fuelTypes);

          // Fetch features data
          const [exteriorDoc, interiorDoc] = await Promise.all([
            getDoc(doc(db, "car-features", "Exterior")),
            getDoc(doc(db, "car-features", "Interior")),
          ]);

          const exteriorFeatures = exteriorDoc.exists()
            ? exteriorDoc.data()?.features || []
            : [];
          const interiorFeatures = interiorDoc.exists()
            ? interiorDoc.data()?.features || []
            : [];

          setFeatures({ exteriorFeatures, interiorFeatures });

          // Filter the car's features by matching the keys
          const carFeatures = carData.features || [];

          const filteredExterior = exteriorFeatures.filter((feature: any) =>
            carFeatures.includes(
              typeof feature === "string" ? feature : feature.key
            )
          );
          const filteredInterior = interiorFeatures.filter((feature: any) =>
            carFeatures.includes(
              typeof feature === "string" ? feature : feature.key
            )
          );

          setExteriorFeatures(filteredExterior);
          setInteriorFeatures(filteredInterior);
        } else {
          console.error("Car not found!");
          router.push("/404");
        }
      } catch (error) {
        console.error("Error fetching car data:", error);
      }
    };

    fetchCarData();
  }, [carId, router]);

  useEffect(() => {
    if (car) {
      // Extract the rental period from the URL search parameters
      const startDateStr = searchParams.get("start");
      const endDateStr = searchParams.get("end");
      console.log(startDateStr);

      if (startDateStr && endDateStr) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // Calculate the number of days between the selected dates
        const rentalDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
        );
        console.log(rentalDays);

        // Calculate the total rental cost
        const calculatedTotalCost = rentalDays * car.price;

        setTotalCost(calculatedTotalCost);
      }
    }
  }, [car, searchParams]);

  if (!car) {
    return (
      <div className="flex w-screen h-screen justify-center items-center">
        <Spinner label="Loading..." color="primary" labelColor="primary" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-10 items-start p-10 h-full overflow-auto lg:overflow-hidden  text-white">
        {/* Fixed Image Section */}
        <div className="col-span-10 lg:col-span-10 flex flex-col content-center justify-items-between">
          <div className="h-full grid place-items-center">
            <img
              alt={`${car.brand} ${car.model}`}
              className="object-cover rounded-xl max-h-full shadow-2xl"
              src={car.modelimg!}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full mt-4 mb-4 md:mb-0 text-center text-gray-300">
            <div className="flex justify-between md:flex-col">
              <p className="text-md text-left md:text-center font-bold text-orange-400">
                {getLocationNameByKey(locations, car.location)}
              </p>
              <p className="text-sm text-gray-400">Location</p>
            </div>
            <div className="flex justify-between md:flex-col">
              <p className="text-md text-left md:text-center font-bold text-orange-400">
                {car.seats}
              </p>
              <p className="text-sm text-gray-400">Seats</p>
            </div>
            <div className="flex justify-between md:flex-col">
              <p className="text-md text-left md:text-center font-bold text-orange-400">
                {getFuelTypeNameByKey(fuels, car.fuel)}
              </p>
              <p className="text-sm text-gray-400">Fuel Type</p>
            </div>
            <div className="flex justify-between md:flex-col">
              <p className="text-md text-left md:text-center font-bold text-orange-400">
                {getTransmissionTypeNameByKey(transmissions, car.transmission)}
              </p>
              <p className="text-sm text-gray-400">Transmission</p>
            </div>
            <div className="flex justify-between md:flex-col">
              <p className="text-md text-left md:text-center font-bold text-orange-400">
                {getBodyTypeNameByKey(bodyTypes, car.body)}
              </p>
              <p className="text-sm text-gray-400">Body Type</p>
            </div>
          </div>
        </div>

        {/* Scrollable Configuration Section */}
        <div className="col-span-10 lg:col-span-10 h-full overflow-y-scroll pb-56 lg:pb-48 p-5">
          <h2 className="text-2xl font-bold mb-4">Features</h2>

          <Accordion variant="splitted" selectionMode="multiple">
            <AccordionItem
              key="1"
              aria-label="exterior"
              title="Exterior Features"
              className="my-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
                {exteriorFeatures.map((feature, index) => (
                  <Card
                    key={index}
                    className="border bg-gradient-to-bl dark:from-neutral-900 dark:to-neutral-800 from-neutral-300 to-neutral-200 hover:scale-95 transform transition-transform"
                  >
                    <CardBody className="flex justify-center items-center p-3">
                      <h3 className="text-lg font-bold text-center ">
                        {typeof feature === "string" ? feature : feature.name}
                      </h3>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </AccordionItem>

            <AccordionItem
              key="2"
              aria-label="interior"
              title="Interior Features"
              className="my-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
                {interiorFeatures.map((feature, index) => (
                  <Card
                    key={index}
                    className="border bg-gradient-to-bl dark:from-neutral-900 dark:to-neutral-800 from-neutral-300 to-neutral-200 hover:scale-95 transform transition-transform"
                  >
                    <CardBody className="flex justify-center items-center p-3">
                      <h3 className="text-lg font-bold text-center ">
                        {typeof feature === "string" ? feature : feature.name}
                      </h3>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Sticky bottom container */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-br dark:from-neutral-900 dark:to-neutral-800 from-neutral-300 to-neutral-200 border-t border-neutral-800 shadow-lg py-4 z-50">
        <div className="container mx-auto flex lg:flex-row flex-col justify-between items-center px-4">
          <div>
            <p className="text-2xl font-bold">
              {car.brand!} {car.model!}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-start">
              <p className="text-md text-orange-500">Total Rental Cost:</p>
              <p className="text-xl font-bold text-orange-500">
                RM{(totalCost ?? 0).toLocaleString()}
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:to-green-700"
              onClick={async () => {
                const auth = getAuth();
                const user = auth.currentUser;

                if (user) {
                  try {
                    const result = await Swal.fire({
                      title: "Confirm Rental?",
                      text: `Total cost: RM${totalCost.toLocaleString()}`,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonColor: "#03c04A",
                      cancelButtonColor: "#3085d6",
                      confirmButtonText: "Yes, confirm!",
                      customClass: {
                        popup:
                          theme === "dark"
                            ? "bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl text-white"
                            : "from-neutral-300 to-neutral-200 bg-gradient-br rounded-xl text-black", // Apply your theme's class
                      },
                    });

                    if (result.isConfirmed) {
                      const startDateStr = searchParams.get("start");
                      const endDateStr = searchParams.get("end");

                      if (startDateStr && endDateStr) {
                        const startDate = new Date(startDateStr);
                        const endDate = new Date(endDateStr);

                        // Create a new document in the car-rental-periods collection
                        await addDoc(collection(db, "car-rental-periods"), {
                          carId: carId,
                          car: {
                            brand: car.brand,
                            model: car.model,
                            body: getBodyTypeNameByKey(bodyTypes, car.body),
                            location: getLocationNameByKey(
                              locations,
                              car.location
                            ),
                            fuel: getFuelTypeNameByKey(fuels, car.fuel),
                            transmission: getTransmissionTypeNameByKey(
                              transmissions,
                              car.transmission
                            ),
                            seats: car.seats,
                            pricePerDay: car.price,
                            modelImg: car.modelimg,
                            features: {
                              exterior: exteriorFeatures.map((feature) =>
                                typeof feature === "string"
                                  ? feature
                                  : feature.name
                              ),
                              interior: interiorFeatures.map((feature) =>
                                typeof feature === "string"
                                  ? feature
                                  : feature.name
                              ),
                            },
                          },
                          start: startDate.toISOString(),
                          end: endDate.toISOString(),
                          totalPrice: totalCost,
                          userId: user.uid, // Optionally, store the user ID
                        });

                        await addDoc(
                          collection(db, "cars-used", "cars", carId),
                          { user: user.uid }
                        );

                        // Show success toast
                        toast.success("Rental confirmed!", {
                          autoClose: 2000,
                          closeOnClick: true,
                          position: "bottom-right",
                          theme,
                        });

                        // Redirect to another page, like a confirmation page or dashboard
                        router.push("/rent");
                      }
                    }
                  } catch (error) {
                    console.error("Error confirming rental:", error);
                    toast.error(
                      "There was an issue confirming your rental. Please try again.",
                      {
                        autoClose: 2000,
                        closeOnClick: true,
                        position: "bottom-right",
                        theme,
                      }
                    );
                  }
                } else {
                  toast.error("Please log in to proceed with the rental.", {
                    autoClose: 2000,
                    closeOnClick: true,
                    position: "bottom-right",
                  });
                }
              }}
            >
              Rent Now
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
