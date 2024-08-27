"use client";
import { title } from "@/components/primitives";
import { Image } from "@nextui-org/react";

export default function Home() {
  return (
    <section className="relative flex items-center justify-center w-full h-screen overflow-hidden">
      <div className="absolute rounded-none inset-0 bg-gradient-to-l h-full overflow-hidden from-black to-transparent z-10"></div>

      <div className="size-full">
        <Image
          src="/images/backgroundwallpaperlarge.png"
          alt="Background Wallpaper"
          className="z-0 rounded-none object-cover h-screen w-full"
        />
      </div>
      <p
        className={`absolute left-0 p-10 text-center text-3xl md:text-4xl lg:text-7xl  z-20 text-white w-full font-bold`}
      >
        The Easiest Way To Find A Perfect Car For Yourself
      </p>
    </section>
  );
}
