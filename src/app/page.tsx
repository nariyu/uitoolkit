import { MainScreen } from "@/example/screens/MainScreen";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UI Toolkit | playwell inc.",
  description: "boilerplate",
};

export default function Home() {
  return <MainScreen />;
}
