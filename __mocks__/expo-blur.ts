import React from 'react'
import { View } from 'react-native'

export const BlurView = ({ children, intensity: _intensity, style, ...props }: any) =>
  React.createElement(View, { style, ...props }, children)
