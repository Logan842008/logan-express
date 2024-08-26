"use client";
import { useTheme } from "next-themes";
import { db } from "@/config";
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  Spinner,
} from "@nextui-org/react";
import { getAuth } from "firebase/auth";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

// Utility functions for mapping keys to names using fetched data
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

function getEngineTypesByKeys(engineTypes: any[], keys: string[]) {
  const engines = engineTypes
    .flatMap((category) => category.engines)
    .filter((engine) => keys.includes(engine.key))
    .sort((a, b) => a.price - b.price); // Sort by price

  return engines;
}

function getColorsByKeys(colorData: any[], keys: string[]) {
  const colors = colorData
    .flatMap((category) => category.colors)
    .filter((color) => keys.includes(color.key))
    .map((color) => ({ name: color.name, hex: color.hex })); // Map to get both name and hex

  return colors;
}

export default function CarDetails() {
  const { theme } = useTheme(); // Access the theme
  interface Engine {
    key: string;
    name: string;
    price: number;
    hpIncrease: number;
    topSpeedIncrease: number;
    mileageDecrease: number;
  }

  const auth = getAuth();
  const router = useRouter();
  const params = useParams();
  const carId = params.id as string;

  const [car, setCar] = useState<any | null>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [enginetypes, setEngineTypes] = useState<any[]>([]);
  const [fueltypes, setFuelTypes] = useState<any[]>([]);
  const [bodytypes, setBodyTypes] = useState<any[]>([]);
  const [features, setFeatures] = useState<{
    exteriorFeatures: any[];
    interiorFeatures: any[];
  }>({
    exteriorFeatures: [],
    interiorFeatures: [],
  });

  const [transmissiontypes, setTransmissionTypes] = useState<any[]>([]);
  const [enginetechs, setEngineTechs] = useState<any[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<Engine | null>(null);
  const [selectedColor, setSelectedColor] = useState<any | null>(null);
  const [selectedEngineTech, setSelectedEngineTech] = useState<any | null>(
    null
  );
  const [currentHP, setCurrentHP] = useState<number>(0);
  const [currentTopSpeed, setCurrentTopSpeed] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [baseEngine, setBaseEngine] = useState<Engine | null>(null);
  const [meow, setExistingConfiguration] = useState<any | null>(null);
  const [exteriorFeatures, setExteriorFeatures] = useState([]);
  const [interiorFeatures, setInteriorFeatures] = useState([]);
  const [mandatoryFeatures, setMandatoryFeatures] = useState<any[]>([]);

  useEffect(() => {
    const fetchAndSetEngine = async () => {
      if (car && enginetypes.length > 0) {
        const engineKeys = Array.isArray(car.enginetype)
          ? car.enginetype
          : [car.enginetype];

        const relevantEngines = getEngineTypesByKeys(enginetypes, engineKeys);

        if (relevantEngines.length > 0) {
          const base = relevantEngines[0];
          setBaseEngine(base);

          const auth = getAuth();
          const user = auth.currentUser;

          if (user && meow) {
            // Load saved engine, tech, and color configurations
            const savedEngineType = meow?.enginetype?.key?.toLowerCase();
            const savedEngine = relevantEngines.find(
              (engine) => engine.key.toLowerCase() === savedEngineType
            );

            const savedTechKey = meow?.enginetech?.key?.toLowerCase();
            const savedTech = enginetechs.find(
              (tech) => tech.tech.key.toLowerCase() === savedTechKey
            );

            // Handle both array and string cases for saved color
            const savedColorKey = Array.isArray(meow.colors)
              ? meow.colors[0]?.toLowerCase()
              : meow.colors?.toLowerCase();
            const savedColor = car.colors.find(
              (color: any) => color.toLowerCase() === savedColorKey
            );

            // Calculate base prices
            let currentTotalPrice = Number(car.price);
            const enginePriceDifference = savedEngine
              ? savedEngine.price - base.price
              : 0;
            const techPrice = savedTech ? savedTech.tech.price || 0 : 0;
            currentTotalPrice += enginePriceDifference + techPrice;

            // Include feature prices
            if (meow.features) {
              meow.features.forEach((featureKey: string) => {
                const feature = features.exteriorFeatures
                  .concat(features.interiorFeatures)
                  .find((feat) => feat.key === featureKey);
                if (feature) {
                  currentTotalPrice += feature.price;
                }
              });
            }

            setTotalPrice(currentTotalPrice);
            setCurrentHP(
              Number(car.hp) +
                (savedEngine?.hpIncrease || base.hpIncrease) +
                (savedTech?.tech.hpIncrease || 0)
            );
            setCurrentTopSpeed(
              Number(car.topspeed) +
                (savedEngine?.topSpeedIncrease || base.topSpeedIncrease) +
                (savedTech?.tech.topSpeedIncrease || 0)
            );
            setCurrentMileage(
              Number(car.mileage) +
                (savedEngine?.mileageDecrease || base.mileageDecrease) -
                (savedTech?.tech.mileageDecrease || 0)
            );

            // Set selected engine, tech, and color
            setSelectedEngine(savedEngine || base);
            setSelectedEngineTech(savedTech || enginetechs[0]);
            setSelectedColor(savedColor || colors[0]?.colors[0]?.key);
          } else {
            // Default selection logic
            setSelectedEngine(base);
            setSelectedEngineTech(enginetechs[0]);
            setSelectedColor(colors[0]?.colors[0]?.key);

            setTotalPrice(Number(car.price));
            setCurrentHP(Number(car.hp) + base.hpIncrease);
            setCurrentTopSpeed(Number(car.topspeed) + base.topSpeedIncrease);
            setCurrentMileage(Number(car.mileage) + base.mileageDecrease);
          }
        }
      }
    };

    fetchAndSetEngine();
  }, [car, enginetypes, enginetechs, colors, meow, features]);

  useEffect(() => {
    const fetchCarData = async () => {
      try {
        const carDoc = await getDoc(doc(db, "cars-sell", carId));
        if (carDoc.exists()) {
          setCar({ id: carDoc.id, ...carDoc.data() });
          const data = carDoc.data();
          const auth = getAuth();
          const user = auth.currentUser;
          if (data.features) {
            setMandatoryFeatures(data.features);
          }

          if (user) {
            const existingConfiguration = await getDoc(
              doc(db, "car-configurations", user.uid, "cars", carId)
            );

            if (!existingConfiguration.exists()) {
              // No saved configuration, set default selections
              await setDoc(
                doc(db, "car-configurations", user.uid, "cars", carId),
                {
                  ...data,
                }
              );
            } else {
              // Load the saved configuration
              const savedConfig = existingConfiguration.data();
              console.log(savedConfig);

              // Set the configuration from the saved data
              setExistingConfiguration({
                id: existingConfiguration.id,
                ...savedConfig,
              });
            }
          }
        } else {
          router.push("/sell");
        }
      } catch (error) {
        console.error("Error fetching car data:", error);
      }
    };

    const fetchSupportingData = async () => {
      try {
        const [
          fetchedBrands,
          fetchedColors,
          fetchedEngineTypes,
          fetchedFuelTypes,
          fetchedBodyTypes,
          fetchedTransmissionTypes,
          fetchedEngineTechs,
          exteriorDoc,
          interiorDoc,
        ] = await Promise.all([
          fetchCollectionData("car-brands"),
          fetchCollectionData("car-colors"),
          fetchCollectionData("car-engines"),
          fetchCollectionData("car-fueltype"),
          fetchCollectionData("car-bodytype"),
          fetchCollectionData("car-transmission"),
          fetchCollectionData("car-tech"),
          getDoc(doc(db, "car-features", "Exterior")),
          getDoc(doc(db, "car-features", "Interior")),
        ]);

        const exteriorFeatures = exteriorDoc.exists()
          ? exteriorDoc.data().features
          : [];
        const interiorFeatures = interiorDoc.exists()
          ? interiorDoc.data().features
          : [];

        setBrands(fetchedBrands);
        setColors(fetchedColors); // Set color data as-is
        setEngineTypes(fetchedEngineTypes);
        setFuelTypes(fetchedFuelTypes);
        setBodyTypes(fetchedBodyTypes);
        setTransmissionTypes(fetchedTransmissionTypes);
        setEngineTechs(
          fetchedEngineTechs.sort((a, b) => a.tech.price - b.tech.price)
        );
        setFeatures({ exteriorFeatures, interiorFeatures }); // Setting features for both exterior and interior
      } catch (error) {
        console.error("Error fetching supporting data:", error);
      }
    };

    fetchCarData();
    fetchSupportingData();
  }, [carId, router]);

  const handleEngineClick = async (engineKey: string) => {
    const engine = enginetypes
      .flatMap((category) => category.engines)
      .find((engine) => engine.key === engineKey);

    if (engine && selectedEngine?.key !== engineKey) {
      setSelectedEngine(engine);

      if (baseEngine && selectedEngineTech) {
        const tech = selectedEngineTech.tech;

        setTotalPrice(
          Number(car.price) +
            (engine.price - baseEngine.price) +
            (tech.price || 0)
        );
        setCurrentHP(
          Number(car.hp) +
            engine.hpIncrease -
            baseEngine.hpIncrease +
            (tech.hpIncrease || 0)
        );
        setCurrentTopSpeed(
          Number(car.topspeed) +
            engine.topSpeedIncrease -
            baseEngine.topSpeedIncrease +
            (tech.topSpeedIncrease || 0)
        );
        setCurrentMileage(
          Number(car.mileage) +
            (engine.mileageDecrease + baseEngine.mileageDecrease) -
            (tech.mileageDecrease || 0)
        );

        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          // Update the local meow state with the new engine configuration
          setExistingConfiguration((prevConfig: any) => ({
            ...prevConfig,
            enginetype: engine,
          }));

          await updateDoc(
            doc(db, "car-configurations", user.uid, "cars", carId),
            {
              enginetype: engine,
              enginetech: selectedEngineTech.tech,
              topspeed:
                Number(car.topspeed) +
                engine.topSpeedIncrease -
                baseEngine.topSpeedIncrease +
                (tech.topSpeedIncrease || 0),
              mileage:
                Number(car.mileage) +
                (engine.mileageDecrease - baseEngine.mileageDecrease) +
                (tech.mileageDecrease || 0),
              hp:
                Number(car.hp) +
                engine.hpIncrease -
                baseEngine.hpIncrease +
                (tech.hpIncrease || 0),
              price:
                Number(car.price) +
                (engine.price - baseEngine.price) +
                (tech.price || 0),
            }
          );
        }
      }
    }
  };

  const handleEngineTechClick = async (techKey: string) => {
    const tech = enginetechs.find(
      (technology) => technology.tech.key === techKey
    );

    if (tech && selectedEngineTech?.tech.key !== techKey) {
      setSelectedEngineTech(tech);

      // Ensure baseEngine is not null before using it
      if (baseEngine && selectedEngine) {
        const techPriceAdjustment = tech.tech.price || 0;
        const additionalHP = tech.tech.hpIncrease || 0;
        const additionalTopSpeed = tech.tech.topSpeedIncrease || 0;
        const mileagePenalty = tech.tech.mileageDecrease || 0;

        setTotalPrice(
          Number(car.price) +
            (selectedEngine.price - baseEngine.price) +
            techPriceAdjustment
        );
        setCurrentHP(
          Number(car.hp) +
            selectedEngine.hpIncrease -
            baseEngine.hpIncrease +
            additionalHP
        );
        setCurrentTopSpeed(
          Number(car.topspeed) +
            selectedEngine.topSpeedIncrease -
            baseEngine.topSpeedIncrease +
            additionalTopSpeed
        );
        setCurrentMileage(
          Number(car.mileage) +
            (selectedEngine.mileageDecrease - baseEngine.mileageDecrease) +
            mileagePenalty
        );

        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          // Update the local meow state with the new tech configuration
          setExistingConfiguration((prevConfig: any) => ({
            ...prevConfig,
            enginetech: tech.tech,
          }));

          await updateDoc(
            doc(db, "car-configurations", user.uid, "cars", carId),
            {
              enginetech: tech.tech,
              enginetype: selectedEngine,
              topspeed:
                Number(car.topspeed) +
                selectedEngine.topSpeedIncrease -
                baseEngine.topSpeedIncrease +
                additionalTopSpeed,
              mileage:
                Number(car.mileage) -
                (selectedEngine.mileageDecrease - baseEngine.mileageDecrease) -
                mileagePenalty,
              hp:
                Number(car.hp) +
                selectedEngine.hpIncrease -
                baseEngine.hpIncrease +
                additionalHP,
              price:
                Number(car.price) +
                (selectedEngine.price - baseEngine.price) +
                techPriceAdjustment,
            }
          );
        }
      }
    }
  };

  const handleColorClick = async (color: any) => {
    setSelectedColor(color);

    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "car-configurations", user.uid, "cars", carId), {
        ...car,
        enginetype: selectedEngine,
        enginetech: selectedEngineTech?.tech,
        colors: color,
        topspeed: currentTopSpeed,
        mileage: currentMileage,
        hp: currentHP,
        price: totalPrice,
      });
    }
  };
  const colorOptions = getColorsByKeys(colors, car?.colors || []); //

  const handleFeatureToggle = async (
    featureCategory: string,
    featureKey: any,
    featurePrice: number
  ) => {
    // Check if the feature is mandatory
    if (mandatoryFeatures.includes(featureKey)) {
      return; // Do nothing if it's a mandatory feature
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        const carConfigRef = doc(
          db,
          "car-configurations",
          user.uid,
          "cars",
          carId
        );
        const carConfigDoc = await getDoc(carConfigRef);

        if (carConfigDoc.exists()) {
          const carConfigData = carConfigDoc.data();
          let updatedFeatures = carConfigData.features || [];
          let updatedTotalPrice = totalPrice;

          if (updatedFeatures.includes(featureKey)) {
            updatedFeatures = updatedFeatures.filter(
              (key: any) => key !== featureKey
            );
            updatedTotalPrice -= featurePrice;
          } else {
            updatedFeatures.push(featureKey);
            updatedTotalPrice += featurePrice;
          }

          setExistingConfiguration((prevConfig: any) => ({
            ...prevConfig,
            features: updatedFeatures,
          }));

          if (featureCategory === "exterior") {
            setExteriorFeatures(updatedFeatures);
          } else if (featureCategory === "interior") {
            setInteriorFeatures(updatedFeatures);
          }

          setTotalPrice(updatedTotalPrice);

          await updateDoc(carConfigRef, {
            features: updatedFeatures,
            price: updatedTotalPrice,
            enginetype: selectedEngine,
            enginetech: selectedEngineTech?.tech,
          });
        }
      } catch (error) {
        console.error("Error toggling feature selection:", error);
      }
    }
  };

  if (!car || !baseEngine) {
    return (
      <div className="flex w-screen h-screen justify-center items-center">
        <Spinner label="Loading..." color="primary" labelColor="primary" />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          overflow: hidden;
        }

        @media (max-width: 1024px) {
          html,
          body {
            overflow: auto;
          }
        }
      `}</style>
      <div className="grid grid-cols-10 h-screen">
        {/* Fixed Image Section */}
        <div className="col-span-10 lg:col-span-7 flex flex-col px-10">
          <div className="h-[75%] grid place-items-center">
            <img
              alt={`${getBrandNameByKey(brands, car.brand!)} ${car.model}`}
              className="object-cover rounded-xl max-h-full"
              src={car.modelimg!}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 w-full mt-4 mb-4 lg:mb-0 text-center">
            <div>
              <p className="text-xl font-bold text-orange-500">
                {currentHP} hp
              </p>
              <p className="text-md">Power</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-500">
                {currentTopSpeed} km/h
              </p>
              <p className="text-md">Top Speed</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-500">
                {currentMileage} km
              </p>
              <p className="text-md">Mileage</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-500">
                {getBodyTypeNameByKey(bodytypes, car.body)}
              </p>
              <p className="text-md">Body Type</p>
            </div>
          </div>
        </div>

        {/* Scrollable Configuration Section */}
        <div className="col-span-10 lg:col-span-3 h-screen overflow-y-scroll pb-56 lg:pb-32 p-10">
          <Accordion variant="splitted" selectionMode="multiple">
            <AccordionItem
              key="1"
              aria-label="engine"
              title="Select Engine"
              className="rounded-xl"
            >
              <div className="grid grid-cols-1 gap-4">
                {getEngineTypesByKeys(enginetypes, car.enginetype).map(
                  (engine) => (
                    <Card
                      key={engine.key}
                      isPressable
                      className={`${
                        selectedEngine?.key === engine.key
                          ? "border-2 border-orange-500 shadow-lg dark:bg-neutral-900 bg-neutral-200"
                          : "border dark:bg-neutral-900 bg-neutral-200"
                      }`}
                      onClick={() => handleEngineClick(engine.key)}
                    >
                      <CardBody>
                        <h3 className="text-lg font-bold">{engine.name}</h3>
                        <span className="text-xs text-neutral-500">
                          Fuel Type: {getFuelTypeNameByKey(fueltypes, car.fuel)}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {getTransmissionTypeNameByKey(
                            transmissiontypes,
                            car.transmission
                          )}
                        </span>
                        <p className="mt-2 font-semibold">
                          From RM{" "}
                          {(
                            Number(car.price) +
                            (engine.price - baseEngine!.price ?? 0)
                          ).toLocaleString()}
                        </p>
                      </CardBody>
                    </Card>
                  )
                )}
              </div>
            </AccordionItem>
            <AccordionItem
              key="2"
              aria-label="technology"
              title="Select Engine Technology"
            >
              <div className="grid grid-cols-1 gap-4">
                {enginetechs.map((tech: any) => (
                  <Card
                    key={tech.tech.key}
                    isPressable
                    className={`${
                      selectedEngineTech?.tech.key === tech.tech.key
                        ? "border-2 border-orange-500 shadow-lg dark:bg-neutral-900 bg-neutral-200"
                        : "border dark:bg-neutral-900 bg-neutral-200"
                    }`}
                    onClick={() => handleEngineTechClick(tech.tech.key)}
                  >
                    <CardBody>
                      <h3 className="text-lg font-bold">{tech.tech.name}</h3>
                      <p className="text-xs text-neutral-500">
                        HP Increase: {tech.tech.hpIncrease} hp
                      </p>
                      <p className="text-xs text-neutral-500">
                        Top Speed Increase: {tech.tech.topSpeedIncrease} km/h
                      </p>
                      <p className="text-xs text-neutral-500">
                        Mileage Decrease: {tech.tech.mileageDecrease} km
                      </p>
                      <p className="mt-2 font-semibold">
                        From RM{" "}
                        {(
                          Number(car.price) +
                          (selectedEngine!.price - baseEngine!.price) +
                          (tech.tech.price || 0)
                        ).toLocaleString()}
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </AccordionItem>
            <AccordionItem key="3" aria-label="colors" title="Select Color">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {colorOptions.map((color: any, index: number) => (
                  <div className="flex flex-col justify-center items-center">
                    <Card
                      key={index}
                      isPressable
                      className={`${
                        selectedColor === color.hex
                          ? "border-2 border-orange-500 shadow-lg rounded-full w-10 h-10"
                          : "border rounded-full w-10 h-10"
                      }`}
                      style={{ backgroundColor: color.hex }} // Use the hex value for the background color
                      onClick={() => handleColorClick(color.hex)} // Use the hex code as the selected color
                    >
                      <CardBody></CardBody>
                    </Card>
                    <small className="mt-2">{color.name}</small>
                  </div>
                ))}
              </div>
            </AccordionItem>
            <AccordionItem
              key="4"
              aria-label="features"
              title="Select Exterior Features"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {features.exteriorFeatures.map((feature, index) => {
                  const isSelected = meow?.features?.includes(feature.key);
                  const isMandatory = feature.mandatory; // Assuming each feature has a `mandatory` property

                  return (
                    <Card
                      key={`exterior-${index}`}
                      isPressable={!mandatoryFeatures.includes(feature.key)} // Disable pressing if mandatory
                      isDisabled={mandatoryFeatures.includes(feature.key)}
                      className={`${
                        isSelected
                          ? "border-2 border-orange-500 shadow-lg dark:bg-neutral-900 bg-neutral-200"
                          : "border dark:bg-neutral-900 bg-neutral-200"
                      } ${
                        mandatoryFeatures.includes(feature.key)
                          ? "cursor-not-allowed"
                          : ""
                      }`} // Show as not clickable if mandatory
                      onClick={() =>
                        handleFeatureToggle(
                          "exterior",
                          feature.key,
                          feature.price
                        )
                      }
                    >
                      <CardBody>
                        <h3 className="text-lg font-bold">
                          {feature.name}
                          {mandatoryFeatures.includes(feature.key) &&
                            " (Mandatory)"}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          Price: RM {feature.price}
                        </p>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </AccordionItem>

            <AccordionItem
              key="5"
              aria-label="features"
              title="Select Interior Features"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {features.interiorFeatures.map((feature, index) => {
                  const isSelected = meow?.features?.includes(feature.key);
                  return (
                    <Card
                      key={`interior-${index}`}
                      isPressable={!mandatoryFeatures.includes(feature.key)} // Disable pressing if mandatory
                      isDisabled={mandatoryFeatures.includes(feature.key)}
                      className={`${
                        isSelected
                          ? "border-2 border-orange-500 shadow-lg dark:bg-neutral-900 bg-neutral-200"
                          : "border dark:bg-neutral-900 bg-neutral-200"
                      } ${
                        mandatoryFeatures.includes(feature.key)
                          ? "cursor-not-allowed"
                          : ""
                      }`} // Show as not clickable if mandatory
                      onClick={() =>
                        handleFeatureToggle(
                          "interior",
                          feature.key,
                          feature.price
                        )
                      }
                    >
                      <CardBody>
                        <h3 className="text-lg font-bold">
                          {feature.name}
                          {mandatoryFeatures.includes(feature.key) &&
                            " (Mandatory)"}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          Price: RM {feature.price}
                        </p>
                      </CardBody>
                    </Card>
                  );
                })}
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
              {getBrandNameByKey(brands, car.brand!)} {car.model!}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-start">
              <p className="text-md text-orange-500">Total Price:</p>
              <p className="text-xl font-bold text-orange-500">
                RM{(totalPrice ?? 0).toLocaleString()}
              </p>
            </div>
            <Button
              color="primary"
              onClick={async () => {
                const result = await Swal.fire({
                  title: "Confirm Payment?",
                  text: `RM${(totalPrice ?? 0).toLocaleString()}`,
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
                  try {
                    const auth = getAuth();
                    const user = auth.currentUser;

                    if (user) {
                      // Add the car details to the orders collection
                      await addDoc(collection(db, "orders", user.uid, "cars"), {
                        brand: car.brand,
                        model: car.model,
                        body: car.body,
                        colors: selectedColor,
                        driving: car.driving,
                        enginetech: selectedEngineTech?.tech,
                        enginetype: selectedEngine,
                        features: meow?.features || [],
                        fuel: car.fuel,
                        hp: currentHP,
                        mileage: currentMileage,
                        modelimg: car.modelimg,
                        price: totalPrice,
                        seats: car.seats,
                        topspeed: currentTopSpeed,
                        transmission: car.transmission,
                        units: car.units,
                        orderDate: new Date().toISOString(),
                      });

                      // Reduce the quantity in cars-sell collection
                      const carRef = doc(db, "cars-sell", carId);
                      const carSnapshot = await getDoc(carRef);
                      if (carSnapshot.exists()) {
                        const carData = carSnapshot.data();
                        const newUnits = Math.max(Number(carData.units) - 1, 0); // Ensure quantity doesn't go below 0

                        if (newUnits === 0) {
                          // Show out-of-stock toast
                          toast.error("This car is now out of stock.", {
                            autoClose: 3000,
                            closeOnClick: true,
                            position: "bottom-right",
                            theme,
                          });
                        }

                        await updateDoc(carRef, { units: newUnits.toString() });
                      }

                      // Delete the car configuration document after successful purchase
                      const configRef = doc(
                        db,
                        "car-configurations",
                        user.uid,
                        "cars",
                        carId
                      );
                      await deleteDoc(configRef);

                      // Redirect to the orders or confirmation page
                      router.push("/buy");

                      // Show success toast
                      toast.success(
                        "Payment Successful! Your order has been placed.",
                        {
                          autoClose: 2000,
                          closeOnClick: true,
                          position: "bottom-right",
                          theme,
                        }
                      );
                    }
                  } catch (error) {
                    console.error("Error placing order:", error);

                    // Show error toast
                    toast.error(
                      "There was an issue placing your order. Please try again.",
                      {
                        autoClose: 2000,
                        closeOnClick: true,
                        position: "bottom-right",
                        theme,
                      }
                    );
                  }
                }
              }}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

async function fetchCollectionData(collectionName: string) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const data: any[] = [];
  querySnapshot.forEach((doc) => {
    data.push({ id: doc.id, ...doc.data() });
  });
  return data;
}
