"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, app } from "@/config";
import { Card, CardBody, CardFooter, Divider, Image } from "@nextui-org/react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useTheme } from "next-themes";

export default function Buy() {
  const [cars, setCars] = useState<any[]>([]);
  const [brands, setBrands] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth(app);
  const { theme } = useTheme();

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
    if (!loading) {
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
          const carsCollection = collection(db, "cars-sell");
          const carsSnapshot = await getDocs(carsCollection);
          const carsList = carsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCars(carsList);
        } catch (error) {
          console.error("Error fetching cars:", error);
        }
      };

      fetchBrands();
      fetchCars();
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 w-full lg:w-3/4 p-5 lg:p-10 mt-5 gap-6">
      {cars.map((car, index) => (
        <Card
          shadow="sm"
          className="border-2 border-orange-500 bg-gradient-to-br dark:from-neutral-900 dark:to-neutral-800 from-neutral-300 to-neutral-200"
          isDisabled={car.units == 0}
          key={index}
          isPressable={car.units != 0}
          onPress={() => router.push(`/buy/${car.id}`)}
        >
          <CardBody className="overflow-visible p-0 flex items-center justify-center">
            <Image
              radius="lg"
              alt={`${brands[car.brand]} ${car.model}`}
              className="w-full h-full object-contain p-3"
              src={car.modelimg}
            />
          </CardBody>
          <Divider />
          <CardFooter className="text-small justify-between items-end">
            <div className="flex flex-col justify-start">
              <small className="text-left text-default-500 font-bold">
                {brands[car.brand].toLocaleUpperCase()}
              </small>
              <h2 className="text-left text-md">{car.model}</h2>
            </div>
            <p className="text-orange-500 font-bold text-md">
              RM{Number(car.price).toLocaleString()}
            </p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
