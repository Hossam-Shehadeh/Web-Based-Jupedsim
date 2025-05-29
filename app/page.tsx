import { redirect } from "next/navigation"
import { WelcomePage } from "@/components/welcome-page"

export default function Home() {
  // Check if the user has seen the welcome page before
  if (typeof window !== "undefined") {
    const hasSeenWelcome = localStorage.getItem("jupedsim-welcome-seen")
    if (hasSeenWelcome) {
      redirect("/simulation")
    }
  }

  return <WelcomePage />
}
