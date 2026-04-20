export const router = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
}

export const useRouter = jest.fn(() => router)
export const useSegments = jest.fn(() => [])
export const useLocalSearchParams = jest.fn(() => ({}))
export const usePathname = jest.fn(() => '/')
export const Link = 'Link'
export const Stack = { Screen: 'Stack.Screen' }
export const Tabs = { Screen: 'Tabs.Screen' }
export const Slot = 'Slot'
