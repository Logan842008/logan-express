export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center w-full gap-4 h-full px-10 py-20">
      <div className="flex items-center text-center justify-center w-full h-full">
        {children}
      </div>
    </section>
  );
}
