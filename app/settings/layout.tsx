export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center w-full gap-4 overflow-scroll h-screen">
      {children}
    </section>
  );
}
