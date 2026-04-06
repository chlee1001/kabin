import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./lib/i18n"
import i18next from "i18next"
import { settingsApi } from "./lib/tauri"
import App from "./App"
import "@/styles/globals.css"

async function bootstrap() {
  const saved = await settingsApi.get("language")
  if (saved) {
    await i18next.changeLanguage(saved)
  } else {
    const osLang = navigator.language.startsWith("ko") ? "ko" : "en"
    await i18next.changeLanguage(osLang)
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
