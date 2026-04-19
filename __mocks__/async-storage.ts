const store: Record<string, string> = {}

export default {
  getItem: jest.fn(async (key: string) => store[key] ?? null),
  setItem: jest.fn(async (key: string, value: string) => { store[key] = value }),
  removeItem: jest.fn(async (key: string) => { delete store[key] }),
  __reset() {
    Object.keys(store).forEach(k => delete store[k])
    ;(this.getItem as jest.Mock).mockClear()
    ;(this.setItem as jest.Mock).mockClear()
    ;(this.removeItem as jest.Mock).mockClear()
  },
}
