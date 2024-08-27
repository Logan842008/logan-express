"use client";
import { db } from "@/config";
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
import { getAuth } from "firebase/auth";

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
      <div className="grid grid-cols-10 h-screen overflow-auto lg:overflow-hidden">
        {/* Fixed Image Section */}
        <div className="col-span-10 lg:col-span-7 flex flex-col content-center justify-items-between px-10">
          <div className="h-[68%] grid place-items-center">
            <img
              alt={`${car.brand} ${car.model}`}
              className="object-cover rounded-xl max-h-full"
              src={car.modelimg!}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5  gap-4 w-full mt-4 mb-4 lg:mb-0 text-center">
            <div>
              <p className="text-xl font-bold text-orange-500">
                {getLocationNameByKey(locations, car.location)}
              </p>
              <p className="text-md">Location</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-500">{car.seats}</p>
              <p className="text-md">Seats</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-500">
                {getFuelTypeNameByKey(fuels, car.fuel)}
              </p>
              <p className="text-md">Fuel Type</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-500">
                {getTransmissionTypeNameByKey(transmissions, car.transmission)}
              </p>
              <p className="text-md">Transmission</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-500">
                {getBodyTypeNameByKey(bodyTypes, car.body)}
              </p>
              <p className="text-md">Body Type</p>
            </div>
          </div>
        </div>

        {/* Scrollable Configuration Section */}
        <div className="col-span-10 lg:col-span-3 h-screen overflow-y-scroll pb-56 lg:pb-48 p-10">
          <h2 className="text-2xl font-bold">Features</h2>

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
                    className="border dark:bg-neutral-900 bg-neutral-200"
                  >
                    <CardBody className="flex justify-center items-center">
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
                    className="border dark:bg-neutral-900 bg-neutral-200"
                  >
                    <CardBody className="flex justify-center items-center">
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
      <div className="fixed bottom-0 left-0 w-full bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-300 dark:border-neutral-800 shadow-lg py-4 z-50">
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
              color="primary"
              onClick={async () => {
                const auth = getAuth();
                const user = auth.currentUser;

                if (user) {
                  try {
                    // Confirm the rental with an alert or SweetAlert
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
                            ? "bg-black rounded-xl text-white"
                            : "bg-white rounded-xl text-black", // Apply your theme's class
                        title: "swal-title",
                        confirmButton: "swal-confirm",
                        cancelButton: "swal-cancel",
                      },
                    });

                    if (result.isConfirmed) {
                      // Extract the rental period from search params
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

                    // Show error toast
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
                  // Show a message to log in if the user is not authenticated
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
