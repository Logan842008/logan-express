"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { app, db } from "@/config";
import {
  Card,
  CardBody,
  CardFooter,
  Divider,
  Image,
  DateRangePicker,
  Slider,
  Autocomplete,
  AutocompleteItem,
} from "@nextui-org/react";
import {
  getLocalTimeZone,
  today,
  parseDateTime,
} from "@internationalized/date";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import { useTheme } from "next-themes";

export default function Rent() {
  const [cars, setCars] = useState<any[]>([]);
  const [filteredCars, setFilteredCars] = useState<any[]>([]);
  const [brands, setBrands] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()).add({ days: 7 }),
  });
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000]);
  const [rentalPeriods, setRentalPeriods] = useState<any[]>([]);
  const router = useRouter();
  const auth = getAuth(app);
  const { theme } = useTheme();
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
    const fetchBrands = async () => {
      try {
        const brandsSnapshot = await getDocs(collection(db, "car-brands"));
        const brandsMap: Record<string, string> = {};

        brandsSnapshot.docs.forEach((brandDoc) => {
          const brandData = brandDoc.data();
          brandData.brands.forEach((brand: { key: string; name: string }) => {
            brandsMap[brand.key] = brand.name;
          });
        });

        setBrands(brandsMap);
      } catch (error) {
        console.error("Error fetching car brands:", error);
      }
    };

    const fetchCars = async () => {
      try {
        const carsCollection = collection(db, "cars-rent");
        const carsSnapshot = await getDocs(carsCollection);
        const carsList = carsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCars(carsList);
        setFilteredCars(carsList);
      } catch (error) {
        console.error("Error fetching cars:", error);
      }
    };

    const fetchLocations = async () => {
      try {
        const locationsSnapshot = await getDocs(
          collection(db, "car-locations")
        );
        const locationsList = locationsSnapshot.docs.map((doc) => {
          const locationData = doc.data();
          return {
            id: doc.id,
            ...locationData,
          };
        });

        console.log("Fetched Locations:", locationsList); // Ensure data structure is correct
        setLocations(locationsList);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    const fetchRentalPeriods = async () => {
      try {
        const rentalPeriodsSnapshot = await getDocs(
          collection(db, "car-rental-periods")
        );
        const rentalList = rentalPeriodsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRentalPeriods(rentalList);
      } catch (error) {
        console.error("Error fetching rental periods:", error);
      }
    };

    fetchBrands();
    fetchCars();
    fetchLocations();
    fetchRentalPeriods();
  }, []);

  useEffect(() => {
    const filtered = cars.filter((car) => {
      const carPrice = Number(car.price);

      // Price filtering
      const isWithinPriceRange =
        carPrice >= priceRange[0] && carPrice <= priceRange[1];

      // Location filtering
      const isWithinLocation =
        !selectedLocation || car.location === selectedLocation;

      // Check if the car is available during the selected date range
      const isAvailableInDateRange = !rentalPeriods.some((rental) => {
        if (rental.carId === car.id) {
          const rentalStart = new Date(rental.start);
          const rentalEnd = new Date(rental.end);

          const selectedStart = new Date(dateRange.start.toString());
          const selectedEnd = new Date(dateRange.end.toString());

          // Check if the selected date range overlaps with the rental period
          return (
            (selectedStart >= rentalStart && selectedStart <= rentalEnd) ||
            (selectedEnd >= rentalStart && selectedEnd <= rentalEnd) ||
            (selectedStart <= rentalStart && selectedEnd >= rentalEnd)
          );
        }
        return false;
      });

      return isWithinPriceRange && isWithinLocation && isAvailableInDateRange;
    });

    setFilteredCars(filtered);
  }, [cars, dateRange, priceRange, rentalPeriods, selectedLocation]);

  return (
    <div className="w-full flex items-center h-full justify-center overflow-x-hidden p-10">
      <div className="grid lg:w-3/4 grid-cols-1 lg:grid-cols-4 w-full mt-5 gap-6 ">
        <DateRangePicker
          label="Rental Start / End"
          labelPlacement="outside"
          visibleMonths={1}
          minValue={today(getLocalTimeZone())}
          value={dateRange}
          onChange={(range) => setDateRange(range)}
          className="mb-5 col-span-2"
          granularity="day"
        />

        {/* Autocomplete for Location Filter */}
        <Autocomplete
          label="Filter by Location"
          labelPlacement="outside"
          placeholder="Select Location"
          onSelectionChange={(value) => setSelectedLocation(value as string)} // Cast to string
          className="relative flex items-center mb-5 w-full col-span-2 lg:col-span-1"
        >
          {locations.map((location) => (
            <AutocompleteItem
              key={location.id} // Use the location ID here
              value={location.location.key} // Make sure the location object has the correct structure
            >
              {location.location.value}
            </AutocompleteItem>
          ))}
        </Autocomplete>

        <Slider
          label="Price Range / day"
          step={1}
          maxValue={1000}
          minValue={0}
          defaultValue={priceRange}
          onChange={(value) => setPriceRange(value as number[])}
          className="max-w mb-5 col-span-2 lg:col-span-1"
        />

        {filteredCars.length > 0 ? (
          filteredCars.map((car, index) => (
            <Card
              shadow="sm"
              className="border-2 border-orange-500 bg-gradient-to-br dark:from-neutral-900 dark:to-neutral-800 from-neutral-300 to-neutral-200 col-span-2"
              key={index}
              isPressable
              onPress={() =>
                router.push(
                  `/rent/${car.id}?start=${dateRange.start.toString()}&end=${dateRange.end.toString()}`
                )
              }
            >
              <CardBody className="overflow-visible p-0 flex justify-center items-center">
                <Image
                  radius="lg"
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-full object-contain p-3"
                  src={car.modelimg}
                />
              </CardBody>

              <Divider />
              <CardFooter className="text-small justify-between items-end">
                <div className="flex flex-col justify-start">
                  <small className="text-left text-default-500 font-bold">
                    {car.brand.toLocaleUpperCase()}
                  </small>
                  <h2 className="text-left text-md">{car.model}</h2>
                </div>
                <p className="text-orange-500 font-bold text-md">
                  RM{Number(car.price).toLocaleString()}/day
                </p>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="flex items-center justify-center w-full h-full col-span-full text-white text-lg font-semibold">
            No cars available for the selected range.
          </div>
        )}
      </div>
    </div>
  );
}
