import ClientProviders from "@/components/providers/ClientProviders";

export default function TakeAttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProviders>
      {children}
    </ClientProviders>
  );
}
