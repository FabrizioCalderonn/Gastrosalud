import type { Metadata } from "next";
import { BookingFlow } from "@/components/BookingFlow";

export const metadata: Metadata = {
  title: "Agenda tu cita — GastroSalud",
};

export default function CitasPage() {
  return <BookingFlow />;
}
