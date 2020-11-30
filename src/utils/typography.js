import Typography from "typography"
import githubTheme from 'typography-theme-github'

githubTheme.googleFonts = [
  {
    name: "Noto+Sans+JP",
    styles: ["400"],
  }
]

githubTheme.headerFontFamily = ["Noto Sans JP"]
githubTheme.bodyFontFamily = ["Noto Sans JP"]
githubTheme.baseLineHeight = 2

const typography = new Typography(githubTheme)

// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles()
}

export default typography
export const rhythm = typography.rhythm
export const scale = typography.scale
