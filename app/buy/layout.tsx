export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col h-screen w-full items-center justify-center ">
      <div className=" w-full text-center justify-center flex items-center">
        {children}
      </div>
    </section>
  );
}
