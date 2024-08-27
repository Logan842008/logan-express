export default function SellDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col lg:pt-20 h-screen items-center">
      <div className="inline-block max-w-full text-center">{children}</div>
    </section>
  );
}
