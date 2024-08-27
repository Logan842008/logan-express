export default function RentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col h-screen items-center p-10">
      <div className="inline-block w-full text-center ">{children}</div>
    </section>
  );
}
