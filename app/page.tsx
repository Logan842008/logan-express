"use client";
import { title } from "@/components/primitives";
import { Image } from "@nextui-org/react";

export default function Home() {
  return (
    <section className="relative flex items-center justify-center w-full overflow-hidden h-screen">
      {/* Gradient Overlay */}
      <div className="absolute rounded-none inset-0 bg-gradient-to-l h-full overflow-hidden from-black to-transparent z-10"></div>

      {/* Image */}
      <Image
        src="/images/backgroundwallpaperlarge.png"
        alt="Background Wallpaper"
        className="z-0 rounded-none"
      />

      {/* Text Content */}
      <p
        className={`absolute left-0 ml-4 z-20 ${title({ className: `text-white w-[500px]` })}`}
      >
        The Easiest Way To Find A Perfect Car For Yourself
      </p>
    </section>
  );
}
