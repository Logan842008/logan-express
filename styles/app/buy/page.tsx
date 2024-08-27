"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config";
import { Card, CardBody, CardFooter, Divider, Image } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function Buy() {
  const [cars, setCars] = useState<any[]>([]);
  const [brands, setBrands] = useState<Record<string, string>>({});
  const router = useRouter();

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
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 w-1/2 mt-5 p-10 gap-6">
      {cars.map((car, index) => (
        <Card
          shadow="sm"
          className="border-2 border-orange-500"
          isDisabled={car.units == 0}
          key={index}
          isPressable={car.units != 0}
          onPress={() => router.push(`/buy/${car.id}`)}
        >
          <CardBody className="overflow-visible p-0">
            <Image
              radius="lg"
              width={400}
              height={200}
              alt={`${brands[car.brand]} ${car.model}`}
              className="w-full object-cover h-[140px] p-3"
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
