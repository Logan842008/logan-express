"use client";
import { title } from "@/components/primitives";
import { Button } from "@nextui-org/button";
import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  SelectSection,
  SharedSelection,
  useDisclosure,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useTheme } from "next-themes";
import { useToast } from "@/components/ToastContext";
import { toast } from "react-toastify";
import { db, storage } from "@/config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export default function Dashboard() {
  const { theme } = useTheme(); // Access the theme
  const { showToast } = useToast();
  const auth = getAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [addedCars, setAddedCar] = useState<any[]>([]);
  const [car, setCar] = useState<any>({});
  const [userData, setUserData] = useState<any | null>(null);
  const [modelInput, setModelInput] = useState<string>("");
  const [modelError, setModelError] = useState<string | null>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [enginetypes, setEngineTypes] = useState<any[]>([]);
  const [fueltypes, setFuelTypes] = useState<any[]>([]);
  const [bodytypes, setBodyTypes] = useState<any[]>([]);
  const [transmissiontypes, setTransmissionTypes] = useState<any[]>([]);
  const [enginetechs, setEngineTechs] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [drivetypes, setDriveTypes] = useState<any[]>([]);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modelFile, setModelFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const querySnapshot = await getDocs(collection(db, "users"));
        let data: any = null;
        querySnapshot.forEach((doc) => {
          if (doc.id === user.uid) data = doc.data();
        });
        setUserData(data);
        if (!data.isAdmin) {
          showToast("You cannot access this page!", {
            type: "error",
            autoClose: 2000,
            closeOnClick: true,
            position: "bottom-right",
            theme, // Use the theme from context
          });
          router.push("/");
        }
        const querySnapshot2 = await getDocs(collection(db, "cars-sell"));
        const querySnapshot3 = await getDocs(collection(db, "car-brands"));
        const querySnapshot4 = await getDocs(collection(db, "car-colors"));
        const querySnapshot5 = await getDocs(collection(db, "car-engines"));
        const querySnapshot6 = await getDocs(collection(db, "car-fueltype"));
        const querySnapshot7 = await getDocs(collection(db, "car-bodytype"));
        const querySnapshot8 = await getDocs(
          collection(db, "car-transmission")
        );
        const querySnapshot9 = await getDocs(collection(db, "car-tech"));
        const querySnapshot10 = await getDocs(collection(db, "car-drivetype"));
        const querySnapshot11 = await getDocs(collection(db, "car-features"));
        let availableCars: any = [];
        let brands: any = [];
        let colors: any = [];
        let enginetypes: any = [];
        let fueltypes: any = [];
        let bodytypes: any = [];
        let transmissiontypes: any = [];
        let enginetech: any = [];
        let drivetypes: any = [];
        let features: any = [];

        querySnapshot2.forEach((doc) => {
          availableCars.push({ id: doc.id, ...doc.data() });
        });

        querySnapshot3.forEach((doc) =>
          brands.push({ id: doc.id, ...doc.data() })
        );

        querySnapshot4.forEach((doc) =>
          colors.push({
            id: doc.id,
            arrangement: doc.data().arrangement,
            ...doc.data(),
          })
        );
        colors.sort(
          (a: { arrangement: number }, b: { arrangement: number }) =>
            a.arrangement - b.arrangement
        );

        querySnapshot5.forEach((doc) => {
          enginetypes.push({ id: doc.id, ...doc.data() });
        });
        querySnapshot6.forEach((doc) => {
          fueltypes.push({ id: doc.id, ...doc.data() });
        });

        querySnapshot7.forEach((doc) => {
          bodytypes.push({ id: doc.id, ...doc.data() });
        });

        querySnapshot8.forEach((doc) => {
          transmissiontypes.push({ id: doc.id, ...doc.data() });
        });
        querySnapshot9.forEach((doc) => {
          enginetech.push({ id: doc.id, ...doc.data() });
        });
        querySnapshot10.forEach((doc) => {
          drivetypes.push({ id: doc.id, ...doc.data() });
        });
        querySnapshot11.forEach((doc) => {
          features.push({ id: doc.id, ...doc.data() });
        });

        setAddedCar(availableCars);
        setBrands(brands);
        setColors(colors);
        setEngineTypes(enginetypes);
        setFuelTypes(fueltypes);
        setBodyTypes(bodytypes);
        setTransmissionTypes(transmissiontypes);
        setEngineTechs(enginetech);
        setDriveTypes(drivetypes);
        setFeatures(features);
        console.log(features);
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const handleModelInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setModelInput(e.target.value);

    const modelExists = addedCars.some(
      (carItem) => carItem.model.toLowerCase() === e.target.value.toLowerCase()
    );

    if (modelExists) {
      setModelError("This model already exists in the database.");
    } else {
      setModelError(null);
      setCar({
        ...car,
        [e.target.name]: e.target.value,
      });
      console.log(car);
    }
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (e.target.name === "modelimg") {
        setModelFile(selectedFile);
        setCar({
          ...car,
          [e.target.name]: e.target.value,
        });
      }
    }
  };

  const handleChange = (e: { target: { name: string; value: any } }) => {
    setCar({
      ...car,
      [e.target.name]: e.target.value,
    });
    console.log(car);
  };

  // For Autocomplete and Select, manually pass the name and value:
  const handleSelectChange = (name: string, value: any) => {
    console.log(value.anchorKey);
    setCar({
      ...car,
      [name]: value.anchorKey,
    });
    console.log(car);
  };

  const handleAutoSelectChange = (name: string, value: any) => {
    setCar({
      ...car,
      [name]: value,
    });
    console.log(car);
  };

  const handleMultipleSelectChange = (name: string, value: SharedSelection) => {
    // Convert the selection to an array
    const selectedValues = Array.from(value as Set<string>);

    setCar({
      ...car,
      [name]: selectedValues, // Update the car state with the selected values
    });

    console.log(car);
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

  function getTextColor(hex: string): string {
    const color = hex.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000" : "#FFF";
  }

  return (
    <div>
      {user && userData && userData.isAdmin ? (
        <>
          <h1 className={title()}>Welcome, {user.displayName}</h1>
          <br />
          <Button onPress={onOpen}>Open Modal</Button>
          <Modal
            size="5xl"
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            scrollBehavior="inside"
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    Add Car
                  </ModalHeader>
                  <ModalBody>
                    {/* Brand Autocomplete */}
                    <Autocomplete
                      isRequired
                      label="Brand"
                      name="brand"
                      onSelectionChange={(value) =>
                        handleAutoSelectChange("brand", value)
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
                            <AutocompleteItem
                              key={brand.key}
                              value={brand.name}
                            >
                              {brand.name}
                            </AutocompleteItem>
                          ))}
                        </AutocompleteSection>
                      ))}
                    </Autocomplete>

                    {/* Model Input */}
                    <div className="mt-5">
                      <Input
                        isRequired
                        label="Model"
                        name="model"
                        labelPlacement="outside"
                        required
                        placeholder="Model name..."
                        onSelect={handleModelInputChange}
                      />
                      {modelError && (
                        <p style={{ color: "red" }}>{modelError}</p>
                      )}
                    </div>
                    <div className="mt-5">
                      <Input
                        isRequired
                        type="number"
                        name="price"
                        onChange={handleChange}
                        label="Price"
                        placeholder="0.00"
                        labelPlacement="outside"
                        startContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                              RM
                            </span>
                          </div>
                        }
                      />
                    </div>
                    <div className="mt-5">
                      <Input
                        isRequired
                        type="number"
                        name="units"
                        onChange={handleChange}
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
                    </div>
                    <div className="mt-5">
                      <Input
                        isRequired
                        type="file"
                        name="modelimg"
                        label="Model Image"
                        placeholder=""
                        labelPlacement="outside"
                        onChange={handleFileChange}
                      />
                    </div>
                    <div className="mt-5">
                      <Input
                        isRequired
                        type="number"
                        name="hp"
                        onChange={handleChange}
                        label="Horse Power"
                        placeholder="0"
                        labelPlacement="outside"
                        endContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                              hp
                            </span>
                          </div>
                        }
                      />
                    </div>
                    <div className="mt-5">
                      <Input
                        isRequired
                        type="number"
                        name="topspeed"
                        onChange={handleChange}
                        label="Top Speed"
                        placeholder="0"
                        labelPlacement="outside"
                        endContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                              kmph
                            </span>
                          </div>
                        }
                      />
                    </div>
                    <div className="mt-5">
                      <Input
                        isRequired
                        type="number"
                        name="mileage"
                        onChange={handleChange}
                        label="Mileage"
                        placeholder="0"
                        labelPlacement="outside"
                        endContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                              km
                            </span>
                          </div>
                        }
                      />
                    </div>
                    <div className="mt-5">
                      <Select
                        isRequired
                        label="Fuel Type"
                        name="fuel"
                        onSelectionChange={(value) =>
                          handleSelectChange("fuel", value)
                        }
                        placeholder="Select a fuel type..."
                        labelPlacement="outside"
                        className="w-full"
                      >
                        {fueltypes.map((type) => (
                          <SelectItem
                            key={type.fuel.key}
                            value={type.fuel.value}
                          >
                            {type.fuel.value}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                    <div className="mt-5">
                      <Autocomplete
                        isRequired
                        label="Body type"
                        name="body"
                        onSelectionChange={(value) =>
                          handleAutoSelectChange("body", value)
                        }
                        labelPlacement="outside"
                        placeholder="Select a body type..."
                      >
                        {bodytypes.map((bodyType) => (
                          <AutocompleteItem
                            key={bodyType.body.key}
                            value={bodyType.body.value}
                          >
                            {bodyType.body.value}
                          </AutocompleteItem>
                        ))}
                      </Autocomplete>
                    </div>
                    <div className="mt-5">
                      <Select
                        isRequired
                        label="Transmission Type"
                        name="transmission"
                        onSelectionChange={(value) =>
                          handleSelectChange("transmission", value)
                        }
                        placeholder="Select a transmission type..."
                        labelPlacement="outside"
                        className="w-full"
                      >
                        {transmissiontypes.map((type) => (
                          <SelectItem
                            key={type.transmission.key}
                            value={type.transmission.value}
                          >
                            {type.transmission.value}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                    <div className="mt-5">
                      <Select
                        isRequired
                        selectionMode="multiple"
                        label="Colors"
                        name="colors"
                        onSelectionChange={(value) =>
                          handleMultipleSelectChange("colors", value)
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
                    </div>
                    <div className="mt-5">
                      <Select
                        isRequired
                        selectionMode="multiple"
                        label="Features"
                        name="features"
                        onSelectionChange={(value) =>
                          handleMultipleSelectChange("features", value)
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
                              <SelectItem
                                key={feature.key}
                                value={feature.name}
                              >
                                {feature.name}
                              </SelectItem>
                            ))}
                          </SelectSection>
                        ))}
                      </Select>
                    </div>
                    <div className="mt-5  grid grid-cols-2 gap-3">
                      <Select
                        isRequired
                        selectionMode="multiple"
                        label="Engine Type"
                        name="enginetype"
                        onSelectionChange={(value) =>
                          handleMultipleSelectChange("enginetype", value)
                        }
                        placeholder="Choose the engine..."
                        labelPlacement="outside"
                        className="w-full col-span-2 lg:col-span-1"
                      >
                        {enginetypes.map((section) => (
                          <SelectSection
                            key={section.id}
                            title={section.id} // Use the title for the section
                            classNames={{
                              heading:
                                "flex w-full sticky top-1 z-20 py-1.5 px-2 bg-default-100 shadow-small rounded-small",
                            }}
                          >
                            {section.engines.map((engine: any) => (
                              <SelectItem key={engine.key} value={engine.name}>
                                {engine.name}
                              </SelectItem>
                            ))}
                          </SelectSection>
                        ))}
                      </Select>

                      <Select
                        isRequired
                        label="Engine Technology"
                        name="enginetech"
                        selectionMode="multiple"
                        onSelectionChange={(value) => {
                          // Ensure that "naturally aspirated" is always included
                          const fixedSelection = new Set(value);
                          fixedSelection.add("naturally-aspirated-engine"); // This key should match the one in your data

                          handleMultipleSelectChange(
                            "enginetech",
                            fixedSelection
                          );
                        }}
                        value={[
                          "naturally-aspirated-engine",
                          ...enginetechs.filter(
                            (key: string) =>
                              key !== "naturally-aspirated-engine"
                          ),
                        ]} // Keep "naturally aspirated" selected
                        placeholder="Choose the technology..."
                        labelPlacement="outside"
                        className="w-full col-span-2 lg:col-span-1"
                      >
                        {enginetechs.map((tech) => (
                          <SelectItem
                            key={tech.tech.key}
                            value={tech.tech.key}
                            isDisabled={
                              tech.tech.key === "naturally-aspirated-engine"
                            } // Disable the "naturally aspirated" option to prevent deselection
                          >
                            {tech.tech.name}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                    <div className="mt-5">
                      <Select
                        isRequired
                        label="Driving Type"
                        name="driving"
                        onSelectionChange={(value) =>
                          handleSelectChange("driving", value)
                        }
                        placeholder="Choose the driving type..."
                        labelPlacement="outside"
                        className="w-full"
                      >
                        {drivetypes.map((type) => (
                          <SelectItem
                            key={type.drive.key}
                            value={type.drive.name}
                          >
                            {type.drive.name}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                    <div className="mt-5">
                      <Input
                        isRequired
                        type="number"
                        name="seats"
                        onChange={handleChange}
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
                    </div>
                    <div className="mt-5">
                      <Input
                        isRequired
                        type="number"
                        name="warranty"
                        onChange={handleChange}
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
                    <Button color="danger" variant="light" onPress={onClose}>
                      Close
                    </Button>
                    <Button color="primary" onPress={() => addCar(onClose)}>
                      Add
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </>
      ) : null}
    </div>
  );
}
