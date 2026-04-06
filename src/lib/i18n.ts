import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import { settingsApi } from "./tauri"
import { enUS, ko } from "date-fns/locale"

import commonEn from "@/locales/en/common.json"
import dashboardEn from "@/locales/en/dashboard.json"
import boardEn from "@/locales/en/board.json"
import cardEn from "@/locales/en/card.json"
import settingsEn from "@/locales/en/settings.json"
import layoutEn from "@/locales/en/layout.json"
import tableEn from "@/locales/en/table.json"

import commonKo from "@/locales/ko/common.json"
import dashboardKo from "@/locales/ko/dashboard.json"
import boardKo from "@/locales/ko/board.json"
import cardKo from "@/locales/ko/card.json"
import settingsKo from "@/locales/ko/settings.json"
import layoutKo from "@/locales/ko/layout.json"
import tableKo from "@/locales/ko/table.json"

i18next.use(initReactI18next).init({
  resources: {
    en: {
      common: commonEn,
      dashboard: dashboardEn,
      board: boardEn,
      card: cardEn,
      settings: settingsEn,
      layout: layoutEn,
      table: tableEn,
    },
    ko: {
      common: commonKo,
      dashboard: dashboardKo,
      board: boardKo,
      card: cardKo,
      settings: settingsKo,
      layout: layoutKo,
      table: tableKo,
    },
  },
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "ko"],
  ns: ["common", "dashboard", "board", "card", "settings", "layout", "table"],
  defaultNS: "common",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

i18next.on("languageChanged", (lng) => {
  settingsApi.set("language", lng)
})

export function getDateLocale() {
  return i18next.language.startsWith("ko") ? ko : enUS
}

export default i18next
