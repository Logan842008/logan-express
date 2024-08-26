export default function RentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col lg:overflow-y-hidden items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block w-full text-center justify-center">
        {children}
      </div>
    </section>
  );
}
