export default function RentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col lg:overflow-y-hidden items-center justify-center">
      <div className="inline-block w-full text-center justify-center">
        {children}
      </div>
    </section>
  );
}
