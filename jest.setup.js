global.IS_REACT_ACT_ENVIRONMENT = true

// Pre-configure RNTL host component names to avoid auto-detection issue with React 18
const { configure } = require('@testing-library/react-native')
configure({
  hostComponentNames: {
    text: 'Text',
    textInput: 'TextInput',
  },
})
