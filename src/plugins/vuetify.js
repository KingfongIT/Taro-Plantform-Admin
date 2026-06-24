import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, md } from 'vuetify/iconsets/md'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import colors from 'vuetify/util/colors'
import { VDateInput } from 'vuetify/labs/VDateInput'

const customTheme = {
  dark: false,
  variables: {
    'font-family': "'Roboto', sans-serif", // Vuetify 元件內部會吃這個
  },
  colors: {
    primary: colors.blue.darken2,
    secondary: '#f5f5f5',
    success: '#4CAF50',
    warning: '#FB8C00',
    error: colors.red.accent2,
    info: '#2196F3',
    text: '#1c1c1c',
    text_light: '#595959',
    gray_100: colors.grey.darken2,
    gray_300: colors.grey.darken3,
    gray_500: colors.grey.darken4,
  },
  variables: {
    'border-color': '#000000',
    'border-opacity': 0.12,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.6,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
    'hover-opacity': 0.04,
    'focus-opacity': 0.12,
    'selected-opacity': 0.08,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.12,
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#F5F5F5',
    'theme-on-code': '#000000',
  },
}

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'customTheme',
    themes: {
      customTheme,
    },
  },
  icons: {
    defaultSet: 'md',
    aliases,
    sets: {
      md,
    },
  },
  components: {
    ...components,
    VDateInput,
  },
  directives,
  defaults: {
    VDataTable: {
      itemsPerPage: 50,
      itemsPerPageOptions: [50, 100, 200, 500, { value: -1, title: 'ALL' }],
    },
    VDataTableServer: {
      itemsPerPage: 50,
      itemsPerPageOptions: [50, 100, 200, 500, { value: -1, title: 'ALL' }],
    },
  },
})

export default vuetify
