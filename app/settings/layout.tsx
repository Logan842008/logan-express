export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center w-full gap-4 h-full overflow-scroll p-10">
      {children}
    </section>
  );
}
